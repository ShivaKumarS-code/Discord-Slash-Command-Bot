import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { ArrowLeft, RefreshCw, CheckCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomDropdown } from "@/components/ui/CustomDropdown"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Skeleton from "@/components/ui/Skeleton"
import { API_BASE_URL } from "@/services/api"

interface ServerConfig {
  logging_enabled: boolean
  ai_enabled: boolean
  mirror_channel_id: string | null
}

interface CommandConfig {
  id?: string
  command_name: string
  enabled: boolean
  ai_enabled: boolean
  mirror_enabled: boolean
}

interface DiscordServer {
  id: string
  discord_guild_id: string
  name: string
  created_at: string
  config: ServerConfig | null
  command_configs: CommandConfig[]
}

interface ChannelOption {
  id: string
  name: string
}

export default function ServerDetails() {
  const { serverId } = useParams<{ serverId: string }>()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState<"general" | "mirroring">("general")



  // Sync commands state
  const [syncingCommands, setSyncingCommands] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  // Mirroring tab state
  const [loggingEnabled, setLoggingEnabled] = useState(true)
  const [mirrorChannelId, setMirrorChannelId] = useState<string>("")
  const [savingMirror, setSavingMirror] = useState(false)
  const [mirrorSuccess, setMirrorSuccess] = useState(false)



  // 1. Fetch server details using TanStack Query
  const { data: server, isLoading: isServerLoading, error: serverError } = useQuery<DiscordServer | null>({
    queryKey: ["serverDetails", serverId, session?.access_token],
    queryFn: async () => {
      if (!session?.access_token || !serverId) return null
      const response = await fetch(`${API_BASE_URL}/api/v1/servers/${serverId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to retrieve server details.")
      }
      return data
    },
    enabled: !!session?.access_token && !!serverId
  })

  // 2. Fetch channels list using TanStack Query
  const { data: channels = [] } = useQuery<ChannelOption[]>({
    queryKey: ["serverChannels", serverId, session?.access_token],
    queryFn: async () => {
      if (!session?.access_token || !serverId) return []
      const response = await fetch(`${API_BASE_URL}/api/v1/servers/${serverId}/channels`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (!response.ok) return []
      return data
    },
    enabled: !!session?.access_token && !!serverId && activeTab === "mirroring"
  })

  // Synchronize local form states when the cached server data loads or changes
  useEffect(() => {
    if (server) {
      if (server.config) {
        setLoggingEnabled(server.config.logging_enabled)
        setMirrorChannelId(server.config.mirror_channel_id || "")
      }
    }
  }, [server])

  const initialLoggingEnabled = server?.config?.logging_enabled ?? true
  const initialMirrorChannelId = server?.config?.mirror_channel_id ? server.config.mirror_channel_id.toString() : ""

  const isMirrorChanged = 
    loggingEnabled !== initialLoggingEnabled ||
    mirrorChannelId !== initialMirrorChannelId



  // Sync Slash Commands trigger
  const handleSyncCommands = async () => {
    if (!session?.access_token || !serverId) return

    try {
      setSyncingCommands(true)
      setSyncSuccess(false)
      const response = await fetch(`${API_BASE_URL}/api/v1/discord/sync-commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ serverId })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error?.message || "Failed to synchronize slash commands.")
      }

      setSyncSuccess(true)
      setTimeout(() => setSyncSuccess(false), 3000)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Error synchronizing slash commands.")
    } finally {
      setSyncingCommands(false)
    }
  }

  // Save Mirroring Config
  const handleSaveMirrorConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.access_token || !serverId) return

    if (loggingEnabled && !mirrorChannelId) {
      alert("Please select a target mirror channel.")
      return
    }

    try {
      setSavingMirror(true)
      setMirrorSuccess(false)
      const response = await fetch(`${API_BASE_URL}/api/v1/servers/${serverId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          logging_enabled: loggingEnabled,
          mirror_channel_id: mirrorChannelId || null
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error?.message || "Failed to update mirror config.")
      }

      // Invalidate the cache to synchronize updates globally without browser focus triggers
      queryClient.invalidateQueries({ queryKey: ["serverDetails", serverId] })
      queryClient.invalidateQueries({ queryKey: ["servers"] })
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] })

      setMirrorSuccess(true)
      setTimeout(() => setMirrorSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      alert("Error saving mirroring configurations.")
    } finally {
      setSavingMirror(false)
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

  if (isServerLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back Link Skeleton */}
        <Skeleton className="h-4 w-40" />

        {/* Server Header Skeleton */}
        <Skeleton className="h-24 w-full rounded-xl" />

        {/* Form Content Skeleton */}
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (serverError || !server) {
    return (
      <div className="space-y-6">
        <Link to="/servers" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Connected Servers</span>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <h4 className="font-semibold mb-1">Failed to load server configurations</h4>
          <p className="text-sm">{(serverError as Error)?.message || "Server details not found."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-4">
        <Link to="/servers" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Connected Servers</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold text-lg shadow-sm select-none">
              {getServerInitials(server.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{server.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider select-none border border-green-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Bot Installed
                </span>
                <span>•</span>
                <span>Connected {formatConnectedDate(server.created_at)}</span>
              </div>
            </div>
          </div>
          
          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discord Guild ID</span>
            <span className="font-mono text-sm text-slate-700 font-semibold">{server.discord_guild_id}</span>
          </div>
        </div>
      </div>

      {/* Configuration Tabs Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto">
          {(["general", "mirroring"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 capitalize whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab
                  ? "border-slate-900 text-slate-900 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "general" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">General Settings</h3>
                <p className="text-xs text-slate-400 mt-1">Review basic metadata configurations and connection parameters.</p>
              </div>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Server Name</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{server.name}</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discord Guild ID</span>
                  <p className="text-sm font-mono font-semibold text-slate-800 mt-1">{server.discord_guild_id}</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connected On</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{formatConnectedDate(server.created_at)}</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bot Connection Status</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 mt-1.5">
                    <CheckCircle className="h-4 w-4" />
                    <span>Installed & Active</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSyncCommands}
                  disabled={syncingCommands}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs text-xs"
                >
                  <RefreshCw className={`h-4 w-4 ${syncingCommands ? "animate-spin" : ""}`} />
                  <span>{syncingCommands ? "Syncing..." : "Sync Slash Commands"}</span>
                </Button>

                {syncSuccess && (
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1 animate-fade-in">
                    <CheckCircle className="h-4 w-4" />
                    <span>Commands synced!</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === "mirroring" && (
            <form onSubmit={handleSaveMirrorConfig} className="max-w-xl space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Channel Mirroring</h3>
                <p className="text-xs text-slate-400 mt-1">Map command responses and log forwarding to a specific Discord text channel.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border border-slate-200 rounded-xl p-4">
                  <div>
                    <label htmlFor="logging-toggle" className="text-xs font-bold text-slate-800">Enable Mirroring Logs</label>
                    <p className="text-[10px] text-slate-400 mt-0.5">Toggle channel forwarding active for command metrics.</p>
                  </div>
                  <input
                    id="logging-toggle"
                    type="checkbox"
                    checked={loggingEnabled}
                    onChange={(e) => setLoggingEnabled(e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                </div>

                {loggingEnabled && (
                  <div className="space-y-2">
                    <label htmlFor="mirror-channel" className="text-xs font-bold text-slate-800">Target Mirror Channel</label>
                    <CustomDropdown
                      options={[
                        { value: "", label: "Select Channel" },
                        ...channels.map((ch) => ({ value: ch.id, label: `#${ch.name}` }))
                      ]}
                      value={mirrorChannelId || ""}
                      onChange={setMirrorChannelId}
                      placeholder="Select Channel"
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={savingMirror || !isMirrorChanged}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingMirror ? "Saving..." : "Save Changes"}</span>
                </Button>
                {mirrorSuccess && (
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Configuration updated!</span>
                  </span>
                )}
              </div>
            </form>
          )}

        </div>
      </div>


    </div>
  )
}
