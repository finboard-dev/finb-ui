"use client";

import { useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import {
  addMessage,
  setIsResponding,
  toggleSidebar,
} from "@/lib/store/slices/chatSlice";
import MessageItem from "./MessageItem";
import { MenuIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import MessageInput from "./MessageInput";

const ChatContainer = () => {
  const { messages, isResponding, isSidebarOpen } = useAppSelector(
    (state) => state.chat
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get the latest assistant message index
  const latestAssistantIndex = messages
    .map((msg) => msg.role)
    .lastIndexOf("assistant");

  return (
    <div className="flex flex-col h-full flex-1 bg-white">
      {/* Messages Container */}
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

      <div className="px-4 border-gray-200">
        <MessageInput placeholder="Ask Anything!" />
      </div>
    </div>
  );
};

export default ChatContainer;
