"use client";

import { ReactNode, useRef, useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";

interface SmartScrollProps {
    children: ReactNode;
    isResponding: boolean;
}

// Custom scroll behavior component that respects user scroll position
const SmartScroll = ({ children, isResponding }: SmartScrollProps) => {
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const [atBottom, setAtBottom] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
        }
    }, []);

    // Track scroll position changes
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Check if user is at bottom (with small threshold for rounding issues)
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;

        setAtBottom(isAtBottom);

        // If user scrolls up manually during a stream, remember this choice
        if (!isAtBottom && isResponding) {
            setUserScrolledUp(true);
        }

        // If user manually scrolls to bottom, reset the flag
        if (isAtBottom && userScrolledUp) {
            setUserScrolledUp(false);
        }
    }, [isResponding, userScrolledUp]);

    // Auto-scroll logic
    useEffect(() => {
        // Only auto-scroll if we're responding AND user hasn't manually scrolled up
        if (isResponding && !userScrolledUp) {
            scrollToBottom();
        }
    }, [children, isResponding, userScrolledUp, scrollToBottom]);

    return (
        <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-6"
            onScroll={handleScroll}
        >
            {children}

            {/* Show "scroll to bottom" button when not at bottom */}
            {!atBottom && (
                <button
                    onClick={scrollToBottom}
                    className="fixed bottom-20 right-8 bg-gray-800 text-white p-2 rounded-full shadow-lg opacity-70 hover:opacity-100 transition-opacity z-10"
                    aria-label="Scroll to bottom"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            )}
        </div>
    );
};

const ChatContainer = () => {
    const activeChatId = useAppSelector((state) => state.chat.activeChatId);
    const activeChat = useAppSelector((state) =>
        state.chat.chats.find((chat) => chat.id === activeChatId)
    );

    const messages = activeChat?.chats[0]?.messages || [];
    const isResponding = activeChat?.chats[0]?.isResponding || false;

    const latestAssistantIndex = messages
        .map((msg) => msg.role)
        .lastIndexOf("assistant");

    return (
        <div className="flex flex-col h-full flex-1">
            <SmartScroll isResponding={isResponding}>
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
            </SmartScroll>

            <div className="px-4 py-3">
                <MessageInput placeholder="Ask anything!" />
            </div>
        </div>
    );
};

export default ChatContainer;