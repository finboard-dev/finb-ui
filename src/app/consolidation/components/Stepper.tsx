import React from "react";

interface StepperProps {
  currentStep: number;
}

const steps = [
  "Create Accounts",
  "Link Accounts",
  "Adjust Eliminations",
  "Review & Finalize",
];

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-8 px-10 py-5 bg-white border-b shrink-0">
    {steps.map((label, idx) => (
      <React.Fragment key={label}>
        <div
          className={`flex border py-2 px-3 rounded-full items-center gap-3 ${
            idx === currentStep
              ? "bg-[#F2FAF6] border-[#1E925A]" // active
              : "bg-white border-gray-200" // inactive
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${
              idx === currentStep
                ? "text-white bg-[#1E925A]"
                : "border border-gray-200 bg-white text-gray-400"
            }`}
          >
            {idx + 1}
          </div>
          <span
            className={`font-semibold text-sm ${
              idx === currentStep ? "text-[#1E925A]" : "text-gray-400"
            }`}
          >
            {label}
          </span>
        </div>
        {idx < steps.length - 1 && (
          <span className="text-gray-300 text-2xl">&#8250;</span>
        )}
      </React.Fragment>
    ))}
  </div>
);
