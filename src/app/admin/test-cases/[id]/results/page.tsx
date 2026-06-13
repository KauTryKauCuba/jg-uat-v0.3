"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, PlayCircle, AlertCircle, CheckCircle2, ChevronUp, ChevronDown, BarChart3, Clock, Users } from "lucide-react"

interface Tester {
  id: string
  name: string
  email: string
}

interface PassFailSummary {
  total: number
  passed: number
  failed: number
  blocked?: number
  na?: number
  unanswered: number
}

interface RunItem {
  id: string
  status: string
  submittedAt: string | null
  createdAt: string
  tester: Tester
  answerCount: number
  passFailSummary: PassFailSummary
}

type SortField = "testerName" | "status" | "submittedAt"
type SortOrder = "asc" | "desc"

export default function TestResultsPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const testCaseId = params.id

  const [runs, setRuns] = React.useState<RunItem[]>([])
  const [testCaseTitle, setTestCaseTitle] = React.useState("UAT Scenario Results")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Sorting state
  const [sortField, setSortField] = React.useState<SortField>("submittedAt")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc")

  // Filter state
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  const fetchResults = React.useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch runs list
      const runsRes = await fetch(`/api/test-cases/${testCaseId}/runs`)
      const runsJson = await runsRes.json()

      // Fetch test case metadata to display title
      const caseRes = await fetch(`/api/test-cases`)
      const caseJson = await caseRes.json()

      if (runsJson.error) {
        setError(runsJson.error)
      } else {
        setRuns(runsJson.data || [])
        
        if (caseJson.data) {
          const currentCase = caseJson.data.find((c: { id: string; title: string }) => c.id === testCaseId)
          if (currentCase) {
            setTestCaseTitle(currentCase.title)
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load run logs.")
    } finally {
      setLoading(false)
    }
  }, [testCaseId])

  React.useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  // Filter & sort runs
  const processedRuns = React.useMemo(() => {
    let result = [...runs]

    // 1. Status Filter
    if (statusFilter !== "ALL") {
      result = result.filter((r) => {
        if (statusFilter === "SUBMITTED") return r.status === "SUBMITTED" || r.status === "PASSED" || r.status === "FAILED"
        return r.status === statusFilter
      })
    }

    // 2. Search query (by tester name or email)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.tester.name?.toLowerCase().includes(q) ||
          r.tester.email?.toLowerCase().includes(q)
      )
    }

    // 3. Sorting
    result.sort((a, b) => {
      let aVal: string | number = ""
      let bVal: string | number = ""

      if (sortField === "testerName") {
        aVal = a.tester.name || ""
        bVal = b.tester.name || ""
      } else if (sortField === "status") {
        aVal = a.status
        bVal = b.status
      } else if (sortField === "submittedAt") {
        aVal = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
        bVal = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [runs, statusFilter, searchQuery, sortField, sortOrder])

  // Calculation of stats headers
  const totalRuns = runs.length
  const submittedRuns = runs.filter((r) => r.status !== "PENDING").length
  const passedRuns = runs.filter((r) => r.status === "PASSED").length
  const failedRuns = runs.filter((r) => r.status === "FAILED").length
  const inProgressRuns = runs.filter((r) => r.status === "PENDING").length

  let totalPassed = 0
  let totalDenom = 0
  runs.forEach((r) => {
    if (r.status !== "PENDING") {
      const p = r.passFailSummary.passed || 0
      const f = r.passFailSummary.failed || 0
      const b = r.passFailSummary.blocked || 0
      const n = r.passFailSummary.na || 0
      totalPassed += p
      totalDenom += (p + f + b + n)
    }
  })

  const passRate = totalDenom > 0 ? Math.round((totalPassed / totalDenom) * 100) : 0

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 ml-1 inline-block" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 inline-block" />
    )
  }

  return (
    <main className="p-8 space-y-8 flex-1">
      {/* Back Link */}
      <div className="flex items-center space-x-2">
        <Link href="/admin/test-cases" className="text-gray-400 hover:text-white flex items-center space-x-1.5 transition-colors text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Test Cases</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{testCaseTitle}</h1>
        <p className="text-gray-400 mt-2">Historical execution dashboard and answers verification logs.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Analyzing run histories...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 border border-red-500/20 bg-red-500/10 rounded-2xl">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-white/5 bg-zinc-900/40 p-5 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Runs</p>
                <p className="text-2xl font-extrabold">{totalRuns}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 text-gray-400 border border-white/5">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="border border-white/5 bg-zinc-900/40 p-5 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Submitted</p>
                <p className="text-2xl font-extrabold">{submittedRuns}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="border border-white/5 bg-zinc-900/40 p-5 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Passed Runs</p>
                <p className="text-2xl font-extrabold">{passedRuns}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="border border-white/5 bg-zinc-900/40 p-5 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Pass Rate</p>
                <p className="text-2xl font-extrabold">{passRate}%</p>
              </div>
              <div className="p-2.5 rounded-lg bg-brand-cyan/15 text-brand-cyan border border-brand-teal/20">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className="border border-white/5 bg-zinc-900/40 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="w-full md:w-96">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tester by name or email..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan/50 placeholder-gray-500"
              />
            </div>
            <div className="flex space-x-2 w-full md:w-auto overflow-x-auto">
              {["ALL", "PENDING", "SUBMITTED", "PASSED", "FAILED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-brand-cyan border-brand-cyan text-white shadow-md shadow-brand-cyan/15"
                      : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {status === "ALL" ? "All Runs" : status === "PENDING" ? "In Progress" : status}
                </button>
              ))}
            </div>
          </div>

          {/* Runs Table */}
          <div className="border border-white/5 bg-zinc-900/40 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01] select-none">
                    <th
                      className="py-4 px-6 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("testerName")}
                    >
                      <span>Tester</span>
                      <SortIcon field="testerName" />
                    </th>
                    <th
                      className="py-4 px-6 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      <span>Status</span>
                      <SortIcon field="status" />
                    </th>
                    <th className="py-4 px-6">Pass/Fail Summary</th>
                    <th
                      className="py-4 px-6 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("submittedAt")}
                    >
                      <span>Submitted Date</span>
                      <SortIcon field="submittedAt" />
                    </th>
                    <th className="py-4 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {processedRuns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">
                        No UAT test runs matches the active filters.
                      </td>
                    </tr>
                  ) : (
                    processedRuns.map((r) => {
                      const total = r.passFailSummary.total
                      const passed = r.passFailSummary.passed
                      const f = r.passFailSummary.failed || 0
                      const b = r.passFailSummary.blocked || 0
                      const n = r.passFailSummary.na || 0
                      const denom = passed + f + b + n
                      const percent = denom > 0 ? Math.round((passed / denom) * 100) : 0

                      return (
                        <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-white">{r.tester.name || "Tester"}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">{r.tester.email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === "PASSED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : r.status === "FAILED"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : r.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}>
                              {r.status === "PENDING" ? "In Progress" : r.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 max-w-xs">
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold font-mono text-[10px] text-brand-cyan">
                                  {passed}/{total} Passed
                                </span>
                                {r.passFailSummary.failed > 0 && (
                                  <span className="font-bold font-mono text-[10px] text-rose-400 ml-2">
                                    {r.passFailSummary.failed} Failed
                                  </span>
                                )}
                              </div>
                              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    r.passFailSummary.failed > 0
                                      ? "bg-rose-500"
                                      : r.status === "PASSED"
                                      ? "bg-emerald-500"
                                      : "bg-brand-cyan"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-400 text-xs font-mono">
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "Not submitted yet"}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Link
                              href={`/admin/test-cases/${testCaseId}/results/${r.id}`}
                              className="text-xs font-bold text-brand-cyan hover:underline"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
