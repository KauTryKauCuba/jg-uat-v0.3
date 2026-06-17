"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, Loader2 } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

export function ResetAllButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleReset = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/testers/reset-all", {
        method: "POST",
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setIsOpen(false)
        router.refresh()
      }
    } catch {
      alert("Failed to reset testers progress.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        disabled
        className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/10 text-rose-500/50 cursor-not-allowed opacity-50 shadow-md select-none shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset All Testers (Locked)</span>
      </button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleReset}
        title="Reset All Testers?"
        description="WARNING: This will permanently delete all test runs, answer logs, screenshot uploads, and help tickets. All testers will be reset to choose their profile group again. This action cannot be undone."
        confirmText={loading ? "Resetting..." : "Reset everything"}
        variant="destructive"
      />
    </>
  )
}
