import { v4 as uuidv4 } from "uuid"

export interface ChatMessage {
  message: string
  thread_id: string | null
  stream_tokens: boolean
}

export const getThreadId = (): string | null => {
  const generateId = uuidv4()
  const savedId = localStorage.getItem("thread_id")
  if (savedId) {
    return savedId
  } else {
    localStorage.setItem("thread_id", generateId)
    return generateId
  }
}

export const parseStreamChunk = (chunk: string): any => {
  try {
    if (!chunk || chunk.trim() === "") return null

    if (chunk.trim() === "data: [DONE]") {
      return { type: "done" }
    }

    const jsonString = chunk.startsWith("data:") ? chunk.slice(5).trim() : chunk.trim()

    try {
      return JSON.parse(jsonString)
    } catch (error) {
      console.warn("Failed to parse JSON from chunk:", jsonString)
      return null
    }
  } catch (error) {
    console.error("Error parsing stream chunk:", error, "Raw chunk:", chunk)
    return null
  }
}

const contentPositionTracker = { currentLength: 0 }

export const processStreamResponse = (
    response: any,
    onToken: (token: string) => void,
    onToolCall: (toolCall: any) => void,
    onSidePanelData?: (data: any) => void,
) => {
  if (!response) return

  if (response.type === "done") {
    contentPositionTracker.currentLength = 0
    return
  }

  if (response.type === "token" && response.content) {
    onToken(response.content)
    contentPositionTracker.currentLength += response.content.length
    return
  }

  if (response.type === "message") {
    const { content } = response

    if (content?.type === "ai" && content?.content && typeof content.content === "string") {
      onToken(content.content)
      contentPositionTracker.currentLength += content.content.length
    }

    if (content?.type === "ai" && content?.tool_calls?.length) {
      content.tool_calls.forEach((toolCall: any) => {
        const toolCallWithPosition = {
          name: toolCall.name,
          args: toolCall.args,
          id: toolCall.id,
          position: contentPositionTracker.currentLength,
        }
        onToolCall(toolCallWithPosition)
      })
    }

    if (content?.type === "tool" && content?.content) {
      try {
        let toolContent
        if (typeof content.content === "string" && content.content.trim() !== "") {
          if (content.content.trim().startsWith("Error:")) {
            toolContent = { type: "error", error: content.content }
          } else {
            try {
              toolContent = JSON.parse(content.content)
            } catch (error) {
              toolContent = { type: "text", text: content.content }
              console.warn("Failed to parse tool response as JSON:", error, "Content:", content.content)
            }
          }
        } else if (typeof content.content === "object") {
          toolContent = content.content
        } else {
          toolContent = { type: "text", text: content.content || "" }
        }

        if (onSidePanelData) {
          onSidePanelData({
            ...toolContent,
            tool_call_id: content.tool_call_id,
          })
        }
      } catch (error) {
        console.error("Error processing tool response:", error)
        if (onSidePanelData) {
          onSidePanelData({
            type: "error",
            error: `Failed to process tool response: ${error instanceof Error ? error.message : "Unknown error"}`,
            tool_call_id: content.tool_call_id,
          })
        }
      }
    }
  }
}