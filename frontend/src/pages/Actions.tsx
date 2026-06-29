import { useState, useEffect } from "react"
import PageHeader from "@/components/PageHeader"
import ServerSelector, { ServerOption } from "@/components/ServerSelector"
import { History, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { CustomDropdown } from "@/components/ui/CustomDropdown"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import Skeleton from "@/components/ui/Skeleton"

interface ActionLog {
  id: string
  interaction_log_id: string
  command: string
  server_name: string
  action_type: string
  status: string
  provider: string | null
  error_message: string | null
  retry_count: number
  duration_ms: number | null
  created_at: string
}

interface ActionLogsResponse {
  total: number
  page: number
  limit: number
  totalPages: number
  logs: ActionLog[]
}

interface DiscordServer {
  id: string
  discord_guild_id: string
  name: string
}

export default function Actions() {
  const { session } = useAuth()
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)
  const [selectedActionType, setSelectedActionType] = useState<string>("")
  const [page, setPage] = useState(1)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedServerId, selectedActionType])

  // 1. Fetch servers list for selector
  const { data: servers = [] } = useQuery<DiscordServer[]>({
    queryKey: ["servers", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return []
      const response = await fetch("/api/v1/servers", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || "Failed to load servers")
      return data
    },
    enabled: !!session?.access_token
  })

  // 2. Fetch paginated, filterable action history logs
  const { data, isLoading, error } = useQuery<ActionLogsResponse>({
    queryKey: ["actionLogs", page, selectedServerId, selectedActionType, session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) {
        return { total: 0, page: 1, limit: 10, totalPages: 0, logs: [] }
      }
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      })
      if (selectedServerId) params.append("serverId", selectedServerId)
      if (selectedActionType) params.append("actionType", selectedActionType)

      const response = await fetch(`/api/v1/action-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const logData = await response.json()
      if (!response.ok) throw new Error(logData.error?.message || "Failed to load action history logs")
      return logData
    },
    enabled: !!session?.access_token
  })

  const formatLogTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    } catch {
      return "--:--:--"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "text-green-700 bg-green-50 border-green-100"
      case "FAILED":
      case "FAILURE":
        return "text-red-700 bg-red-50 border-red-100"
      case "RETRYING":
        return "text-amber-700 bg-amber-50 border-amber-100"
      case "PENDING":
        return "text-blue-700 bg-blue-50 border-blue-100"
      default:
        return "text-slate-700 bg-slate-50 border-slate-100"
    }
  }

  const formatActionName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const serverOptions: ServerOption[] = servers.map((s) => ({
    id: s.id,
    name: s.name,
    discordGuildId: s.discord_guild_id
  }))

  const logs = data?.logs || []
  const totalPages = data?.totalPages || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Action History"
          description="Audit trailing backend tasks, channel mirrors, and retry actions triggered by commands."
        />
        <ServerSelector
          servers={serverOptions}
          selectedServerId={selectedServerId}
          onChange={setSelectedServerId}
          align="right"
        />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col md:flex-row gap-4 items-center justify-between relative z-20">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Type:</span>
            <CustomDropdown
              options={[
                { value: "", label: "All Action Types" },
                { value: "SAVE_INTERACTION", label: "Save Interaction" },
                { value: "DISCORD_REPLY_SENT", label: "Discord Reply Sent" },
                { value: "MIRROR_SENT", label: "Mirror Sent" },
                { value: "AI_STARTED", label: "AI Started" },
                { value: "AI_COMPLETED", label: "AI Completed" },
                { value: "RETRY", label: "Retry" },
                { value: "FAILURE", label: "Failure" }
              ]}
              value={selectedActionType}
              onChange={setSelectedActionType}
              placeholder="All Action Types"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <Skeleton className="h-[400px] w-full rounded-xl animate-fade-in" />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <h4 className="font-semibold mb-1">Failed to load action history</h4>
          <p className="text-sm">{(error as Error).message || "An error occurred."}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <History className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-950">No action history recorded</h3>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
            Background processing, AI actions, and mirror events will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action Type</th>
                  <th className="px-6 py-4">Related Command</th>
                  <th className="px-6 py-4">Server</th>
                  <th className="px-6 py-4 text-center">Retries</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Result / Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1c] [&>tr:first-child]:border-t-0 text-slate-700 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap">
                      {formatLogTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-950 whitespace-nowrap">
                      {formatActionName(log.action_type)}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      /{log.command}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 truncate max-w-[120px]">
                      {log.server_name}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-semibold text-slate-500">
                      {log.retry_count}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate">
                      {log.error_message ? (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold text-[11px]">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{log.error_message}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">Success</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                Page {page} of {totalPages} (Total: {data?.total})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 border-slate-200 cursor-pointer disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 border-slate-200 cursor-pointer disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
