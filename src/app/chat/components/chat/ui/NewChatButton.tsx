"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { initializeNewChat } from "@/lib/store/slices/chatSlice";
import { setMainContent } from "@/lib/store/slices/uiSlice";
import { useUrlParams } from "@/lib/utils/urlParams";

const NewChatButton: FC = () => {
  const dispatch = useAppDispatch();
  const { startNewChat } = useUrlParams();

  const selectedCompany = useAppSelector(
    (state) => state.user.selectedCompany
  ) as any;
  const availableAssistants: any[] = selectedCompany?.assistants || [];

  const handleNewChat = (e: React.MouseEvent, assistantId?: string) => {
    e.stopPropagation();
    const selectedAssistant = assistantId
      ? availableAssistants.find((assist: any) => assist.id === assistantId)
      : availableAssistants.find(
          (assist: any) => assist.name === "report_agent"
        ) || availableAssistants[0];

    if (selectedAssistant) {
      dispatch(initializeNewChat({ assistantId: selectedAssistant.id }));
    }
    localStorage.removeItem("thread_id");
    dispatch(setMainContent("chat"));

    // Add a small delay to ensure Redux state is properly updated before URL change
    setTimeout(() => {
      startNewChat();
    }, 0);
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={(e) => handleNewChat(e)}
      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
    >
      <PlusIcon className="h-4 w-4" />
      New Chat
    </Button>
  );
};

export default NewChatButton;
