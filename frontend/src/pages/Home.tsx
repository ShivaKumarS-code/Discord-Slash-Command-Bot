import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export default function Home() {
  const { user, session, logout } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCheckProfile = async () => {
    setError(null)
    setProfileData(null)
    setLoading(true)

    try {
      const response = await fetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch backend profile.")
      }

      setProfileData(data)
    } catch (err: any) {
      setError(err.message || "An error occurred fetching the profile.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "3rem 1.5rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "1rem" }}>
        React Vite Dashboard
      </h1>
      
      <p style={{ fontSize: "1.125rem", color: "#64748b", marginBottom: "1.5rem" }}>
        Welcome to your production-ready workspace. You are signed in as:
      </p>
      
      {user && (
        <div className="mb-6 rounded-lg bg-slate-100 p-3 inline-block font-mono text-sm text-slate-700">
          {user.email}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "2rem" }}>
        <Button variant="default" onClick={logout}>
          Sign Out
        </Button>
        <Button variant="outline" onClick={handleCheckProfile} disabled={loading}>
          {loading ? "Checking..." : "Verify Backend Provisioning"}
        </Button>
      </div>

      {error && (
        <div className="mx-auto max-w-md rounded-lg bg-red-50 p-4 text-left text-sm text-red-700">
          <span className="font-semibold">Backend Error:</span> {error}
        </div>
      )}

      {profileData && (
        <div className="mx-auto max-w-md rounded-lg bg-slate-50 border border-slate-200 p-6 text-left shadow-sm">
          <h3 className="text-md font-semibold text-slate-800 mb-2">Backend Profile Data (From Database)</h3>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-md text-xs overflow-auto font-mono">
            {JSON.stringify(profileData, null, 2)}
          </pre>
          <p className="mt-2 text-xs text-green-600 font-semibold">
            ✓ Verified: User is successfully provisioned in the Postgres users table!
          </p>
        </div>
      )}
    </div>
  )
}
