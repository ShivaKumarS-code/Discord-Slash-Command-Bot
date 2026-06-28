import React from "react"
import { useLocation } from "react-router-dom"
import { Menu, Bell } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface TopNavbarProps {
  onMenuClick: () => void
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { user } = useAuth()
  const location = useLocation()

  const getPageTitle = (path: string) => {
    if (path.startsWith("/servers/")) {
      return "Server Details"
    }
    switch (path) {
      case "/":
        return "Dashboard"
      case "/servers":
        return "Connected Servers"
      case "/commands":
        return "Commands"
      case "/interactions":
        return "Interaction Logs"
      case "/actions":
        return "Action History"
      default:
        return "Control Panel"
    }
  }

  const userDisplayName = user?.user_metadata?.display_name || "Admin User"

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Bell Mock */}
        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-slate-900 ring-2 ring-white" />
        </button>

        {/* User profile dropdown info */}
        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-semibold text-slate-700 sm:inline-block">
            {userDisplayName}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs uppercase">
            {userDisplayName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  )
}
export default TopNavbar
