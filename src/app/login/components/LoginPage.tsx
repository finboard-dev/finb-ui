"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useAnimation, useInView } from "framer-motion"
import LoginButton from "./LoginButton"
import DataVisualizer from './ui/DataVisualizer'
import { BarChartIcon, PieChartIcon, LineChartIcon, AreaChartIcon } from "lucide-react"

interface LoginButtonProps {
    isLoading: boolean
    handleIntuitLogin: () => void
}

export default function LoginPage({ isLoading = false, handleIntuitLogin }: LoginButtonProps) {
    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.3 })
    const controls = useAnimation()

    useEffect(() => {
        if (isInView) {
            controls.start("visible")
        }
    }, [isInView, controls])

    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
            {/* Animated background grid */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    className="h-full w-full bg-[linear-gradient(to_right,#20304010_1px,transparent_1px),linear-gradient(to_bottom,#20304010_1px,transparent_1px)] bg-[size:40px_40px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ duration: 1.5 }}
                />
            </div>

            {/* Floating data visualization elements */}
            <DataVisualizer />

            <div
                ref={containerRef}
                className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-center px-4 md:flex-row"
            >
                {/* Left side - Brand & Illustrations */}
                <motion.div
                    className="mb-8 w-full md:mb-0 md:w-1/2 md:pr-8"
                    initial="hidden"
                    animate={controls}
                    variants={{
                        hidden: { opacity: 0, x: -50 },
                        visible: {
                            opacity: 1,
                            x: 0,
                            transition: {
                                duration: 0.8,
                                staggerChildren: 0.1,
                            },
                        },
                    }}
                >
                    <motion.div
                        className="mb-6 text-center md:text-left"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                        }}
                    >
                        <h1 className="mb-2 font-sans text-5xl font-bold tracking-tight text-white">
                            <span className="text-cyan-400">finb</span>
                            <span className="text-white">.</span>
                            <span className="text-cyan-400">ai</span>
                        </h1>
                        <p className="text-lg font-light text-slate-300">Intelligent financial reporting, reimagined</p>
                    </motion.div>

                    <motion.div
                        className="relative h-64 w-full md:h-80"
                        variants={{
                            hidden: { opacity: 0, scale: 0.9 },
                            visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
                        }}
                    >
                        <div className="absolute left-0 top-0 h-full w-full rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
                            <div className="mb-4 flex items-center">
                                <div className="mr-2 h-3 w-3 rounded-full bg-red-400"></div>
                                <div className="mr-2 h-3 w-3 rounded-full bg-yellow-400"></div>
                                <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                <div className="ml-4 text-xs font-medium text-slate-400">Financial Dashboard</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <motion.div
                                    className="rounded-lg bg-slate-800/70 p-3"
                                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                                >
                                    <div className="mb-2 text-xs font-medium text-slate-400">Revenue Growth</div>
                                    <div className="h-24 w-full overflow-hidden rounded-md bg-slate-900/50">
                                        <motion.div
                                            className="h-full w-full bg-gradient-to-t from-cyan-500/20 to-transparent"
                                            initial={{ height: 0 }}
                                            animate={{
                                                height: ["0%", "60%", "40%", "75%"],
                                            }}
                                            transition={{
                                                duration: 5,
                                                repeat: Number.POSITIVE_INFINITY,
                                                repeatType: "reverse",
                                            }}
                                        />
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="rounded-lg bg-slate-800/70 p-3"
                                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                                >
                                    <div className="mb-2 text-xs font-medium text-slate-400">Profit Margin</div>
                                    <div className="flex h-24 items-end justify-between overflow-hidden rounded-md bg-slate-900/50 p-2">
                                        {[40, 65, 35, 85, 55, 75, 30].map((height, i) => (
                                            <motion.div
                                                key={i}
                                                className="h-full w-2 rounded-t-sm bg-cyan-400"
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                transition={{
                                                    duration: 0.8,
                                                    delay: i * 0.1,
                                                    repeat: Number.POSITIVE_INFINITY,
                                                    repeatType: "reverse",
                                                    repeatDelay: 5,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="mt-6 flex flex-wrap justify-center gap-4 md:justify-start"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { delay: 0.3, duration: 0.5 } },
                        }}
                    >
                        {["Real-time Analytics", "AI Reporting", "Dynamic Dashboards", "Financial Insights"].map(
                            (feature, index) => (
                                <motion.div
                                    key={feature}
                                    className="flex items-center rounded-full bg-slate-800/50 px-3 py-1 text-xs font-medium text-cyan-300"
                                    whileHover={{ scale: 1.05, backgroundColor: "rgba(8, 145, 178, 0.2)" }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                >
                                    <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400"></div>
                                    {feature}
                                </motion.div>
                            ),
                        )}
                    </motion.div>
                </motion.div>

                {/* Right side - Login */}
                <motion.div
                    className="w-full md:w-1/2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.div
                        className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/70 backdrop-blur-xl"
                        whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="p-8">
                            <div className="mb-8 text-center">
                                <motion.h2
                                    className="mb-2 text-2xl font-bold text-white"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                >
                                    Welcome Back
                                </motion.h2>
                                <motion.p
                                    className="text-slate-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                >
                                    Access your financial intelligence platform
                                </motion.p>
                            </div>

                            <div className="space-y-6">
                                <div className="relative">
                                    <motion.div
                                        className="mb-6 flex items-center justify-center space-x-2"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6, duration: 0.6 }}
                                    >
                                        <div className="h-px flex-1 bg-slate-700"></div>
                                        <span className="text-sm font-medium text-slate-400">SECURE ACCESS</span>
                                        <div className="h-px flex-1 bg-slate-700"></div>
                                    </motion.div>

                                    <motion.div
                                        className="flex justify-center"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.7, duration: 0.5 }}
                                    >
                                        <LoginButton isLoading={isLoading} handleIntuitLogin={handleIntuitLogin} />
                                    </motion.div>
                                </div>

                                <motion.div
                                    className="mt-8 text-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8, duration: 0.6 }}
                                >
                                    <p className="text-xs text-slate-500">
                                        By logging in, you agree to our{" "}
                                        <a href="#" className="text-cyan-400 hover:underline">
                                            Terms of Service
                                        </a>{" "}
                                        and{" "}
                                        <a href="#" className="text-cyan-400 hover:underline">
                                            Privacy Policy
                                        </a>
                                    </p>
                                    <p className="mt-4 text-xs font-medium text-slate-500">
                                        © {new Date().getFullYear()} finb.ai — Enterprise Financial Intelligence
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Floating icons */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                {[BarChartIcon, PieChartIcon, LineChartIcon, AreaChartIcon].map((Icon, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-slate-700/20"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            fontSize: `${Math.random() * 40 + 20}px`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 0.3, 0],
                            y: [0, -30],
                            rotate: Math.random() * 20 - 10,
                        }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: Math.random() * 5,
                        }}
                    >
                        <Icon size={Math.random() * 40 + 20} />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
