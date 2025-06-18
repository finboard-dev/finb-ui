// src/components/ChartCard.tsx
import React from "react";
import type { EChartsOption } from "echarts";
import RestrictedChart from "../page";

interface ChartCardProps {
  title: string;
  config: EChartsOption;
  cardStyle?: React.CSSProperties;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, config, cardStyle }) => {
  const defaultCardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "500px", // Consistent size for all cards
    height: "400px", // Fixed height for uniformity
    margin: "0", // Margin handled by container gap
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    borderRadius: "12px",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  };

  const style = { ...defaultCardStyle, ...cardStyle };

  return (
    <div style={style}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <h2
          style={{
            margin: "0 0 10px 0",
            fontSize: "18px",
            color: "#333",
            textAlign: "center",
            fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {title}
        </h2>
        <div style={{ flex: 1, width: "100%" }}>
          <RestrictedChart style={{ height: "100%" }} data={config} />
        </div>
      </div>
    </div>
  );
};

export default ChartCard;
