"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Edit2, BarChart2, Trash2, Folder, GripVertical, Search, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface TestCase {
  id: string
  title: string
  description: string | null
  pdfUrl: string | null
  categoryId: string | null
  fieldsCount: number
  runsCount: number
  passRate: number
  timer: number | null
  hidden: boolean
  createdAt: string
}

interface Category {
  id: string
  name: string
  targetGroup: "JOBSEEKER" | "EMPLOYER"
}

export default function TestCasesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [cases, setCases] = React.useState<TestCase[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Tab Selection: JOBSEEKER or EMPLOYER
  const [activeTab, setActiveTab] = React.useState<"JOBSEEKER" | "EMPLOYER">("JOBSEEKER")
  
  // Title Search state
  const [searchQuery, setSearchQuery] = React.useState("")

  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    const saved = localStorage.getItem("jg-admin-collapsed-categories")
    if (saved) {
      try {
        setCollapsedCategories(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const updated = {
        ...prev,
        [categoryId]: !prev[categoryId],
      }
      localStorage.setItem("jg-admin-collapsed-categories", JSON.stringify(updated))
      return updated
    })
  }

  const isAllCollapsed = React.useMemo(() => {
    const activeCats = categories.filter((cat) => cat.targetGroup === activeTab)
    if (activeCats.length === 0) return false
    return activeCats.every((cat) => !!collapsedCategories[cat.id])
  }, [categories, activeTab, collapsedCategories])

  const toggleCollapseAll = () => {
    const activeCats = categories.filter((cat) => cat.targetGroup === activeTab)
    if (isAllCollapsed) {
      setCollapsedCategories({})
      localStorage.setItem("jg-admin-collapsed-categories", JSON.stringify({}))
    } else {
      const collapsed: Record<string, boolean> = {}
      activeCats.forEach((cat) => {
        collapsed[cat.id] = true
      })
      setCollapsedCategories(collapsed)
      localStorage.setItem("jg-admin-collapsed-categories", JSON.stringify(collapsed))
    }
  }

  // Modal states
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

  // Drag and drop states
  const [draggedCaseId, setDraggedCaseId] = React.useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [casesRes, catsRes] = await Promise.all([
        fetch("/api/test-cases"),
        fetch("/api/categories")
      ])
      const casesJson = await casesRes.json()
      const catsJson = await catsRes.json()
      
      if (casesJson.error) {
        setError(casesJson.error)
      } else if (catsJson.error) {
        setError(catsJson.error)
      } else {
        setCases(casesJson.data)
        setCategories(catsJson.data)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async () => {
    if (!selectedCaseId) return
    try {
      const res = await fetch(`/api/test-cases/${selectedCaseId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setCases(cases.filter((c) => c.id !== selectedCaseId))
      }
    } catch (err: any) {
      alert("Failed to delete test case")
    }
  }

  const handleToggleVisibility = async (caseId: string, currentHidden: boolean) => {
    try {
      const res = await fetch(`/api/test-cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !currentHidden }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setCases((prev) =>
          prev.map((c) => (c.id === caseId ? { ...c, hidden: !currentHidden } : c))
        )
      }
    } catch {
      alert("Failed to update test case visibility")
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (caseId: string) => {
    setDraggedCaseId(caseId)
  }

  const handleDragOver = (e: React.DragEvent, targetCaseId: string, categoryId: string | null) => {
    e.preventDefault()
    if (!draggedCaseId || draggedCaseId === targetCaseId) return

    const draggedIdx = cases.findIndex((c) => c.id === draggedCaseId)
    const targetIdx = cases.findIndex((c) => c.id === targetCaseId)

    if (draggedIdx === -1 || targetIdx === -1) return
    
    // Ensure they belong to the same category to prevent shifting across categories
    if (cases[draggedIdx].categoryId !== categoryId) return

    const reordered = [...cases]
    const draggedItem = reordered[draggedIdx]
    reordered.splice(draggedIdx, 1)
    reordered.splice(targetIdx, 0, draggedItem)
    setCases(reordered)
  }

  const handleDragEnd = async () => {
    setDraggedCaseId(null)
    try {
      const testCaseIds = cases.map((c) => c.id)
      const res = await fetch("/api/test-cases/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testCaseIds }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      }
    } catch (err) {
      console.error("Failed to save test case order:", err)
    }
  }

  // Filter categories by activeTab
  const filteredCategories = categories.filter((cat) => cat.targetGroup === activeTab)

  // Filter cases by search query
  const getFilteredCasesForCategory = (categoryId: string | null) => {
    return cases.filter((c) => {
      const matchesCategory = c.categoryId === categoryId
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }

  const uncategorizedCases = getFilteredCasesForCategory(null).filter(() => activeTab === "JOBSEEKER")
  const uncategorizedDuration = uncategorizedCases.reduce((sum, c) => sum + (c.timer || 0), 0)

  return (
    <main className="p-8 space-y-6 flex-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Cases</h1>
          <p className="text-gray-400 mt-2">Manage dynamic test fields and check run results grouped by category. Drag items to reorder.</p>
        </div>
        <Link
          href="/admin/test-cases/new"
          className="flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-teal to-brand-cyan text-white hover:opacity-90 transition-all shadow-md shadow-brand-teal/10 w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Test Case</span>
        </Link>
      </div>

      {/* Search bar & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-1">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("JOBSEEKER")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "JOBSEEKER"
                ? "border-brand-cyan text-brand-cyan"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Jobseeker Test Cases
          </button>
          <button
            onClick={() => setActiveTab("EMPLOYER")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "EMPLOYER"
                ? "border-brand-cyan text-brand-cyan"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Employer Test Cases
          </button>
        </div>

        {/* Client side search input & collapse controls */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto pb-3 md:pb-0">
          <button
            onClick={toggleCollapseAll}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 transition-all cursor-pointer whitespace-nowrap select-none"
          >
            {isAllCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                <span>Expand All</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <span>Collapse All</span>
              </>
            )}
          </button>

          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search test cases by title..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/40 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan/50 placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 border border-red-500/20 bg-red-500/10 rounded-2xl">
          {error}
        </div>
      ) : filteredCategories.length === 0 && uncategorizedCases.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl space-y-3">
          <p className="text-gray-400 font-semibold">No test cases found for {activeTab === "JOBSEEKER" ? "Jobseekers" : "Employers"}</p>
          <p className="text-xs text-gray-600 max-w-xs mx-auto">Try checking your search query or add a new scenario description.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredCategories.map((cat) => {
            const catCases = getFilteredCasesForCategory(cat.id)
            if (catCases.length === 0 && searchQuery !== "") return null;
            const isCollapsed = !!collapsedCategories[cat.id]
            const totalDuration = catCases.reduce((sum, c) => sum + (c.timer || 0), 0)

            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <button
                    onClick={() => toggleCategoryCollapse(cat.id)}
                    className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    )}
                    <Folder className="w-5 h-5 text-brand-cyan" />
                    <h2 className="text-xl font-bold text-white group-hover:text-brand-cyan transition-colors">{cat.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-mono">
                      {catCases.length} {catCases.length === 1 ? "case" : "cases"}
                    </span>
                    {totalDuration > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-cyan font-mono font-semibold" title="Total Category Duration">
                        {totalDuration} min
                      </span>
                    )}
                  </button>
                  <Link
                    href={`/admin/test-cases/new?categoryId=${cat.id}`}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-cyan/10 hover:bg-brand-cyan/15 border border-brand-cyan/20 text-brand-cyan transition-all cursor-pointer select-none"
                    title="Add Test Case to this category"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Case</span>
                  </Link>
                </div>

                {!isCollapsed && (
                  catCases.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4 pl-8">No matching test cases in this category.</p>
                  ) : (
                    <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md rounded-2xl overflow-hidden ml-0 md:ml-8">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01]">
                            <th className="py-4 px-6 w-12 text-center"></th>
                            <th className="py-4 px-6">Title</th>
                            <th className="py-4 px-6 w-40">Test Runs</th>
                            <th className="py-4 px-6 w-36">Pass Rate</th>
                            <th className="py-4 px-6 w-44">Created At</th>
                            <th className="py-4 px-6 w-36 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catCases.map((c) => (
                            <tr
                              key={c.id}
                              draggable
                              onDragStart={() => handleDragStart(c.id)}
                              onDragOver={(e) => handleDragOver(e, c.id, cat.id)}
                              onDragEnd={handleDragEnd}
                              className={`border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing select-none ${
                                draggedCaseId === c.id ? "opacity-40 bg-zinc-800" : ""
                              }`}
                            >
                              <td className="py-4 px-6 w-12 text-center">
                                <GripVertical className="w-4 h-4 text-gray-500 cursor-move inline-block" />
                              </td>
                              <td className={`py-4 px-6 font-semibold max-w-sm truncate ${c.hidden ? "text-gray-500" : "text-white"}`}>
                                {c.title} {c.hidden && <span className="text-[10px] font-normal text-gray-500 ml-1.5 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">Hidden</span>}
                              </td>
                              <td className="py-4 px-6 w-40 text-gray-400">{c.runsCount} runs</td>
                              <td className="py-4 px-6 w-36">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                                  c.runsCount === 0
                                    ? "bg-gray-500/10 text-gray-400"
                                    : c.passRate >= 80
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : c.passRate >= 50
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-rose-500/10 text-rose-400"
                                }`}>
                                  {c.runsCount > 0 ? `${c.passRate}%` : "-"}
                                </span>
                              </td>
                              <td className="py-4 px-6 w-44 text-gray-500">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVisibility(c.id, c.hidden)}
                                    className={`p-2 rounded-lg border border-white/5 transition-colors cursor-pointer ${
                                      c.hidden
                                        ? "text-gray-500 hover:text-white hover:bg-white/5"
                                        : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    }`}
                                    title={c.hidden ? "Show to Tester" : "Hide from Tester"}
                                  >
                                    {c.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <Link
                                    href={`/admin/test-cases/${c.id}/edit`}
                                    className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-gray-300 transition-colors"
                                    title="Edit Test Case"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Link>
                                  <Link
                                    href={`/admin/test-cases/${c.id}/results`}
                                    className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-brand-cyan transition-colors"
                                    title="View Run Results"
                                  >
                                    <BarChart2 className="w-4 h-4" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCaseId(c.id)
                                      setIsDeleteOpen(true)
                                    }}
                                    className="p-2 rounded-lg border border-white/5 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                                    title="Delete Test Case"
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
                  )
                )}
              </div>
            )
          })}

          {uncategorizedCases.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-2 border-b border-white/5">
                <Folder className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-bold text-gray-400">Uncategorized</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-mono">
                  {uncategorizedCases.length} {uncategorizedCases.length === 1 ? "case" : "cases"}
                </span>
                {uncategorizedDuration > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-mono font-semibold" title="Total Category Duration">
                    {uncategorizedDuration} min
                  </span>
                )}
              </div>

              <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md rounded-2xl overflow-hidden ml-0 md:ml-8">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01]">
                      <th className="py-4 px-6 w-12 text-center"></th>
                      <th className="py-4 px-6">Title</th>
                      <th className="py-4 px-6 w-40">Test Runs</th>
                      <th className="py-4 px-6 w-36">Pass Rate</th>
                      <th className="py-4 px-6 w-44">Created At</th>
                      <th className="py-4 px-6 w-36 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uncategorizedCases.map((c) => (
                      <tr
                        key={c.id}
                        draggable
                        onDragStart={() => handleDragStart(c.id)}
                        onDragOver={(e) => handleDragOver(e, c.id, null)}
                        onDragEnd={handleDragEnd}
                        className={`border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing select-none ${
                          draggedCaseId === c.id ? "opacity-40 bg-zinc-800" : ""
                        }`}
                      >
                        <td className="py-4 px-6 w-12 text-center">
                          <GripVertical className="w-4 h-4 text-gray-500 cursor-move inline-block" />
                        </td>
                        <td className={`py-4 px-6 font-semibold max-w-sm truncate ${c.hidden ? "text-gray-500" : "text-white"}`}>
                          {c.title} {c.hidden && <span className="text-[10px] font-normal text-gray-500 ml-1.5 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">Hidden</span>}
                        </td>
                        <td className="py-4 px-6 w-40 text-gray-400">{c.runsCount} runs</td>
                        <td className="py-4 px-6 w-36">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                            c.runsCount === 0
                              ? "bg-gray-500/10 text-gray-400"
                              : c.passRate >= 80
                              ? "bg-emerald-500/10 text-emerald-400"
                              : c.passRate >= 50
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {c.runsCount > 0 ? `${c.passRate}%` : "-"}
                          </span>
                        </td>
                        <td className="py-4 px-6 w-44 text-gray-500">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(c.id, c.hidden)}
                              className={`p-2 rounded-lg border border-white/5 transition-colors cursor-pointer ${
                                c.hidden
                                  ? "text-gray-500 hover:text-white hover:bg-white/5"
                                  : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              }`}
                              title={c.hidden ? "Show to Tester" : "Hide from Tester"}
                            >
                              {c.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <Link
                              href={`/admin/test-cases/${c.id}/edit`}
                              className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-gray-300 transition-colors"
                              title="Edit Test Case"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/test-cases/${c.id}/results`}
                              className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-brand-cyan transition-colors"
                              title="View Run Results"
                            >
                              <BarChart2 className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCaseId(c.id)
                                setIsDeleteOpen(true)
                              }}
                              className="p-2 rounded-lg border border-white/5 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                              title="Delete Test Case"
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
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedCaseId(null)
        }}
        onConfirm={handleDelete}
        title="Delete Test Case?"
        description="This will permanently delete this testcase, all its defined dynamic field configurations, and all UAT test runs and execution logs. This action cannot be undone."
        confirmText="Delete permanently"
        variant="destructive"
      />
    </main>
  )
}
