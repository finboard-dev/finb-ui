"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import startChat from "@/../public/start-chat-button.svg";
import { useAppSelector } from "@/lib/store/hooks";
import { useChatStream } from "@/hooks/useChatStreaming";

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(1);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const { isResponding } = useAppSelector((state) => state.chat);
  const { sendMessage } = useChatStream();

  const models = [
    { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet" },
    { id: "claude-3-opus", name: "Claude 3 Opus" },
    { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
  ];
  const [selectedModel, setSelectedModel] = useState(models[0]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelSelectorRef.current &&
        !modelSelectorRef.current.contains(event.target as Node)
      ) {
        setIsModelSelectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    const textareaLineHeight = 24;
    const prevRows = e.target.rows;
    e.target.rows = 1;

    const currentRows = Math.ceil(e.target.scrollHeight / textareaLineHeight);

    if (currentRows === prevRows) {
      e.target.rows = currentRows;
    }

    setRows(currentRows < 4 ? currentRows : 4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isResponding) {
      const messageToSend = message;
      setMessage("");
      setRows(1);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      await sendMessage.mutate(messageToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter key (without Shift key for new lines)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid newline
      handleSubmit(e);
    }
  };

  const selectModel = (model: (typeof models)[0]) => {
    setSelectedModel(model);
    setIsModelSelectorOpen(false);
  };

  const isButtonDisabled = isResponding || !message.trim();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col w-full">
          <div className="shadow-[#D0BAFF] rounded-2xl">
            <div
              className={`block bg-white w-full p-5 shadow-sm text-base outline-none border transition-colors duration-200 relative rounded-2xl ${
                isResponding
                  ? "border-gray-200 cursor-not-allowed"
                  : "border-[#ECEFF5] focus:border-[#ECEFF5] focus:ring-4 focus:ring-[#ECEFF5] focus:ring-opacity-50"
              }`}
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isResponding ? "Waiting for response..." : "Message FinB..."
                }
                className={`w-9/12 placeholder:text-slate-400 max-md:w-5/6 outline-none bg-transparent resize-none overflow-hidden ${
                  isResponding
                    ? "cursor-not-allowed placeholder-gray-400"
                    : "placeholder-[#343a40cc]"
                }`}
                disabled={isResponding}
                rows={rows}
                style={{ minHeight: "24px", maxHeight: "120px" }}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isButtonDisabled}
                className={`absolute flex justify-center items-center gap-3 top-1/2 transform -translate-y-1/2 px-2 rounded-full h-8 right-4 font-medium text-sm transition-all duration-200 ${
                  isButtonDisabled
                    ? "bg-gradient-to-b from-[#4A25F0] to-[#7A3EFF] cursor-not-allowed opacity-50"
                    : "bg-gradient-to-b from-[#4A25F0] to-[#7A3EFF] hover:bg-green-blue focus:ring-4"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Image
                    src={startChat}
                    alt="Start Chat"
                    width={16}
                    height={16}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Floating model selector */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-2">
          <div className="relative" ref={modelSelectorRef}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md py-1 px-2 flex items-center gap-1"
            >
              {selectedModel.name}
              <ChevronDownIcon className="h-3 w-3" />
            </Button>

            {isModelSelectorOpen && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 rounded-lg bg-transparent z-10 animate-in fade-in slide-in-from-bottom-5 duration-200 w-48">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className={`px-3 py-2 text-xs cursor-pointer mb-1 rounded-lg backdrop-blur-md transition-all duration-150 ${
                      model.id === selectedModel.id
                        ? "bg-purple-100/90 dark:bg-purple-900/90 text-purple-600 dark:text-purple-300"
                        : "bg-white/80 dark:bg-zinc-800/80 hover:bg-gray-100/90 dark:hover:bg-zinc-700/90"
                    } border border-gray-200/50 dark:border-zinc-700/50`}
                    onClick={() => selectModel(model)}
                  >
                    {model.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
