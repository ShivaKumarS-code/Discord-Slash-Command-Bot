import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Menu } from "lucide-react"
import Sidebar from "./Sidebar"

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation Drawer */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Compact Mobile Header (visible only on mobile/tablet) */}
        <div className="lg:hidden flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-xs">
          <button
            type="button"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-extrabold tracking-tight text-slate-900">
            Bot Control
          </span>
          <div className="w-9" /> {/* Visual spacing balancing */}
        </div>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default DashboardLayout
