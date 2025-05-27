"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TooltipProvider } from "@/components/ui/tooltip"; // For Shadcn Tooltip

interface RootProviderProps {
    children: React.ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
    return (
        <DndProvider backend={HTML5Backend}>
            <TooltipProvider>
                {children}
            </TooltipProvider>
        </DndProvider>
    );
}