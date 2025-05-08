"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function DataVisualizer() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {/* Floating data points */}
            {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute h-1.5 w-1.5 rounded-full bg-cyan-400/30"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        opacity: [0.2, 0.5, 0.2],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: Math.random() * 3 + 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: Math.random() * 2,
                    }}
                />
            ))}

            {/* Data connection lines */}
            {Array.from({ length: 15 }).map((_, i) => {
                const startX = Math.random() * 100
                const startY = Math.random() * 100
                const endX = startX + (Math.random() * 20 - 10)
                const endY = startY + (Math.random() * 20 - 10)

                return (
                    <motion.div
                        key={`line-${i}`}
                        className="absolute h-px bg-cyan-400/10"
                        style={{
                            left: `${startX}%`,
                            top: `${startY}%`,
                            width: `${Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))}%`,
                            transformOrigin: "left center",
                            transform: `rotate(${Math.atan2(endY - startY, endX - startX) * (180 / Math.PI)}deg)`,
                        }}
                        animate={{
                            opacity: [0, 0.5, 0],
                            scaleX: [0, 1, 0],
                        }}
                        transition={{
                            duration: Math.random() * 4 + 3,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "loop",
                            ease: "easeInOut",
                            delay: Math.random() * 2,
                        }}
                    />
                )
            })}

            {/* Larger data visualization elements */}
            {Array.from({ length: 5 }).map((_, i) => {
                const size = Math.random() * 200 + 100
                return (
                    <motion.div
                        key={`viz-${i}`}
                        className="absolute rounded-full border border-cyan-500/5 bg-cyan-500/5"
                        style={{
                            width: size,
                            height: size,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            transform: "translate(-50%, -50%)",
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.05, 0.1, 0.05],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                    />
                )
            })}

            {/* Animated chart lines */}
            <div className="absolute bottom-0 left-0 h-40 w-full opacity-10">
                <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
                    <motion.path
                        d="M0,100 C150,80 350,150 500,100 C650,50 850,120 1000,100"
                        fill="none"
                        stroke="rgba(8, 145, 178, 0.5)"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: 1,
                            opacity: 0.5,
                            pathOffset: [0, 1],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                    <motion.path
                        d="M0,150 C200,120 300,180 500,150 C700,120 800,160 1000,150"
                        fill="none"
                        stroke="rgba(8, 145, 178, 0.3)"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: 1,
                            opacity: 0.3,
                            pathOffset: [0, 1],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                            delay: 2,
                        }}
                    />
                </svg>
            </div>
        </div>
    )
}