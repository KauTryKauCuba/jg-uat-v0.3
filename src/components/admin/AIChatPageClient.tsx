"use client"

import * as React from "react"
import { Send, Loader2, Sparkles, User, Search, RefreshCw, Layers } from "lucide-react"

interface UATRun {
  id: string
  status: string
  submittedAt: string | null
  createdAt: string
  testerName: string | null
  testerGroup: string | null
  testCaseTitle: string | null
}

interface TargetGroup {
  id: string
  name: string
  displayName: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AIChatPageClientProps {
  runs: UATRun[]
  targetGroups: TargetGroup[]
}

export function AIChatPageClient({ runs, targetGroups }: AIChatPageClientProps) {
  const [selectedRunId, setSelectedRunId] = React.useState<string>("")
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [groupFilter, setGroupFilter] = React.useState<string>("ALL")
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  // Filter UAT runs
  const filteredRuns = runs.filter(
    (run) =>
      (groupFilter === "ALL" || run.testerGroup === groupFilter) &&
      ((run.testerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
       (run.testCaseTitle?.toLowerCase() || "").includes(searchQuery.toLowerCase()))
  )

  // Auto scroll to bottom
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // Select UAT Run Context
  const handleSelectRun = async (runId: string) => {
    setSelectedRunId(runId)
    const run = runs.find((r) => r.id === runId)
    
    // Reset conversation and inject initial analysis request
    const prompt = `Analyze the UAT test run results for "${run?.testCaseTitle || "this test case"}" submitted by "${run?.testerName || "the tester"}". Check if all answers align with correct guidelines and highlight any errors.`
    
    setMessages([{ role: "user", content: `Load context for: ${run?.testerName} - ${run?.testCaseTitle}` }])
    setLoading(true)

    try {
      const res = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          messages: [{ role: "user", content: prompt }]
        }),
      })

