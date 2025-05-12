"use client";

import React from "react"

export function FinancialReportShimmer() {
    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-white">
            {/* Command header shimmer */}
            <div className="flex justify-left pl-8 my-4">
                <div className="shimmer-background rounded-full py-2 px-6 w-64 h-10"></div>
            </div>

            <div className="flex h-full flex-col overflow-y-auto scrollbar-hidden">
            {/* Command prompt shimmer */}
            <div className="flex justify-left pl-8 my-4">
                <div className="shimmer-background border border-gray-200 rounded-lg py-3 px-4 w-72 h-12 flex items-center">
                    <div className="shimmer-line h-5 w-5 mr-2"></div>
                    <div className="shimmer-line h-5 w-48"></div>
                    <div className="shimmer-line h-5 w-5 ml-auto"></div>
                </div>
            </div>

            {/* Report content shimmer */}
            <div className="my-6 px-8">
                <div className="shimmer-line h-6 w-3/4 mb-4"></div>
                <div className="shimmer-line h-5 w-full mb-3"></div>
                <div className="shimmer-line h-5 w-full mb-3"></div>
                <div className="shimmer-line h-5 w-full mb-3"></div>
                <div className="shimmer-line h-5 w-full mb-3"></div>
                <div className="shimmer-line h-5 w-full mb-3"></div>
                <div className="shimmer-line h-5 w-full mb-3"></div>
                <div className="shimmer-line h-5 w-full mb-3"></div>
                <div className="shimmer-line h-5 w-4/5 mb-3"></div>
                <div className="shimmer-line h-5 w-2/3 mb-3"></div>
            </div>
                <div className="flex justify-left pl-8 my-4">
                    <div className="shimmer-background border border-gray-200 rounded-lg py-3 px-4 w-72 h-12 flex items-center">
                        <div className="shimmer-line h-5 w-5 mr-2"></div>
                        <div className="shimmer-line h-5 w-48"></div>
                        <div className="shimmer-line h-5 w-5 ml-auto"></div>
                    </div>
                </div>

                {/* Report content shimmer */}
                <div className="my-6 px-8">
                    <div className="shimmer-line h-6 w-3/4 mb-4"></div>
                    <div className="shimmer-line h-5 w-full mb-3"></div>
                    <div className="shimmer-line h-5 w-full mb-3"></div>
                    <div className="shimmer-line h-5 w-full mb-3"></div>
                    <div className="shimmer-line h-5 w-full mb-3"></div>
                    <div className="shimmer-line h-5 w-full mb-3"></div>
                    <div className="shimmer-line h-5 w-full mb-3"></div>
                    <div className="shimmer-line h-5 w-full mb-3"></div>
                    <div className="shimmer-line h-5 w-4/5 mb-3"></div>
                    <div className="shimmer-line h-5 w-2/3 mb-3"></div>
                </div>
            </div>

            {/* Empty space */}
            <div className="flex-grow"></div>

            {/* Input area shimmer */}
            <div className="border border-gray-200 rounded-lg p-4 m-4 mt-auto">
                <div className="shimmer-line h-6 w-3/4 mb-6"></div>

                <div className="flex items-center mt-4">
                    <div className="shimmer-background border border-gray-200 rounded-lg py-2 px-3 w-48 h-10 flex items-center mr-4">
                        <div className="shimmer-line h-5 w-5 mr-2"></div>
                        <div className="shimmer-line h-5 w-32"></div>
                    </div>

                    <div className="shimmer-background border border-gray-200 rounded-lg py-2 px-3 w-40 h-10 flex items-center">
                        <div className="shimmer-line h-5 w-5 mr-2"></div>
                        <div className="shimmer-line h-5 w-24"></div>
                        <div className="shimmer-line h-5 w-5 ml-auto"></div>
                    </div>
                </div>
            </div>

            {/* Issue indicator shimmer */}
            {/*<div className="flex justify-end border-none mb-4 mr-4">*/}
            {/*    <div className="shimmer-background border-none rounded-full py-1 px-4 w-24 h-8 flex items-center">*/}
            {/*        <div className="shimmer-circle h-4 w-4 mr-2"></div>*/}
            {/*        <div className="shimmer-line h-4 w-12"></div>*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* Custom shimmer CSS */}
        </div>
    )
}

