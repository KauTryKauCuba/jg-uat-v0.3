"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { HelpCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function HelpRequestNavLink({ isCollapsed }: { isCollapsed?: boolean }) {
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
      title={isCollapsed ? `Help Requests (${count})` : undefined}
      className={cn(
        "flex items-center rounded-xl text-sm font-semibold transition-all duration-200 border relative",
        isCollapsed ? "justify-center p-3" : "justify-between px-4 py-3",
        isActive
          ? "bg-gradient-to-r from-brand-teal/15 to-brand-cyan/15 border-brand-teal/20 text-brand-teal dark:text-brand-cyan"
          : hasNotification
          ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 dark:hover:bg-rose-500/20"
          : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
      )}
    >
      <div className="flex items-center space-x-3">
        <HelpCircle className={cn("w-5 h-5 shrink-0", hasNotification && !isActive ? "text-rose-600 dark:text-rose-400" : "")} />
        {!isCollapsed && <span>Help Requests</span>}
      </div>
      {hasNotification && (
        isCollapsed ? (
          <span className="absolute top-1.5 right-1.5 flex w-2.5 h-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
        ) : (
          <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] animate-pulse">
            {count}
          </span>
        )
      )}
    </Link>
  )
}
export default HelpRequestNavLink;
