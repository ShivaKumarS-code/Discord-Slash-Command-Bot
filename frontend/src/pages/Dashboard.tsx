import React from "react"
import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import SectionCard from "@/components/SectionCard"
import EmptyState from "@/components/EmptyState"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Server, Terminal, Activity, Repeat, Eye, History, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"

interface InteractionLog {
  id: string
  command: string
  server_name: string
  discord_user_id: string
  status: string
  created_at: string
}

interface ActionLog {
  id: string
  command: string
  server_name: string
  action_type: string
  status: string
  retry_count: number
  created_at: string
}

interface DashboardSummary {
  connectedServers: number
  registeredCommands: number
  todayInteractions: number
  activeMirrors: number
  recentInteractions: InteractionLog[]
  recentActions: ActionLog[]
}

export default function Dashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()

  // Use TanStack React Query to fetch and cache dashboard summary statistics
  const { data, isLoading, error, refetch } = useQuery<DashboardSummary | null>({
    queryKey: ["dashboardSummary", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return null
      const response = await fetch("/api/v1/dashboard/summary", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const summary = await response.json()
      if (!response.ok) {
        throw new Error(summary.error?.message || "Failed to retrieve dashboard summary data.")
      }
      return summary
    },
    enabled: !!session?.access_token
  })

  const formatLogTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString(undefined, {
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
      default:
        return "text-slate-700 bg-slate-50 border-slate-100"
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="text-sm font-medium text-slate-500">Loading dashboard analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <h4 className="font-semibold mb-1">Failed to load dashboard summary</h4>
        <p className="text-sm">{(error as Error).message || "An error occurred."}</p>
        <Button
          onClick={() => refetch()}
          className="mt-4 bg-red-100 hover:bg-red-200 text-red-800 border-none px-4 py-2 text-xs rounded-lg cursor-pointer"
        >
          Retry Load
        </Button>
      </div>
    )
  }

  // Onboarding landing screen if 0 connected servers
  if (!data || data.connectedServers === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Dashboard"
          description="Overview of your connected Discord servers, bot commands, and AI activity."
        />
        
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm space-y-6 mt-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs">
            <Server className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-950">No Discord servers connected yet</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              To configure command overrides, customize prompt AI integrations, setup logging channel mirrors, and analyze analytics, you must connect a Discord server first.
            </p>
          </div>
          <div>
            <Button
              onClick={() => navigate("/servers")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <span>Connect Discord Server</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and status flags */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description="Overview of your connected Discord servers, bot commands, and AI activity."
        />
        
        {/* System Status Indicators */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs self-start md:self-auto select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span>Discord API: Online</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span>Database: Connected</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span>AI Service: Operational</span>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid - 4 Columns */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Connected Servers"
          value={data.connectedServers.toString()}
          icon={Server}
          description="Active Discord configurations"
        />
        <StatCard
          title="Registered Commands"
          value={data.registeredCommands.toString()}
          icon={Terminal}
          description="Configured bot functions"
        />
        <StatCard
          title="Today's Interactions"
          value={data.todayInteractions.toString()}
          icon={Activity}
          description="Triggered slash commands"
        />
        <StatCard
          title="Active Mirrors"
          value={data.activeMirrors.toString()}
          icon={Repeat}
          description="Log forwarding channels"
        />
      </div>

      {/* Activity Logs Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <SectionCard
          title="Recent Interactions"
          description="Latest slash command triggers and custom interactions."
        >
          {data.recentInteractions.length === 0 ? (
            <EmptyState
              title="No interactions received yet"
              description="Command events will display here once your bot starts receiving interactions."
              icon={Eye}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5">Command</th>
                    <th className="py-2.5">Server</th>
                    <th className="py-2.5">User ID</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {data.recentInteractions.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-mono font-semibold text-slate-900">/{log.command}</td>
                      <td className="py-3 truncate max-w-[120px]">{log.server_name}</td>
                      <td className="py-3 font-mono text-[10px] text-slate-400">{log.discord_user_id}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400 font-mono">{formatLogTime(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Actions"
          description="Latest system action logs and AI generation histories."
        >
          {data.recentActions.length === 0 ? (
            <EmptyState
              title="No history records found"
              description="Background tasks and API responses will appear here."
              icon={History}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5">Action</th>
                    <th className="py-2.5">Server</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-center">Retries</th>
                    <th className="py-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {data.recentActions.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-semibold text-slate-950">{log.action_type.replace(/_/g, " ")}</td>
                      <td className="py-3 truncate max-w-[120px]">{log.server_name}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-500">{log.retry_count}</td>
                      <td className="py-3 text-right text-slate-400 font-mono">{formatLogTime(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
