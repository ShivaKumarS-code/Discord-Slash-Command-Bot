import { useState, useEffect } from "react"
import PageHeader from "@/components/PageHeader"
import ServerSelector, { ServerOption } from "@/components/ServerSelector"
import { Terminal, Save, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import Skeleton from "@/components/ui/Skeleton"

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

export default function Commands() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)
  
  const [commandsList, setCommandsList] = useState<CommandConfig[]>([])
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 1. Fetch connected servers list
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

  // Set default selected server on load if servers are returned
  useEffect(() => {
    if (servers.length > 0 && !selectedServerId) {
      setSelectedServerId(servers[0].id)
    }
  }, [servers, selectedServerId])

  // 2. Fetch server details containing command_configs for selected server
  const { data: serverDetails, isLoading: isDetailsLoading } = useQuery<DiscordServer | null>({
    queryKey: ["serverDetails", selectedServerId, session?.access_token],
    queryFn: async () => {
      if (!selectedServerId || !session?.access_token) return null
      const response = await fetch(`/api/v1/servers/${selectedServerId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || "Failed to retrieve configs")
      return data
    },
    enabled: !!selectedServerId && !!session?.access_token
  })

  // Synchronize form values when target server changes or fetches complete
  useEffect(() => {
    if (serverDetails) {
      const defaultCommands = [
        { command_name: "report", enabled: true, ai_enabled: true, mirror_enabled: true },
        { command_name: "status", enabled: true, ai_enabled: false, mirror_enabled: true }
      ]

      const merged = defaultCommands.map((def) => {
        const dbConfig = serverDetails.command_configs?.find((db) => db.command_name === def.command_name)
        return dbConfig ? { ...def, ...dbConfig } : def
      })

      setCommandsList(merged)
    } else {
      setCommandsList([])
    }
  }, [serverDetails])

  const getInitialCommands = () => {
    if (!serverDetails) return []
    const defaultCommands = [
      { command_name: "report", enabled: true, ai_enabled: true, mirror_enabled: true },
      { command_name: "status", enabled: true, ai_enabled: false, mirror_enabled: true }
    ]
    return defaultCommands.map((def) => {
      const dbConfig = serverDetails.command_configs?.find((db) => db.command_name === def.command_name)
      return dbConfig ? {
        command_name: def.command_name,
        enabled: dbConfig.enabled,
        ai_enabled: dbConfig.ai_enabled,
        mirror_enabled: dbConfig.mirror_enabled
      } : def
    })
  }

  const initialCommands = getInitialCommands()
  const isChanged = commandsList.some((cmd, idx) => {
    const init = initialCommands[idx]
    if (!init) return true
    return (
      cmd.enabled !== init.enabled ||
      cmd.ai_enabled !== init.ai_enabled ||
      cmd.mirror_enabled !== init.mirror_enabled
    )
  })

  const handleCommandToggle = (index: number, field: keyof CommandConfig) => {
    const updated = [...commandsList]
    updated[index] = {
      ...updated[index],
      [field]: !updated[index][field]
    }
    setCommandsList(updated)
  }

  const handleSaveChanges = async () => {
    if (!session?.access_token || !selectedServerId) return

    try {
      setSaving(true)
      setSaveSuccess(false)
      const response = await fetch(`/api/v1/servers/${selectedServerId}/commands`, {
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
        throw new Error(errData.error?.message || "Failed to save command configurations.")
      }

      // Invalidate target keys to synchronize pages instantly
      queryClient.invalidateQueries({ queryKey: ["serverDetails", selectedServerId] })
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] })

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to save command overrides.")
    } finally {
      setSaving(false)
    }
  }

  const serverOptions: ServerOption[] = servers.map((s) => ({
    id: s.id,
    name: s.name,
    discordGuildId: s.discord_guild_id
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Commands"
          description="Configure parameters, disable commands, and enable AI prompts for individual guild servers."
        />
        <ServerSelector
          servers={serverOptions}
          selectedServerId={selectedServerId}
          onChange={setSelectedServerId}
          align="right"
        />
      </div>

      {isDetailsLoading ? (
        <Skeleton className="h-[350px] w-full rounded-xl animate-fade-in" />
      ) : !selectedServerId ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Terminal className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-950">No servers connected</h3>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
            Please connect a Discord server first before managing command overrides.
          </p>
        </div>
      ) : commandsList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Terminal className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-950">No commands found</h3>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
            Ensure this bot has been synchronized with commands for the selected server.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Slash Command Parameters</h3>
            <p className="text-xs text-slate-400 mt-1">Updates to these parameters apply to the active selected server.</p>
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
              <tbody className="divide-y divide-[#1c1c1c] [&>tr:first-child]:border-t-0 text-slate-700 font-semibold">
                {commandsList.map((cmd, idx) => (
                  <tr key={cmd.command_name} className="transition-colors">
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
              onClick={handleSaveChanges}
              disabled={saving || !isChanged}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </Button>
            {saveSuccess && (
              <span className="text-xs text-green-600 font-semibold flex items-center gap-1 animate-fade-in">
                <CheckCircle className="h-4 w-4" />
                <span>Command overrides saved!</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
