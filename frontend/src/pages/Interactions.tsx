import { useState, useEffect } from "react"
import PageHeader from "@/components/PageHeader"
import ServerSelector, { ServerOption } from "@/components/ServerSelector"
import { Activity, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { CustomDropdown } from "@/components/ui/CustomDropdown"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import Skeleton from "@/components/ui/Skeleton"
import { API_BASE_URL } from "@/services/api"

interface InteractionLog {
  id: string
  interaction_id: string
  server_name: string
  server_id: string
  discord_user_id: string
  command: string
  arguments: any
  status: string
  ai_summary: string | null
  created_at: string
}

interface InteractionLogsResponse {
  total: number
  page: number
  limit: number
  totalPages: number
  logs: InteractionLog[]
}

interface DiscordServer {
  id: string
  discord_guild_id: string
  name: string
}

export default function Interactions() {
  const { session } = useAuth()
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)
  const [selectedCommand, setSelectedCommand] = useState<string>("")
  const [searchId, setSearchId] = useState<string>("")
  const [debouncedSearchId, setDebouncedSearchId] = useState<string>("")
  const [page, setPage] = useState(1)

  // Debounce search ID input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchId(searchId)
      setPage(1) // Reset page on search
    }, 400)
    return () => clearTimeout(handler)
  }, [searchId])

  // Reset page on filters changes
  useEffect(() => {
    setPage(1)
  }, [selectedServerId, selectedCommand])

  // 1. Fetch servers for select filter
  const { data: servers = [] } = useQuery<DiscordServer[]>({
    queryKey: ["servers", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return []
      const response = await fetch(`${API_BASE_URL}/api/v1/servers`, {
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

  // 2. Fetch paginated, filterable logs
  const { data, isLoading, error } = useQuery<InteractionLogsResponse>({
    queryKey: ["interactionLogs", page, selectedServerId, selectedCommand, debouncedSearchId, session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) {
        return { total: 0, page: 1, limit: 10, totalPages: 0, logs: [] }
      }
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      })
      if (selectedServerId) params.append("serverId", selectedServerId)
      if (selectedCommand) params.append("command", selectedCommand)
      if (debouncedSearchId) params.append("interactionId", debouncedSearchId)

      const response = await fetch(`${API_BASE_URL}/api/v1/interaction-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const logData = await response.json()
      if (!response.ok) throw new Error(logData.error?.message || "Failed to load interaction logs")
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
      case "PROCESSING":
      case "PENDING":
        return "text-blue-700 bg-blue-50 border-blue-100"
      default:
        return "text-slate-700 bg-slate-50 border-slate-100"
    }
  }

  const getOriginalReportText = (args: any) => {
    if (!args) return <span className="text-slate-400 font-normal">-</span>
    if (Array.isArray(args)) {
      const textOption = args.find((o: any) => o.name === "text")
      if (textOption) {
        return <span className="font-semibold text-slate-800">"{textOption.value}"</span>
      }

      const issueOption = args.find((o: any) => o.name === "issue")
      const detailsOption = args.find((o: any) => o.name === "details")
      if (issueOption || detailsOption) {
        return (
          <div className="flex flex-col gap-0.5">
            {issueOption && <span className="font-semibold text-slate-800">Issue: {issueOption.value}</span>}
            {detailsOption && <span className="text-slate-400 font-normal text-[10px]">Details: {detailsOption.value}</span>}
          </div>
        )
      }
    }
    return <span className="text-slate-400 font-normal">-</span>
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
          title="Interaction Logs"
          description="Monitor incoming slash command triggers, webhook statuses, and response payloads."
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
          {/* Command select filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Command:</span>
            <CustomDropdown
              options={[
                { value: "", label: "All Commands" },
                { value: "status", label: "/status" },
                { value: "report", label: "/report" }
              ]}
              value={selectedCommand}
              onChange={setSelectedCommand}
              placeholder="All Commands"
            />
          </div>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Interaction ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <Skeleton className="h-[400px] w-full rounded-xl animate-fade-in" />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <h4 className="font-semibold mb-1">Failed to load interaction logs</h4>
          <p className="text-sm">{(error as Error).message || "An error occurred."}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-950">No interaction logs recorded</h3>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
            Logs will appear after your connected servers begin receiving slash commands.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Server</th>
                  <th className="px-6 py-4">Command</th>
                  <th className="px-6 py-4">Discord User</th>
                  <th className="px-6 py-4">Original Report</th>
                  <th className="px-6 py-4">AI Summary</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1c] [&>tr:first-child]:border-t-0 text-slate-700 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap">
                      {formatLogTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 truncate max-w-[120px]">
                      {log.server_name}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-950 whitespace-nowrap">
                      /{log.command}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">&lt;@{log.discord_user_id}&gt;</span>
                        <span className="font-mono text-[9px] text-slate-400">ID: {log.discord_user_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 truncate max-w-[220px]">
                      {getOriginalReportText(log.arguments)}
                    </td>
                    <td className="px-6 py-4 truncate max-w-[280px]">
                      {log.ai_summary || <span className="text-slate-400 font-normal">-</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
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
