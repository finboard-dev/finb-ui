// src/components/MessageItem.tsx
"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { MessageType } from "@/types/chat";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import chatLogo from "@/../public/chat_logo_final.svg";

interface MessageItemProps {
  message: MessageType;
}

const MessageItem = ({ message }: MessageItemProps) => {
  const { selectedVariant } = useAppSelector((state) => state.chat);
  const [copied, setCopied] = useState(false);

  const isAssistant = message.role === "assistant";

  const displayContent =
    isAssistant && message.variants
      ? message.variants.find((v) => v.id === selectedVariant)?.content ||
        message.content
      : message.content;

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
        <div className="px-5 py-3 rounded-xl text-base font-medium max-w-[85%] bg-[#F5F4F0] text-zinc-700 ml-2 overflow-hidden">
          <div className="prose max-w-full break-words">
            <ReactMarkdown
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
          </div>
          <div className="px-5 py-3 rounded-xl text-base font-medium max-w-[85%] bg-transparent text-zinc-700 mr-2 group relative overflow-hidden">
            <div className="prose max-w-full break-words">
              <ReactMarkdown
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
