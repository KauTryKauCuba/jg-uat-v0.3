"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export function SignOutButton({ isCollapsed }: { isCollapsed?: boolean }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className={cn(
        "text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center w-full text-gray-300 hover:text-white",
        isCollapsed ? "py-2.5" : "px-4 py-2 space-x-2"
      )}
      title={isCollapsed ? "Sign Out" : undefined}
    >
      <LogOut className="w-4 h-4 shrink-0" />
      {!isCollapsed && <span>Sign Out</span>}
    </button>
  )
}
