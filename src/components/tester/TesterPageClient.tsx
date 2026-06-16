"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Folder, Loader2, Clock, Lock, ShieldAlert, User, Briefcase, ChevronRight, ChevronDown, Check } from "lucide-react"
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
  runSubmittedAt?: string | null
  testerStatus: string
  timer: number | null
  locked: boolean
  runResult?: string | null
}

interface ResourceSet {
  id: string
  name: string
  photoUrl: string
  resumeUrl: string
  icUrl: string
  testerId: string | null
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
  isFirst,
}: {
  c: CaseItem
  handleAction: (caseId: string, runId: string | null) => void
  loadingId: string | null
  isFirst?: boolean
}) {
  const [isExpired, setIsExpired] = React.useState(false)

  return (
    <div
      id={isFirst ? "uat-first-case-card" : undefined}
      className={`bg-zinc-900/40 border p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/20 backdrop-blur-md transition-all ${
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
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
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
          {c.testerStatus === "submitted" ? (
            c.runCreatedAt && c.runSubmittedAt ? (() => {
              const durationMs = new Date(c.runSubmittedAt).getTime() - new Date(c.runCreatedAt).getTime();
              const durationSec = Math.max(0, Math.floor(durationMs / 1000));
              const m = Math.floor(durationSec / 60);
              const s = durationSec % 60;
              const timeTakenStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
              return (
                <span className="flex items-center space-x-1.5 text-gray-400 text-xs font-mono font-bold" title="Time taken to complete">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>{timeTakenStr}</span>
                </span>
              );
            })() : c.timer ? (
              <span className="flex items-center space-x-1.5 text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{c.timer} min</span>
              </span>
            ) : null
          ) : (!c.locked && c.testerStatus === "in_progress" && c.runCreatedAt && c.timer) ? (
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
  testerId: string
}

export function TesterPageClient({
  initialCategories,
  initialCases,
  userName,
  testerGroup,
  employerLocked,
  testerId,
}: TesterPageClientProps) {
  const router = useRouter()
  const uncategorizedCases = initialCases.filter((c) => !c.categoryId)
  const uncategorizedDuration = uncategorizedCases.reduce((sum, c) => sum + (c.timer || 0), 0)
  usePageTitle(
    !testerGroup
      ? "Choose UAT Profile"
      : testerGroup === "EMPLOYER" && employerLocked
      ? "Access Locked"
      : "Available Test Cases"
  )

  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [resourceSets, setResourceSets] = React.useState<ResourceSet[]>([])
  const [selectedSet, setSelectedSet] = React.useState<ResourceSet | null>(null)
  const [briefingDeck, setBriefingDeck] = React.useState<{ id: string; url: string; fileName: string } | null>(null)
  const [loadingResources, setLoadingResources] = React.useState(true)
  const [selectCount, setSelectCount] = React.useState<number>(0)
  const [startTime, setStartTime] = React.useState("")
  const [selectingGroup, setSelectingGroup] = React.useState<string | null>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Tooltip Tour Guide Configuration
  const TOUR_STEPS = React.useMemo(() => [
    {
      targetId: "uat-welcome-card",
      title: "Welcome to UAT Workspace!",
      content: `Welcome, ${userName}! This dashboard contains everything you need to execute UAT scenarios. Let's take a quick 1-minute tour to get you started.`,
    },
    {
      targetId: "uat-testing-resources",
      title: "Testing Resources",
      content: "These are mock persona files linked as a set (photo, resume, and IC card) that you can select and download. Use these exact details when executing your test scenarios to keep test data clean.",
    },
    {
      targetId: "uat-flow-progress",
      title: "UAT Flow Progress Tracker",
      content: "This progress bar and step timeline show your UAT status. It keeps track of how many test cases you have completed out of the total assigned.",
    },
    {
      targetId: "uat-first-case-card",
      title: "Start Testing",
      content: "Here is your first UAT test scenario. Click 'Start Test' (or 'Continue' / 'View Result') to execute this case. You must complete the cases sequentially to unlock and move to the next ones.",
    }
  ], [userName])

  const [tourStep, setTourStep] = React.useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = React.useState<{ top: number; left: number; position: 'above' | 'below' | 'center' }>({ top: 0, left: 0, position: 'below' })

  const updateTooltipPosition = React.useCallback((stepIndex: number) => {
    const step = TOUR_STEPS[stepIndex]
    if (!step) return
    const el = document.getElementById(step.targetId)
    if (!el) {
      setTooltipPos({
        top: 200,
        left: 20,
        position: 'center'
      })
      return
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" })

    setTimeout(() => {
      const rect = el.getBoundingClientRect()
      const parent = el.closest('main')
      const parentRect = parent ? parent.getBoundingClientRect() : { top: 0, left: 0, width: 0, height: 0 }
      
      let top = rect.bottom - parentRect.top + 16
      let left = rect.left - parentRect.left + (rect.width - 340) / 2
      let pos: 'above' | 'below' | 'center' = 'below'

      // Keep within bounds
      if (left < 16) left = 16
      if (parent && left + 340 > parentRect.width) {
        left = parentRect.width - 356
      }

      // If it goes too low, position it above the element
      if (rect.bottom + 200 > window.innerHeight) {
        top = rect.top - parentRect.top - 180
        pos = 'above'
      }

      setTooltipPos({ top, left, position: pos })
    }, 500)
  }, [TOUR_STEPS])

  React.useEffect(() => {
    if (tourStep === null) {
      TOUR_STEPS.forEach((step) => {
        const el = document.getElementById(step.targetId)
        if (el) {
          el.classList.remove("tour-active-highlight")
        }
      })
      return
    }

    TOUR_STEPS.forEach((step, idx) => {
      const el = document.getElementById(step.targetId)
      if (el) {
        if (idx === tourStep) {
          el.classList.add("tour-active-highlight")
        } else {
          el.classList.remove("tour-active-highlight")
        }
      }
    })

    updateTooltipPosition(tourStep)
  }, [tourStep, updateTooltipPosition, TOUR_STEPS])

  // Handle auto-start on first load / after signin if user hasn't done anything yet
  React.useEffect(() => {
    if (testerGroup === "JOBSEEKER" && !loadingResources) {
      const hasDoneAnything = initialCases.some((c) => c.testerStatus !== "not_started")
      const hasSelectedResource = resourceSets.some((s) => s.testerId === testerId)
      const completed = localStorage.getItem("jg-uat-tour-completed")
      const shown = localStorage.getItem("jg-uat-tour-shown")

      if (!completed && !shown && !hasDoneAnything && !hasSelectedResource) {
        const timer = setTimeout(() => {
          setTourStep(0)
          localStorage.setItem("jg-uat-tour-shown", "true")
        }, 1200)
        return () => clearTimeout(timer)
      }
    }
  }, [testerGroup, initialCases, loadingResources, resourceSets, testerId])

  // Handle manual trigger event
  React.useEffect(() => {
    const handleTriggerTour = () => {
      setTourStep(0)
    }
    window.addEventListener("trigger-tour", handleTriggerTour)
    return () => {
      window.removeEventListener("trigger-tour", handleTriggerTour)
    }
  }, [])

  const handleNextStep = () => {
    if (tourStep === null) return
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1)
    } else {
      handleCompleteTour()
    }
  }

  const handlePrevStep = () => {
    if (tourStep === null) return
    if (tourStep > 0) {
      setTourStep(tourStep - 1)
    }
  }

  const handleCompleteTour = () => {
    setTourStep(null)
    localStorage.setItem("jg-uat-tour-completed", "true")
    localStorage.setItem("jg-uat-tour-shown", "true")
    sessionStorage.setItem("jg-uat-tour-session-seen", "true")
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
        if (activeEl) {
          activeEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, []);
  const [isMouseDown, setIsMouseDown] = React.useState(false)
  const [startX, setStartX] = React.useState(0)
  const [scrollLeftState, setScrollLeftState] = React.useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    setIsMouseDown(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeftState(scrollContainerRef.current.scrollLeft)
  }

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk
  }
  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    const saved = localStorage.getItem("jg-tester-collapsed-categories")
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
      localStorage.setItem("jg-tester-collapsed-categories", JSON.stringify(updated))
      return updated
    })
  }

  const isAllCollapsed = React.useMemo(() => {
    if (initialCategories.length === 0 && uncategorizedCases.length === 0) return false

    const allCategoryIds = initialCategories.map((c) => c.id)
    if (uncategorizedCases.length > 0) {
      allCategoryIds.push("uncategorized")
    }

    return allCategoryIds.every((id) => !!collapsedCategories[id])
  }, [initialCategories, uncategorizedCases, collapsedCategories])

  const toggleCollapseAll = () => {
    if (isAllCollapsed) {
      setCollapsedCategories({})
      localStorage.setItem("jg-tester-collapsed-categories", JSON.stringify({}))
    } else {
      const collapsed: Record<string, boolean> = {}
      initialCategories.forEach((cat) => {
        collapsed[cat.id] = true
      })
      if (uncategorizedCases.length > 0) {
        collapsed["uncategorized"] = true
      }
      setCollapsedCategories(collapsed)
      localStorage.setItem("jg-tester-collapsed-categories", JSON.stringify(collapsed))
    }
  }



  React.useEffect(() => {
    setStartTime(new Date().toLocaleString())
  }, [])

  React.useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch("/api/tester/resources")
        const json = await res.json()
        if (json.data) {
          setResourceSets(json.data)
          // Find if this tester has already claimed a set
          const claimedSet = json.data.find((set: ResourceSet) => set.testerId === testerId)
          if (claimedSet) {
            setSelectedSet(claimedSet)
          } else {
            setSelectedSet(null) // No set claimed yet
          }
        }
        if (typeof json.selectCount === "number") {
          setSelectCount(json.selectCount)
        }
      } catch (err) {
        console.error("Failed to load UAT resources:", err)
      } finally {
        setLoadingResources(false)
      }
    }

    const fetchBriefing = async () => {
      try {
        const res = await fetch("/api/tester/briefing-deck")
        const json = await res.json()
        if (json.data) {
          setBriefingDeck(json.data)
        }
      } catch (err) {
        console.error("Failed to load UAT briefing deck:", err)
      }
    }
    
    if (testerGroup) {
      fetchResources()
      fetchBriefing()
    }
  }, [testerGroup, testerId])

  const handleSelectSet = async (set: ResourceSet) => {
    const isAlreadySelectedByMe = selectedSet?.id === set.id
    const targetSetId = isAlreadySelectedByMe ? null : set.id // Toggle selection / unclaim

    try {
      const res = await fetch("/api/tester/resources/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: targetSetId }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        // Update local sets with new claims
        const updatedSets = resourceSets.map((s: ResourceSet) => {
          // If this set was claimed by current tester, set testerId to null
          if (s.testerId === testerId) {
            return { ...s, testerId: null }
          }
          // If this set is the newly claimed one, set testerId to current tester
          if (s.id === targetSetId) {
            return { ...s, testerId: testerId }
          }
          return s
        })
        setResourceSets(updatedSets)
        setSelectedSet(targetSetId ? set : null)

        // Sync count
        const syncRes = await fetch("/api/tester/resources")
        const syncJson = await syncRes.json()
        if (typeof syncJson.selectCount === "number") {
          setSelectCount(syncJson.selectCount)
        }
      }
    } catch {
      alert("Failed to update resource set selection.")
    }
  }

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
        localStorage.removeItem("jg-uat-tour-completed")
        localStorage.removeItem("jg-uat-tour-shown")
        sessionStorage.removeItem("jg-uat-tour-session-seen")
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
            <p className="text-xs text-gray-600 font-mono">
              Status: PENDING_ADMIN_ACTIVATION
            </p>
          </div>
        </div>
      </main>
    )
  }

  const isEmpty = initialCategories.length === 0 && initialCases.length === 0

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 flex flex-col space-y-10 relative z-10 text-white">
      {!isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Card with UAT progress tracker in bottom row */}
          <div id="uat-welcome-card" className="lg:col-span-2 bg-zinc-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden">
            <style>{`
              @keyframes flow-gradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animate-flow-gradient {
                background-size: 200% 200%;
                animation: flow-gradient 4s ease infinite;
              }
              @keyframes pulse-ring {
                0% { transform: scale(0.95); opacity: 0.5; }
                50% { transform: scale(1.15); opacity: 0.8; }
                100% { transform: scale(0.95); opacity: 0.5; }
              }
              .animate-pulse-ring {
                animation: pulse-ring 2s infinite ease-in-out;
              }
              .tour-active-highlight {
                position: relative !important;
                z-index: 50 !important;
                pointer-events: none !important;
                box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.8) !important;
                transition: all 0.3s ease !important;
              }
              .tour-active-highlight::before {
                content: "" !important;
                position: absolute !important;
                inset: 0px !important;
                padding: 2px !important;
                border-radius: inherit !important;
                background: linear-gradient(135deg, #06b6d4, #10b981) !important;
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0) !important;
                -webkit-mask-composite: xor !important;
                mask-composite: exclude !important;
                pointer-events: none !important;
                z-index: 100 !important;
              }
              #uat-welcome-card:has(.tour-active-highlight) {
                z-index: 49 !important;
              }
            `}</style>

            {/* Top row */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {userName}!</h1>
                <p className="text-sm text-gray-400">
                  Thank you for joining. Testing UAT flow as: <span className="font-semibold text-brand-cyan">{testerGroup === "EMPLOYER" ? "Employer" : "Jobseeker"}</span>
                </p>
              </div>
              <div className="text-xs text-gray-500 font-mono bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 flex flex-col sm:items-end w-full sm:w-auto shrink-0">
                <span className="font-bold text-brand-teal uppercase tracking-wider block mb-0.5 text-xs">Session Started</span>
                <span>{startTime}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-white/5 w-full my-1" />

            {/* Bottom Row - Progress Track */}
            <div id="uat-flow-progress" className="w-full bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-brand-cyan uppercase tracking-wider">UAT Flow Progress</span>
                  {(() => {
                    const totalDuration = initialCases.reduce((sum, c) => sum + (c.timer || 0), 0)
                    return totalDuration > 0 ? (
                      <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 font-mono">
                        {totalDuration} MINS
                      </span>
                    ) : null
                  })()}
                </div>
                <span className="text-[11px] font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                  {Math.round((initialCases.filter((c) => c.testerStatus === "submitted").length / (initialCases.length || 1)) * 100)}% Complete ({initialCases.filter((c) => c.testerStatus === "submitted").length}/{initialCases.length})
                </span>
              </div>

              {/* Steps bar */}
              <div
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                className={`relative py-4 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 mt-2 select-none ${
                  isMouseDown ? "cursor-grabbing" : "cursor-grab"
                }`}
              >
                {/* Steps Row */}
                <div className="relative flex justify-between items-start gap-12 min-w-max pl-[10px] pr-6 pb-2">
                  {/* Connecting track line */}
                  {(() => {
                    const lastActiveIdx = initialCases.map((c) => c.testerStatus !== "not_started").lastIndexOf(true);
                    const progressWidth = lastActiveIdx >= 0 ? (lastActiveIdx / (initialCases.length - 1 || 1)) * 100 : 0;
                    return (
                      <div className="absolute top-[16px] left-[28px] right-[42px] h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-cyan to-emerald-500 animate-flow-gradient transition-all duration-700 ease-out"
                          style={{ width: `${progressWidth}%` }}
                        />
                      </div>
                    );
                  })()}
                  {(() => {
                    const activeIdx = initialCases.findIndex((c) => c.testerStatus !== "submitted");
                    const scrollTargetIdx = activeIdx !== -1 ? activeIdx : initialCases.length - 1;

                    return initialCases.map((c, idx) => {
                      const stepNum = idx + 1
                      const isCompleted = c.testerStatus === "submitted"
                      const isFailed = isCompleted && !!c.runResult && c.runResult.toLowerCase().includes("fail")
                      const isBlocked = isCompleted && !!c.runResult && c.runResult.toLowerCase().includes("block")
                      const isNA = isCompleted && !!c.runResult && (c.runResult.toLowerCase().includes("n/a") || c.runResult.toLowerCase().includes("na") || c.runResult.toLowerCase().includes("not execute") || c.runResult.toLowerCase().includes("could not"))
                      const isInProgress = c.testerStatus === "in_progress"
                      const isCurrentLocked = c.locked
                      const isActiveScrollTarget = idx === scrollTargetIdx
                      const isNextCaseToStart = idx === scrollTargetIdx && c.testerStatus === "not_started"

                      return (
                        <div key={c.id} data-active={isActiveScrollTarget} className="flex flex-col items-center relative z-10 shrink-0">
                          {/* Step Circle Node */}
                          <button
                            type="button"
                            onClick={() => handleAction(c.id, c.runId)}
                            disabled={isCurrentLocked}
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative transition-all duration-300 ${
                              isFailed
                                ? "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 scale-105 cursor-pointer"
                                : isBlocked
                                ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 scale-105 cursor-pointer"
                                : isNA
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105 cursor-pointer"
                                : isCompleted
                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 scale-105 cursor-pointer"
                                : isInProgress
                                ? "bg-zinc-900 border-2 border-brand-cyan text-brand-cyan scale-110 cursor-pointer"
                                : isNextCaseToStart
                                ? "bg-zinc-900 border-2 border-brand-cyan/60 text-brand-cyan/80 scale-105 cursor-pointer"
                                : "bg-zinc-900/90 border border-white/10 text-gray-500 cursor-default"
                            }`}
                          >
                            {/* Pulse Ring for active node or next case to start */}
                            {(isInProgress || isNextCaseToStart) && (
                              <span className="absolute -inset-1.5 rounded-full border border-brand-cyan/40 animate-pulse-ring -z-10" />
                            )}

                            {isCompleted ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <span>{stepNum}</span>
                            )}
                          </button>

                          {/* Step text below */}
                          <span className={`text-[10px] font-semibold mt-2 max-w-[70px] text-center truncate ${
                            isFailed
                              ? "text-rose-400 font-bold"
                              : isBlocked
                              ? "text-amber-400 font-bold"
                              : isNA
                              ? "text-blue-400 font-bold"
                              : isCompleted
                              ? "text-emerald-400 font-bold"
                              : isInProgress
                              ? "text-brand-cyan font-bold"
                              : isNextCaseToStart
                              ? "text-brand-cyan/80 font-bold"
                              : "text-gray-500"
                          }`}>
                            Case {stepNum}
                          </span>
                        </div>
                      )
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Download Resources Card */}
          <div id="uat-testing-resources" className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-start space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-cyan">Testing Resources</h2>
                {selectCount >= 2 ? (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Permanent</span>
                ) : selectCount === 1 ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded-full uppercase tracking-wider">1 Change Left</span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full uppercase tracking-wider">First Choice</span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Choose a photo set. The resume and IC card are linked as a set.
              </p>
            </div>

            {/* Briefing Deck Section */}
            {briefingDeck && (
              <>
                <div className="border border-white/5 bg-white/[0.02] p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="text-xl">📄</span>
                    <div className="truncate">
                      <p className="text-[11px] font-bold text-white truncate">{briefingDeck.fileName}</p>
                      <p className="text-[9px] text-brand-teal font-extrabold uppercase tracking-wider">UAT Briefing Deck</p>
                    </div>
                  </div>
                   <div className="flex items-center space-x-2 shrink-0">
                    <a
                      href={briefingDeck.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] cursor-pointer whitespace-nowrap transition-all"
                    >
                      View
                    </a>
                    <a
                      href={briefingDeck.url}
                      download={briefingDeck.fileName}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-brand-cyan hover:opacity-90 text-white font-bold text-[10px] cursor-pointer whitespace-nowrap shadow-md shadow-brand-cyan/10 transition-all"
                    >
                      Download
                    </a>
                  </div>
                </div>
                <hr className="border-white/5" />
              </>
            )}

            {/* Photo Selection Sets */}
            {loadingResources ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-brand-teal animate-spin" />
              </div>
            ) : resourceSets.length === 0 ? (
              /* Fallback to local default assets if no sets configured */
              <div className="space-y-2">
                <p className="text-xs text-gray-500 italic">Using default fallback specimen set.</p>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="/sample-photo.png"
                    download="specimen-photo.png"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-brand-teal/30 transition-all text-center group cursor-pointer"
                  >
                    <span className="text-lg mb-1">👤</span>
                    <span className="text-xs font-bold text-gray-300">Photo</span>
                  </a>
                  <a
                    href="/sample-resume.pdf"
                    download="specimen-resume.pdf"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-brand-teal/30 transition-all text-center group cursor-pointer"
                  >
                    <span className="text-lg mb-1">📄</span>
                    <span className="text-xs font-bold text-gray-300">Resume</span>
                  </a>
                  <a
                    href="/sample-ic.png"
                    download="specimen-ic.png"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-brand-teal/30 transition-all text-center group cursor-pointer"
                  >
                    <span className="text-lg mb-1">🪪</span>
                    <span className="text-xs font-bold text-gray-300">IC Card</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selectors */}
                <div className="flex items-center space-x-3 overflow-x-auto py-2 px-2.5 scrollbar-thin scrollbar-thumb-white/5">
                  {resourceSets.map((set) => {
                    const isSelected = selectedSet?.id === set.id
                    const isClaimedByOthers = !!set.testerId && set.testerId !== testerId
                    const isPermanent = selectCount >= 2 && !isSelected
                    const isDisabled = isClaimedByOthers || isPermanent
                    return (
                      <button
                        key={set.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSelectSet(set)}
                        className={`relative w-[72px] h-[72px] rounded-full overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? "border-brand-teal ring-2 ring-brand-teal/30 scale-105"
                            : isClaimedByOthers
                            ? "border-red-500/20 opacity-30 cursor-not-allowed grayscale"
                            : isPermanent
                            ? "border-white/5 opacity-20 cursor-not-allowed grayscale"
                            : "border-white/10 opacity-60 hover:opacity-100"
                        }`}
                        title={isClaimedByOthers ? `${set.name} (Claimed by another tester)` : isPermanent ? `${set.name} (Selection is permanent)` : set.name}
                      >
                        <img src={set.photoUrl} className="w-full h-full object-cover" alt={set.name} />
                        {isClaimedByOthers && (
                          <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                            <span className="text-xs font-bold text-red-200 uppercase tracking-tighter">🔒</span>
                          </div>
                        )}
                        {isPermanent && (
                          <div className="absolute inset-0 bg-zinc-900/70 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-400">🔒</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Info and download buttons for selected set */}
                {selectedSet && (
                  <div className="space-y-3 animate-fade-in">
                    <p className="text-xs text-gray-400 font-semibold truncate">
                      Selected Set: <span className="text-gray-200">{selectedSet.name}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={selectedSet.photoUrl}
                        download={`${selectedSet.name.replace(/\s+/g, "_")}_photo.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-brand-teal/30 transition-all text-center group cursor-pointer"
                      >
                        <span className="text-base mb-0.5 group-hover:scale-110 transition-transform">👤</span>
                        <span className="text-xs font-bold text-gray-300">Photo</span>
                      </a>
                      <a
                        href={selectedSet.resumeUrl}
                        download={`${selectedSet.name.replace(/\s+/g, "_")}_resume.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-brand-teal/30 transition-all text-center group cursor-pointer"
                      >
                        <span className="text-base mb-0.5 group-hover:scale-110 transition-transform">📄</span>
                        <span className="text-xs font-bold text-gray-300">Resume</span>
                      </a>
                      <a
                        href={selectedSet.icUrl}
                        download={`${selectedSet.name.replace(/\s+/g, "_")}_ic.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-brand-teal/30 transition-all text-center group cursor-pointer"
                      >
                        <span className="text-base mb-0.5 group-hover:scale-110 transition-transform">🪪</span>
                        <span className="text-xs font-bold text-gray-300">IC Card</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="m-auto text-center py-20 border border-dashed border-white/10 rounded-3xl space-y-3 bg-zinc-900/40 backdrop-blur-md p-8 max-w-md shadow-xl">
          <p className="text-gray-400 font-semibold">No test cases available yet.</p>
          <p className="text-xs text-gray-500">Your administrator hasn&apos;t published any UAT test case scenarios for {testerGroup === "EMPLOYER" ? "Employers" : "Jobseekers"} yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">UAT Test Scenarios</h2>
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
          </div>

          <div className="space-y-12">
            {/* Grouped by categories */}
            {initialCategories.map((cat) => {
              const catCases = initialCases.filter((c) => c.categoryId === cat.id)
              if (catCases.length === 0) return null
              const totalDuration = catCases.reduce((sum, c) => sum + (c.timer || 0), 0)
              const isCollapsed = !!collapsedCategories[cat.id]

              return (
                <div key={cat.id} className="space-y-4">
                  <div className="pb-2 border-b border-white/5">
                    <button
                      onClick={() => toggleCategoryCollapse(cat.id)}
                      className="flex items-center space-x-2.5 text-left focus:outline-none group cursor-pointer"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      )}
                      <Folder className="w-5 h-5 text-brand-cyan" />
                      <h2 className="text-lg font-bold text-white group-hover:text-brand-cyan transition-colors">{cat.name}</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-mono font-bold">
                        {catCases.length} {catCases.length === 1 ? "test" : "tests"}
                      </span>
                      {totalDuration > 0 && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-cyan font-mono font-semibold" title="Total Category Duration">
                          {totalDuration} min
                        </span>
                      )}
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catCases.map((c) => (
                        <CaseCard
                          key={c.id}
                          c={c}
                          handleAction={handleAction}
                          loadingId={loadingId}
                          isFirst={c.id === initialCases[0]?.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Uncategorized Fallback */}
            {uncategorizedCases.length > 0 && (() => {
              const isCollapsed = !!collapsedCategories["uncategorized"]
              return (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-white/5">
                    <button
                      onClick={() => toggleCategoryCollapse("uncategorized")}
                      className="flex items-center space-x-2.5 text-left focus:outline-none group cursor-pointer"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      )}
                      <Folder className="w-5 h-5 text-gray-500" />
                      <h2 className="text-lg font-bold text-gray-400 group-hover:text-white transition-colors">Uncategorized</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-mono font-bold">
                        {uncategorizedCases.length} {uncategorizedCases.length === 1 ? "test" : "tests"}
                      </span>
                      {uncategorizedDuration > 0 && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-mono font-semibold" title="Total Category Duration">
                          {uncategorizedDuration} min
                        </span>
                      )}
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {uncategorizedCases.map((c) => (
                        <CaseCard
                          key={c.id}
                          c={c}
                          handleAction={handleAction}
                          loadingId={loadingId}
                          isFirst={c.id === initialCases[0]?.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}
      {tourStep !== null && TOUR_STEPS[tourStep] && (
        <>
          {/* Overlay mask */}
          <div 
            className="fixed -inset-20 bg-black/60 z-40 transition-opacity duration-300 cursor-pointer"
            onClick={handleCompleteTour}
          />
          {/* Popover */}
          <div
            style={{
              position: 'absolute',
              top: tooltipPos.top,
              left: tooltipPos.left,
            }}
            className="w-[340px] max-w-[calc(100vw-32px)] bg-zinc-950/95 border border-brand-teal/40 p-5 rounded-2xl shadow-2xl z-50 text-white backdrop-blur-md transition-all duration-300 animate-fade-in space-y-4"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
                Step {tourStep + 1} of {TOUR_STEPS.length}
              </span>
              <h4 className="font-bold text-sm text-white">{TOUR_STEPS[tourStep].title}</h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {TOUR_STEPS[tourStep].content}
            </p>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCompleteTour}
                className="text-gray-500 hover:text-gray-300 text-xs font-semibold cursor-pointer"
              >
                Skip Tour
              </button>
              <div className="flex items-center">
                {tourStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="mr-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-3 py-1.5 rounded-lg bg-brand-cyan hover:bg-brand-cyan/95 text-white text-xs font-bold shadow-md shadow-brand-cyan/10 transition-all cursor-pointer"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  )
}

