import { Button } from "@/components/ui/button";
import React, { useRef, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const FolderIcon = ({ isAutoSaving }: { isAutoSaving: boolean }) => {
  return (
    <>
      {isAutoSaving ? (
        <svg
          width="24"
          height="24"
          viewBox="0 0 512 512"
          preserveAspectRatio="xMidYMid meet"
          className={`${isAutoSaving && "animate-pulse"}`}
        >
          <g
            transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
            fill="#AEB5C2"
            stroke="none"
          >
            <path d="M310 4894 c-116 -31 -220 -119 -273 -232 l-32 -67 -3 -1590 -2 -1589 21 -63 c49 -147 180 -258 336 -283 34 -6 484 -10 1091 -10 1115 0 1079 -2 1114 53 15 22 16 47 11 199 -8 247 16 395 97 594 178 436 576 757 1040 840 114 20 334 23 440 5 104 -17 236 -55 335 -96 95 -40 105 -41 149 -20 69 33 66 -2 66 752 0 382 -4 703 -10 736 -25 156 -135 286 -282 336 -61 21 -71 21 -1088 21 l-1025 0 -200 201 c-110 110 -212 207 -227 215 -41 21 -1477 20 -1558 -2z" />
            <path d="M3733 2546 c-490 -93 -868 -481 -949 -974 -21 -128 -14 -333 16 -452 110 -445 435 -770 880 -880 119 -30 324 -37 452 -16 442 73 801 382 936 806 43 136 55 236 49 408 -7 210 -56 381 -161 557 -153 257 -417 453 -715 532 -81 22 -123 26 -266 29 -114 2 -194 -1 -242 -10z m253 -431 c61 -25 64 -45 64 -387 l0 -303 150 -150 c91 -91 154 -162 160 -181 21 -62 -26 -124 -94 -124 -38 0 -47 7 -223 182 -147 146 -186 191 -194 221 -6 24 -9 160 -7 360 3 352 3 352 63 382 37 18 38 18 81 0z" />
          </g>
        </svg>
      ) : (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <mask
            id="mask0_603_333"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="24"
            height="24"
          >
            <rect width="24" height="24" fill="#D9D9D9" />
          </mask>
          <g mask="url(#mask0_603_333)">
            <path
              d="M17.6538 13.3463C18.9026 13.3463 19.9648 13.7841 20.8403 14.6598C21.7159 15.5353 22.1538 16.5974 22.1538 17.8462C22.1538 19.0949 21.7159 20.1571 20.8403 21.0328C19.9648 21.9083 18.9026 22.346 17.6538 22.346C16.4051 22.346 15.3429 21.9083 14.4672 21.0328C13.5916 20.1571 13.1538 19.0949 13.1538 17.8462C13.1538 16.5974 13.5916 15.5353 14.4672 14.6598C15.3429 13.7841 16.4051 13.3463 17.6538 13.3463ZM10.9713 18C10.9776 18.2602 10.9962 18.5153 11.027 18.7653C11.0577 19.0153 11.1102 19.2602 11.1845 19.5H2.5V4.5H9.798L11.798 6.5H21.5V12.3808C20.9358 11.9769 20.3265 11.6715 19.672 11.4645C19.0175 11.2573 18.3448 11.1538 17.6538 11.1538C15.7654 11.1538 14.1683 11.8243 12.8625 13.1655C11.5567 14.5065 10.9263 16.118 10.9713 18ZM16.9385 19.9808L20.346 16.5885L19.5077 15.75L16.9385 18.2885L15.8 17.15L14.9615 18.0038L16.9385 19.9808Z"
              fill="#AEB5C2"
            />
          </g>
        </svg>
      )}
    </>
  );
};

interface StepperProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  isSaved?: boolean;
  isAutoSaving?: boolean;
}

const steps = ["Create Accounts", "Link Accounts", "Review & Finalize"];

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepChange,
  onSave,
  isSaving = false,
  isSaved = false,
  isAutoSaving = false,
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
      <div className="flex gap-5 justify-center items-center">
        <FolderIcon isAutoSaving={isAutoSaving} />
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
    </div>
  );
};
