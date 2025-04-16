import React from "react";
import VisualizationView from "../components/visualization/VisualizationView";
import { enhancedChartSpecs } from "@/data/dummyData";

const Page = () => {
  return (
    <VisualizationView
      charts={enhancedChartSpecs[6] as any}
      title="Business Analytics Overview"
    />
  );
};

export default Page;
