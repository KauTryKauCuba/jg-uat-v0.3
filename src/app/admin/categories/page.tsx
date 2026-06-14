"use client"

import * as React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Folder, GripVertical, Edit2, Trash2, X, Save } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface Category {
  id: string
  name: string
  description: string | null
  targetGroup: "JOBSEEKER" | "EMPLOYER"
  createdAt: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Tab Selection: JOBSEEKER or EMPLOYER
  const [activeTab, setActiveTab] = React.useState<"JOBSEEKER" | "EMPLOYER">("JOBSEEKER")

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)

  // Form & Editing states
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [targetGroup, setTargetGroup] = React.useState<"JOBSEEKER" | "EMPLOYER">("JOBSEEKER")
  const [submitting, setSubmitting] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)

  // Delete modal state
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  // Automatically update form targetGroup when tab changes (unless editing)
  React.useEffect(() => {
    if (!editingCategory) {
      setTargetGroup(activeTab)
    }
  }, [activeTab, editingCategory])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/categories")
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setCategories(json.data)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchCategories()
  }, [])

  const handleEditClick = (c: Category) => {
    setEditingCategory(c)
    setName(c.name)
    setDescription(c.description || "")
    setTargetGroup(c.targetGroup)
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setName("")
    setDescription("")
    setTargetGroup(activeTab)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/categories/${deletingId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setCategories(categories.filter((c) => c.id !== deletingId))
        if (editingCategory?.id === deletingId) {
          handleCancelEdit()
        }
      }
    } catch {
      alert("Failed to delete category")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setSubmitting(true)

    try {
      if (editingCategory) {
        // Edit mode (PATCH)
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, targetGroup }),
        })
        const json = await res.json()
        if (json.error) {
          alert(json.error)
        } else {
          setCategories(categories.map((c) => (c.id === editingCategory.id ? json.data : c)))
          handleCancelEdit()
        }
      } else {
        // Create mode (POST)
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, targetGroup }),
        })
        const json = await res.json()
        if (json.error) {
          alert(json.error)
        } else {
          setCategories([...categories, json.data])
          setName("")
          setDescription("")
        }
      }
    } catch (err: any) {
      alert(editingCategory ? "Failed to update category" : "Failed to create category")
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered categories for active tab
  const activeCategories = categories.filter((c) => c.targetGroup === activeTab)

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const reorderedActive = [...activeCategories]
    const draggedItem = reorderedActive[draggedIndex]
    reorderedActive.splice(draggedIndex, 1)
    reorderedActive.splice(index, 0, draggedItem)

    // Merge back into original list maintaining order
    const updatedCategories = [...categories]
    // Replace the items for active tab in their new relative positions
    let activeIdx = 0
    const finalCategories = updatedCategories.map((c) => {
      if (c.targetGroup === activeTab) {
        return reorderedActive[activeIdx++]
      }
      return c
    })

    setCategories(finalCategories)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    setDraggedIndex(null)
    try {
      const categoryIds = categories.map((c) => c.id)
      const res = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      }
    } catch (err) {
      console.error("Failed to save category order:", err)
    }
  }

  return (
    <main className="p-8 space-y-6 flex-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Case Categories</h1>
        <p className="text-gray-400 mt-2">Create and organize categories before building test cases. Drag items to reorder.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 space-x-4">
        <button
          onClick={() => setActiveTab("JOBSEEKER")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "JOBSEEKER"
              ? "border-brand-cyan text-brand-cyan"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          Jobseeker Categories
        </button>
        <button
          onClick={() => setActiveTab("EMPLOYER")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "EMPLOYER"
              ? "border-brand-cyan text-brand-cyan"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          Employer Categories
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation/Edit Form */}
        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl h-fit space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {editingCategory ? (
              <>
                <Edit2 className="w-5 h-5 text-brand-cyan animate-pulse" />
                <span>Edit Category</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-brand-cyan" />
                <span>New Category</span>
              </>
            )}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <label className="block text-xs text-gray-400 font-semibold">Category Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Candidate Dashboard"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs text-gray-400 font-semibold">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Scope or description of this category..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs text-gray-400 font-semibold">Target Group</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value as "JOBSEEKER" | "EMPLOYER")}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
              >
                <option value="JOBSEEKER">Jobseeker</option>
                <option value="EMPLOYER">Employer</option>
              </select>
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-teal to-brand-cyan hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-brand-teal/10 flex items-center justify-center space-x-1.5"
              >
                {editingCategory ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{submitting ? "Saving..." : "Save Changes"}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{submitting ? "Creating..." : "Create Category"}</span>
                  </>
                )}
              </button>

              {editingCategory && (
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

        {/* Categories List */}
        <div className="lg:col-span-2 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold">
            {activeTab === "JOBSEEKER" ? "Jobseeker" : "Employer"} Categories List
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="md" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 border border-red-500/20 bg-red-500/10 rounded-xl">
              {error}
            </div>
          ) : activeCategories.length === 0 ? (
            <p className="text-xs text-gray-500 py-16 text-center">
              No categories created yet for {activeTab === "JOBSEEKER" ? "Jobseekers" : "Employers"}. Add one using the form on the left.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01]">
                    <th className="py-4 px-6 w-12"></th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6">Created At</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCategories.map((c, idx) => (
                    <tr
                      key={c.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing select-none ${
                        draggedIndex === idx ? "opacity-40 bg-zinc-800" : ""
                      }`}
                    >
                      <td className="py-4 px-6 text-center">
                        <GripVertical className="w-4 h-4 text-gray-500 cursor-move inline-block" />
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-brand-cyan shrink-0" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-400 max-w-xs truncate">{c.description || "-"}</td>
                      <td className="py-4 px-6 text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(c)}
                            className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-gray-300 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(c.id)}
                            className="p-2 rounded-lg border border-white/5 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                            title="Delete Category"
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
        title="Delete Category?"
        description="WARNING: Deleting this category will cascade delete all associated test cases, defined test field configurations, UAT test runs, and answers execution logs. This action cannot be undone."
        confirmText="Delete permanently"
        variant="destructive"
      />
    </main>
  )
}
