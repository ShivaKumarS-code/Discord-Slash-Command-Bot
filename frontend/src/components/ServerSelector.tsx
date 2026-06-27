import React from "react"

export interface ServerOption {
  id: string
  name: string
  discordGuildId: string
}

export interface ServerSelectorProps {
  servers: ServerOption[]
  selectedServerId: string | null
  onChange: (serverId: string) => void
}

export function ServerSelector({
  servers,
  selectedServerId,
  onChange
}: ServerSelectorProps) {
  const isDisabled = servers.length === 0

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="server-select"
        className="text-xs font-bold text-slate-500 uppercase tracking-wider"
      >
        Server:
      </label>
      <select
        id="server-select"
        disabled={isDisabled}
        value={selectedServerId || ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-slate-900 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        {isDisabled ? (
          <option value="">No servers connected</option>
        ) : (
          <>
            <option value="">Select Server</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  )
}
export default ServerSelector
