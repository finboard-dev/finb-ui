"use client"

import React from "react";

interface LoadingAnimationProps {
    message : string;
}

import { motion } from "framer-motion"
import { Loader2, BarChart, PieChart, LineChart } from "lucide-react"

export const LoadingAnimationChild = () => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-95 z-50">
            <div className="relative w-64 h-64 mb-8">
                {/* Primary loading animation */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="relative w-32 h-32"
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <motion.circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="#3b82f6"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: [0, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                                strokeDasharray="251.2"
                                strokeDashoffset="0"
                            />
                        </svg>
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        >
                            <Loader2 className="w-12 h-12 text-blue-500" />
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Secondary floating elements */}
                <motion.div
                    className="absolute top-0 left-0"
                    animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                >
                    <div className="bg-blue-100 bg-opacity-80 rounded-lg p-2 shadow-md">
                        <BarChart className="w-10 h-10 text-blue-600" />
                    </div>
                </motion.div>

                <motion.div
                    className="absolute bottom-4 right-0"
                    animate={{
                        y: [0, 10, 0],
                        rotate: [0, -5, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 0.5,
                    }}
                >
                    <div className="bg-green-100 bg-opacity-80 rounded-lg p-2 shadow-md">
                        <PieChart className="w-10 h-10 text-green-600" />
                    </div>
                </motion.div>

                <motion.div
                    className="absolute top-8 right-4"
                    animate={{
                        y: [0, -8, 0],
                        rotate: [0, 3, 0],
                    }}
                    transition={{
                        duration: 3.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 0.3,
                    }}
                >
                    <div className="bg-purple-100 bg-opacity-80 rounded-lg p-2 shadow-md">
                        <LineChart className="w-8 h-8 text-purple-600" />
                    </div>
                </motion.div>
            </div>

            <motion.div
                className="text-gray-700 text-xl font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >

            </motion.div>

        </div>
    )
}

export const LoadingAnimationAlt = () => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-95 z-50">
            <div className="relative w-64 h-64 mb-8">
                {/* Primary loading animation - data visualization inspired */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <svg viewBox="0 0 200 200" className="w-40 h-40">
                        {/* Outer circle */}
                        <motion.circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="4" />

                        {/* Animated segments */}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <motion.path
                                key={i}
                                d={`M 100 100 L 100 20 A 80 80 0 0 1 ${100 + 80 * Math.sin((Math.PI / 3) * (i + 1))} ${100 - 80 * Math.cos((Math.PI / 3) * (i + 1))} Z`}
                                fill="none"
                                stroke={`hsl(${i * 40}, 70%, 60%)`}
                                strokeWidth="3"
                                initial={{ opacity: 0.2, scale: 0.8 }}
                                animate={{
                                    opacity: [0.2, 0.8, 0.2],
                                    scale: [0.8, 1, 0.8],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    delay: i * 0.3,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}

                        {/* Inner circle */}
                        <motion.circle
                            cx="100"
                            cy="100"
                            r="30"
                            fill="#f8fafc"
                            stroke="#e2e8f0"
                            strokeWidth="3"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        />

                        {/* Pulsing dot */}
                        <motion.circle
                            cx="100"
                            cy="100"
                            r="15"
                            fill="#3b82f6"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        />
                    </svg>
                </motion.div>

                {/* Floating data points */}
                {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            top: `${20 + i * 15}%`,
                            left: `${10 + (i % 3) * 30}%`,
                        }}
                        animate={{
                            y: [0, -10, 0],
                            x: [0, i % 2 === 0 ? 5 : -5, 0],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 2 + i * 0.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                            delay: i * 0.2,
                        }}
                    >
                        <div
                            className={`rounded-full w-${3 + (i % 3)} h-${3 + (i % 3)} bg-${
                                ["blue", "green", "purple", "indigo", "teal"][i]
                            }-${400 + i * 100}`}
                        ></div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                className="text-gray-700 text-xl font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
            </motion.div>
        </div>
    )
}

export const LoadingAnimationDots = () => {
    const dotColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-red-500", "bg-indigo-500"]

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-95 z-50">
            <div className="relative w-64 h-64 mb-8">
                {/* Main loading animation - dots circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-40 h-40">
                        {dotColors.map((color, i) => (
                            <motion.div
                                key={i}
                                className={`absolute w-4 h-4 ${color} rounded-full shadow-md`}
                                style={{
                                    originX: "100px",
                                    originY: "100px",
                                }}
                                initial={{
                                    x: "50%",
                                    y: "50%",
                                    scale: 0,
                                }}
                                animate={{
                                    x: `${50 + 35 * Math.cos((2 * Math.PI * i) / dotColors.length)}%`,
                                    y: `${50 + 35 * Math.sin((2 * Math.PI * i) / dotColors.length)}%`,
                                    scale: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    delay: i * (2 / dotColors.length),
                                    ease: "easeInOut",
                                }}
                            />
                        ))}

                        {/* Center pulsing circle */}
                        <motion.div
                            className="absolute top-1/2 left-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
                            style={{ x: "-50%", y: "-50%" }}
                            animate={{
                                scale: [0.8, 1, 0.8],
                                boxShadow: [
                                    "0 4px 6px rgba(59, 130, 246, 0.1)",
                                    "0 8px 12px rgba(59, 130, 246, 0.2)",
                                    "0 4px 6px rgba(59, 130, 246, 0.1)",
                                ],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                            }}
                        >
                            <motion.div
                                className="w-8 h-8 bg-blue-500 rounded-full opacity-80"
                                animate={{
                                    scale: [0.8, 1, 0.8],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut",
                                }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Floating elements */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            top: `${i * 30}%`,
                            left: `${i * 30}%`,
                            zIndex: 10,
                        }}
                        animate={{
                            y: [0, i % 2 === 0 ? -15 : 15, 0],
                            rotate: [0, i % 2 === 0 ? 5 : -5, 0],
                        }}
                        transition={{
                            duration: 3 + i,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    >
                        <div
                            className={`bg-gradient-to-br from-${["blue", "green", "purple"][i]}-100 to-${
                                ["blue", "green", "purple"][i]
                            }-200 rounded-lg p-3 shadow-md`}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                className={`text-${["blue", "green", "purple"][i]}-500`}
                            >
                                {i === 0 && (
                                    // Chart icon
                                    <path
                                        d="M3 3v18h18"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}
                                {i === 0 && (
                                    <path
                                        d="M8 12l3-3 2 2 5-5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}
                                {i === 1 && (
                                    // Pie chart icon
                                    <>
                                        <path
                                            d="M12 2v10h10"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M12 12a10 10 0 1 0 10-10H12v10z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </>
                                )}
                                {i === 2 && (
                                    // Bar chart icon
                                    <>
                                        <path
                                            d="M18 20V10"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M12 20V4"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M6 20v-6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </>
                                )}
                            </svg>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                className="text-gray-700 text-xl font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
            </motion.div>
        </div>
    )
}

const LoadingAnimation = ({message}: LoadingAnimationProps) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold mb-4">{message}</h1>
            <div className="flex flex-wrap justify-center gap-4">
                <div className="w-80 h-80">
                    <LoadingAnimationChild />
                </div>
                <div className="w-80 h-80">
                    <LoadingAnimationAlt />
                </div>
                <div className="w-80 h-80">
                    <LoadingAnimationDots />
                </div>
            </div>
        </div>
    );
};

export default LoadingAnimation;