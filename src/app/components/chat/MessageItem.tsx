"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { MessageType } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import chatLogo from "@/../public/chat_logo_final.svg";
import remarkGfm from "remark-gfm";
import ToolCallDisplay from "../ui/ToolCallDisplay";

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

  // Check if the message contains a tool call
  const hasToolCall = isAssistant && message.toolCall;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex w-full ${
        isAssistant ? "justify-start" : "justify-end"
      } mb-6 items-start max-w-3xl mx-auto`}
    >
      {!isAssistant ? (
        <div className="px-5 py-3 rounded-xl text-base font-medium max-w-[85%] bg-background-card text-zinc-700 ml-2 overflow-hidden">
          <div className="prose max-w-full break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
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
                // Add styling for tables
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
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <>
          <div className="relative flex items-center justify-center w-8 h-8 mt-2 rounded-full flex-shrink-0 select-none">
            <Image
              src={chatLogo}
              width={28}
              height={28}
              alt="Bot Avatar"
              loading="eager"
              unoptimized
              className="m-0 p-0 select-none pointer-events-none"
            />
            {isLoading && !hasToolCall && (
              <div className="absolute -right-6 w-4 h-4 bg-gradient-to-b from-[#4A25F0] to-[#7A3EFF] rounded-full pulse animate-pulse" />
            )}
          </div>
          <div className="px-5 py-3 rounded-xl text-base font-medium max-w-[85%] bg-transparent text-zinc-700 mr-2 group relative overflow-hidden">
            {/* Display Tool Call UI if present */}
            {hasToolCall && (
              <ToolCallDisplay
                toolName={message?.toolCall?.name || ""}
                toolArgs={message?.toolCall?.args}
                isLoading={isLoading}
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
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          </div>
          <div className="flex-shrink-0 w-10" />
        </>
      )}
    </div>
  );
};

export default MessageItem;
