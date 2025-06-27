"use client";

import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  loadChatMessages,
  processToolResponses,
  setResponsePanelWidth,
} from "@/lib/store/slices/chatSlice";
import { setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice";
import { useChatConversation } from "@/hooks/useChatConversation";
import { FinancialReportShimmer } from "@/app/components/chat/ui/shimmer/ChatShimmer";

interface ChatConversationLoaderProps {
  threadId: string;
  chatId: string;
  children: React.ReactNode;
  hasExistingMessages?: boolean;
}

export const ChatConversationLoader: React.FC<ChatConversationLoaderProps> = ({
  threadId,
  chatId,
  children,
  hasExistingMessages = false,
}) => {
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useChatConversation(
    threadId,
    hasExistingMessages
  );

  useEffect(() => {
    if (data && data.messages) {
      dispatch(
        loadChatMessages({
          chatId: chatId,
          messages: data.messages,
        })
      );
      processToolResponses(data.messages, dispatch);

      const toolMessages = data.messages.filter(
        (msg: { type: string }) => msg.type === "tool"
      );
      if (toolMessages.length > 0) {
        const latestToolCallId =
          toolMessages[toolMessages.length - 1].tool_call_id;
        dispatch(setActiveToolCallId(latestToolCallId));
        dispatch(setResponsePanelWidth(30));
      }
    }
  }, [data, chatId, dispatch]);

  if (isLoading) {
    return <FinancialReportShimmer />;
  }

  if (error) {
    console.error("Failed to load chat messages:", error);
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Failed to load chat messages</div>
      </div>
    );
  }

  return <>{children}</>;
};
