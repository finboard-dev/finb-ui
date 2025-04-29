
"use client";

import { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

// Define types for the data
export type RowData = Record<string, string | number | boolean | null>;

export interface DynamicTableProps {
  data: RowData[] | string;
  isLoading?: boolean;
  error?: string | null;
}

export default function DynamicTable({
                                       data,
                                       isLoading = false,
                                       error = null,
                                     }: DynamicTableProps) {
  const [tableData, setTableData] = useState<RowData[]>([]);
  const [columns, setColumns] = useState<ColumnDef<RowData>[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [localError, setLocalError] = useState<string | null>(error);

  // Helper function for custom sorting
  const createSortingFn = () => {
    return (rowA: any, rowB: any, columnId: string) => {
      const a = rowA.getValue(columnId);
      const b = rowB.getValue(columnId);

      // Handle null/undefined values
      if (a == null) return 1;
      if (b == null) return -1;
      if (a == null && b == null) return 0;

      // Handle numbers (including string numbers with currency symbols)
      const numA = typeof a === 'string' ? parseFloat(a.replace(/[^0-9.-]+/g, "")) : a;
      const numB = typeof b === 'string' ? parseFloat(b.replace(/[^0-9.-]+/g, "")) : b;

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA > numB ? 1 : numA < numB ? -1 : 0;
      }

      // Handle dates
      const dateA = new Date(a as string);
      const dateB = new Date(b as string);
      if (dateA.toString() !== 'Invalid Date' && dateB.toString() !== 'Invalid Date') {
        return dateA.getTime() - dateB.getTime();
      }

      // Default string comparison
      return String(a).localeCompare(String(b));
    };
  };

  const processJsonData = (jsonData: RowData[]) => {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      setLocalError("Invalid or empty data array provided");
      return;
    }

    const allKeys = new Set<string>();
    jsonData.forEach((item) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });

    const tableColumns: ColumnDef<RowData>[] = Array.from(allKeys).map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => {
        const value = info.getValue();
        return value !== null && value !== undefined ? String(value) : "";
      },
      sortingFn: createSortingFn(),
    }));

    setColumns(tableColumns);
    setTableData(jsonData);
  };

  const processHtmlTable = (htmlText: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const table = doc.querySelector("table");

    if (!table) {
      setLocalError("No table found in HTML data");
      return;
    }

    const headerCells = Array.from(table.querySelectorAll("th"));
    const headers = headerCells.map((th) => th.textContent?.trim() || "");

    const rows = Array.from(table.querySelectorAll("tbody tr")).map((tr) => {
      const cells = Array.from(tr.querySelectorAll("td")).map(
          (td) => td.textContent?.trim() || ""
      );

      return headers.reduce<RowData>((obj, header, index) => {
        obj[header] = cells[index] || "";
        return obj;
      }, {});
    });

    const tableColumns: ColumnDef<RowData>[] = headers.map((header) => ({
      accessorKey: header,
      header: header,
      cell: (info) => info.getValue() as string,
      sortingFn: createSortingFn(),
    }));

    setColumns(tableColumns);
    setTableData(rows);
  };

  useEffect(() => {
    setLocalError(error);

    if (isLoading || !data) {
      return;
    }

    try {
      if (typeof data === "string") {
        processHtmlTable(data);
      } else if (Array.isArray(data)) {
        processJsonData(data);
      } else {
        setLocalError("Invalid data format provided");
      }
    } catch (err) {
      console.error("Error processing data:", err);
      setLocalError("Failed to process table data");
    }
  }, [data, isLoading, error]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading)
    return <div className="text-center p-4">Loading table data...</div>;
  if (localError)
    return <div className="text-center p-4 text-red-500">{localError}</div>;
  if (tableData.length === 0)
    return <div className="text-center p-4">No data available</div>;

  return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                    <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center">
                        {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                        )}
                        <span className="ml-1">
                      {{
                        asc: "▲",
                        desc: "▼",
                      }[header.column.getIsSorted() as string] || ""}
                    </span>
                      </div>
                    </th>
                ))}
              </tr>
          ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                    <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                ))}
              </tr>
          ))}
          </tbody>
        </table>
      </div>
  );
}