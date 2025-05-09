"use client"

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { addMessage, setIsResponding, updateMessage } from "@/lib/store/slices/chatSlice"
import { v4 as uuidv4 } from "uuid"
import type { MessageType, Model, ContentPart } from "@/types/chat"
import { parseStreamChunk, processStreamResponse } from "@/lib/api/ChatServices/chatService"
import { getSavedSelectedCompanyId } from "@/hooks/useSelectedCompanyId"
import { setToolCallLoading } from "@/lib/store/slices/loadingSlice"
import { addToolCallResponse, setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice"
import { setResponsePanelWidth } from "@/lib/store/slices/chatSlice"
import { store } from "@/lib/store/store"

export type ToolMentionType = {
  id: string
  name: string
  description: string
  category: string
  startPos: number
  endPos: number
}

export const useChatStream = () => {
  const dispatch = useAppDispatch()
  const activeChatId = useAppSelector((state) => state.chat.activeChatId)
  const activeChat = useAppSelector((state) => state.chat.chats.find((chat) => chat.id === activeChatId))
  const bearerToken = store.getState().user.token
  const token = bearerToken?.accessToken

  const getThreadId = () => {
    return activeChat?.thread_id || ""
  }

  const sendMessage = {
    mutate: async (payload: { text: string; mentions?: ToolMentionType[]; model?: Model }) => {
      if (!activeChatId || !activeChat) {
        console.error("No active chat found")
        return
      }

      const { text, mentions = [], model } = payload

      const userMessage: MessageType = {
        id: uuidv4(),
        role: "user",
        content: [{ type: "text", content: text }],
        timestamp: new Date().toISOString(),
        mentions,
        model,
      }

      dispatch(addMessage({ chatId: activeChatId, message: userMessage }))
      dispatch(setIsResponding(true))

      const assistantMessageId = uuidv4()
      const assistantMessage: MessageType = {
        id: assistantMessageId,
        role: "assistant",
        content: [],
        timestamp: new Date().toISOString(),
        toolCalls: [],
      }

      dispatch(addMessage({ chatId: activeChatId, message: assistantMessage }))

      const toolMentions = mentions.map((mention) => ({
        id: mention.id,
        name: mention.name,
        description: mention.description,
        category: mention.category,
      }))

      const chatMessage: any = {
        message: text,
        threadId: getThreadId(),
        companyId: getSavedSelectedCompanyId(),
        toolMentions: toolMentions.length > 0 ? toolMentions : undefined,
        assistantId: model ? model.id : undefined,
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_CHAT}/chat/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
        let contentParts: ContentPart[] = []
        let toolCalls: { name: string; args: any; id?: string; position?: number }[] = []
        let buffer = ""
        let currentText = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            if (currentText) {
              contentParts = [...contentParts, { type: "text", content: currentText }]
            }
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.trim() === "") continue

            const parsedResponse = parseStreamChunk(line)
            if (parsedResponse) {
              processStreamResponse(
                  parsedResponse,
                  (token) => {
                    currentText += token
                  },
                  (toolCall) => {
                    if (currentText) {
                      contentParts = [...contentParts, { type: "text", content: currentText }]
                      currentText = ""
                    }
                    if (!toolCalls.some((tc) => tc.id === toolCall.id)) {
                      toolCalls = [
                        ...toolCalls,
                        {
                          name: toolCall.name,
                          args: toolCall.args,
                          id: toolCall.id,
                          position: toolCall.position,
                        },
                      ]
                      if (toolCall.id) {
                        contentParts = [...contentParts, { type: "toolCall", toolCallId: toolCall.id }]
                      }
                    }
                  },
                  (sidePanelData) => {
                    try {
                      if (currentText) {
                        contentParts = [...contentParts, { type: "text", content: currentText }]
                        currentText = ""
                      }
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
                          })
                      )

                      dispatch(setActiveToolCallId(toolCallId))
                      dispatch(setResponsePanelWidth(30))
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
                          })
                      )

                      dispatch(setActiveToolCallId(toolCallId))
                      dispatch(setResponsePanelWidth(30))
                    }
                  }
              )

              const updatedMessage: MessageType = {
                id: assistantMessageId,
                role: "assistant",
                content: [...contentParts, ...(currentText ? [{ type: "text", content: currentText }] : [])] as ContentPart[],
                timestamp: new Date().toISOString(),
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              }
              dispatch(updateMessage({ chatId: activeChatId, message: updatedMessage }))

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
        return contentParts
      } catch (error) {
        console.error("Error in chat stream:", error)
        const updatedMessage: MessageType = {
          id: assistantMessageId,
          role: "assistant",
          content: [{ type: "text", content: "Sorry, something went wrong. Please try again." }],
          timestamp: new Date().toISOString(),
          isError: true,
        }
        dispatch(updateMessage({ chatId: activeChatId, message: updatedMessage }))
        dispatch(setIsResponding(false))
        dispatch(setToolCallLoading(false))
        throw error
      }
    },
  }

  return { sendMessage }
}