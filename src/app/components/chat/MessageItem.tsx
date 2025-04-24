"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { MessageType } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ToolCallDisplay from "./ui/ToolCallDisplay";
import CompactParticlesLoader from "./ui/ChatLoading";

interface MessageItemProps {
  message: MessageType;
  isLoading?: boolean;
}

const MessageItem = ({ message, isLoading = false }: MessageItemProps) => {
  const { selectedVariant } = useAppSelector((state) => state.chat);
  const [copied, setCopied] = useState(false);

  const isAssistant = message.role === "assistant";

  const displayContent =
    isAssistant && message.variants
      ? message.variants.find((v) => v.id === selectedVariant)?.content ||
        message.content
      : message.content;

  // Check if the message contains tool calls
  const hasToolCalls =
    isAssistant && message.toolCalls && message.toolCalls.length > 0;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex w-full justify-start mb-6 items-start max-w-3xl mx-auto">
      {/* Avatar or indicator area - consistent width for both message types */}
      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
        {/* Avatar could go here */}
      </div>

      {/* Message content - consistently positioned for both message types */}
      <div
        className={`py-3 ${
          isAssistant
            ? "text-zinc-700 px-2"
            : "px-5 bg-background-card text-zinc-700 rounded-xl font-medium"
        } overflow-hidden`}
      >
        {/* Display Tool Calls UI if present */}
        {hasToolCalls && (
          <ToolCallDisplay
            toolCalls={message.toolCalls || []}
            isLoading={isLoading}
            messageId={message.id} // Pass the message ID to identify which tool calls belong to this message
          />
        )}

        <div className="prose max-w-full break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ src, alt, width, height }) => {
                if (!src) return null;

                return (
                  <>
                    <img
                      src={src}
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
              em: ({ children }) => <span className="italic">{children}</span>,
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
                <td className="border border-gray-300 px-4 py-2">{children}</td>
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>

        {/* Always add the loader at the end of assistant messages */}
        {isAssistant && isLoading && (
          <div className="mt-4">
            <CompactParticlesLoader />
          </div>
        )}
      </div>

      {/* Spacer to maintain consistent layout */}
      <div className="flex-shrink-0 w-10" />
    </div>
  );
};

export default MessageItem;
