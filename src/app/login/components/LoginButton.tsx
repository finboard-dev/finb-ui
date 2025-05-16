"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import intuitButton from "../../../../public/buttons/Sign_in_blue_btn_med_default.svg"
import hoverIntuitButton from "../../../../public/buttons/Sign_in_blue_btn_med_hover.svg"

interface LoginButtonProps {
    isLoading: boolean
    handleIntuitLogin: () => void
}

export function LoginButton({ isLoading = false, handleIntuitLogin }: LoginButtonProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <button
            onClick={handleIntuitLogin}
            disabled={isLoading}
            className={`relative cursor-pointer ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            onMouseEnter={() => !isLoading && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative flex items-center justify-center"
            >
                {isLoading ? (
                    <div className="absolute flex items-center justify-center">
                        <svg
                            className="animate-spin h-6 w-6 text-cyan-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                        </svg>
                    </div>
                ) : (
                    <Image
                        src={isHovered ? hoverIntuitButton : intuitButton}
                        alt="Sign in with Intuit"
                        width={200}
                        height={50}
                        className="h-full w-full object-contain transition-all duration-300 hover:opacity-90"
                    />
                )}
            </motion.div>
        </button>
    )
}