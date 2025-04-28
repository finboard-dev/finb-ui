"use client"

import { useAppDispatch } from "@/lib/store/hooks"
import { addMessage, setIsResponding, updateMessage } from "@/lib/store/slices/chatSlice"
import { v4 as uuidv4 } from "uuid"
import type { MentionType, MessageType } from "@/types/chat"
import { getThreadId, parseStreamChunk, processStreamResponse } from "@/lib/api/chatService"
import { getSavedSelectedCompanyId } from "./useSelectedCompanyId"
import { setToolCallLoading } from "@/lib/store/slices/loadingSlice"
import { addToolCallResponse, setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice"
import { setResponsePanelWidth } from "@/lib/store/slices/chatSlice"

export const useChatStream = () => {
  const dispatch = useAppDispatch()

  const sendMessage = {
    mutate: async (payload: { text: string; mentions?: MentionType[] }) => {
      const { text, mentions = [] } = payload

      // Create user message with mentions
      const userMessage: MessageType = {
        id: uuidv4(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
        mentions, // Store mentions in the message
      }

      dispatch(addMessage(userMessage))
      dispatch(setIsResponding(true))

      // Create assistant message placeholder
      const assistantMessageId = uuidv4()
      const assistantMessage: MessageType = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      }

      dispatch(addMessage(assistantMessage))

      // Prepare request payload (send plain text to backend)
      const chatMessage: any = {
        message: text,
        thread_id: getThreadId(),
        stream_tokens: true,
        company_id: getSavedSelectedCompanyId(),
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_CHAT}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
          },
          body: JSON.stringify(chatMessage),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`)
        }

        if (!response.body) {
          throw new Error("Response body is null")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedContent = ""
        let toolCalls: { name: string; args: any; id?: string }[] = []
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.trim() === "") continue

            const parsedResponse = parseStreamChunk(line)
            if (parsedResponse) {
              // Handle token content
              if (parsedResponse.type === "token" && parsedResponse.content) {
                accumulatedContent += parsedResponse.content
                const updatedMessage: MessageType = {
                  id: assistantMessageId,
                  role: "assistant",
                  content: accumulatedContent,
                  timestamp: new Date().toISOString(),
                  toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                }
                dispatch(updateMessage(updatedMessage))
                continue
              }

              processStreamResponse(
                parsedResponse,
                (token) => {
                  accumulatedContent += token
                  const updatedMessage: MessageType = {
                    id: assistantMessageId,
                    role: "assistant",
                    content: accumulatedContent,
                    timestamp: new Date().toISOString(),
                    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                  }
                  dispatch(updateMessage(updatedMessage))
                },
                (toolCall) => {
                  if (!toolCalls.some((tc) => tc.id === toolCall.id)) {
                    toolCalls = [
                      ...toolCalls,
                      {
                        name: toolCall.name,
                        args: toolCall.args,
                        id: toolCall.id,
                      },
                    ]
                    const updatedMessage: MessageType = {
                      id: assistantMessageId,
                      role: "assistant",
                      content: accumulatedContent,
                      timestamp: new Date().toISOString(),
                      toolCalls,
                    }
                    dispatch(updateMessage(updatedMessage))
                  }
                },
                (sidePanelData) => {
                  try {
                    let dataType: "code" | "table" | "graph" | "error" | "text" = "text"
                    let dataContent: any = sidePanelData

                    if (sidePanelData.type === "error") {
                      dataType = "error"
                      dataContent = sidePanelData.error
                    } else if (sidePanelData.type === "text") {
                      dataType = "text"
                      dataContent = sidePanelData.text
                    } else if (sidePanelData.type === "report") {
                      dataType = "table"
                      dataContent = sidePanelData
                    } else if (sidePanelData.type === "graph") {
                      dataType = "graph"
                      dataContent = sidePanelData.schema
                      if (typeof dataContent === "object" && dataContent !== null && !dataContent.$schema) {
                        dataContent.$schema = "https://vega.github.io/schema/vega-lite/v5.json"
                      }
                    }

                    const toolCallId =
                      parsedResponse.content?.tool_call_id || toolCalls[toolCalls.length - 1]?.id || uuidv4()
                    const toolName = toolCalls.find((tc) => tc.id === toolCallId)?.name || "unknown"

                    dispatch(
                      addToolCallResponse({
                        id: uuidv4(),
                        tool_call_id: toolCallId,
                        tool_name: toolName,
                        data: dataContent,
                        type: dataType,
                        messageId: assistantMessageId,
                      }),
                    )

                    dispatch(setActiveToolCallId(toolCallId))
                    dispatch(setResponsePanelWidth(550))
                  } catch (error) {
                    console.error("Error processing side panel data:", error)
                    const toolCallId =
                      parsedResponse.content?.tool_call_id || toolCalls[toolCalls.length - 1]?.id || uuidv4()
                    const toolName = toolCalls.find((tc) => tc.id === toolCallId)?.name || "unknown"

                    dispatch(
                      addToolCallResponse({
                        id: uuidv4(),
                        tool_call_id: toolCallId,
                        tool_name: toolName,
                        data: `Error processing response: ${error instanceof Error ? error.message : "Unknown error"}`,
                        type: "error",
                        messageId: assistantMessageId,
                      }),
                    )

                    dispatch(setActiveToolCallId(toolCallId))
                    dispatch(setResponsePanelWidth(550))
                  }
                },
              )

              if (parsedResponse.content?.type === "ai" && parsedResponse.content?.tool_calls?.length) {
                dispatch(setToolCallLoading(true))
              }

              if (parsedResponse.content?.type === "tool") {
                dispatch(setToolCallLoading(false))
              }
            }
          }
        }

        dispatch(setIsResponding(false))
        return accumulatedContent
      } catch (error) {
        console.error("Error in chat stream:", error)
        const updatedMessage: MessageType = {
          id: assistantMessageId,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
          isError: true,
        }
        dispatch(updateMessage(updatedMessage))
        dispatch(setIsResponding(false))
        dispatch(setToolCallLoading(false))
        throw error
      }
    },
  }

  return { sendMessage }
}
