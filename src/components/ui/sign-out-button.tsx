"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export function SignOutButton({ isCollapsed }: { isCollapsed?: boolean }) {
  return (
    <button
      onClick={() => {
        localStorage.removeItem("jg-uat-tour-completed")
        localStorage.removeItem("jg-uat-tour-shown")
        sessionStorage.removeItem("jg-uat-tour-completed")
        sessionStorage.removeItem("jg-uat-tour-shown")
        sessionStorage.removeItem("jg-uat-tour-session-seen")
        signOut({ callbackUrl: "/" })
      }}
      className={cn(
        "text-xs font-semibold rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center w-full text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white",
        isCollapsed ? "py-2.5" : "px-4 py-2 space-x-2"
      )}
      title={isCollapsed ? "Sign Out" : undefined}
    >
      <LogOut className="w-4 h-4 shrink-0" />
      {!isCollapsed && <span>Sign Out</span>}
    </button>
  )
}
