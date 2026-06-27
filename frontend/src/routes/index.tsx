import { createBrowserRouter } from "react-router-dom"
import Home from "@/pages/Home"
import Login from "@/pages/Login"
import ProtectedRoute from "@/components/ProtectedRoute"

/**
 * Configures client routes.
 * Secure routes by wrapping them inside the ProtectedRoute component.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    )
  },
  {
    path: "/login",
    element: <Login />
  }
])
