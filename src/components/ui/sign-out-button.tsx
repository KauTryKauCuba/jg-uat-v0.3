"use client"

import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-xs font-semibold px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
    >
      Sign Out
    </button>
  )
}
