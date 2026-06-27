import { createBrowserRouter } from "react-router-dom"
import Home from "@/pages/Home"

/**
 * Configure routes for the React application.
 * You can add layout routes, sub-routes, and loaders here.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  // Add more routes here, e.g.:
  // {
  //   path: "/dashboard",
  //   element: <Dashboard />,
  // }
])
