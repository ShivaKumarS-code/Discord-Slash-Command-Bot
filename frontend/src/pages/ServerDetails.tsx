import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { ArrowLeft, Calendar, Server, Cpu, RefreshCw, Terminal, ShieldAlert, CheckCircle, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const [server, setServer] = useState<DiscordServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"general" | "mirroring" | "commands" | "permissions">("general")

  // Disconnect modal state
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)

  // Mirroring tab state
  const [channels, setChannels] = useState<ChannelOption[]>([])
  const [loggingEnabled, setLoggingEnabled] = useState(true)
  const [mirrorChannelId, setMirrorChannelId] = useState<string>("")
  const [savingMirror, setSavingMirror] = useState(false)
  const [mirrorSuccess, setMirrorSuccess] = useState(false)

  // Commands tab state
  const [commandsList, setCommandsList] = useState<CommandConfig[]>([])
  const [savingCommands, setSavingCommands] = useState(false)
  const [commandsSuccess, setCommandsSuccess] = useState(false)

  // Permissions tab state (local/mock config)
  const [permissionsMap, setPermissionsMap] = useState<Record<string, string>>({
    report: "everyone",
    status: "everyone"
  })
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [permissionsSuccess, setPermissionsSuccess] = useState(false)

  const fetchServerDetails = async () => {
    if (!session?.access_token || !serverId) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/v1/servers/${serverId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to retrieve server details.")
      }

      setServer(data)

      // Initialize mirroring state from DB config
      if (data.config) {
        setLoggingEnabled(data.config.logging_enabled)
        setMirrorChannelId(data.config.mirror_channel_id || "")
      }

      // Initialize commands configs, merging defaults with DB records
      const defaultCommands = [
        { command_name: "report", enabled: true, ai_enabled: true, mirror_enabled: true },
        { command_name: "status", enabled: true, ai_enabled: false, mirror_enabled: true }
      ]

      const mergedCommands = defaultCommands.map((def) => {
        const dbConfig = data.command_configs?.find((db: CommandConfig) => db.command_name === def.command_name)
        return dbConfig ? { ...def, ...dbConfig } : def
      })

      setCommandsList(mergedCommands)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An error occurred fetching server details.")
    } finally {
      setLoading(false)
    }
  }

  const fetchChannels = async () => {
    if (!session?.access_token || !serverId) return
    try {
      const response = await fetch(`/api/v1/servers/${serverId}/channels`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setChannels(data)
      }
    } catch (err) {
      console.error("Failed to fetch channels:", err)
    }
  }

  useEffect(() => {
    fetchServerDetails()
  }, [session, serverId])

  useEffect(() => {
    if (activeTab === "mirroring") {
      fetchChannels()
    }
  }, [activeTab])

  // Save Mirroring Config
  const handleSaveMirrorConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.access_token || !serverId) return

    try {
      setSavingMirror(true)
      setMirrorSuccess(false)
      const response = await fetch(`/api/v1/servers/${serverId}/config`, {
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

      setMirrorSuccess(true)
      setTimeout(() => setMirrorSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      alert("Error saving mirroring configurations.")
    } finally {
      setSavingMirror(false)
    }
  }

  // Save Commands Config
  const handleSaveCommandsConfig = async () => {
    if (!session?.access_token || !serverId) return

    try {
      setSavingCommands(true)
      setCommandsSuccess(false)
      const response = await fetch(`/api/v1/servers/${serverId}/commands`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          commands: commandsList
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error?.message || "Failed to update commands configurations.")
      }

      const updatedCommands = await response.json()
      setCommandsList(updatedCommands)
      setCommandsSuccess(true)
      setTimeout(() => setCommandsSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      alert("Error saving command configurations.")
    } finally {
      setSavingCommands(false)
    }
  }

  // Save Permissions Config
  const handleSavePermissions = () => {
    setSavingPermissions(true)
    setPermissionsSuccess(false)
    setTimeout(() => {
      setSavingPermissions(false)
      setPermissionsSuccess(true)
      setTimeout(() => setPermissionsSuccess(false), 3000)
    }, 800)
  }

  const handleCommandToggle = (index: number, field: keyof CommandConfig) => {
    const updated = [...commandsList]
    updated[index] = {
      ...updated[index],
      [field]: !updated[index][field]
    }
    setCommandsList(updated)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="text-sm font-medium text-slate-500">Loading server configurations...</p>
        </div>
      </div>
    )
  }

  if (error || !server) {
    return (
      <div className="space-y-6">
        <Link to="/servers" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Connected Servers</span>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <h4 className="font-semibold mb-1">Failed to load server configurations</h4>
          <p className="text-sm">{error || "Server details not found."}</p>
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
          {(["general", "mirroring", "commands", "permissions"] as const).map((tab) => (
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

              <div className="border-t border-slate-100 pt-6">
                <Button
                  onClick={() => setShowDisconnectModal(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Disconnect Server</span>
                </Button>
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
                {/* Mirroring enabled toggle */}
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

                {/* Mirror Channel selection */}
                {loggingEnabled && (
                  <div className="space-y-2">
                    <label htmlFor="mirror-channel" className="text-xs font-bold text-slate-800">Target Mirror Channel</label>
                    <select
                      id="mirror-channel"
                      value={mirrorChannelId}
                      onChange={(e) => setMirrorChannelId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-slate-900 focus:outline-none transition-colors"
                      required={loggingEnabled}
                    >
                      <option value="">Select Channel</option>
                      {channels.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          #{ch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={savingMirror}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs text-xs"
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

          {activeTab === "commands" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Slash Commands Override</h3>
                <p className="text-xs text-slate-400 mt-1">Configure individual override switches, AI automations, and mirror parameters.</p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider select-none">
                      <th className="px-6 py-3.5">Command</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-center">Use AI Prompt</th>
                      <th className="px-6 py-3.5 text-center">Mirror Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {commandsList.map((cmd, idx) => (
                      <tr key={cmd.command_name} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-mono text-slate-900 font-bold">/{cmd.command_name}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {cmd.command_name === "report" 
                              ? "Generate a summary report of bot activity." 
                              : "View active health status metrics."}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={cmd.enabled}
                              onChange={() => handleCommandToggle(idx, "enabled")}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                            <span className="ml-2 text-xs font-semibold text-slate-600">
                              {cmd.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </label>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={cmd.ai_enabled}
                            disabled={!cmd.enabled}
                            onChange={() => handleCommandToggle(idx, "ai_enabled")}
                            className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={cmd.mirror_enabled}
                            disabled={!cmd.enabled}
                            onChange={() => handleCommandToggle(idx, "mirror_enabled")}
                            className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <Button
                  onClick={handleSaveCommandsConfig}
                  disabled={savingCommands}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs text-xs"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingCommands ? "Saving..." : "Save Changes"}</span>
                </Button>
                {commandsSuccess && (
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1 animate-fade-in">
                    <CheckCircle className="h-4 w-4" />
                    <span>Configurations saved!</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Bot & User Permissions</h3>
                <p className="text-xs text-slate-400 mt-1">Assign command accessibility options mapping active roles.</p>
              </div>

              <div className="space-y-4">
                {commandsList.map((cmd) => (
                  <div key={cmd.command_name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded-xl p-4">
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-900">/{cmd.command_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Restrict who can run this command inside channels.</p>
                    </div>
                    <select
                      value={permissionsMap[cmd.command_name] || "everyone"}
                      onChange={(e) => setPermissionsMap({ ...permissionsMap, [cmd.command_name]: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-slate-900 focus:outline-none transition-colors w-full sm:w-40"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="moderators">Moderators</option>
                      <option value="administrators">Administrators</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <Button
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs text-xs"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingPermissions ? "Saving..." : "Save Changes"}</span>
                </Button>
                {permissionsSuccess && (
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1 animate-fade-in">
                    <CheckCircle className="h-4 w-4" />
                    <span>Permissions updated!</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Modal Overlay */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-red-600">
                <ShieldAlert className="h-5 w-5" />
                <span>Disconnect Server</span>
              </h3>
              <button 
                onClick={() => setShowDisconnectModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to disconnect **{server.name}**? This will remove the configurations, command overrides, and logging parameters configured for this server.
            </p>
            
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDisconnectModal(false)}
                className="text-xs font-semibold px-4 py-2 border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  alert("Disconnect server functionality will be implemented in the next phase.")
                  setShowDisconnectModal(false)
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Confirm Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
