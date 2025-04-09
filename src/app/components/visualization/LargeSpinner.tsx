// visualizations/LargeSpinner.tsx
import React from "react";

interface Props {
  color?: string;
}

const LargeSpinner: React.FC<Props> = ({ color = "#000" }) => {
  return (
    <div
      className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4"
      style={{ borderColor: color }}
    ></div>
  );
};

export default LargeSpinner;
