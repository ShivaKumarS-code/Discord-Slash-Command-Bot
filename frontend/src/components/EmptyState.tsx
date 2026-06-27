import React from "react"
import { LucideIcon } from "lucide-react"
import { Button } from "./ui/button"

export interface EmptyStateProps {
  title: string
  description: string
  icon: LucideIcon
  actionLabel?: string
  onActionClick?: () => void
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onActionClick
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/30">
      <div className="p-3 rounded-full bg-slate-50 text-slate-400 mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">{description}</p>
      {actionLabel && onActionClick && (
        <Button variant="default" className="mt-6 cursor-pointer" onClick={onActionClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
export default EmptyState
