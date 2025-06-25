import { useMutation } from "@tanstack/react-query"
import { v4 as uuidv4 } from "uuid"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import {addMessage, setIsResponding, setResponsePanelWidth, updateMessage} from "@/lib/store/slices/chatSlice"
import type {MessageType, Model, Tool} from "@/types/chat"
import { addToolCallResponse } from "@/lib/store/slices/responsePanelSlice"
import { parseStreamChunk, processStreamResponse } from "@/lib/services/ChatServices/chatService"
import { getSavedSelectedCompanyId } from "@/hooks/useSelectedCompanyId"
import { setToolCallLoading } from "@/lib/store/slices/loadingSlice"
import {  setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice"
import { store } from "@/lib/store/store"

export const useChatStream = () => {
  const dispatch = useAppDispatch()
  const activeChatId = useAppSelector((state) => state.chat.activeChatId)
  const user = useAppSelector((state) => state.user)
  const selectedCompanyId = user?.selectedCompany?.id

  const activeChat = useAppSelector((state) => {
    if (state.chat.pendingChat && state.chat.pendingChat.id === state.chat.activeChatId) {
      return state.chat.pendingChat
    }
    return state.chat.chats.find((chat) => chat.id === state.chat.activeChatId)
  })

  const bearerToken = store.getState().user.token
  const token = bearerToken?.accessToken

  const threadId = activeChat?.thread_id || ""
  const selectedAssistantId = activeChat?.chats[0]?.selectedAssistantId || ""

  const sendMessage = useMutation({
    mutationFn: async (payload: { text: string; mentions?: Tool[]; model?: Model }) => {
      if (!activeChatId || !threadId || !selectedAssistantId) {
        throw new Error("Missing required chat information")
      }

      // Add user message to the chat
      const userMessageId = uuidv4()
      const userMessage: MessageType = {
        id: userMessageId,
        role: "user",
        content: [{ type: "text", content: payload.text }],
        timestamp: new Date().toISOString(),
        mentions: payload.mentions,
        model: payload.model,
      }

      dispatch(
          addMessage({
            chatId: activeChatId,
            message: userMessage,
          }),
      )

      // Create assistant message placeholder
      const assistantMessageId = uuidv4()
      const assistantMessage: MessageType = {
        id: assistantMessageId,
        role: "assistant",
        content: [{ type: "text", content: "" }],
        timestamp: new Date().toISOString(),
        model: payload.model,
      }

      dispatch(
          addMessage({
            chatId: activeChatId,
            message: assistantMessage,
          }),
      )

      dispatch(setIsResponding(true))

      try {
        // Prepare the chat message with the selected assistant ID
        const chatMessage = {
          message: payload.text,
          threadId: threadId,
          companyId: selectedCompanyId,
          toolMentions:
              payload.mentions && payload.mentions.length > 0
                  ? payload.mentions.map((mention) => ({
                    id: mention.id,
                    name: mention.name,
                    description: mention.description,
                    category: mention.category,
                  }))
                  : undefined,
          assistantId: selectedAssistantId,
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_CHAT}/chat/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(chatMessage),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to send message")
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("Response body is null")

        let contentParts: ContentPart[] = []
        let toolCalls: { name: string; args: any; id?: string; position?: number }[] = []
        let buffer = ""
        let currentText = ""
        const decoder = new TextDecoder()

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
                        dataContent = sidePanelData
                      }

                      const toolCallId =
                          parsedResponse.content?.tool_call_id || toolCalls[toolCalls.length - 1]?.id || uuidv4()
                      const toolName = toolCalls.find((tc) => tc.id === toolCallId)?.name || "unknown"

                      // If there's a user_request in sidePanelData, ensure it gets passed through
                      if (sidePanelData.user_request) {
                        dataContent.user_request = sidePanelData.user_request;
                      }
                      
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
                      
                      // Only open response panel for graph and table types
                      if (dataType === "graph" || dataType === "table") {
                        // Check if content is renderable before showing panel
                        let shouldShowPanel = false;
                        
                        if (dataType === "graph") {
                          const schema = dataContent?.schema || dataContent;
                          shouldShowPanel = !!schema;
                        } else if (dataType === "table") {
                          const tableData = Array.isArray(dataContent) ? 
                            dataContent : 
                            dataContent?.report_table || dataContent?.data || dataContent;
                          shouldShowPanel = !!tableData;
                        }
                        
                        if (shouldShowPanel) {
                          dispatch(setResponsePanelWidth(500));
                        }
                      }
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
                      // Don't open response panel for errors
                    }
                  },
              )

              const updatedMessage: MessageType = {
                id: assistantMessageId,
                role: "assistant",
                content: [
                  ...contentParts,
                  ...(currentText ? [{ type: "text", content: currentText }] : []),
                ] as ContentPart[],
                timestamp: new Date().toISOString(),
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                model: payload.model,
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
          model: payload.model,
        }
        dispatch(updateMessage({ chatId: activeChatId, message: updatedMessage }))
        dispatch(setIsResponding(false))
        dispatch(setToolCallLoading(false))
        throw error
      }
    },
  })

  return { sendMessage }
}

type ContentPart = { type: "text"; content: string } | { type: "toolCall"; toolCallId: string }
