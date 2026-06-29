import React from "react"
import { LucideIcon } from "lucide-react"
import EmptyState from "./EmptyState"

export interface DataTableProps {
  columns: string[]
  emptyTitle: string
  emptyDescription: string
  emptyIcon: LucideIcon
  children?: React.ReactNode
  rowCount?: number
}

export function DataTable({
  columns,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  children,
  rowCount = 0
}: DataTableProps) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-500">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className="px-6 py-4">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c1c] bg-white [&>tr:first-child]:border-t-0">
            {rowCount > 0 ? (
              children
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <div className="py-12 px-6">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      icon={emptyIcon}
                    />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default DataTable
