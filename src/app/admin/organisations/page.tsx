"use client"

import * as React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Building, Edit2, Trash2, X, Save, Loader2 } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface Organisation {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export default function OrganisationsPage() {
  const [organisations, setOrganisations] = React.useState<Organisation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Form states
  const [name, setName] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [editingOrg, setEditingOrg] = React.useState<Organisation | null>(null)

  // Delete modal state
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const fetchOrganisations = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/organisations")
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setOrganisations(json.data || [])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load organisations")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchOrganisations()
  }, [])

  const handleEditClick = (org: Organisation) => {
    setEditingOrg(org)
    setName(org.name)
  }

  const handleCancelEdit = () => {
    setEditingOrg(null)
    setName("")
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/admin/organisations/${deletingId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setOrganisations(organisations.filter((o) => o.id !== deletingId))
        if (editingOrg?.id === deletingId) {
          handleCancelEdit()
        }
      }
    } catch {
      alert("Failed to delete organisation")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)

    try {
      if (editingOrg) {
        // Edit mode (PUT)
        const res = await fetch(`/api/admin/organisations/${editingOrg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        })
        const json = await res.json()
        if (json.error) {
          alert(json.error)
        } else {
          setOrganisations(organisations.map((o) => (o.id === editingOrg.id ? json.data : o)))
          handleCancelEdit()
        }
      } else {
        // Create mode (POST)
        const res = await fetch("/api/admin/organisations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        })
        const json = await res.json()
        if (json.error) {
          alert(json.error)
        } else {
          setOrganisations([...organisations, json.data].sort((a, b) => a.name.localeCompare(b.name)))
          setName("")
        }
      }
    } catch (err: any) {
      alert(editingOrg ? "Failed to update organisation" : "Failed to create organisation")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="p-8 space-y-6 flex-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organisations</h1>
        <p className="text-gray-400 mt-2">Manage organisations representing testers and testing sources.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation/Edit Form */}
        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl h-fit space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {editingOrg ? (
              <>
                <Edit2 className="w-5 h-5 text-brand-cyan" />
                <span>Edit Organisation</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-brand-cyan" />
                <span>New Organisation</span>
              </>
            )}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <label className="block text-xs text-gray-400 font-semibold">Organisation Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-teal to-brand-cyan hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-brand-teal/10 flex items-center justify-center space-x-1.5"
              >
                {editingOrg ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{submitting ? "Saving..." : "Save Changes"}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{submitting ? "Creating..." : "Create Organisation"}</span>
                  </>
                )}
              </button>

              {editingOrg && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-gray-400 border border-white/5 hover:bg-white/5 hover:text-white transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Edit</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Organisations List */}
        <div className="lg:col-span-2 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold">Organisations List</h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="md" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 border border-red-500/20 bg-red-500/10 rounded-xl">
              {error}
            </div>
          ) : organisations.length === 0 ? (
            <p className="text-xs text-gray-500 py-16 text-center">
              No organisations created yet. Add one using the form on the left.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01]">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Created At</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organisations.map((org) => (
                    <tr
                      key={org.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-brand-cyan shrink-0" />
                          <span>{org.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-500">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(org)}
                            className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-gray-300 transition-colors cursor-pointer"
                            title="Edit Organisation"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(org.id)}
                            className="p-2 rounded-lg border border-white/5 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                            title="Delete Organisation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Organisation?"
        description="Are you sure you want to permanently delete this organisation? Any testers associated with it will no longer belong to this organisation (their association will be cleared)."
        confirmText="Delete permanently"
        variant="destructive"
      />
    </main>
  )
}
