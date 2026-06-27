import React from "react"
import PageHeader from "@/components/PageHeader"
import StatCard from "@/components/StatCard"
import SectionCard from "@/components/SectionCard"
import EmptyState from "@/components/EmptyState"
import { Server, Terminal, Activity, Repeat, Eye, History } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and status flags */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description="Overview of your connected Discord servers, bot commands, and AI activity."
        />
        
        {/* System Status Indicators */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs self-start md:self-auto">
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
          value="0"
          icon={Server}
          description="Active Discord configurations"
        />
        <StatCard
          title="Registered Commands"
          value="0"
          icon={Terminal}
          description="Configured bot functions"
        />
        <StatCard
          title="Today's Interactions"
          value="0"
          icon={Activity}
          description="Triggered slash commands"
        />
        <StatCard
          title="Active Mirrors"
          value="0"
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
          <EmptyState
            title="No interactions received yet"
            description="Connect your first Discord server to begin managing commands and viewing activity."
            icon={Eye}
          />
        </SectionCard>

        <SectionCard
          title="Recent Actions"
          description="Latest system action logs and AI generation histories."
        >
          <EmptyState
            title="No history records found"
            description="Connect your first Discord server to begin managing commands and viewing activity."
            icon={History}
          />
        </SectionCard>
      </div>
    </div>
  )
}
