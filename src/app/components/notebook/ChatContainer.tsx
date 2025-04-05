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
import Image from "next/image";
import chatLogo from "@/../public/chat_logo_final.svg"; // Adjust path as needed

const ChatContainer = () => {
  const dispatch = useAppDispatch();
  const { messages, isResponding, isSidebarOpen } = useAppSelector(
    (state) => state.chat
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage = {
      id: uuidv4(),
      role: "user" as const,
      content,
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage(userMessage));
    dispatch(setIsResponding(true));

    setTimeout(() => {
      const botMessage = {
        id: uuidv4(),
        role: "assistant" as const,
        content: `This is a simulated response to: "${content}"`,
        timestamp: new Date().toISOString(),
        variants: [
          { id: 1, content: `This is the default response to: "${content}"` },
          { id: 2, content: `This is variant 1 response to: "${content}"` },
          { id: 3, content: `This is variant 2 response to: "${content}"` },
        ],
      };
      dispatch(addMessage(botMessage));
      dispatch(setIsResponding(false));
    }, 1000);
  };

  // Loading animation component
  const LoadingAnimation = () => (
    <div className="flex items-center space-x-2">
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className="text-purple-500"
      >
        <circle
          cx="18"
          cy="18"
          r="16"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray="80"
          strokeDashoffset="60"
          className="animate-spin"
          style={{ animationDuration: "1.5s" }}
        />
        <circle
          cx="18"
          cy="18"
          r="8"
          fill="currentColor"
          className="animate-pulse"
          style={{ animationDuration: "1s" }}
        />
      </svg>
    </div>
  );

  return (
    <div className="flex flex-col h-full flex-1 bg-white dark:bg-zinc-900">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {isResponding && (
          <div className="flex w-full justify-start mb-6 items-start max-w-3xl mx-auto">
            {/* Use only the loading animation without the logo */}
            <div className="px-5 py-3 rounded-xl text-base font-medium max-w-[85%] bg-transparent">
              <LoadingAnimation />
            </div>
            <div className="flex-shrink-0 w-10" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-gray-200 dark:border-zinc-700">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatContainer;
