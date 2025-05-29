"use client"

import { useState, useEffect } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronRight, ChevronUp, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type RowData = Record<string, string | number | boolean | null>

export interface DynamicTableProps {
  data: RowData[] | string
  isLoading?: boolean
  error?: string | null
  maxHeight?: string
  title?: string
  description?: string
  enableCollapsing?: boolean
}

interface GroupInfo {
  id: string
  name: string
  level: number
  rows: number[]
  isCollapsed: boolean
  parentId?: string
}

export default function DynamicTable({
                                       data,
                                       isLoading = false,
                                       error = null,
                                       maxHeight = "calc(100vh - 200px)",
                                       title,
                                       description,
                                       enableCollapsing = false,
                                     }: DynamicTableProps) {
  const [tableData, setTableData] = useState<RowData[]>([])
  const [columns, setColumns] = useState<ColumnDef<RowData>[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [localError, setLocalError] = useState<string | null>(error)
  const [rowGroups, setRowGroups] = useState<GroupInfo[]>([])
  const [visibleRows, setVisibleRows] = useState<number[]>([])
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])

  // Helper function for custom sorting
  const createSortingFn = () => {
    return (rowA: any, rowB: any, columnId: string) => {
      const a = rowA.getValue(columnId)
      const b = rowB.getValue(columnId)

      // Handle null/undefined values
      if (a == null) return 1
      if (b == null) return -1
      if (a == null && b == null) return 0

      // Handle numbers (including string numbers with currency symbols)
      const numA = typeof a === "string" ? Number.parseFloat(a.replace(/[^0-9.-]+/g, "")) : a
      const numB = typeof b === "string" ? Number.parseFloat(b.replace(/[^0-9.-]+/g, "")) : b

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA > numB ? 1 : numA < numB ? -1 : 0
      }

      // Handle dates
      const dateA = new Date(a as string)
      const dateB = new Date(b as string)
      if (dateA.toString() !== "Invalid Date" && dateB.toString() !== "Invalid Date") {
        return dateA.getTime() - dateB.getTime()
      }

      // Default string comparison
      return String(a).localeCompare(String(b))
    }
  }

  const processJsonData = (jsonData: RowData[]) => {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      setLocalError("Invalid or empty data array provided")
      return
    }

    const allKeys = new Set<string>()
    jsonData.forEach((item) => {
      Object.keys(item).forEach((key) => allKeys.add(key))
    })

    const tableColumns: ColumnDef<RowData>[] = Array.from(allKeys).map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => {
        const value = info.getValue()
        return value !== null && value !== undefined ? String(value) : ""
      },
      sortingFn: createSortingFn(),
    }))

    setColumns(tableColumns)
    setTableData(jsonData)
    setVisibleColumns(Array.from(allKeys))

    // Initialize all rows as visible
    setVisibleRows(Array.from({ length: jsonData.length }, (_, i) => i))

    // Detect and create row groups based on data patterns
    detectRowGroups(jsonData)
  }

  const detectRowGroups = (jsonData: RowData[]) => {
    if (!enableCollapsing) return

    const groups: GroupInfo[] = []
    const idField = findIdField(jsonData)

    if (idField) {
      // Process hierarchical IDs (like ":Income:45:46:48")
      const hierarchyMap = new Map<string, number>() // Maps group ID to its index in groups array

      jsonData.forEach((row, rowIndex) => {
        const id = String(row[idField])
        if (!id) return

        // Skip if this is not a hierarchical ID
        if (!id.includes(":")) return

        const parts = id.split(":").filter(Boolean)
        const isTotal = id.toLowerCase().includes("total")

        // Create a group for each level in the hierarchy
        let currentPath = ""
        let parentId: string | undefined = undefined

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          const newPath = currentPath ? `${currentPath}:${part}` : `:${part}`
          currentPath = newPath

          // Skip creating groups for "Total" entries
          if (part.toLowerCase() === "total") continue

          // Check if this group already exists
          if (!hierarchyMap.has(newPath)) {
            const groupName = (row["Account"] as string) || part
            const level = i

            const group: GroupInfo = {
              id: newPath,
              name: groupName,
              level,
              rows: [rowIndex],
              isCollapsed: false,
              parentId,
            }

            groups.push(group)
            hierarchyMap.set(newPath, groups.length - 1)
          } else {
            // Add this row to the existing group
            const groupIndex = hierarchyMap.get(newPath)!
            groups[groupIndex].rows.push(rowIndex)
          }

          // Current path becomes parent for next level
          parentId = newPath
        }
      })
    } else {
      // Fallback to indentation-based grouping
      const accountField = findAccountField(jsonData)
      if (!accountField) return

      // Group by indentation level (assuming spaces or lack of value indicates hierarchy)
      let currentGroup: GroupInfo | null = null
      let currentLevel = 0

      jsonData.forEach((row, rowIndex) => {
        const account = String(row[accountField])
        if (!account) return

        // Detect if this is a total row
        const isTotal = account.toLowerCase().includes("total")

        // Detect indentation level (simplified)
        const leadingSpaces = account.match(/^\s*/)![0].length
        const level = leadingSpaces / 2 // Assuming 2 spaces per level

        if (isTotal) {
          // End of a group, don't create a new group
          if (currentGroup) {
            currentGroup.rows.push(rowIndex)
          }
        } else if (level > currentLevel) {
          // Child group
          const parentId = currentGroup?.id

          currentGroup = {
            id: `group-${rowIndex}`,
            name: account.trim(),
            level,
            rows: [rowIndex],
            isCollapsed: false,
            parentId,
          }

          groups.push(currentGroup)
          currentLevel = level
        } else if (level === currentLevel) {
          // Sibling group
          currentGroup = {
            id: `group-${rowIndex}`,
            name: account.trim(),
            level,
            rows: [rowIndex],
            isCollapsed: false,
            parentId: currentGroup?.parentId,
          }

          groups.push(currentGroup)
        } else {
          // Going back up the hierarchy
          currentLevel = level

          // Find the appropriate parent based on level
          let parentId: string | undefined = undefined
          for (let i = groups.length - 1; i >= 0; i--) {
            if (groups[i].level < level) {
              parentId = groups[i].id
              break
            }
          }

          currentGroup = {
            id: `group-${rowIndex}`,
            name: account.trim(),
            level,
            rows: [rowIndex],
            isCollapsed: false,
            parentId,
          }

          groups.push(currentGroup)
        }
      })
    }

    // Filter out groups with only one row (no children)
    const validGroups = groups.filter((group) => group.rows.length > 1)
    setRowGroups(validGroups)
  }

  // Helper to find the ID field in the data
  const findIdField = (data: RowData[]): string | null => {
    const possibleIdFields = ["rowId", "id", "ID", "Id"]
    for (const field of possibleIdFields) {
      if (data[0] && field in data[0]) {
        return field
      }
    }
    return null
  }

  // Helper to find the account/name field in the data
  const findAccountField = (data: RowData[]): string | null => {
    const possibleFields = ["Account", "Name", "Description", "Category"]
    for (const field of possibleFields) {
      if (data[0] && field in data[0]) {
        return field
      }
    }
    return Object.keys(data[0])[0] // Fallback to first column
  }

  const processHtmlTable = (htmlText: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlText, "text/html")
    const table = doc.querySelector("table")

    if (!table) {
      setLocalError("No table found in HTML data")
      return
    }

    const headerCells = Array.from(table.querySelectorAll("th"))
    const headers = headerCells.map((th) => th.textContent?.trim() || "")

    const rows = Array.from(table.querySelectorAll("tbody tr")).map((tr) => {
      const cells = Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim() || "")

      return headers.reduce<RowData>((obj, header, index) => {
        obj[header] = cells[index] || ""
        return obj
      }, {})
    })

    const tableColumns: ColumnDef<RowData>[] = headers.map((header) => ({
      accessorKey: header,
      header: header,
      cell: (info) => info.getValue() as string,
      sortingFn: createSortingFn(),
    }))

    setColumns(tableColumns)
    setTableData(rows)
    setVisibleColumns(headers)
    setVisibleRows(Array.from({ length: rows.length }, (_, i) => i))

    // Detect row groups
    detectRowGroups(rows)
  }

  useEffect(() => {
    setLocalError(error)

    if (isLoading || !data) {
      return
    }

    try {
      if (typeof data === "string") {
        processHtmlTable(data)
      } else if (Array.isArray(data)) {
        processJsonData(data)
      } else {
        setLocalError("Invalid data format provided")
      }
    } catch (err) {
      console.error("Error processing data:", err)
      setLocalError("Failed to process table data")
    }
  }, [data, isLoading, error, enableCollapsing])

  const toggleRowGroup = (groupId: string) => {
    setRowGroups((prevGroups) => {
      const newGroups = [...prevGroups]
      const groupIndex = newGroups.findIndex((g) => g.id === groupId)

      if (groupIndex !== -1) {
        // Toggle the collapsed state
        newGroups[groupIndex].isCollapsed = !newGroups[groupIndex].isCollapsed

        // Update visible rows
        updateVisibleRows(newGroups)
      }

      return newGroups
    })
  }

  const updateVisibleRows = (groups: GroupInfo[]) => {
    // Start with all rows visible
    const allRows = Array.from({ length: tableData.length }, (_, i) => i)

    // Get all rows that should be hidden due to collapsed groups
    const hiddenRows = new Set<number>()

    groups.forEach((group) => {
      if (group.isCollapsed) {
        // Hide all rows in this group except the first one
        group.rows.slice(1).forEach((rowIndex) => hiddenRows.add(rowIndex))

        // Also hide all rows in child groups
        const childGroups = groups.filter((g) => g.parentId === group.id)
        childGroups.forEach((childGroup) => {
          childGroup.rows.forEach((rowIndex) => hiddenRows.add(rowIndex))
        })
      }
    })

    // Set visible rows to all rows except hidden ones
    setVisibleRows(allRows.filter((row) => !hiddenRows.has(row)))
  }

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) return <div className="text-center p-4">Loading table data...</div>
  if (localError) return <div className="text-center p-4 text-red-500">{localError}</div>
  if (tableData.length === 0) return <div className="text-center p-4">No data available</div>

  // Get rows that should be visible
  const filteredRows = table.getRowModel().rows.filter((_, index) => visibleRows.includes(index))

  // Find the indentation level for each row
  const getRowIndentation = (rowIndex: number) => {
    for (const group of rowGroups) {
      if (group.rows.includes(rowIndex)) {
        return group.level || 0
      }
    }
    return 0
  }

  return (
      <div className="w-full rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {/* Table Title Section */}
        {(title || description) && (
            <div className="bg-white border-b border-gray-300 px-6 py-4">
              <div className="flex items-center justify-between">
                {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}

                {enableCollapsing && rowGroups.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-sm text-gray-500">
                            <Info className="h-4 w-4 mr-1" />
                            <span>Grouping enabled</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click on the arrow icons to expand or collapse groups</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
              </div>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
        )}

        <div className="w-full">
          {/* Table container with scrollable body */}
          <div className="overflow-y-auto" style={{ maxHeight }}>
            <table className="min-w-full">
              {/* Header section - sticky */}
              <thead className="bg-gray-50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-gray-300">
                    {/* Add an extra column for row group indicators if we have row groups */}
                    {rowGroups.length > 0 && enableCollapsing && (
                        <th className="w-10 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 bg-gray-50">
                          <span className="sr-only">Group</span>
                        </th>
                    )}

                    {headerGroup.headers.map((header, index) => (
                        <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer bg-gray-50 ${
                                index < headerGroup.headers.length - 1 ? 'border-r border-gray-300' : ''
                            }`}
                        >
                          <div className="flex items-center">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span className="ml-1">
                            {{
                              asc: <ChevronUp className="w-4 h-4" />,
                              desc: <ChevronDown className="w-4 h-4" />,
                            }[header.column.getIsSorted() as string] || ""}
                          </span>
                          </div>
                        </th>
                    ))}
                  </tr>
              ))}
              </thead>

              {/* Body section */}
              <tbody className="bg-white">
              {filteredRows.map((row, rowIndex) => {
                const actualRowIndex = visibleRows[rowIndex]

                // Find if this row is the first row of any group
                const rowGroup = rowGroups.find((g) => g.rows[0] === actualRowIndex)
                const isGroupStart = !!rowGroup

                // Get indentation level
                const indentLevel = getRowIndentation(actualRowIndex)
                const isTotal = String(row.getValue("Account") || "")
                    .toLowerCase()
                    .includes("total")

                return (
                    <tr
                        key={row.id}
                        className={`hover:bg-gray-50 border-b border-gray-200 ${isTotal ? "font-semibold" : ""} ${
                            isGroupStart && rowGroup?.level === 0 ? "border-t-2 border-gray-400" : ""
                        }`}
                    >
                      {/* Row group toggle button */}
                      {rowGroups.length > 0 && enableCollapsing && (
                          <td className="w-10 px-2 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-300">
                            {isGroupStart && (
                                <button
                                    onClick={() => toggleRowGroup(rowGroup.id)}
                                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                    title={rowGroup.isCollapsed ? "Expand group" : "Collapse group"}
                                >
                                  {rowGroup.isCollapsed ? (
                                      <ChevronRight className="w-4 h-4 text-gray-600" />
                                  ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-600" />
                                  )}
                                </button>
                            )}
                          </td>
                      )}

                      {row.getVisibleCells().map((cell, cellIndex) => {
                        // Apply indentation to the first column only
                        const isFirstColumn = cellIndex === 0
                        const indentStyle =
                            isFirstColumn && indentLevel > 0 ? { paddingLeft: `${indentLevel * 20 + 24}px` } : {}

                        return (
                            <td
                                key={cell.id}
                                className={`px-6 py-4 whitespace-nowrap text-sm ${
                                    isTotal ? "text-gray-900" : "text-gray-500"
                                } ${
                                    cellIndex < row.getVisibleCells().length - 1 ? 'border-r border-gray-300' : ''
                                }`}
                                style={indentStyle}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        )
                      })}
                    </tr>
                )
              })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  )
}