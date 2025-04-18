"use client";

import { useRef, useEffect } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";

const ChatContainer = () => {
  const { messages, isResponding, isSidebarOpen } = useAppSelector(
    (state) => state.chat
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const latestAssistantIndex = messages
    .map((msg) => msg.role)
    .lastIndexOf("assistant");

  return (
    <div className="flex flex-col h-full flex-1">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message, index) => (
          <div key={message.id} className="relative">
            <MessageItem
              message={message}
              isLoading={
                isResponding &&
                message.role === "assistant" &&
                index === latestAssistantIndex
              }
            />
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3">
        <MessageInput placeholder="Ask anything!" />
      </div>
    </div>
  );
};

export default ChatContainer;
