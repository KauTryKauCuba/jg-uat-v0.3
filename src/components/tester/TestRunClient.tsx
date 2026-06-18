"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { CheckCircle2, AlertCircle, ArrowLeft, Loader2, Clock } from "lucide-react"
import { usePageTitle } from "@/components/tester/TesterLayout"
import { FieldRenderer } from "@/components/tester/FieldRenderer"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { TestFieldWithOptions } from "@/types"

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

interface RunData {
  id: string
  status: string
  submittedAt: string | null
  createdAt: string
  updatedAt: string
  elapsedSeconds: number
  testCase: {
    id: string
    title: string
    pdfUrl: string | null
    timer?: number | null
    fields: TestFieldWithOptions[]
  }
  answers: Record<
    string,
    {
      id?: string
      value: any
      screenshotUrl?: string | null
    }
  >
  auditLogs?: Array<{
    id: string
    action: string
    previousStatus: string
    newStatus: string
    createdAt: string
  }>
}

interface TestRunClientProps {
  run: RunData
}

export function TestRunClient({ run }: TestRunClientProps) {
  const router = useRouter()
  usePageTitle(run.testCase.title)

  const [answers, setAnswers] = React.useState<Record<string, any>>(run.answers)
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle")
  const [isSubmitted, setIsSubmitted] = React.useState(run.status !== "PENDING")
  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [reopening, setReopening] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  // Countdown timer state
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(run.elapsedSeconds)
  const [updatedAt, setUpdatedAt] = React.useState(run.updatedAt)

  React.useEffect(() => {
    setElapsedSeconds(run.elapsedSeconds)
    setUpdatedAt(run.updatedAt)
  }, [run.elapsedSeconds, run.updatedAt])

  const timeoutsRef = React.useRef<Record<string, NodeJS.Timeout>>({})

  // Auto submit on time expiration
  const triggerAutoSubmit = React.useCallback(async () => {
    setSubmitting(true)
    setSubmitError("Time expired! Submitting test run automatically...")

    try {
      const res = await fetch(`/api/runs/${run.id}/submit`, {
        method: "POST",
      })
      const json = await res.json()
      if (!json.error) {
        setIsSubmitted(true)
        router.refresh()
        router.push("/tester")
      }
    } catch {
      setSubmitError("Auto-submit failed. Please lock manually.")
    } finally {
      setSubmitting(false)
    }
  }, [run.id, router])

  React.useEffect(() => {
    if (isSubmitted || !run.testCase.timer) return

    const totalDurationSeconds = run.testCase.timer * 60
    const startSessionMs = new Date(updatedAt).getTime()

    // eslint-disable-next-line prefer-const
    let interval: NodeJS.Timeout

    const updateTimer = () => {
      const now = Date.now()
      const sessionElapsedSeconds = Math.max(0, Math.floor((now - startSessionMs) / 1000))
      const totalElapsedSeconds = elapsedSeconds + sessionElapsedSeconds
      const diffSec = Math.max(0, totalDurationSeconds - totalElapsedSeconds)
      
      setTimeLeft(diffSec)

      if (diffSec <= 0) {
        if (interval) clearInterval(interval)
        triggerAutoSubmit()
      }
    }

    updateTimer()
    interval = setInterval(updateTimer, 1000)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSubmitted, run.testCase.timer, updatedAt, elapsedSeconds, triggerAutoSubmit])

  // Clean up timeouts on unmount
  React.useEffect(() => {
    const currentTimeouts = timeoutsRef.current
    return () => {
      Object.values(currentTimeouts).forEach((t) => clearTimeout(t))
    }
  }, [])

  const handleAnswerChange = (fieldId: string, value: any, screenshotUrl?: string | null) => {
    if (isSubmitted) return

    // Optimistically update state
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        value,
        screenshotUrl: screenshotUrl !== undefined ? screenshotUrl : prev[fieldId]?.screenshotUrl,
      },
    }))

    // Clear existing timeout for this field
    if (timeoutsRef.current[fieldId]) {
      clearTimeout(timeoutsRef.current[fieldId])
    }

    setSaveStatus("saving")

    // Debounce API call (800ms)
    timeoutsRef.current[fieldId] = setTimeout(async () => {
      try {
        const payload = {
          testFieldId: fieldId,
          value,
          screenshotUrl: screenshotUrl !== undefined ? screenshotUrl : answers[fieldId]?.screenshotUrl,
        }

        const res = await fetch(`/api/runs/${run.id}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const json = await res.json()
        if (json.error) {
          setSaveStatus("error")
        } else {
          setSaveStatus("saved")
          setTimeout(() => {
            setSaveStatus((curr) => (curr === "saved" ? "idle" : curr))
          }, 2000)
        }
      } catch {
        setSaveStatus("error")
      }
    }, 800)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/runs/${run.id}/submit`, {
        method: "POST",
      })
      const json = await res.json()
      if (json.error) {
        setSubmitError(json.error)
      } else {
        setIsSubmitted(true)
        setIsSubmitModalOpen(false)
        router.refresh()
        router.push("/tester")
      }
    } catch {
      setSubmitError("Failed to submit UAT test run.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReopen = async () => {
    setReopening(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/runs/${run.id}/reopen`, {
        method: "POST",
      })
      const json = await res.json()
      if (json.error) {
        setSubmitError(json.error)
      } else {
        setElapsedSeconds(0)
        setUpdatedAt(new Date().toISOString())
        setIsSubmitted(false)
        router.refresh()
      }
    } catch {
      setSubmitError("Failed to reopen test run.")
    } finally {
      setReopening(false)
    }
  }

  const handleOpenSubmitModal = () => {
    const unansweredFields = run.testCase.fields.filter((field) => {
      const answer = answers[field.id]
      if (!answer) return true
      const val = answer.value
      if (val === null || val === undefined) return true
      if (typeof val === "object" && val !== null) {
        return !val.choice
      }
      if (typeof val === "string") {
        return val.trim() === ""
      }
      return false
    })

    if (unansweredFields.length > 0) {
      setSubmitError("You must choose a result (Passed, Failed, Blocked, or N/A) before submitting.")
      return
    }

    // Validate that if choice is failed, blocked, or n/a, defectDetails and screenshotUrl are provided.
    let validationErrorMessage: string | null = null
    for (const field of run.testCase.fields) {
      if (field.fieldType === "DROPDOWN") {
        const answer = answers[field.id]
        const val = answer?.value
        const screenshotUrl = answer?.screenshotUrl

        let choice = ""
        let defectDetails = ""
        if (typeof val === "object" && val !== null) {
          choice = val.choice || ""
          defectDetails = val.defectDetails || ""
        } else {
          choice = String(val || "")
        }

        const choiceLower = choice.toLowerCase().trim()
        if (choiceLower !== "" && choiceLower !== "passed" && choiceLower !== "pass") {
          if (!defectDetails || defectDetails.trim() === "") {
            validationErrorMessage = `Defect details are required for "${field.fieldName}" when the result is ${choice}.`
            break
          }
          if (!screenshotUrl || screenshotUrl.trim() === "") {
            validationErrorMessage = `A screenshot attachment is required for "${field.fieldName}" when the result is ${choice}.`
            break
          }
        }
      }
    }

    if (validationErrorMessage) {
      setSubmitError(validationErrorMessage)
      return
    }

    setSubmitError(null)
    setIsSubmitModalOpen(true)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="h-[calc(100vh-96px)] flex flex-col md:flex-row overflow-hidden w-full relative">
      {/* Top PDF panel on mobile, left on desktop */}
      <div className="relative w-full md:w-3/4 h-[60%] md:h-full border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
        {run.testCase.pdfUrl ? (
          <PDFViewer fileUrl={run.testCase.pdfUrl} />
        ) : (
          <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-gray-500 w-full">
            No verification PDF assigned to this test case.
          </div>
        )}
      </div>

      {/* Bottom control panel on mobile, right on desktop */}
      <div className={`w-full md:w-1/4 h-[40%] md:h-full flex flex-col bg-black/60 border-t md:border-t-0 md:border-l backdrop-blur-md text-white overflow-hidden shadow-2xl relative z-10 transition-colors duration-300 ${
        timeLeft !== null && timeLeft <= 0 ? "border-rose-500 shadow-rose-950/20" : "border-white/5"
      }`}>
        {/* Autosave & Countdown status indicator */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 bg-black/40">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Save:</span>
            {saveStatus === "saving" && (
              <span className="inline-flex items-center text-xs font-semibold text-brand-cyan">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs font-bold text-emerald-400">
                Saved ✓
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs font-bold text-rose-400">
                Save failed!
              </span>
            )}
            {saveStatus === "idle" && (
              <span className="text-xs font-semibold text-gray-500">
                Ready
              </span>
            )}
          </div>

          {/* TIMER COUNTDOWN */}
          {timeLeft !== null && !isSubmitted && (
            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-xs font-mono font-bold ${
              timeLeft <= 60
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                : "bg-white/5 text-brand-cyan border-white/10"
            }`}>
              <Clock className="w-3 h-3" />
              <span>{timeLeft <= 0 ? "Expired" : formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Fields list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">{run.testCase.title}</h2>
            <p className="text-xs text-gray-500 font-mono">RUN ID: {run.id}</p>
          </div>
          <hr className="border-white/5" />

          {run.testCase.fields.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center py-10">No dynamic fields configured for this scenario.</p>
          ) : (
            <div className="space-y-6">
              {run.testCase.fields.map((field, index) => (
                <div key={field.id} className="space-y-4">
                  <FieldRenderer
                    field={field}
                    answer={answers[field.id] ?? null}
                    onChange={handleAnswerChange}
                    disabled={isSubmitted}
                    testRunId={run.id}
                  />
                  {index < run.testCase.fields.length - 1 && (
                    <hr className="border-white/5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom actions bar */}
        <div className="p-4 border-t border-white/5 bg-black/60 space-y-2">
          {submitError && (
            <div className="flex items-start space-x-1.5 text-xs text-rose-400 font-semibold pb-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Test Submitted</span>
              </div>
              <button
                type="button"
                onClick={handleReopen}
                disabled={reopening}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                {reopening ? "Re-opening..." : "Edit / Re-open Test Run"}
              </button>
              
              {/* Audit trail details */}
              {run.auditLogs && run.auditLogs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-left">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Run History (Audit Trail)</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                    {run.auditLogs.map((log) => (
                      <div key={log.id} className="text-xs bg-white/[0.02] border border-white/5 p-2.5 rounded-lg space-y-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold uppercase tracking-tight text-[10px] ${log.action === "SUBMIT" ? "text-emerald-400" : "text-amber-400"}`}>
                            {log.action === "SUBMIT" ? "Submitted" : "Re-opened"}
                          </span>
                          <span className="text-gray-550 font-mono text-[10px]">
                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-400 leading-normal">
                          Status transition: <span className="font-mono">{log.previousStatus}</span> &rarr; <span className="font-mono">{log.newStatus}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href="/tester"
                className="flex items-center justify-center space-x-1.5 text-xs font-bold text-brand-cyan hover:underline text-center w-full py-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Test Cases</span>
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenSubmitModal}
              className="w-full py-3.5 rounded-xl bg-brand-teal hover:opacity-90 text-white font-bold text-sm shadow-lg shadow-brand-teal/10 transition-all cursor-pointer"
            >
              Submit Test Run
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleSubmit}
        title="Submit Test Run?"
        description="Once submitted, all answer inputs and screenshot logs will be locked, and you cannot make any further changes to this UAT test run."
        confirmText={submitting ? "Submitting..." : "Submit permanently"}
        variant="neutral"
      />
    </div>
  )
}
