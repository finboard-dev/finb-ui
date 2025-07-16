"use client"

import { cn } from "@/lib/utils"

interface ShimmerProps {
    className?: string
}

export function Shimmer({ className }: ShimmerProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-gradient-to-r from-transparent via-muted/60 to-transparent",
                className,
            )}
        />
    )
}
