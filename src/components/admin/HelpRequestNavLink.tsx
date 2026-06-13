"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { HelpCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function HelpRequestNavLink() {
  const pathname = usePathname()
  const isActive = pathname === "/admin/help-requests"
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/help-requests")
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setCount(json.data.length)
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 5000)
    return () => clearInterval(interval)
  }, [])

  const hasNotification = count > 0

  return (
    <Link
      href="/admin/help-requests"
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border",
        isActive
          ? "bg-gradient-to-r from-brand-teal/15 to-brand-cyan/15 border-brand-teal/20 text-brand-cyan"
          : hasNotification
          ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
          : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent"
      )}
    >
      <div className="flex items-center space-x-3">
        <HelpCircle className={cn("w-5 h-5", hasNotification && !isActive ? "text-rose-400" : "")} />
        <span>Help Requests</span>
      </div>
      {hasNotification && (
        <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] animate-pulse">
          {count}
        </span>
      )}
    </Link>
  )
}
export default HelpRequestNavLink;
