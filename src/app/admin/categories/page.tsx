"use client"

import * as React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Folder, GripVertical, Edit2, Trash2, X, Save, Loader2, Lock, Unlock } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface Category {
  id: string
  name: string
  description: string | null
  targetGroup: string
  createdAt: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [targetGroups, setTargetGroups] = React.useState<{ id: string; name: string; displayName: string; locked: boolean }[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Tab Selection
  const [activeTab, setActiveTab] = React.useState<string>("JOBSEEKER_WEB")

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [draggedGroupIndex, setDraggedGroupIndex] = React.useState<number | null>(null)

  // Form & Editing states
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [targetGroup, setTargetGroup] = React.useState<string>("JOBSEEKER_WEB")
  const [submitting, setSubmitting] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)

  // Target Groups Modal & Form States
  const [isManageGroupsOpen, setIsManageGroupsOpen] = React.useState(false)
  const [groupName, setGroupName] = React.useState("")
  const [groupDisplayName, setGroupDisplayName] = React.useState("")
  const [editingGroup, setEditingGroup] = React.useState<{ id: string; name: string; displayName: string } | null>(null)
  const [savingGroup, setSavingGroup] = React.useState(false)

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

  const fetchTargetGroups = async () => {
    try {
      const res = await fetch("/api/target-groups")
      const json = await res.json()
      if (json.data) {
        setTargetGroups(json.data)
        if (json.data.length > 0) {
          const exists = json.data.some((g: any) => g.name === activeTab)
          if (!exists) {
            setActiveTab(json.data[0].name)
          }
        }
      }
    } catch (err) {
      console.error("Failed to load target groups", err)
    }
  }

  React.useEffect(() => {
    fetchCategories()
    fetchTargetGroups()
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

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName || !groupDisplayName) return
    setSavingGroup(true)
    try {
      if (editingGroup) {
        const res = await fetch(`/api/target-groups/${editingGroup.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: groupName, displayName: groupDisplayName }),
        })
        const json = await res.json()
        if (json.error) {
          alert(json.error)
        } else {
          setTargetGroups(targetGroups.map(g => g.id === editingGroup.id ? json.data : g))
          setEditingGroup(null)
          setGroupName("")
          setGroupDisplayName("")
        }
      } else {
        const res = await fetch("/api/target-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: groupName, displayName: groupDisplayName }),
        })
        const json = await res.json()
        if (json.error) {
          alert(json.error)
        } else {
          setTargetGroups([...targetGroups, json.data])
          setGroupName("")
          setGroupDisplayName("")
        }
      }
    } catch {
      alert("Failed to save target group")
    } finally {
      setSavingGroup(false)
    }
  }

  const handleDeleteGroup = async (groupId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" target group? This will not delete categories automatically, but any categories assigned to it will no longer display under this group.`)) return
    try {
      const res = await fetch(`/api/target-groups/${groupId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setTargetGroups(targetGroups.filter(g => g.id !== groupId))
        if (activeTab === name) {
          const remaining = targetGroups.filter(g => g.id !== groupId)
          if (remaining.length > 0) {
            setActiveTab(remaining[0].name)
          }
        }
      }
    } catch {
      alert("Failed to delete target group")
    }
  }

  const handleGroupDragStart = (index: number) => {
    setDraggedGroupIndex(index)
  }

  const handleGroupDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedGroupIndex === null || draggedGroupIndex === index) return

    const reorderedGroups = [...targetGroups]
    const draggedItem = reorderedGroups[draggedGroupIndex]
    reorderedGroups.splice(draggedGroupIndex, 1)
    reorderedGroups.splice(index, 0, draggedItem)

    setTargetGroups(reorderedGroups)
    setDraggedGroupIndex(index)
  }

  const handleGroupDragEnd = async () => {
    setDraggedGroupIndex(null)
    try {
      const groupIds = targetGroups.map((g) => g.id)
      const res = await fetch("/api/target-groups/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
        fetchTargetGroups()
      }
    } catch (err) {
      alert("Failed to save target group order.")
      fetchTargetGroups()
    }
  }

  const handleToggleGroupLock = async (groupId: string, currentLocked: boolean) => {
    try {
      const res = await fetch(`/api/target-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: !currentLocked }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setTargetGroups(prev =>
          prev.map(g => (g.id === groupId ? { ...g, locked: !currentLocked } : g))
        )
      }
    } catch {
      alert("Failed to toggle target group lock status")
    }
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
    <main className="p-8 space-y-6 flex-1 bg-zinc-950/20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Case Categories</h1>
        <p className="text-gray-400 mt-2">Create and organize categories before building test cases. Drag items to reorder.</p>
      </div>

      {/* Tabs Header with Manage Target Groups Trigger */}
      <div className="flex border-b border-white/5 justify-between items-center w-full">
        <div className="flex space-x-4 overflow-x-auto pb-0.5 scrollbar-none">
          {targetGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveTab(g.name)}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === g.name
                  ? "border-brand-cyan text-brand-cyan"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {g.displayName} Categories
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsManageGroupsOpen(true)}
          className="pb-3 text-xs font-bold text-brand-cyan hover:text-brand-cyan/85 transition-colors cursor-pointer select-none"
        >
          Manage UAT Groups
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
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
              >
                {targetGroups.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.displayName}
                  </option>
                ))}
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
            {targetGroups.find((g) => g.name === activeTab)?.displayName || "Group"} Categories List
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
              No categories created yet for {targetGroups.find((g) => g.name === activeTab)?.displayName || "this group"}. Add one using the form on the left.
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

      {/* Target Groups Manager Modal */}
      {isManageGroupsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl border border-white/10 bg-zinc-950 rounded-2xl p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsManageGroupsOpen(false);
                setEditingGroup(null);
                setGroupName("");
                setGroupDisplayName("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-xl font-bold text-white">Manage UAT Target Groups</h3>
              <p className="text-xs text-gray-400 mt-1">Add, edit, or delete UAT target groups. Active groups dictate category/test filters.</p>
            </div>

            {/* List existing groups */}
            <div className="border border-white/5 rounded-xl bg-black/20 p-4 max-h-60 overflow-y-auto space-y-2">
              {targetGroups.map((g, index) => (
                <div
                  key={g.id}
                  draggable
                  onDragStart={() => handleGroupDragStart(index)}
                  onDragOver={(e) => handleGroupDragOver(e, index)}
                  onDragEnd={handleGroupDragEnd}
                  className={`flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-zinc-900/40 text-xs cursor-grab active:cursor-grabbing select-none transition-colors ${
                    draggedGroupIndex === index ? "opacity-40 bg-zinc-800" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <GripVertical className="w-3.5 h-3.5 text-gray-500 cursor-move" />
                    <div>
                      <span className="font-semibold text-white">{g.displayName}</span>
                      <span className="text-[10px] font-mono text-gray-500 ml-2">({g.name})</span>
                    </div>
                  </div>
                  <div className="flex space-x-1 items-center">
                    <button
                      type="button"
                      onClick={() => handleToggleGroupLock(g.id, !!g.locked)}
                      className={`p-1 rounded border border-transparent transition-colors cursor-pointer ${
                        g.locked ? "text-red-500 hover:bg-red-500/10" : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                      title={g.locked ? "Unlock Group" : "Lock Group"}
                    >
                      {g.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGroup(g);
                        setGroupName(g.name);
                        setGroupDisplayName(g.displayName);
                      }}
                      className="p-1 text-brand-cyan hover:bg-brand-cyan/10 rounded border border-transparent transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(g.id, g.name)}
                      className="p-1 text-red-500 hover:bg-red-500/10 rounded border border-transparent transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Edit group form */}
            <form onSubmit={handleSaveGroup} className="border-t border-white/5 pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-brand-cyan">
                {editingGroup ? "Edit Target Group" : "Create New Target Group"}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">System Name *</label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                    placeholder="e.g. AGENCY"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={groupDisplayName}
                    onChange={(e) => setGroupDisplayName(e.target.value)}
                    placeholder="e.g. Agency Profile"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2 justify-end">
                {editingGroup && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroup(null);
                      setGroupName("");
                      setGroupDisplayName("");
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingGroup || !groupName || !groupDisplayName}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-cyan hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-brand-cyan/10 flex items-center justify-center space-x-1.5"
                >
                  {savingGroup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{editingGroup ? "Save Changes" : "Create Group"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
