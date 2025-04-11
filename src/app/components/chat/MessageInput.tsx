"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowUp } from "lucide-react";
import Image from "next/image";
import { useAppSelector } from "@/lib/store/hooks";
import { useChatStream } from "@/hooks/useChatStreaming";

type MessageInput = {
  placeholder?: string | "Ask anything";
  showBorder?: boolean;
};

export default function MessageInput({
  placeholder,
  showBorder = true,
}: MessageInput) {
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(1);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const { isResponding } = useAppSelector((state) => state.chat);
  const { sendMessage } = useChatStream();

  const models = [
    { id: "finboard", name: "Finboard" },
    { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet" },
    { id: "claude-3-opus", name: "Claude 3 Opus" },
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const selectModel = (model: (typeof models)[0]) => {
    setSelectedModel(model);
    setIsModelSelectorOpen(false);
  };

  const isButtonDisabled = isResponding || !message.trim();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <Card
        className={`${
          !showBorder
            ? "bg-transparent px-0 py-0 border-none"
            : "rounded-2xl bg-background-card -z-10 border-none px-3 py-3"
        }`}
      >
        <Card className="rounded-xl bg-white z-10 border-primary p-6">
          <div className="flex flex-col w-full">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isResponding ? "Waiting for response..." : placeholder
              }
              className="text-base placeholder:text-placeholder placeholder:font-medium h-20 text-gray-500 font-light w-full outline-none px-2 resize-none"
              disabled={isResponding}
              rows={rows}
              style={{ minHeight: "24px" }}
            />

            <div className="flex items-center pt-3 gap-2">
              <div className="relative" ref={modelSelectorRef}>
                <div
                  className="flex items-center border border-primary rounded-lg px-2 py-1 cursor-pointer"
                  onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">qb</span>
                    </div>
                    <span className="text-gray-800 font-medium">
                      {selectedModel.name}
                    </span>
                  </div>
                  <div className="border-l ml-3 border-primary">
                    <ChevronDown className="ml-2 h-5 w-5 text-gray-500" />
                  </div>
                </div>

                {isModelSelectorOpen && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg z-10 w-48 border border-primary">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                          model.id === selectedModel.id
                            ? "bg-gray-100 text-gray-900"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => selectModel(model)}
                      >
                        {model.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-grow"></div>

              <Button
                onClick={handleSubmit}
                disabled={isButtonDisabled}
                className={`rounded-full h-12 w-12 p-0 flex items-center justify-center ${
                  isButtonDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-gray-800"
                }`}
              >
                <ArrowUp className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        </Card>
      </Card>
    </div>
  );
}
