import { Button } from "@/components/ui/button";
import React, { useRef, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface StepperProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  isSaved?: boolean;
}

const steps = ["Create Accounts", "Link Accounts", "Review & Finalize"];

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepChange,
  onSave,
  isSaving = false,
  isSaved = false,
}) => {
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const currentLabel = labelRefs.current[currentStep];
    if (currentLabel) {
      setUnderlineStyle({
        left: currentLabel.offsetLeft,
        width: currentLabel.offsetWidth,
      });
    }
  }, [currentStep]);

  const handleStepClick = (stepIndex: number) => {
    onStepChange(stepIndex);
  };

  return (
    <div className=" flex justify-between w-full border-b px-10">
      <div className="relative flex items-center justify-between text-sm pt-4">
        <div className="flex items-center gap-10">
          {steps.map((label, idx) => (
            <span
              key={label}
              ref={(el) => {
                labelRefs.current[idx] = el;
              }}
              className={`relative transition-colors duration-200 pb-4 cursor-pointer ${
                idx === currentStep
                  ? "text-[#007AFF] font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#007AFF]"
                  : "text-muted-foreground font-normal hover:text-[#007AFF]"
              }`}
              onClick={() => handleStepClick(idx)}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      {currentStep !== 2 && (
        <div className="flex gap-5 justify-center items-center">
          <Button
            variant="default"
            size={"default"}
            className="bg-primary px-4 py-2 text-white text-sm relative"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
