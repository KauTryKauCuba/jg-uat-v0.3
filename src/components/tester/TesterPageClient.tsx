"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Folder, Loader2, Clock, Lock, ShieldAlert, User, Briefcase, ChevronRight } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { usePageTitle } from "@/components/tester/TesterLayout"

interface CaseItem {
  id: string
  title: string
  description: string
  categoryId: string | null
  fieldsCount: number
  runId: string | null
  runCreatedAt: string | null
  testerStatus: string
  timer: number | null
  locked: boolean
  runResult?: string | null
}

function LiveTimer({ runCreatedAt, timerLimitMinutes, onExpire }: { runCreatedAt: string; timerLimitMinutes: number; onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null)

  React.useEffect(() => {
    const limitMs = timerLimitMinutes * 60 * 1000
    const startMs = new Date(runCreatedAt).getTime()
    const endMs = startMs + limitMs

    const updateTimer = () => {
      const now = Date.now()
      const diffSec = Math.max(0, Math.floor((endMs - now) / 1000))
      setTimeLeft(diffSec)
      if (diffSec <= 0 && onExpire) {
        onExpire()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [runCreatedAt, timerLimitMinutes, onExpire])

  if (timeLeft === null) return null

  const m = Math.floor(timeLeft / 60)
  const s = timeLeft % 60
  const timeStr = `${m}:${s.toString().padStart(2, "0")}`

  return (
    <span className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-mono font-bold ${
      timeLeft <= 60
        ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
        : "bg-white/5 text-brand-cyan border-white/10"
    }`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft <= 0 ? "Expired" : timeStr}</span>
    </span>
  )
}

function CaseCard({
  c,
  handleAction,
  loadingId,
}: {
  c: CaseItem
  handleAction: (caseId: string, runId: string | null) => void
  loadingId: string | null
}) {
  const [isExpired, setIsExpired] = React.useState(false)

  return (
    <div className={`bg-zinc-900/40 border p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/20 backdrop-blur-md transition-all ${
      c.locked
        ? "border-white/5 opacity-50 select-none"
        : isExpired
        ? "border-rose-500 hover:border-rose-500/80"
        : "border-white/5 hover:border-white/10"
    }`}>
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-start space-x-1.5 min-w-0">
            {c.locked && <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-1" />}
            <h3 className="font-semibold text-white leading-snug break-words">{c.title}</h3>
          </div>
          <StatusBadge status={c.locked ? "LOCKED" : c.testerStatus} className="shrink-0" />
        </div>
        <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px] leading-relaxed">
          {c.description || "No description provided."}
        </p>
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
          {c.testerStatus === "submitted" && c.runResult ? (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              c.runResult.toLowerCase() === "passed" || c.runResult.toLowerCase() === "pass"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                : c.runResult.toLowerCase() === "failed" || c.runResult.toLowerCase() === "fail"
                ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                : c.runResult.toLowerCase() === "blocked" || c.runResult.toLowerCase() === "block"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                : "bg-blue-500/10 text-blue-400 border-blue-500/25"
            }`}>
              Result: {c.runResult}
            </span>
          ) : (
            <div />
          )}
          {!c.locked && c.testerStatus === "in_progress" && c.runCreatedAt && c.timer ? (
            <LiveTimer
              runCreatedAt={c.runCreatedAt}
              timerLimitMinutes={c.timer}
              onExpire={() => setIsExpired(true)}
            />
          ) : c.timer ? (
            <span className="flex items-center space-x-1.5 text-brand-cyan">
              <Clock className="w-3.5 h-3.5" />
              <span>{c.timer} min</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          disabled={loadingId !== null || c.locked}
          onClick={() => handleAction(c.id, c.runId)}
          className={`w-full flex items-center justify-center space-x-1.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            c.locked
              ? "bg-zinc-800 border border-white/5 text-gray-500 cursor-not-allowed"
              : c.testerStatus === "not_started"
              ? "bg-brand-cyan hover:bg-brand-cyan/95 text-white shadow-md shadow-brand-cyan/10"
              : c.testerStatus === "in_progress"
              ? "bg-brand-teal hover:bg-brand-teal/95 text-white shadow-md shadow-brand-teal/10"
              : "border border-white/10 text-gray-300 hover:bg-white/5"
          }`}
        >
          {loadingId === c.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : c.locked ? (
            <Lock className="w-3.5 h-3.5" />
          ) : null}
          <span>
            {c.locked
              ? "Locked"
              : c.testerStatus === "not_started"
              ? "Start Test"
              : c.testerStatus === "in_progress"
              ? "Continue"
              : "View Result"}
          </span>
        </button>
      </div>
    </div>
  )
}

interface CategoryItem {
  id: string
  name: string
}

interface TesterPageClientProps {
  initialCategories: CategoryItem[]
  initialCases: CaseItem[]
  userName: string
  testerGroup: "JOBSEEKER" | "EMPLOYER" | null
  employerLocked: boolean
}

export function TesterPageClient({
  initialCategories,
  initialCases,
  userName,
  testerGroup,
  employerLocked,
}: TesterPageClientProps) {
  const router = useRouter()
  usePageTitle(
    !testerGroup
      ? "Choose UAT Profile"
      : testerGroup === "EMPLOYER" && employerLocked
      ? "Access Locked"
      : "Available Test Cases"
  )

  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [startTime, setStartTime] = React.useState("")
  const [selectingGroup, setSelectingGroup] = React.useState<string | null>(null)

  React.useEffect(() => {
    setStartTime(new Date().toLocaleString())
  }, [])

  const handleAction = async (caseId: string, runId: string | null) => {
    if (runId) {
      router.push(`/tester/runs/${runId}`)
      return
    }

    setLoadingId(caseId)
    try {
      const res = await fetch(`/api/test-cases/${caseId}/runs`, {
        method: "POST",
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        router.push(`/tester/runs/${json.data.runId}`)
      }
    } catch {
      alert("Failed to start test execution.")
    } finally {
      setLoadingId(null)
    }
  }

  const handleSelectGroup = async (group: "JOBSEEKER" | "EMPLOYER") => {
    setSelectingGroup(group)
    try {
      const res = await fetch("/api/tester/select-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        // Force refresh session credentials and update layout views
        window.location.reload()
      }
    } catch (err) {
      alert("Failed to save selection. Please try again.")
    } finally {
      setSelectingGroup(null)
    }
  }

  // Render first-time select role flow
  if (!testerGroup) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 w-full flex-1 flex flex-col justify-center items-center text-white relative z-10">
        <div className="text-center space-y-4 max-w-lg mb-10">
          <div className="inline-flex p-3 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/25 mb-2">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Choose Your Testing Role</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Welcome to the JobGiga UAT system. Please select your UAT group.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Jobseeker Card */}
          <div className="border border-white/5 bg-zinc-900/40 hover:border-brand-teal/30 p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden group">
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 text-brand-teal w-fit">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Jobseeker Profile</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Test candidate dashboard flows, job search and filters, resume uploads, profile setup, and application tracking systems.
              </p>
            </div>
            <button
              onClick={() => handleSelectGroup("JOBSEEKER")}
              disabled={selectingGroup !== null}
              className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold bg-brand-teal hover:bg-brand-teal/90 text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {selectingGroup === "JOBSEEKER" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Select Jobseeker</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>

          {/* Employer Card */}
          <div className="border border-white/5 bg-zinc-900/40 hover:border-brand-cyan/30 p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden group">
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan w-fit">
                <Briefcase className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Employer Profile</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Test job postings creation, applicant screening dashboards, company profile customizations, and employer administration systems.
              </p>
            </div>
            <button
              onClick={() => handleSelectGroup("EMPLOYER")}
              disabled={selectingGroup !== null}
              className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold bg-brand-cyan hover:bg-brand-cyan/90 text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {selectingGroup === "EMPLOYER" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Select Employer</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Render Employer locked layout
  if (testerGroup === "EMPLOYER" && employerLocked) {
    return (
      <main className="max-w-lg mx-auto px-6 py-24 w-full flex-1 flex flex-col justify-center items-center text-white relative z-10">
        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-10 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-red-500" />
          
          <div className="inline-flex p-4 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 mb-2 animate-pulse">
            <Lock className="w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight">Employer Access Locked</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your Employer testing access is currently locked. Please contact the system administrator to unlock it.
          </p>
          
          <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
            <p className="text-xs text-gray-500">
              UAT Tester: <span className="font-semibold text-gray-300">{userName}</span>
            </p>
            <p className="text-[10px] text-gray-600 font-mono">
              Status: PENDING_ADMIN_ACTIVATION
            </p>
          </div>
        </div>
      </main>
    )
  }

  const uncategorizedCases = initialCases.filter((c) => !c.categoryId)
  const isEmpty = initialCategories.length === 0 && initialCases.length === 0

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 flex flex-col space-y-10 relative z-10 text-white">
      {!isEmpty && (
        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome, {userName}!</h1>
            <p className="text-sm text-gray-400">
              Thank you for joining. Testing UAT flow as: <span className="font-semibold text-brand-cyan">{testerGroup === "EMPLOYER" ? "Employer" : "Jobseeker"}</span>
            </p>
          </div>
          <div className="text-xs text-gray-500 font-mono bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 flex flex-col md:items-end">
            <span className="font-bold text-brand-teal uppercase tracking-wider block mb-0.5 text-[10px]">Session Started</span>
            <span>{startTime}</span>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="m-auto text-center py-20 border border-dashed border-white/10 rounded-3xl space-y-3 bg-zinc-900/40 backdrop-blur-md p-8 max-w-md shadow-xl">
          <p className="text-gray-400 font-semibold">No test cases available yet.</p>
          <p className="text-xs text-gray-500">Your administrator hasn&apos;t published any UAT test case scenarios for {testerGroup === "EMPLOYER" ? "Employers" : "Jobseekers"} yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Grouped by categories */}
          {initialCategories.map((cat) => {
            const catCases = initialCases.filter((c) => c.categoryId === cat.id)
            if (catCases.length === 0) return null

            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center space-x-2.5 pb-2 border-b border-white/5">
                  <Folder className="w-5 h-5 text-brand-cyan" />
                  <h2 className="text-lg font-bold text-white">{cat.name}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-mono font-bold">
                    {catCases.length} {catCases.length === 1 ? "test" : "tests"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catCases.map((c) => (
                    <CaseCard
                      key={c.id}
                      c={c}
                      handleAction={handleAction}
                      loadingId={loadingId}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Uncategorized Fallback */}
          {uncategorizedCases.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-white/5">
                <Folder className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-400">Uncategorized</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-mono font-bold">
                  {uncategorizedCases.length} {uncategorizedCases.length === 1 ? "test" : "tests"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uncategorizedCases.map((c) => (
                  <CaseCard
                    key={c.id}
                    c={c}
                    handleAction={handleAction}
                    loadingId={loadingId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
