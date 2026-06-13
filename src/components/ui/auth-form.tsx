"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

import { signIn } from "next-auth/react"

export function AuthForm() {
  const [activeTab, setActiveTab] = React.useState<"login" | "register">("login")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      if (activeTab === "register") {
        // Call registration API
        const registerRes = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })
        const registerJson = await registerRes.json()
        if (registerJson.error) {
          setError(registerJson.error)
          setLoading(false)
          return
        }
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (res && res.error) {
        setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error)
      } else if (res && res.ok) {
        window.location.href = "/"
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300">
      {/* Tabs */}
      <div className="flex border-b border-black/5 dark:border-white/5 pb-4 mb-6 relative">
        <button
          type="button"
          onClick={() => setActiveTab("login")}
          className={cn(
            "flex-1 text-center py-2 text-sm font-semibold transition-all duration-200",
            activeTab === "login"
              ? "text-brand-teal dark:text-brand-cyan border-b-2 border-brand-teal dark:border-brand-cyan"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={cn(
            "flex-1 text-center py-2 text-sm font-semibold transition-all duration-200",
            activeTab === "register"
              ? "text-brand-teal dark:text-brand-cyan border-b-2 border-brand-teal dark:border-brand-cyan"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Register
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "register" && (
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-teal dark:focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-teal dark:focus:ring-brand-cyan transition-all"
            />
          </div>
        )}

        <div className="space-y-1 text-left">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-teal dark:focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-teal dark:focus:ring-brand-cyan transition-all"
          />
        </div>

        <div className="space-y-1 text-left">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-teal dark:focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-teal dark:focus:ring-brand-cyan transition-all"
          />
        </div>

        {error && (
          <div className="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-center">
            {error}
          </div>
        )}

        {activeTab === "login" && (
          <div className="flex justify-end">
            <a href="#" className="text-xs text-brand-teal dark:text-brand-cyan hover:underline transition-all">
              Forgot password?
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-brand-teal to-brand-cyan hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-brand-teal/20"
        >
          {loading ? "Verifying..." : activeTab === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  )
}
