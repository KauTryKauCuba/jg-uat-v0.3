"use client"

import * as React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Users, RefreshCw, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface Tester {
  id: string
  name: string | null
  email: string
  testerGroup: "JOBSEEKER" | "EMPLOYER" | null
  employerLocked: boolean
  createdAt: string
}

export default function AdminTestersPage() {
  const [testers, setTesters] = React.useState<Tester[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const fetchTesters = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/testers")
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setTesters(json.testers)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load testers")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchTesters()
  }, [])

  const handleAction = async (testerId: string, action: "toggle-lock" | "reset-choice") => {
    if (action === "reset-choice") {
      const confirmReset = window.confirm("Are you sure you want to reset this tester's group choice? They will be prompted to select Jobseeker or Employer again upon their next login.")
      if (!confirmReset) return
    }

    try {
      setUpdatingId(testerId)
      const res = await fetch(`/api/admin/testers/${testerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        // Update local state
        setTesters((prev) =>
          prev.map((t) => {
            if (t.id === testerId) {
              if (action === "toggle-lock") {
                return { ...t, employerLocked: json.employerLocked }
              } else if (action === "reset-choice") {
                return { ...t, testerGroup: null, employerLocked: true }
              }
            }
            return t
          })
        )
      }
    } catch (err) {
      alert("Failed to update tester status")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      setUpdatingId(deletingId)
      const res = await fetch(`/api/admin/testers/${deletingId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setTesters((prev) => prev.filter((t) => t.id !== deletingId))
      }
    } catch (err) {
      alert("Failed to delete tester")
    } finally {
      setUpdatingId(null)
      setDeletingId(null)
    }
  }

  return (
    <main className="p-8 space-y-6 flex-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tester Management</h1>
        <p className="text-gray-400 mt-2">
          Monitor UAT testers and reset tester selections.
        </p>
      </div>

      <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-cyan" />
          <span>Registered Testers</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 border border-red-500/20 bg-red-500/10 rounded-xl font-medium">
            {error}
          </div>
        ) : testers.length === 0 ? (
          <p className="text-xs text-gray-500 py-16 text-center">No testers registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Selected Group</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testers.map((tester) => {
                  const isUpdating = updatingId === tester.id

                  return (
                    <tr
                      key={tester.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors select-none"
                    >
                      <td className="py-4 px-4 font-semibold text-white">
                        {tester.name || <span className="text-gray-500 italic">No Name</span>}
                      </td>
                      <td className="py-4 px-4 text-gray-300">{tester.email}</td>
                      <td className="py-4 px-4">
                        {tester.testerGroup === "JOBSEEKER" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                            Jobseeker
                          </span>
                        ) : tester.testerGroup === "EMPLOYER" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/25 text-blue-400">
                            Employer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 border border-zinc-500/25 text-zinc-400">
                            Not Chosen
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-500">
                        {new Date(tester.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        {tester.testerGroup !== null && (
                          <button
                            onClick={() => handleAction(tester.id, "reset-choice")}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Reset Choice
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingId(tester.id)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Tester Account?"
        description="Are you sure you want to delete this tester account? This will permanently delete their profile, help requests, answers, and reset any claimed UAT resources."
        confirmText="Delete permanently"
        variant="destructive"
      />
    </main>
  )
}