      const json = await res.json()
      if (json.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Failed to load AI evaluation: ${json.error}` }
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.message }
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error communicating with the local UAT AI model. Please check if Ollama is running." }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Handle Send
  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault()
    const textToSend = customPrompt || input
    if (!textToSend.trim() || loading) return

    // Guard suggestion prompts that require specific run context
    if (customPrompt && !selectedRunId) {
      const isGlobalPrompt = customPrompt.toLowerCase().includes("overall") || customPrompt.toLowerCase().includes("summarize")
      if (!isGlobalPrompt) {
        alert("Please select a UAT test run from the panel on the left to analyze specific errors or guideline details.")
        return
      }
    }

    const userMsg: Message = { role: "user", content: textToSend }
    const updatedMessages = [...messages, userMsg]
    
    setMessages(updatedMessages)
    if (!customPrompt) setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: selectedRunId || undefined,
          groupFilter: groupFilter || undefined,
          messages: updatedMessages
        }),
      })

      const json = await res.json()
      if (json.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${json.error}` }
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.message }
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to fetch response. Make sure Ollama is active on the VPS." }
      ])
    } finally {
      setLoading(false)
    }
  }

  const SUGGESTIONS = [
    { 
      title: "Review errors", 
      desc: "Identify incorrect values or guideline gaps in UAT",
      prompt: "Review the selected UAT test run results for errors, incorrect inputs, or guideline mismatch. Highlight step details."
    },
    { 
      title: "Guideline check", 
      desc: "Verify if tester followed the briefing deck",
      prompt: "Check the answers of the selected UAT run against the expected steps and standard guidelines of the briefing deck."
    },
    { 
      title: "Summarize UAT", 
      desc: "Draft a feedback summary report for admin review",
      prompt: "Please provide a comprehensive summary of the entire UAT results. Analyze the total runs, pass rate, average tester ratings across ease of use, instructions, results form, and compile an overall executive report."
    }
  ]

  return (
    <main className="flex h-[calc(100vh-2rem)] flex-1 overflow-hidden p-6 gap-6">
      
      {/* Left panel: Context/Runs selector */}
      <div className="w-80 flex flex-col border border-white/5 bg-zinc-900/20 backdrop-blur-md rounded-3xl p-4 space-y-4 shrink-0 overflow-hidden">
        <div>
          <h2 className="text-md font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-cyan" />
            <span>UAT Context Panel</span>
          </h2>
          <p className="text-[10px] text-gray-500 mt-1">Select a test run to ground the AI model&apos;s context.</p>
        </div>

        {/* Choose UAT Group Filter as Visual Cards */}
        <div className="grid grid-cols-2 gap-2 select-none">
          {[
            { id: "ALL", name: "ALL", displayName: "All Groups" },
            ...targetGroups.map((tg) => ({ id: tg.id, name: tg.name, displayName: tg.displayName.replace("Categories", "").replace("Category", "").trim() }))
          ].map((grp) => {
            const isSelected = groupFilter === grp.name
            const count = grp.name === "ALL" ? runs.length : runs.filter((r) => r.testerGroup === grp.name).length

            // Colorful palette per group type
            let colorClasses = ""
            if (grp.name === "ALL") {
              colorClasses = isSelected
                ? "border-violet-500/50 bg-violet-500/10 text-white shadow-md shadow-violet-500/10"
                : "border-violet-500/10 bg-violet-500/5 text-violet-400/80 hover:bg-violet-500/10 hover:text-violet-300"
            } else if (grp.name === "EMPLOYER") {
              colorClasses = isSelected
                ? "border-amber-500/50 bg-amber-500/10 text-white shadow-md shadow-amber-500/10"
                : "border-amber-500/10 bg-amber-500/5 text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-300"
            } else if (grp.name === "JOBSEEKER_WEB") {
              colorClasses = isSelected
                ? "border-cyan-500/50 bg-cyan-500/10 text-white shadow-md shadow-cyan-500/10"
                : "border-cyan-500/10 bg-cyan-500/5 text-cyan-400/80 hover:bg-cyan-500/10 hover:text-cyan-300"
            } else if (grp.name === "JOBSEEKER") {
              colorClasses = isSelected
                ? "border-emerald-500/50 bg-emerald-500/10 text-white shadow-md shadow-emerald-500/10"
                : "border-emerald-500/10 bg-emerald-500/5 text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-300"
            } else {
              colorClasses = isSelected
                ? "border-brand-cyan bg-brand-cyan/10 text-white shadow-md shadow-brand-cyan/10"
                : "border-white/5 bg-zinc-900/40 hover:bg-white/5 text-gray-400"
            }

            return (
              <button
                key={grp.id}
                onClick={() => {
                  setGroupFilter(grp.name)
                  setSelectedRunId("") // clear selected run context when switching group
                }}
                className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${colorClasses}`}
              >
                <div className="text-[10px] font-bold truncate">{grp.displayName}</div>
                <div className="text-[9px] opacity-60 mt-1 font-mono">{count} Runs</div>
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search run or tester..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-xs text-white placeholder-gray-650 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {filteredRuns.length === 0 ? (
            <p className="text-center text-xs text-gray-600 py-12">No matching runs found.</p>
          ) : (
            filteredRuns.map((run) => {
              const isSelected = selectedRunId === run.id
              const statusColor =
                run.status === "PASSED"
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                  : run.status === "FAILED"
                  ? "bg-red-500/10 border-red-500/25 text-red-400"
                  : "bg-amber-500/10 border-amber-500/25 text-amber-400"

              return (
                <button
                  key={run.id}
                  onClick={() => handleSelectRun(run.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer select-none space-y-1.5 block ${
                    isSelected
                      ? "border-brand-cyan bg-brand-cyan/5 text-white"
                      : "border-white/5 bg-zinc-900/40 hover:bg-white/5 text-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-xs truncate max-w-[140px] block">
                      {run.testerName || "Tester User"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase ${statusColor}`}>
                      {run.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-gray-400 line-clamp-1 flex-1">
                      {run.testCaseTitle || "UAT Scenario"}
                    </p>
                    {run.testerGroup && (
                      <span className="text-[7px] font-mono px-1 rounded bg-white/5 border border-white/10 text-gray-500 shrink-0">
                        {targetGroups.find((tg) => tg.name === run.testerGroup)?.displayName.replace("Categories", "").replace("Category", "").trim() || run.testerGroup}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right panel: Chat viewport */}
      <div className="flex-1 flex flex-col bg-zinc-950/40 border border-white/5 rounded-3xl overflow-hidden relative">
        
        {/* Active context header */}
        {selectedRunId && (
          <div className="border-b border-white/5 px-6 py-4 bg-zinc-900/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              <p className="text-xs text-gray-400 font-semibold truncate max-w-lg">
                Context: {runs.find((r) => r.id === selectedRunId)?.testerName} - {runs.find((r) => r.id === selectedRunId)?.testCaseTitle}
              </p>
            </div>
            <button
              onClick={() => setSelectedRunId("")}
              className="text-[10px] text-gray-500 hover:text-white transition-colors border border-white/5 bg-white/5 px-2.5 py-1 rounded-lg"
            >
              Clear Context
            </button>
          </div>
        )}

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-brand-teal via-brand-cyan to-brand-cyan bg-clip-text text-transparent">
                  Hello, Admin
                </h1>
                <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                  I am UATGiga. Ask me questions about UAT run results, tester submissions, or test case specifications.
                </p>
              </div>

              {/* Suggestions Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(undefined, s.prompt)}
                    className="p-4 text-left border border-white/5 bg-zinc-900/30 hover:border-brand-cyan/20 hover:bg-zinc-900/50 rounded-2xl transition-all cursor-pointer space-y-1 block"
                  >
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-brand-cyan" />
                      <span>{s.title}</span>
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-normal">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isAssistant = msg.role === "assistant"
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
                        isAssistant
                          ? "text-gray-300 pt-1.5"
                          : "bg-zinc-900 border border-white/5 text-white px-4 py-3 rounded-2xl rounded-tr-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {!isAssistant && (
                      <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )
              })}

              {loading && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex items-center space-x-2 pt-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" />
                    <span className="text-xs text-gray-600 font-medium">UATGiga is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input box */}
        <div className="p-6 border-t border-white/5 bg-zinc-950/20">
          <div className="max-w-3xl mx-auto w-full">
            <form onSubmit={handleSend} className="relative flex items-center bg-zinc-900 border border-white/10 focus-within:border-brand-cyan/40 rounded-full px-5 py-3 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                placeholder="Ask UATGiga anything or select UAT context on the left..."
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none resize-none max-h-24 scrollbar-none pr-10"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-3 p-2 rounded-full bg-brand-cyan hover:opacity-90 active:scale-[0.98] transition-all text-black disabled:opacity-30 disabled:hover:opacity-30 cursor-pointer shadow-md shadow-brand-cyan/10"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[9px] text-gray-600 text-center mt-2.5">
              UATGiga uses local Ollama model context. Confirm UAT outputs manually before signing off results.
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}
