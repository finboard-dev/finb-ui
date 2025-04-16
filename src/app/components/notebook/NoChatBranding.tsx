"use client";

import React from "react";
import MessageInput from "../chat/MessageInput";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ChevronUp } from "lucide-react";
import cardOne from "@/../public/cards/card-1.svg";
import cardTwo from "@/../public/cards/card-2.svg";
import cardThree from "@/../public/cards/card-3.svg";
import cardFour from "@/../public/cards/card-4.svg";
import cardFive from "@/../public/cards/card-5.svg";
import cardSix from "@/../public/cards/card-6.svg";
import Image from "next/image";

const cardImages = [cardOne, cardTwo, cardThree, cardFour, cardFive, cardSix];

const NoChatBranding = () => {
  const messageInputPlaceholder = `'Ask about your financial data... e.g., 'Revenue for last quarter''`;
  const cardData = ["Profit & Loss", "Invoices", "Cash Flow", "Expenses"];
  return (
    <div className="flex w-full overflow-y-auto bg-home flex-row justify-center h-full">
      <div className="flex flex-col w-full">
        <section className="flex flex-col items-center">
          <div className="pt-24">
            <div className="py-16">
              <h1 className="text-[2.4rem] font-semibold text-center text-primary">
                Get Financial Insights with AI
              </h1>
              <p className="mt-3 text-base leading-2 font-medium text-center text-secondary">
                Let AI help you visualize and analyze your data.
              </p>
            </div>
          </div>
          <div className="w-full max-w-3xl ">
            <MessageInput
              showBorder={false}
              placeholder={messageInputPlaceholder}
            />
          </div>
          <div className="flex gap-3">
            {cardData.map((card, i) => (
              <div
                key={i}
                className="flex items-center border border-primary rounded-md px-2 py-2 cursor-pointer"
              >
                <div className="flex items-center">
                  <span className="text-secondary font-medium">{card}</span>
                </div>
                <div className="ml-3 border-primary">
                  <ArrowUpRight className="h-5 w-5 text-secondary" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="flex flex-col items-center pb-24">
          <div className="flex flex-col w-5xl">
            <div className="pt-16">
              <h1 className="text-2xl font-semibold text-left text-primary">
                Explore
              </h1>
              <p className="mt-3 text-base leading-2 font-medium text-left text-secondary">
                Financial insights, reports, and visualizations
              </p>
            </div>
            <div className="pt-8 grid grid-cols-3 gap-4">
              {cardImages.map((card, i) => (
                <Image
                  key={i}
                  src={card}
                  alt={`Card ${i + 1}`}
                  className="w-full h-auto"
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NoChatBranding;
