import React, { useState } from "react"
import PageHeader from "@/components/PageHeader"
import DataTable from "@/components/DataTable"
import ServerSelector, { ServerOption } from "@/components/ServerSelector"
import { History } from "lucide-react"

export default function Actions() {
  const columns = ["Time", "Action", "Status", "Retry Count", "Details"]
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)

  // Mock server list for presentation (empty by default to show empty state behavior)
  const mockServers: ServerOption[] = []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Action History"
          description="Audit trailing backend tasks, channel mirrors, and retry actions triggered by commands."
        />
        <ServerSelector
          servers={mockServers}
          selectedServerId={selectedServerId}
          onChange={setSelectedServerId}
        />
      </div>

      <DataTable
        columns={columns}
        emptyTitle="No action history recorded"
        emptyDescription="Background processing, AI actions, and mirror events will appear here."
        emptyIcon={History}
        rowCount={0}
      />
    </div>
  )
}
