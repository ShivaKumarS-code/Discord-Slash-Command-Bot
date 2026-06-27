import React, { useState } from "react"
import PageHeader from "@/components/PageHeader"
import EmptyState from "@/components/EmptyState"
import SectionCard from "@/components/SectionCard"
import { Server, Settings, Cpu, Shield, Repeat } from "lucide-react"

export default function Servers() {
  const [activeTab, setActiveTab] = useState<"general" | "ai" | "mirroring" | "permissions">("general")

  const handleConnectServer = () => {
    // TODO: In the next phase, this will redirect to Discord OAuth URL
    alert("Connect Discord Server - Action triggered (OAuth will be implemented in the next phase).")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Connected Servers"
        description="Connect and configure Discord servers authorized to interact with the bot."
      />

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <EmptyState
          title="No Discord servers connected yet"
          description="Connect a Discord server to configure commands, AI, and mirroring."
          icon={Server}
          actionLabel="Connect Discord Server"
          onActionClick={handleConnectServer}
        />
      </div>

      {/* Future Server Management View Structure */}
      <SectionCard
        title="Server Configuration Layout (Preview)"
        description="Manage server-specific options once a guild connection is established."
      >
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          {/* Mock Tab Selector */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-r border-slate-200 transition-colors cursor-pointer ${
                activeTab === "general"
                  ? "bg-white text-slate-900 border-b-2 border-b-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Settings className="h-4 w-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-r border-slate-200 transition-colors cursor-pointer ${
                activeTab === "ai"
                  ? "bg-white text-slate-900 border-b-2 border-b-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Cpu className="h-4 w-4" />
              AI Settings
            </button>
            <button
              onClick={() => setActiveTab("mirroring")}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-r border-slate-200 transition-colors cursor-pointer ${
                activeTab === "mirroring"
                  ? "bg-white text-slate-900 border-b-2 border-b-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Repeat className="h-4 w-4" />
              Mirroring
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === "permissions"
                  ? "bg-white text-slate-900 border-b-2 border-b-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Shield className="h-4 w-4" />
              Permissions
            </button>
          </div>

          {/* Mock Tab Contents */}
          <div className="p-6">
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-700">Connection Status</span>
                  <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-sm">Offline (Placeholder)</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-slate-700">Slash Commands Synced</span>
                  <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-sm">0 Synced</span>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Enable AI summaries for this Server</span>
                    <p className="text-xs text-slate-400">Permit bot commands to summarize responses using Groq LLM on this server</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled
                    className="h-4 w-4 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {activeTab === "mirroring" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Enable Mirroring</span>
                    <p className="text-xs text-slate-400">Forward command interactions to a log channel</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled
                    className="h-4 w-4 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Mirror Channel ID
                  </label>
                  <input
                    type="text"
                    disabled
                    placeholder="Enter channel ID..."
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Mirror Format
                  </label>
                  <select
                    disabled
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                  >
                    <option>Embeds & Text</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Manage administrator role permissions allowed to interact with bot command syncs in the future.
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
