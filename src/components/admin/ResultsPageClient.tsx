"use client"

import * as React from "react"
import Link from "next/link"
import { Users, Clock, CheckCircle2, BarChart3, ChevronUp, ChevronDown, ArrowRight } from "lucide-react"

interface Tester {
  id: string
  name: string
  email: string
}

interface TestCase {
  id: string
  title: string
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
  testCase: TestCase
  passFailSummary: PassFailSummary
}

type SortField = "testerName" | "testCaseTitle" | "status" | "submittedAt"
type SortOrder = "asc" | "desc"

interface ResultsPageClientProps {
  initialRuns: RunItem[]
}

export function ResultsPageClient({ initialRuns }: ResultsPageClientProps) {
  const [runs, setRuns] = React.useState<RunItem[]>(initialRuns)
  const [sortField, setSortField] = React.useState<SortField>("submittedAt")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

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

    // 2. Search query (by tester name/email or scenario title)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.tester.name?.toLowerCase().includes(q) ||
          r.tester.email?.toLowerCase().includes(q) ||
          r.testCase.title?.toLowerCase().includes(q)
      )
    }

    // 3. Sorting
    result.sort((a, b) => {
      let aVal: string | number = ""
      let bVal: string | number = ""

      if (sortField === "testerName") {
        aVal = a.tester.name || ""
        bVal = b.tester.name || ""
      } else if (sortField === "testCaseTitle") {
        aVal = a.testCase.title || ""
        bVal = b.testCase.title || ""
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Run Results</h1>
        <p className="text-gray-400 mt-2">Comprehensive logs of all UAT test runs and executions.</p>
      </div>

      {/* Summary stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Runs</p>
            <p className="text-3xl font-extrabold">{totalRuns}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 text-gray-400 border border-white/5">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Submitted</p>
            <p className="text-3xl font-extrabold">{submittedRuns}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Passed Runs</p>
            <p className="text-3xl font-extrabold">{passedRuns}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Pass Rate</p>
            <p className="text-3xl font-extrabold">{passRate}%</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-cyan/15 text-brand-cyan border border-brand-teal/20">
            <BarChart3 className="w-6 h-6" />
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
            placeholder="Search by tester or scenario title..."
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
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Runs Table */}
      <div className="border border-white/5 bg-zinc-900/40 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01] select-none">
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("testCaseTitle")}
                >
                  <span>Scenario Title</span>
                  <SortIcon field="testCaseTitle" />
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("testerName")}
                >
                  <span>Tester</span>
                  <SortIcon field="testerName" />
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <span>Status</span>
                  <SortIcon field="status" />
                </th>
                <th className="py-3 px-4">Pass/Fail Summary</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("submittedAt")}
                >
                  <span>Submitted Date</span>
                  <SortIcon field="submittedAt" />
                </th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {processedRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-medium">
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
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white max-w-xs truncate">{r.testCase.title}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{r.tester.name || "Tester"}</div>
                        <div className="text-[9px] text-gray-500 font-mono mt-0.5">{r.tester.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
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
                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold font-mono text-[9px] text-brand-cyan">
                              {passed}/{total} Passed
                            </span>
                            {f > 0 && (
                              <span className="font-bold font-mono text-[9px] text-rose-400 ml-2">
                                {f} Failed
                              </span>
                            )}
                            {b > 0 && (
                              <span className="font-bold font-mono text-[9px] text-amber-400 ml-2">
                                {b} Blocked
                              </span>
                            )}
                            {n > 0 && (
                              <span className="font-bold font-mono text-[9px] text-blue-400 ml-2">
                                {n} N/A
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                f > 0
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
                      <td className="py-3 px-4 text-gray-400 font-mono">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "Not submitted yet"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/test-cases/${r.testCase.id}/results/${r.id}`}
                          className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-cyan hover:text-brand-cyan/95 hover:underline"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
    </main>
  )
}
