import React, { useState } from "react"
import PageHeader from "@/components/PageHeader"
import DataTable from "@/components/DataTable"
import ServerSelector, { ServerOption } from "@/components/ServerSelector"
import { Terminal } from "lucide-react"

export default function Commands() {
  const columns = ["Command", "Enabled", "AI Integration", "Mirroring", "Actions"]
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null)

  // Mock server list for presentation (empty by default to show empty state behavior)
  const mockServers: ServerOption[] = []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Commands"
          description="Configure parameters, disable commands, and enable AI prompts for individual guild servers."
        />
        <ServerSelector
          servers={mockServers}
          selectedServerId={selectedServerId}
          onChange={setSelectedServerId}
        />
      </div>

      <DataTable
        columns={columns}
        emptyTitle="No commands configured yet"
        emptyDescription="Connect a server first to configure slash commands."
        emptyIcon={Terminal}
        rowCount={0}
      />
    </div>
  )
}
