"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import intuitButton from "@/../public/images/icons/Sign_in_blue_btn_med_default.svg";
import hoverIntuitButton from "@/../public/images/icons/Sign_in_blue_btn_med_hover.svg";

interface LoginButtonProps {
    isLoading: boolean
    handleIntuitLogin: () => void
}

export default function LoginButton({ isLoading = false, handleIntuitLogin }: LoginButtonProps) {
    const [isHovered, setIsHovered] = useState(false)


    return (
                <button
                    onClick={() => {
                        handleIntuitLogin()
                    }}
                    disabled={isLoading}
                    className="cursor-pointer"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <Image
                                src={isHovered ? hoverIntuitButton : intuitButton}
                                alt="Sign in with Intuit"
                                width={200}
                                height={50}
                                className="h-full w-full object-contain transition-all duration-300 hover:opacity-90"
                            />
                        </motion.div>

                </button>
    )
}
