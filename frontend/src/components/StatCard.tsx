import React from "react"
import { LucideIcon } from "lucide-react"

export interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between space-x-4">
        <span className="text-sm font-medium text-slate-500 truncate">{title}</span>
        <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </div>
    </div>
  )
}
export default StatCard
