"use client"

import * as React from "react"
import Link from "next/link"
import { Users, Clock, CheckCircle2, BarChart3, ChevronUp, ChevronDown, ArrowRight, Star, FileText, X, History, MessageSquare } from "lucide-react"

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

interface FeedbackAuditLog {
  id: string
  previousData: any
  createdAt: string
}

interface FeedbackItem {
  id: string
  ratingOverall: number
  ratingEaseOfUse: number
  ratingInstructions: number
  ratingResultForm: number
  impressiveAspects: string | null
  improvementAreas: string | null
  otherFeedback: string | null
  uatSessionStart: string | null
  createdAt: string
  updatedAt: string
  testerId: string
  testerName: string | null
  testerEmail: string | null
  testerRole: string | null
  organisationName: string | null
  auditLogs: FeedbackAuditLog[]
}

interface SignOffAuditLog {
  id: string
  previousData: any
  createdAt: string
}

interface SignOffItem {
  id: string
  designation: string
  createdAt: string
  updatedAt: string
  testerId: string
  testerName: string | null
  testerEmail: string | null
  testerRole: string | null
  organisationName: string | null
  auditLogs: SignOffAuditLog[]
}

type SortField = "testerName" | "testCaseTitle" | "status" | "submittedAt"
type SortOrder = "asc" | "desc"

interface SortIconProps {
  field: SortField
  sortField: SortField
  sortOrder: SortOrder
}

const SortIcon = ({ field, sortField, sortOrder }: SortIconProps) => {
  if (sortField !== field) return null
  return sortOrder === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 ml-1 inline-block" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 ml-1 inline-block" />
  )
}

interface ResultsPageClientProps {
  initialRuns: RunItem[]
  initialFeedbacks: FeedbackItem[]
  initialSignOffs: SignOffItem[]
}

const AdminRatingStars = ({ score }: { score: number }) => {
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= score ? "fill-amber-400 text-amber-400" : "text-zinc-700"
          }`}
        />
      ))}
    </div>
  )
}

const AdminRatingStarsLarge = ({ score }: { score: number }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= score ? "fill-amber-400 text-amber-400" : "text-zinc-700"
          }`}
        />
      ))}
    </div>
  )
}

