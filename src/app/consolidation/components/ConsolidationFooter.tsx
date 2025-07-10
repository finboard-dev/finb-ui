import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConsolidationFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  isLoading?: boolean;
}

export const ConsolidationFooter: React.FC<ConsolidationFooterProps> = ({
  onBack,
  onNext,
  isLoading,
}) => (
  <div className="fixed left-60 right-0 bottom-0 flex justify-between items-center px-10 py-4 bg-white border-t z-20">
    <Button variant="outline" onClick={onBack}>
      Back
    </Button>
    <Button
      className="bg-[#2AA86B] text-white"
      onClick={onNext}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center">
          <span className="ml-2">Saving...</span>
        </div>
      ) : (
        "Save & Next"
      )}
    </Button>
  </div>
);
