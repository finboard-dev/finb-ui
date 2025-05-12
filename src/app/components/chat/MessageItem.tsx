"use client"

import { useState, useEffect, Fragment } from "react"
import { useAppSelector } from "@/lib/store/hooks"
import type { MessageType } from "@/types/chat"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import type { Element } from "hast"
import ToolCallDisplay from "./ui/ToolCallDisplay"
import CompactParticlesLoader from "./ui/ChatLoading"
import { Check, Copy } from "lucide-react"

interface MessageItemProps {
  message: MessageType
  isLoading?: boolean
}

interface MessageMentionProps {
  name: string
}

interface CustomComponents extends Components {
  mention?: (props: { node: Element }) => React.ReactNode
}

const MessageMention: React.FC<MessageMentionProps> = ({ name }) => {
  return (
      <span className="inline-flex items-center bg-blue-100 text-blue-800 rounded-md py-0.5 px-2 mx-0.5 font-medium text-sm">
      {`@${name}`}
    </span>
  )
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLoading = false }) => {
  const activeChatId = useAppSelector((state) => state.chat.activeChatId)
  const activeChat = useAppSelector((state) => state.chat.chats.find((chat) => chat.id === activeChatId))
  const selectedVariant = activeChat?.chats[0]?.selectedVariant || 1

  const [copied, setCopied] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const isAssistant = message.role === "assistant"
  const displayContent = isAssistant && message.variants
      ? message.variants.find((v) => v.id === selectedVariant)?.content || message.content
      : message.content
  const hasToolCalls = isAssistant && message.toolCalls && message.toolCalls.length > 0

  const copyToClipboard = () => {
    const textContent = displayContent
        .filter(part => part.type === "text")
        .map(part => part.content)
        .join("")
    navigator.clipboard.writeText(textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (!displayContent) {
      return
    }

    let content = displayContent.map(part => {
      if (part.type === "text" && message.mentions && message.mentions.length > 0) {
        let contentText = part.content
        message.mentions.forEach((mention) => {
          const emojiMentionRegex = new RegExp(`[\\p{Emoji}]\\s*@${mention.name}`, "gu")
          contentText = contentText.replace(emojiMentionRegex, `@${mention.name}`)
          const mentionText = `@${mention.name}`
          const mentionTag = `<mention data-name="${mention.name}"></mention>`
          contentText = contentText.replace(new RegExp(mentionText, "g"), mentionTag)
        })
        return { ...part, content: contentText }
      }
      return part
    })

    // Handle duplicated content
    const textParts = content.filter(part => part.type === "text").map(part => part.content).join("")
    const halfLength = Math.floor(textParts.length / 2)
    if (halfLength > 0) {
      const firstHalf = textParts.substring(0, halfLength)
      const secondHalf = textParts.substring(halfLength)
      if (firstHalf === secondHalf) {
        content = content.slice(0, Math.ceil(content.length / 2))
      }
    }
  }, [displayContent, message.mentions])

  return (
      <div className="flex w-full justify-start items-start max-w-3xl mx-auto">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center"></div>

        <div
            className={`py-3 relative ${
                isAssistant ? "text-zinc-700 px-2" : "px-5 bg-background-card my-4  text-zinc-700 rounded-xl font-medium"
            } overflow-hidden`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
          <div className="prose max-w-full break-words">
            {displayContent.map((part, index) => (
                <Fragment key={index}>
                  {part.type === "text" ? (
                      <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            mention: ({ node }: { node: Element }) => {
                              const name =
                                  node.properties?.["data-name"]?.toString() ||
                                  node.properties?.dataName?.toString() ||
                                  "Unknown"
                              return <MessageMention name={name} />
                            },
                            img: ({ src, alt, width, height }) => {
                              if (!src) return null
                              return (
                                  <>
                                    <img
                                        src={src || "/placeholder.svg"}
                                        alt={alt || "Image"}
                                        width={width || "auto"}
                                        height={height || "auto"}
                                        className="max-w-full h-auto rounded"
                                        loading="lazy"
                                    />
                                    {alt && <span className="text-sm text-gray-500 block mt-1">{alt}</span>}
                                  </>
                              )
                            },
                            p: ({ children }) => <p className="text-base leading-relaxed m-0">{children}</p>,
                            strong: ({ children }) => <span className="font-bold">{children}</span>,
                            em: ({ children }) => <span className="italic">{children}</span>,
                            ul: ({ children }) => <ul className="list-disc pl-4 my-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 my-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            code: ({ children }) => <code className="bg-gray-100 rounded px-1 break-all">{children}</code>,
                            table: ({ children }) => (
                                <table className="border-collapse border border-gray-300 my-4 w-full">{children}</table>
                            ),
                            thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => <tr className="border-b border-gray-300">{children}</tr>,
                            th: ({ children }) => (
                                <th className="border border-gray-300 px-4 py-2 text-left font-bold">{children}</th>
                            ),
                            td: ({ children }) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
                          } as CustomComponents}
                      >
                        {part.content}
                      </ReactMarkdown>
                  ) : (
                      part.toolCallId && message.toolCalls && (
                          <ToolCallDisplay
                              toolCall={message.toolCalls.find((tc) => tc.id === part.toolCallId)}
                              isLoading={isLoading}
                              messageId={message.id}
                              inline={true}
                          />
                      )
                  )}
                </Fragment>
            ))}
          </div>

          {isAssistant && isLoading && (
              <div className="mt-4">
                <CompactParticlesLoader />
              </div>
          )}

          {isHovering && (
              <div className="absolute top-2 right-0">
                <button
                    onClick={copyToClipboard}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    title="Copy message"
                >
                  {copied ? <Check size={12} className="text-gray-500" /> : <Copy size={12} className="text-gray-500" />}
                </button>
              </div>
          )}
        </div>

        <div className="flex-shrink-0 w-10" />
      </div>
  )
}

export default MessageItem