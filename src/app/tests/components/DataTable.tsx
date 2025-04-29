"use client";
import type { NextPage } from "next";
import DynamicTable, { RowData } from "./DynamicTableRenderer";
import { dummyHtmlData, dummyJsonData } from "../data/dummy";

const DataTablePage: NextPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Dynamic Data Table</h1>
      <DynamicTable
        data={dummyJsonData as RowData[] | string}
        isLoading={false}
        error={null}
      />
    </div>
  );
};

export default DataTablePage;
