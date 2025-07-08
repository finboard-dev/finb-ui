import React from "react";

interface ConsolidationMainProps {
  children: React.ReactNode;
}

export const ConsolidationMain: React.FC<ConsolidationMainProps> = ({
  children,
}) => (
  <div className="flex-1 flex flex-col h-full overflow-hidden">{children}</div>
);
