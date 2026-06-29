import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true })
    }
  }, [user, navigate])

  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || undefined
            }
          }
        })
        if (signUpError) throw signUpError
        
        if (data?.session) {
          navigate("/", { replace: true })
        } else {
          setMessage("Registration successful! Check your email to confirm registration or sign in.")
        }
      } else {
        const { error: loginError } = await login(email, password)
        if (loginError) throw loginError
        navigate("/", { replace: true })
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!email) {
      setError("Please enter your email address to reset password.")
      return
    }
    // Placeholder functionality
    setMessage(`Password reset instructions sent to ${email} (simulation).`)
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#080808] p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {isRegistering ? "Create an account" : "Sign in to Dashboard"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegistering ? "Get started with your discord bot!" : "Enter your email and password below"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </label>
              {!isRegistering && (
                <a
                  href="#"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  Forgot password?
                </a>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg mt-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? "Processing..." : isRegistering ? "Register Account" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
          </span>{" "}
          <button
            onClick={() => {
              setIsRegistering(!isRegistering)
              setError(null)
              setMessage(null)
            }}
            className="font-semibold text-slate-900 hover:underline"
          >
            {isRegistering ? "Sign in instead" : "Create one now"}
          </button>
        </div>
      </div>
    </div>
  )
}
