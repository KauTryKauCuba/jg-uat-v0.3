"use client"

import * as React from "react"
import { CheckCircle2, XCircle, FileText, Image as ImageIcon, ChevronRight, CheckSquare, Square } from "lucide-react"

interface TestField {
  id: string
  fieldName: string
  fieldType: string
  choices?: string[] | null
  steps?: string[] | null
}

interface Answer {
  id?: string
  value: unknown
  screenshotUrl?: string | null
}

interface AnswerRendererProps {
  field: TestField
  answer: Answer | null
}

const getScreenshotUrls = (urlStr: string | null | undefined): string[] => {
  if (!urlStr) return []
  const trimmed = urlStr.trim()
  if (trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as string[]
    } catch {
      // fallback
    }
  }
  return trimmed.split(",").map(u => u.trim()).filter(Boolean)
}

export function AnswerRenderer({ field, answer }: AnswerRendererProps) {
  const value = answer?.value ?? null
  const screenshotUrl = answer?.screenshotUrl ?? null

  const isUnanswered = (val: unknown) => {
    if (val === null || val === undefined) return true
    if (typeof val === "string" && val.trim() === "") return true
    return false
  }

  const renderNoAnswer = () => (
    <span className="text-xs text-gray-500 italic font-medium bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
      No answer
    </span>
  )

  // PASS_FAIL (BOOLEAN)
  if (field.fieldType === "BOOLEAN") {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</h4>
        <div>
          {isUnanswered(value) ? (
            renderNoAnswer()
          ) : value === true ? (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pass</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle className="w-3.5 h-3.5" />
              <span>Fail</span>
            </span>
          )}
        </div>
      </div>
    )
  }

  // TEXT
  if (field.fieldType === "TEXT") {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</h4>
        <div>
          {isUnanswered(value) ? (
            renderNoAnswer()
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-gray-300 leading-relaxed break-words">
              {String(value)}
            </div>
          )}
        </div>
      </div>
    )
  }

  // NUMBER
  if (field.fieldType === "NUMBER") {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</h4>
        <div>
          {isUnanswered(value) ? (
            renderNoAnswer()
          ) : (
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-cyan">
              <FileText className="w-4 h-4" />
              <span>{String(value)}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // FILE (SCREENSHOT)
  if (field.fieldType === "FILE") {
    const urls = getScreenshotUrls(screenshotUrl)
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</h4>
        <div>
          {urls.length === 0 ? (
            renderNoAnswer()
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              {urls.map((url, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden border border-white/15 bg-black/40 p-2 group">
                  <img
                    src={url}
                    alt={`UAT Verification Screenshot ${idx + 1}`}
                    className="w-full max-h-48 object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="mt-2 flex items-center justify-between px-1">
                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[50%]">
                      {url}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[10px] font-bold text-brand-cyan hover:underline"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Open Full Image</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // DROPDOWN
  if (field.fieldType === "DROPDOWN") {
    // Parse value to see if it's an object with choice & defectDetails
    let choice = ""
    let defectDetails = ""
    if (typeof value === "object" && value !== null) {
      choice = (value as any).choice || ""
      defectDetails = (value as any).defectDetails || ""
    } else {
      choice = String(value || "")
    }

    const isPassed = choice.toLowerCase() === "passed" || choice.toLowerCase() === "pass"
    const isFailed = choice.toLowerCase() === "failed" || choice.toLowerCase() === "fail"
    const isBlocked = choice.toLowerCase() === "blocked" || choice.toLowerCase() === "block"

    const urls = getScreenshotUrls(screenshotUrl)

    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</h4>
        <div className="space-y-2.5">
          {isUnanswered(choice) ? (
            renderNoAnswer()
          ) : (
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
              isPassed
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : isFailed
                ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                : isBlocked
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
            }`}>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{choice}</span>
            </span>
          )}

          {defectDetails && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300 leading-relaxed break-words max-w-md">
              <span className="font-bold text-[10px] uppercase block text-rose-400/80 mb-1">Defect Details:</span>
              {defectDetails}
            </div>
          )}

          {urls.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              {urls.map((url, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden border border-white/15 bg-black/40 p-2 group">
                  <img
                    src={url}
                    alt={`UAT Verification Screenshot ${idx + 1}`}
                    className="w-full max-h-48 object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="mt-2 flex items-center justify-between px-1">
                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[50%]">
                      {url}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[10px] font-bold text-brand-cyan hover:underline"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Open Full Image</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // CHECKLIST
  if (field.fieldType === "CHECKLIST") {
    const steps = field.steps || []
    const checkedArray = (value as { checked?: boolean[] })?.checked || []

    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</h4>
        <div>
          {steps.length === 0 ? (
            renderNoAnswer()
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2.5">
              {steps.map((step, idx) => {
                const isChecked = !!checkedArray[idx]
                return (
                  <div key={idx} className="flex items-start space-x-2 text-xs">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                    )}
                    <span className={`leading-relaxed ${isChecked ? "line-through text-gray-500 font-medium" : "text-gray-300"}`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
