"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, FileSpreadsheet, Loader2, User, Clock, Check } from "lucide-react"
import { AnswerRenderer } from "@/components/admin/AnswerRenderer"

const PDFViewer = dynamic(
  () => import("@/components/tester/PDFViewer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-gray-400">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin mr-2" />
        <span>Loading PDF Viewer...</span>
      </div>
    ),
  }
)

interface FieldItem {
  id: string
  fieldName: string
  fieldType: string
  choices?: string[] | null
  steps?: string[] | null
}

interface RunData {
  id: string
  status: string
  submittedAt: string | null
  createdAt: string
  tester: {
    name: string
    email: string
  }
  testCase: {
    id: string
    title: string
    pdfUrl: string | null
    fields: FieldItem[]
  }
  answers: Record<
    string,
    {
      id?: string
      value: unknown
      screenshotUrl?: string | null
    }
  >
}

export default function AdminRunDetailPage() {
  const router = useRouter()
  const params = useParams() as { id: string; runId: string }
  const { id: testCaseId, runId } = params

  const [run, setRun] = React.useState<RunData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchRunDetails = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/runs/${runId}`)
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setRun(json.data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load run details")
    } finally {
      setLoading(false)
    }
  }, [runId])

  React.useEffect(() => {
    fetchRunDetails()
  }, [fetchRunDetails])

  // pass/fail summary & verdict calculation
  const passFailSummary = React.useMemo(() => {
    if (!run) return { total: 0, passed: 0, failed: 0, blocked: 0, na: 0, unanswered: 0, verdict: "Partial" as const }

    const fields = run.testCase.fields
    const answersMap = run.answers

    let passed = 0
    let failed = 0
    let blocked = 0
    let na = 0
    let unanswered = 0
    let total = fields.length

    fields.forEach((field) => {
      const ans = answersMap[field.id]
      if (!ans || ans.value === null || ans.value === undefined) {
        unanswered++
      } else {
        let choice = ""
        if (field.fieldType === "BOOLEAN") {
          choice = ans.value === true ? "Passed" : "Failed"
        } else {
          if (typeof ans.value === "object" && ans.value !== null) {
            choice = (ans.value as any).choice || ""
          } else {
            choice = String(ans.value || "")
          }
        }

        const choiceLower = choice.toLowerCase().trim()
        if (choiceLower === "passed" || choiceLower === "pass") {
          passed++
        } else if (choiceLower === "failed" || choiceLower === "fail") {
          failed++
        } else if (choiceLower === "blocked" || choiceLower === "block") {
          blocked++
        } else if (
          choiceLower.includes("n/a") ||
          choiceLower.includes("na") ||
          choiceLower.includes("not execute") ||
          choiceLower.includes("could not")
        ) {
          na++
        } else {
          // default fallback
          passed++
        }
      }
    })

    let verdict: "Passed" | "Failed" | "Partial" = "Partial"
    if (run.status === "PENDING") {
      verdict = "Partial"
    } else if (failed > 0 || blocked > 0) {
      verdict = "Failed"
    } else if (passed > 0 && (passed + na === total)) {
      verdict = "Passed"
    } else if (passed === 0 && na === total && total > 0) {
      verdict = "Passed"
    } else {
      verdict = "Passed"
    }

    return { total, passed, failed, blocked, na, unanswered, verdict }
  }, [run])

  if (loading) {
    return (
      <div className="h-[calc(100vh-56px)] flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin mb-2" />
        <p className="text-xs text-gray-500 font-medium">Reconstructing test execution timeline...</p>
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#0a0a0a] text-white p-8">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Failed to load run details</h2>
          <p className="text-xs text-gray-400">{error || "The test run log could not be loaded."}</p>
          <button
            onClick={() => router.push(`/admin/test-cases/${testCaseId}/results`)}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] flex overflow-hidden w-full relative">
      {/* Left PDF panel */}
      <div className="w-3/4 h-full relative border-r border-white/5 bg-[#0a0a0a]">
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2">
          <Link
            href={`/admin/test-cases/${testCaseId}/results`}
            className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-bold text-gray-300 hover:bg-black/80 hover:text-white transition-all shadow-md backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Results</span>
          </Link>
        </div>

        {run.testCase.pdfUrl ? (
          <PDFViewer fileUrl={run.testCase.pdfUrl} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 select-none">
            No verification PDF assigned to this test case.
          </div>
        )}
      </div>

      {/* Right answers panel */}
      <div className="w-1/4 h-full flex flex-col bg-black/60 border-l border-white/5 backdrop-blur-md text-white overflow-hidden shadow-2xl relative z-10">
        
        {/* Run Title Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-black/40">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Scenario Execution Log</span>
            <h2 className="text-xs font-semibold text-white truncate max-w-[180px]" title={run.testCase.title}>
              {run.testCase.title}
            </h2>
          </div>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
            run.status === "PASSED"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : run.status === "FAILED"
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}>
            {run.status === "PENDING" ? "In Progress" : run.status}
          </span>
        </div>

        {/* Scrollable inputs list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tester Info Card */}
          <div className="border border-white/5 bg-white/[0.02] p-4 rounded-xl space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-brand-cyan/15 text-brand-cyan border border-brand-teal/20">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{run.tester.name || "Tester"}</p>
                <p className="text-[10px] text-gray-500 truncate font-mono">{run.tester.email}</p>
              </div>
            </div>
            <div className="pt-2.5 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] text-gray-400">
              <div>
                <span className="block text-gray-600 font-semibold uppercase">Started</span>
                <span className="font-mono text-gray-300 font-medium">
                  {new Date(run.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="block text-gray-600 font-semibold uppercase">Submitted</span>
                <span className="font-mono text-gray-300 font-medium">
                  {run.submittedAt ? new Date(run.submittedAt).toLocaleDateString() : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Answers display */}
          {run.testCase.fields.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center py-8">No dynamic test fields configured.</p>
          ) : (
            <div className="space-y-6">
              {run.testCase.fields.map((field, index) => (
                <div key={field.id} className="space-y-4">
                  <AnswerRenderer
                    field={field}
                    answer={run.answers[field.id] ?? null}
                  />
                  {index < run.testCase.fields.length - 1 && (
                    <hr className="border-white/5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom card & export bar */}
        <div className="p-4 border-t border-white/5 bg-black/60 space-y-4">
          
          {/* Pass/Fail Verdict Card */}
          <div className={`border p-3.5 rounded-xl flex items-center justify-between transition-colors ${
            passFailSummary.verdict === "Passed"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : passFailSummary.verdict === "Failed"
              ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
              : "bg-amber-500/10 border-amber-500/25 text-amber-400"
          }`}>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">UAT Run Verdict</p>
              <p className="text-sm font-extrabold mt-0.5">{passFailSummary.verdict}</p>
            </div>
            {passFailSummary.verdict === "Passed" ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : passFailSummary.verdict === "Failed" ? (
              <XCircle className="w-6 h-6 text-rose-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-400" />
            )}
          </div>

          {/* CSV Export Button */}
          <a
            href={`/api/runs/${runId}/export`}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-brand-cyan hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-brand-cyan/10 transition-all text-center cursor-pointer select-none"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV Results</span>
          </a>
        </div>
      </div>
    </div>
  )
}
