import React, { useState, useEffect } from "react"
import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import { useAuth } from "@/contexts/AuthContext"
import { Server, Plus, Calendar, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface ServerConfig {
  logging_enabled: boolean
  ai_enabled: boolean
  mirror_channel_id: string | null
}

interface DiscordServer {
  id: string
  discord_guild_id: string
  name: string
  created_at: string
  config: ServerConfig | null
}

export default function Servers() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [servers, setServers] = useState<DiscordServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConnectedServers = async () => {
    if (!session?.access_token) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/v1/servers", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to retrieve connected servers.")
      }

      setServers(data)
    } catch (err: any) {
      console.error("Failed to load servers:", err)
      setError(err.message || "An error occurred fetching servers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConnectedServers()
  }, [session])

  const handleConnectServer = () => {
    if (session?.access_token) {
      // Redirect to backend connect endpoint passing the Supabase access token in the query
      window.location.href = `/api/v1/discord/connect?token=${session.access_token}`
    } else {
      alert("You must be logged in to connect a server.")
    }
  }

  const formatConnectedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    } catch {
      return "Recently"
    }
  }

  const getServerInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Connected Servers"
          description="Connect and configure Discord servers authorized to interact with the bot."
        />
        {servers.length > 0 && (
          <Button
            onClick={handleConnectServer}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Connect Server</span>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <p className="text-sm font-medium text-slate-500">Loading connected servers...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <h4 className="font-semibold mb-1">Failed to load servers</h4>
          <p className="text-sm">{error}</p>
          <Button
            onClick={fetchConnectedServers}
            className="mt-4 bg-red-100 hover:bg-red-200 text-red-800 border-none px-4 py-2 text-xs rounded-lg cursor-pointer"
          >
            Retry Connection
          </Button>
        </div>
      ) : servers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <EmptyState
            title="No Discord servers connected yet"
            description="Connect a Discord server to configure commands, AI, and mirroring."
            icon={Server}
            actionLabel="Connect Discord Server"
            onActionClick={handleConnectServer}
          />
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <div
              key={server.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                {/* Header Information Row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Server Initials Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-extrabold text-xs shadow-xs select-none">
                      {getServerInitials(server.name)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{server.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">
                        ID: {server.discord_guild_id}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md shrink-0 select-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Bot Installed</span>
                  </div>
                </div>

                {/* Configurations Summary Details */}
                <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">AI Configuration:</span>
                    <span className="font-medium text-slate-700">AI Commands: 0 configured</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Logging & Mirroring:</span>
                    <span className="font-medium text-slate-700">
                      {server.config?.mirror_channel_id ? `Active (#${server.config.mirror_channel_id})` : "Mirroring: Not configured"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action and Footer Row */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Added {formatConnectedDate(server.created_at)}</span>
                </div>
                
                {/* Visual Placeholder for Server Specific Panel Redirects */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/servers/${server.id}`)}
                  className="text-xs py-1 px-3 cursor-pointer flex items-center gap-1.5"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Configure</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
