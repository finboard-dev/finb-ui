"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  User,
  MessageSquare,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { toggleSidebar } from "@/lib/store/slices/chatSlice";

const ChatSidebar = () => {
  const dispatch = useAppDispatch();
  const { isSidebarOpen } = useAppSelector((state) => state.chat);

  return (
    <div
      className={`h-full flex flex-col border-r border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
        {isSidebarOpen ? (
          <>
            <h2 className="font-semibold text-lg">Claude</h2>
            <Button
              onClick={() => dispatch(toggleSidebar())}
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            onClick={() => dispatch(toggleSidebar())}
            variant="ghost"
            size="icon"
            className="w-full h-8 hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        {isSidebarOpen ? (
          <Button className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white">
            <PlusIcon className="h-4 w-4" />
            New Chat
          </Button>
        ) : (
          <Button className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white p-2">
            <PlusIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`${
                isSidebarOpen
                  ? "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 cursor-pointer text-sm"
                  : "p-2 flex justify-center rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 cursor-pointer"
              }`}
            >
              {isSidebarOpen ? (
                `Chat ${i + 1}`
              ) : (
                <MessageSquare className="h-5 w-5 text-gray-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
        {isSidebarOpen ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Claude 3.7 Sonnet
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
