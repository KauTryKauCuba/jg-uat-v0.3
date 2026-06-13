"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

export function RefreshButton() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const handleRefresh = () => {
    setLoading(true)
    router.refresh()
    setTimeout(() => setLoading(false), 800)
  }

  return (
    <button
      onClick={handleRefresh}
      className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer shadow-md select-none shrink-0"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-cyan" : ""}`} />
      <span>Refresh Data</span>
    </button>
  )
}
