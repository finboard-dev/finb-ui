"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import type { MessageType, MentionType } from "@/types/chat";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Element } from "hast";
import ToolCallDisplay from "./ui/ToolCallDisplay";
import CompactParticlesLoader from "./ui/ChatLoading";
import { Check, Copy } from "lucide-react";

interface MessageItemProps {
  message: MessageType;
  isLoading?: boolean;
}

interface MessageMentionProps {
  name: string;
}

interface CustomComponents extends Components {
  mention?: (props: { node: Element }) => React.ReactNode;
}

const MessageMention: React.FC<MessageMentionProps> = ({ name }) => {
  return (
    <span className="inline-flex items-center bg-blue-100 text-blue-800 rounded-md py-0.5 px-2 mx-0.5 font-medium text-sm">
      {`@${name}`}
    </span>
  );
};

const MessageItem = ({ message, isLoading = false }: MessageItemProps) => {
  const { selectedVariant } = useAppSelector((state) => state.chat);
  const [copied, setCopied] = useState(false);
  const [processedContent, setProcessedContent] = useState("");
  const [isHovering, setIsHovering] = useState(false);

  const isAssistant = message.role === "assistant";

  const displayContent =
    isAssistant && message.variants
      ? message.variants.find((v) => v.id === selectedVariant)?.content ||
        message.content
      : message.content;

  const hasToolCalls =
    isAssistant && message.toolCalls && message.toolCalls.length > 0;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    let content = displayContent;

    // Handle mentions and remove emojis before them
    if (message.mentions && message.mentions.length > 0) {
      message.mentions.forEach((mention) => {
        // Look for emoji + @mention pattern
        // This regex matches any emoji character followed by @ and the mention name
        const emojiMentionRegex = new RegExp(
          `[\\p{Emoji}]\\s*@${mention.name}`,
          "gu"
        );

        // Replace with just the @mention without the emoji
        content = content.replace(emojiMentionRegex, `@${mention.name}`);

        // Then handle the mention formatting
        const mentionText = `@${mention.name}`;
        const mentionTag = `<mention data-name="${mention.name}"></mention>`;
        content = content.replace(mentionText, mentionTag);
      });
    }

    setProcessedContent(content);
  }, [displayContent, message.mentions]);

  return (
    <div className="flex w-full justify-start mb-6 items-start max-w-3xl mx-auto">
      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
        {/* Avatar could go here */}
      </div>

      <div
        className={`py-3 relative ${
          isAssistant
            ? "text-zinc-700 px-2"
            : "px-5 bg-background-card text-zinc-700 rounded-xl font-medium"
        } overflow-hidden`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {hasToolCalls && (
          <ToolCallDisplay
            toolCalls={message.toolCalls || []}
            isLoading={isLoading}
            messageId={message.id}
          />
        )}

        <div className="prose max-w-full break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={
              {
                mention: ({ node }: { node: Element }) => {
                  // Extract mention properties safely
                  const name =
                    node.properties?.["data-name"]?.toString() ||
                    node.properties?.dataName?.toString() ||
                    "Unknown";

                  return <MessageMention name={name} />;
                },
                img: ({ src, alt, width, height }) => {
                  if (!src) return null;
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
                      {alt && (
                        <span className="text-sm text-gray-500 block mt-1">
                          {alt}
                        </span>
                      )}
                    </>
                  );
                },
                p: ({ children }) => (
                  <p className="text-base leading-relaxed m-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <span className="font-bold">{children}</span>
                ),
                em: ({ children }) => (
                  <span className="italic">{children}</span>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 my-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 my-2">{children}</ol>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-gray-100 rounded px-1 break-all">
                    {children}
                  </code>
                ),
                table: ({ children }) => (
                  <table className="border-collapse border border-gray-300 my-4 w-full">
                    {children}
                  </table>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-100">{children}</thead>
                ),
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => (
                  <tr className="border-b border-gray-300">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-4 py-2">
                    {children}
                  </td>
                ),
              } as CustomComponents
            }
          >
            {processedContent}
          </ReactMarkdown>
        </div>

        {isAssistant && isLoading && (
          <div className="mt-4">
            <CompactParticlesLoader />
          </div>
        )}

        {/* Copy button that appears on hover */}
        {isHovering && (
          <div className="absolute top-2 -right-0">
            <button
              onClick={copyToClipboard}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check size={12} className="text-gray-500" />
              ) : (
                <Copy size={12} className="text-gray-500" />
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 w-10" />
    </div>
  );
};

export default MessageItem;
