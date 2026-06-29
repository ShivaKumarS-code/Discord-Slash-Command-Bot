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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/30 p-8 text-center bg-transparent">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-400 shadow-2xs mb-4 select-none">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">{description}</p>
      {actionLabel && onActionClick && (
        <Button variant="default" className="mt-6 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg text-xs" onClick={onActionClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
export default EmptyState
