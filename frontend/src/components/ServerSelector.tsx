import { CustomDropdown } from "./ui/CustomDropdown"

export interface ServerOption {
  id: string
  name: string
  discordGuildId: string
}

export interface ServerSelectorProps {
  servers: ServerOption[]
  selectedServerId: string | null
  onChange: (serverId: string) => void
  align?: "left" | "right"
}

export function ServerSelector({
  servers,
  selectedServerId,
  onChange,
  align = "left"
}: ServerSelectorProps) {
  const isDisabled = servers.length === 0

  const options = isDisabled
    ? []
    : [
        { value: "", label: "Select Server" },
        ...servers.map((s) => ({ value: s.id, label: s.name }))
      ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Server:
      </span>
      <CustomDropdown
        options={options}
        value={selectedServerId || ""}
        onChange={onChange}
        disabled={isDisabled}
        placeholder={isDisabled ? "No servers connected" : "Select Server"}
        align={align}
      />
    </div>
  )
}
export default ServerSelector
