import React, { useState } from "react"
import PageHeader from "@/components/PageHeader"
import DataTable from "@/components/DataTable"
import ServerSelector, { ServerOption } from "@/components/ServerSelector"
import { Activity } from "lucide-react"

export default function Interactions() {
  const columns = ["Timestamp", "Server", "Command", "User", "AI Status", "Mirror Status", "Status"]
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)

  // Mock server list for presentation (empty by default to show empty state behavior)
  const mockServers: ServerOption[] = []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Interaction Logs"
          description="Monitor incoming slash command triggers, webhook statuses, and response payloads."
        />
        <ServerSelector
          servers={mockServers}
          selectedServerId={selectedServerId}
          onChange={setSelectedServerId}
        />
      </div>

      <DataTable
        columns={columns}
        emptyTitle="No interaction logs recorded"
        emptyDescription="Logs will appear after your connected servers begin receiving slash commands."
        emptyIcon={Activity}
        rowCount={0}
      />
    </div>
  )
}