export function ResultsPageClient({ initialRuns, initialFeedbacks, initialSignOffs }: ResultsPageClientProps) {
  const [runs, setRuns] = React.useState<RunItem[]>(initialRuns)
  const [feedbacks, setFeedbacks] = React.useState<FeedbackItem[]>(initialFeedbacks || [])
  const [signOffs, setSignOffs] = React.useState<SignOffItem[]>(initialSignOffs || [])
  const [activeTab, setActiveTab] = React.useState<"RUNS" | "FEEDBACK" | "SIGNOFF">("RUNS")
  const [selectedFeedback, setSelectedFeedback] = React.useState<FeedbackItem | null>(null)
  const [selectedSignOff, setSelectedSignOff] = React.useState<SignOffItem | null>(null)
  const [openAuditLogId, setOpenAuditLogId] = React.useState<string | null>(null)
  const [openSignOffAuditLogId, setOpenSignOffAuditLogId] = React.useState<string | null>(null)
  const [sortField, setSortField] = React.useState<SortField>("submittedAt")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const formatDateTime = (dateVal: string | null | undefined) => {
    if (!mounted || !dateVal) return ""
    return new Date(dateVal).toLocaleString()
  }

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

  // Calculation of stats headers for runs
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

  // Filter feedbacks
  const processedFeedbacks = React.useMemo(() => {
    let result = [...feedbacks]
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (f) =>
          f.testerName?.toLowerCase().includes(q) ||
          f.testerEmail?.toLowerCase().includes(q) ||
          f.organisationName?.toLowerCase().includes(q) ||
          f.testerRole?.toLowerCase().includes(q)
      )
    }
    return result
  }, [feedbacks, searchQuery])

  // Filter sign offs
  const processedSignOffs = React.useMemo(() => {
    let result = [...signOffs]
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.testerName?.toLowerCase().includes(q) ||
          s.testerEmail?.toLowerCase().includes(q) ||
          s.organisationName?.toLowerCase().includes(q) ||
          s.testerRole?.toLowerCase().includes(q) ||
          s.designation.toLowerCase().includes(q)
      )
    }
    return result
  }, [signOffs, searchQuery])

  // Calculation of stats headers for feedbacks
  const feedbackStats = React.useMemo(() => {
    if (feedbacks.length === 0) {
      return { avgOverall: 0, avgEaseOfUse: 0, avgInstructions: 0, avgResultForm: 0 }
    }
    const sumOverall = feedbacks.reduce((acc, f) => acc + f.ratingOverall, 0)
    const sumEaseOfUse = feedbacks.reduce((acc, f) => acc + f.ratingEaseOfUse, 0)
    const sumInstructions = feedbacks.reduce((acc, f) => acc + f.ratingInstructions, 0)
    const sumResultForm = feedbacks.reduce((acc, f) => acc + f.ratingResultForm, 0)
    return {
      avgOverall: Number((sumOverall / feedbacks.length).toFixed(1)),
      avgEaseOfUse: Number((sumEaseOfUse / feedbacks.length).toFixed(1)),
      avgInstructions: Number((sumInstructions / feedbacks.length).toFixed(1)),
      avgResultForm: Number((sumResultForm / feedbacks.length).toFixed(1)),
    }
  }, [feedbacks])

  return (
    <main className="p-8 space-y-8 flex-1">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UAT Run Results</h1>
          <p className="text-gray-400 mt-2">Comprehensive logs of all UAT test runs and survey submissions.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-white/5 self-start md:self-auto">
          <button
            onClick={() => {
              setActiveTab("RUNS")
              setSearchQuery("")
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "RUNS"
                ? "bg-brand-cyan text-white shadow-md shadow-brand-cyan/15"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Scenario Runs ({runs.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("FEEDBACK")
              setSearchQuery("")
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "FEEDBACK"
                ? "bg-brand-cyan text-white shadow-md shadow-brand-cyan/15"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tester Feedback ({feedbacks.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("SIGNOFF")
              setSearchQuery("")
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "SIGNOFF"
                ? "bg-brand-cyan text-white shadow-md shadow-brand-cyan/15"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>UAT Sign Offs ({signOffs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "RUNS" ? (
        <>
          {/* Summary stats bar for runs */}
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

          {/* Filters and Search Bar for runs */}
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
                  {status === "PENDING" ? "In Progress" : status}
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
                      <SortIcon field="testCaseTitle" sortField={sortField} sortOrder={sortOrder} />
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("testerName")}
                    >
                      <span>Tester</span>
                      <SortIcon field="testerName" sortField={sortField} sortOrder={sortOrder} />
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      <span>Status</span>
                      <SortIcon field="status" sortField={sortField} sortOrder={sortOrder} />
                    </th>
                    <th className="py-3 px-4">Pass/Fail Summary</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("submittedAt")}
                    >
                      <span>Submitted Date</span>
                      <SortIcon field="submittedAt" sortField={sortField} sortOrder={sortOrder} />
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
                            {r.submittedAt ? formatDateTime(r.submittedAt) : "Not submitted yet"}
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
        </>
      ) : activeTab === "FEEDBACK" ? (
        <>
          {/* Summary stats bar for tester feedbacks */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Avg Overall Rating</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold">{feedbackStats.avgOverall}</span>
                <span className="text-xs text-gray-500">/ 5.0</span>
              </div>
              <div className="mt-2">
                <AdminRatingStars score={Math.round(feedbackStats.avgOverall)} />
              </div>
            </div>

            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Avg Ease of Use</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold">{feedbackStats.avgEaseOfUse}</span>
                <span className="text-xs text-gray-500">/ 5.0</span>
              </div>
              <div className="mt-2">
                <AdminRatingStars score={Math.round(feedbackStats.avgEaseOfUse)} />
              </div>
            </div>

            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Avg Inst. Clarity</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold">{feedbackStats.avgInstructions}</span>
                <span className="text-xs text-gray-500">/ 5.0</span>
              </div>
              <div className="mt-2">
                <AdminRatingStars score={Math.round(feedbackStats.avgInstructions)} />
              </div>
            </div>

            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Avg Result Form Ease</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold">{feedbackStats.avgResultForm}</span>
                <span className="text-xs text-gray-500">/ 5.0</span>
              </div>
              <div className="mt-2">
                <AdminRatingStars score={Math.round(feedbackStats.avgResultForm)} />
              </div>
            </div>
          </div>

          {/* Search Bar for feedbacks */}
          <div className="border border-white/5 bg-zinc-900/40 p-4 rounded-2xl flex gap-4 items-center">
            <div className="w-full md:w-96">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feedbacks by tester, organization, role..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan/50 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Feedbacks Table */}
          <div className="border border-white/5 bg-zinc-900/40 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01] select-none">
                    <th className="py-3 px-4">Tester</th>
                    <th className="py-3 px-4">Organisation</th>
                    <th className="py-3 px-4">Testing Role</th>
                    <th className="py-3 px-4">Overall Rating</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {processedFeedbacks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 font-medium">
                        No UAT survey feedbacks matching your query.
                      </td>
                    </tr>
                  ) : (
                    processedFeedbacks.map((fb) => (
                      <tr key={fb.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{fb.testerName || "Tester"}</div>
                          <div className="text-[9px] text-gray-500 font-mono mt-0.5">{fb.testerEmail}</div>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {fb.organisationName || "-"}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {fb.testerRole || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white">{fb.ratingOverall}</span>
                            <AdminRatingStars score={fb.ratingOverall} />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-400 font-mono">
                          {formatDateTime(fb.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedFeedback(fb)
                              setOpenAuditLogId(null)
                            }}
                            className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-cyan hover:text-brand-cyan/95 hover:underline cursor-pointer bg-transparent border-0"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Search Bar for sign offs */}
          <div className="border border-white/5 bg-zinc-900/40 p-4 rounded-2xl flex gap-4 items-center">
            <div className="w-full md:w-96">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sign offs by tester, organization, role, designation..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan/50 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Sign Offs Table */}
          <div className="border border-white/5 bg-zinc-900/40 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01] select-none">
                    <th className="py-3 px-4">Tester</th>
                    <th className="py-3 px-4">Organisation</th>
                    <th className="py-3 px-4">Testing Role</th>
                    <th className="py-3 px-4">Title / Designation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {processedSignOffs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 font-medium">
                        No UAT sign offs matching your query.
                      </td>
                    </tr>
                  ) : (
                    processedSignOffs.map((so) => (
                      <tr key={so.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{so.testerName || "Tester"}</div>
                          <div className="text-[9px] text-gray-500 font-mono mt-0.5">{so.testerEmail}</div>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {so.organisationName || "-"}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {so.testerRole || "-"}
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {so.designation}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            SIGNED OFF
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 font-mono">
                          {formatDateTime(so.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSignOff(so)
                              setOpenSignOffAuditLogId(null)
                            }}
                            className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-cyan hover:text-brand-cyan/95 hover:underline cursor-pointer bg-transparent border-0"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Feedback Inspector Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col my-8 max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950/40">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-cyan" />
                  <span>UAT Survey Feedback Details</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Submitted by {selectedFeedback.testerName || selectedFeedback.testerEmail}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-1 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* Part 1: Prefilled / Session Metadata */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-cyan mb-4">UAT Session Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">1. Tester's Name</span>
                      <span className="font-semibold text-white">{selectedFeedback.testerName || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 md:border-0 md:pb-0">
                      <span className="text-gray-400">2. Tester's Organisation</span>
                      <span className="font-semibold text-white">{selectedFeedback.organisationName || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">3. Tester's Role</span>
                      <span className="font-semibold text-white">{selectedFeedback.testerRole || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between md:border-0 md:pb-0">
                      <span className="text-gray-400">4. UAT Session Start Time</span>
                      <span className="font-semibold text-white font-mono">
                        {selectedFeedback.uatSessionStart ? formatDateTime(selectedFeedback.uatSessionStart) : "Not started"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part 2: Ratings */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-cyan mb-4">UAT Quantitative Ratings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                    <span className="text-xs text-gray-400">5. Overall UAT Session Rating (5 Stars)</span>
                    <div className="flex items-center justify-between">
                      <AdminRatingStarsLarge score={selectedFeedback.ratingOverall} />
                      <span className="text-lg font-bold text-white font-mono">{selectedFeedback.ratingOverall}/5</span>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                    <span className="text-xs text-gray-400">6. How easy was the JobGiga platform to use overall?</span>
                    <div className="flex items-center justify-between">
                      <AdminRatingStarsLarge score={selectedFeedback.ratingEaseOfUse} />
                      <span className="text-lg font-bold text-white font-mono">{selectedFeedback.ratingEaseOfUse}/5</span>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                    <span className="text-xs text-gray-400">7. How clear were the test case instructions?</span>
                    <div className="flex items-center justify-between">
                      <AdminRatingStarsLarge score={selectedFeedback.ratingInstructions} />
                      <span className="text-lg font-bold text-white font-mono">{selectedFeedback.ratingInstructions}/5</span>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                    <span className="text-xs text-gray-400">8. How easy was it to fill in the Result Form?</span>
                    <div className="flex items-center justify-between">
                      <AdminRatingStarsLarge score={selectedFeedback.ratingResultForm} />
                      <span className="text-lg font-bold text-white font-mono">{selectedFeedback.ratingResultForm}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part 3: Qualitative Feedback */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-cyan">UAT Qualitative Feedback</h3>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">9. What did you find most impressive about the JobGiga platform?</p>
                  <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-white leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {selectedFeedback.impressiveAspects || <span className="text-gray-500 italic">No feedback entered</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">10. What areas of the platform need the most improvement?</p>
                  <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-white leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {selectedFeedback.improvementAreas || <span className="text-gray-500 italic">No feedback entered</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">11. Any other feedback for the JobGiga team?</p>
                  <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-white leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {selectedFeedback.otherFeedback || <span className="text-gray-500 italic">No feedback entered</span>}
                  </div>
                </div>
              </div>

              {/* Part 4: Audit Trail / History */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-cyan flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-cyan" />
                  <span>Audit Trail & Edit History</span>
                </h3>

                {selectedFeedback.auditLogs.length === 0 ? (
                  <p className="text-xs text-gray-500 italic bg-black/20 p-4 rounded-xl border border-white/5">
                    No edits have been made to this feedback form yet. This matches the original submission.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-400/90 font-medium bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg">
                      Note: The tester has edited this feedback form. Below are the historical snapshots archived prior to each update.
                    </p>
                    <div className="relative border-l border-white/10 pl-6 ml-3 space-y-4">
                      {selectedFeedback.auditLogs.map((log) => {
                        const isExpanded = openAuditLogId === log.id
                        const data = log.previousData || {}
                        return (
                          <div key={log.id} className="relative">
                            {/* Dot Indicator */}
                            <span className="absolute -left-[31px] top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-zinc-700 ring-4 ring-zinc-900 border border-zinc-500" />
                            
                            <div className="bg-zinc-950/40 border border-white/5 rounded-xl overflow-hidden">
                              <button
                                onClick={() => setOpenAuditLogId(isExpanded ? null : log.id)}
                                className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-gray-300 hover:text-white cursor-pointer hover:bg-white/[0.02] transition-colors"
                              >
                                <span>Snapshot archived on {formatDateTime(log.createdAt)}</span>
                                <span className="text-[10px] text-brand-cyan font-bold underline">
                                  {isExpanded ? "Collapse Details" : "View Version Details"}
                                </span>
                              </button>

                              {isExpanded && (
                                <div className="p-4 border-t border-white/5 bg-black/20 space-y-4 text-xs text-gray-300">
                                  {/* Ratings Grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
                                      <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">5. Overall Rating</p>
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-bold text-white">{data.ratingOverall || "-"}</span>
                                        <AdminRatingStars score={data.ratingOverall || 0} />
                                      </div>
                                    </div>
                                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
                                      <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">6. Ease of Use</p>
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-bold text-white">{data.ratingEaseOfUse || "-"}</span>
                                        <AdminRatingStars score={data.ratingEaseOfUse || 0} />
                                      </div>
                                    </div>
                                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
                                      <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">7. Instructions Clarity</p>
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-bold text-white">{data.ratingInstructions || "-"}</span>
                                        <AdminRatingStars score={data.ratingInstructions || 0} />
                                      </div>
                                    </div>
                                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
                                      <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">8. Result Form Ease</p>
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-bold text-white">{data.ratingResultForm || "-"}</span>
                                        <AdminRatingStars score={data.ratingResultForm || 0} />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Text Fields */}
                                  <div className="space-y-3 pt-2">
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-gray-500 font-semibold">9. What did you find most impressive?</p>
                                      <p className="bg-zinc-900/40 p-3 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                                        {data.impressiveAspects || <span className="text-gray-600 italic">No entry</span>}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-gray-500 font-semibold">10. What areas need improvement?</p>
                                      <p className="bg-zinc-900/40 p-3 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                                        {data.improvementAreas || <span className="text-gray-600 italic">No entry</span>}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-gray-500 font-semibold">11. Other feedback?</p>
                                      <p className="bg-zinc-900/40 p-3 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                                        {data.otherFeedback || <span className="text-gray-600 italic">No entry</span>}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-zinc-950/40 flex justify-end">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 bg-white/5 border border-white/5 text-gray-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Off Inspector Modal */}
      {selectedSignOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col my-8 max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950/40">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-teal" />
                  <span>UAT Sign Off Details</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Submitted by {selectedSignOff.testerName || selectedSignOff.testerEmail}
                </p>
              </div>
              <button
                onClick={() => setSelectedSignOff(null)}
                className="p-1 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Part 1: Sign Off Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-teal">Sign Off Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">Full Name</span>
                      <span className="font-semibold text-white">{selectedSignOff.testerName || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between md:pb-0">
                      <span className="text-gray-400">Organisation</span>
                      <span className="font-semibold text-white">{selectedSignOff.organisationName || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">Testing Role</span>
                      <span className="font-semibold text-white">{selectedSignOff.testerRole || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between md:border-0 md:pb-0">
                      <span className="text-gray-400">Title / Designation</span>
                      <span className="font-semibold text-white">{selectedSignOff.designation || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part 2: Declaration state */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start space-x-3">
                <span className="text-emerald-400 text-lg">✓</span>
                <div>
                  <p className="text-xs font-semibold text-emerald-400">Declaration Confirmed</p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                    Tester confirmed: "I hereby confirm that I have executed the UAT scenario scripts and sign off on this release cycle."
                  </p>
                </div>
              </div>

              {/* Part 3: Audit Trail / History */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-teal flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-teal" />
                  <span>Audit Trail & Edit History</span>
                </h3>

                {selectedSignOff.auditLogs.length === 0 ? (
                  <p className="text-xs text-gray-500 italic bg-black/20 p-4 rounded-xl border border-white/5">
                    No edits have been made to this sign off yet. This matches the original submission.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-400/90 font-medium bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg">
                      Note: The tester has updated their designation. Below are the historical snapshots archived prior to each update.
                    </p>
                    <div className="relative border-l border-white/10 pl-6 ml-3 space-y-4">
                      {selectedSignOff.auditLogs.map((log) => {
                        const isExpanded = openSignOffAuditLogId === log.id
                        const data = log.previousData || {}
                        return (
                          <div key={log.id} className="relative">
                            <span className="absolute -left-[31px] top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-zinc-700 ring-4 ring-zinc-900 border border-zinc-500" />
                            
                            <div className="bg-zinc-950/40 border border-white/5 rounded-xl overflow-hidden">
                              <button
                                onClick={() => setOpenSignOffAuditLogId(isExpanded ? null : log.id)}
                                className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-gray-300 hover:text-white cursor-pointer hover:bg-white/[0.02] transition-colors"
                              >
                                <span>Snapshot archived on {formatDateTime(log.createdAt)}</span>
                                <span className="text-[10px] text-brand-teal font-bold underline">
                                  {isExpanded ? "Collapse Details" : "View Version Details"}
                                </span>
                              </button>

                              {isExpanded && (
                                <div className="p-4 border-t border-white/5 bg-black/20 text-xs text-gray-300 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 font-semibold uppercase text-[10px]">Previous Title / Designation:</span>
                                    <span className="font-semibold text-white">{data.designation || "-"}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-zinc-950/40 flex justify-end">
              <button
                onClick={() => setSelectedSignOff(null)}
                className="px-4 py-2 bg-white/5 border border-white/5 text-gray-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
