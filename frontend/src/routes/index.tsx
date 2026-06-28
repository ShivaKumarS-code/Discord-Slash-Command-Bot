import { createBrowserRouter } from "react-router-dom"
import DashboardLayout from "@/components/DashboardLayout"
import ProtectedRoute from "@/components/ProtectedRoute"
import Dashboard from "@/pages/Dashboard"
import Servers from "@/pages/Servers"
import ServerDetails from "@/pages/ServerDetails"
import Commands from "@/pages/Commands"
import Interactions from "@/pages/Interactions"
import Actions from "@/pages/Actions"
import Login from "@/pages/Login"

/**
 * Configure routes for the React application.
 * All dashboard paths are nested under DashboardLayout and require authentication.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <Dashboard />
      },
      {
        path: "servers",
        element: <Servers />
      },
      {
        path: "servers/:serverId",
        element: <ServerDetails />
      },
      {
        path: "commands",
        element: <Commands />
      },
      {
        path: "interactions",
        element: <Interactions />
      },
      {
        path: "actions",
        element: <Actions />
      }
    ]
  },
  {
    path: "/login",
    element: <Login />
  }
])
