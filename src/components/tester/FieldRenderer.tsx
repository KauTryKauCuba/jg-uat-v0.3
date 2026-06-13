"use client"

import * as React from "react"
import { CheckCircle2, XCircle, Upload, X, Loader2 } from "lucide-react"
import { TestFieldWithOptions } from "@/types"

interface FieldRendererProps {
  field: TestFieldWithOptions
  answer: {
    id?: string
    value: any
    screenshotUrl?: string | null
  } | null
  onChange: (testFieldId: string, value: any, screenshotUrl?: string) => void
  disabled: boolean
}

export function FieldRenderer({ field, answer, onChange, disabled }: FieldRendererProps) {
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  // Current values
  const currentValue = answer?.value ?? null
  const currentScreenshotUrl = answer?.screenshotUrl ?? null

  // BOOLEAN -> PASS_FAIL
  if (field.fieldType === "BOOLEAN") {
    const handlePassFail = (val: boolean) => {
      if (disabled) return
      onChange(field.id, val, currentScreenshotUrl || undefined)
    }

    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePassFail(true)}
            className={`flex items-center justify-center space-x-2 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              currentValue === true
                ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10"
                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Pass</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePassFail(false)}
            className={`flex items-center justify-center space-x-2 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              currentValue === false
                ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10"
                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Fail</span>
          </button>
        </div>
      </div>
    )
  }

  // TEXT
  if (field.fieldType === "TEXT") {
    const textVal = typeof currentValue === "string" ? currentValue : ""
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(field.id, e.target.value, currentScreenshotUrl || undefined)
    }

    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</label>
        <div className="relative">
          <textarea
            disabled={disabled}
            value={textVal}
            onChange={handleTextChange}
            rows={4}
            placeholder="Enter your notes here..."
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all disabled:bg-white/5 disabled:text-gray-500"
          />
          <div className="text-[10px] text-gray-500 text-right mt-1 font-mono">
            {textVal.length} chars
          </div>
        </div>
      </div>
    )
  }

  // NUMBER
  if (field.fieldType === "NUMBER") {
    const numVal = currentValue !== null ? String(currentValue) : ""
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(field.id, e.target.value === "" ? null : Number(e.target.value), currentScreenshotUrl || undefined)
    }

    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</label>
        <input
          type="number"
          disabled={disabled}
          value={numVal}
          onChange={handleNumberChange}
          placeholder="Enter numeric value..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all disabled:bg-white/5 disabled:text-gray-500"
        />
      </div>
    )
  }

  // FILE -> SCREENSHOT
  if (field.fieldType === "FILE") {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || uploading) return
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      setUploadError(null)

      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/upload/screenshot", {
          method: "POST",
          body: formData,
        })
        const json = await res.json()
        if (json.error) {
          setUploadError(json.error)
        } else {
          onChange(field.id, currentValue, json.data.url)
        }
      } catch {
        setUploadError("Upload failed")
      } finally {
        setUploading(false)
      }
    }

    const handleRemoveScreenshot = () => {
      if (disabled) return
      onChange(field.id, currentValue, undefined)
    }

    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</label>
        
        {currentScreenshotUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 p-2 group">
            <img
              src={currentScreenshotUrl}
              alt="UAT Screenshot Verification"
              className="w-full max-h-48 object-contain rounded-lg"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemoveScreenshot}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div>
            <label className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all border-white/10 hover:border-brand-cyan bg-white/5 hover:bg-white/10 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-brand-teal animate-spin" />
                  <span className="text-xs text-gray-400">Uploading screenshot...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-300">Click to upload screenshot</span>
                  <span className="text-[10px] text-gray-500">PNG, JPG, WEBP (max 5MB)</span>
                </>
              )}
              <input
                type="file"
                disabled={disabled || uploading}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {uploadError && <p className="text-[10px] text-red-500 mt-1 font-medium">{uploadError}</p>}
          </div>
        )}
      </div>
    )
  }

  // DROPDOWN
  if (field.fieldType === "DROPDOWN") {
    const choices = field.choices || []

    // Parse value safely
    let selectedChoice = ""
    let defectDetails = ""
    if (typeof currentValue === "object" && currentValue !== null) {
      selectedChoice = (currentValue as any).choice || ""
      defectDetails = (currentValue as any).defectDetails || ""
    } else {
      selectedChoice = String(currentValue || "")
    }

    const handleSelectChoice = (choice: string) => {
      if (disabled) return
      const isPassed = choice.toLowerCase() === "passed" || choice.toLowerCase() === "pass"
      if (isPassed) {
        onChange(field.id, "Passed", undefined)
      } else {
        onChange(field.id, { choice, defectDetails: "" }, currentScreenshotUrl || undefined)
      }
    }

    const handleDefectDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (disabled) return
      onChange(field.id, { choice: selectedChoice, defectDetails: e.target.value }, currentScreenshotUrl || undefined)
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || uploading) return
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      setUploadError(null)

      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/upload/screenshot", {
          method: "POST",
          body: formData,
        })
        const json = await res.json()
        if (json.error) {
          setUploadError(json.error)
        } else {
          onChange(field.id, { choice: selectedChoice, defectDetails }, json.data.url)
        }
      } catch {
        setUploadError("Upload failed")
      } finally {
        setUploading(false)
      }
    }

    const handleRemoveScreenshot = () => {
      if (disabled) return
      onChange(field.id, { choice: selectedChoice, defectDetails }, undefined)
    }

    const isPassed = selectedChoice.toLowerCase() === "passed" || selectedChoice.toLowerCase() === "pass"
    const needsDefectInputs = selectedChoice !== "" && !isPassed

    // Helper functions for dynamic styles based on choice value
    const getChoiceStyles = (choice: string, isSelected: boolean) => {
      if (!isSelected) {
        return {
          button: "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10",
          radioBorder: "border-white/20",
          radioDot: ""
        }
      }

      const lower = choice.toLowerCase().trim()
      if (lower === "passed" || lower === "pass") {
        return {
          button: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-md shadow-emerald-500/5",
          radioBorder: "border-emerald-500 bg-emerald-500",
          radioDot: "bg-zinc-950"
        }
      }
      if (lower === "failed" || lower === "fail") {
        return {
          button: "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-md shadow-rose-500/5",
          radioBorder: "border-rose-500 bg-rose-500",
          radioDot: "bg-zinc-950"
        }
      }
      if (lower === "blocked" || lower === "block") {
        return {
          button: "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-md shadow-amber-500/5",
          radioBorder: "border-amber-500 bg-amber-500",
          radioDot: "bg-zinc-950"
        }
      }
      // N/A or others
      return {
        button: "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-md shadow-blue-500/5",
        radioBorder: "border-blue-500 bg-blue-500",
        radioDot: "bg-zinc-950"
      }
    }

    const getDefectStyles = (choice: string) => {
      const lower = choice.toLowerCase().trim()
      if (lower === "failed" || lower === "fail") {
        return {
          container: "border-rose-500/20 bg-rose-500/5",
          label: "text-rose-400",
          textarea: "focus:border-rose-400 focus:ring-rose-400",
          uploadBorder: "border-white/10 hover:border-rose-400"
        }
      }
      if (lower === "blocked" || lower === "block") {
        return {
          container: "border-amber-500/20 bg-amber-500/5",
          label: "text-amber-400",
          textarea: "focus:border-amber-400 focus:ring-amber-400",
          uploadBorder: "border-white/10 hover:border-amber-400"
        }
      }
      // N/A or others
      return {
        container: "border-blue-500/20 bg-blue-500/5",
        label: "text-blue-400",
        textarea: "focus:border-blue-400 focus:ring-blue-400",
        uploadBorder: "border-white/10 hover:border-blue-400"
      }
    }

    const defectStyles = getDefectStyles(selectedChoice)

    return (
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</label>
        <div className="space-y-2">
          {choices.map((choice, i) => {
            const isSelected = selectedChoice === choice
            const styles = getChoiceStyles(choice, isSelected)
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectChoice(choice)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${styles.button} disabled:opacity-50`}
              >
                <span>{choice}</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${styles.radioBorder}`}>
                  {isSelected && <div className={`w-1.5 h-1.5 rounded-full ${styles.radioDot}`} />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Dynamic Defect Details & Screenshot Upload */}
        {needsDefectInputs && (
          <div className={`space-y-4 p-4 rounded-xl border ${defectStyles.container} animate-fade-in`}>
            {/* Defect Details Textarea */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold ${defectStyles.label} uppercase tracking-wider`}>Defect Details *</label>
              <textarea
                disabled={disabled}
                value={defectDetails}
                onChange={handleDefectDetailsChange}
                placeholder="Please describe the defect or reason for blockage/exclusion..."
                rows={3}
                className={`w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${defectStyles.textarea}`}
              />
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold ${defectStyles.label} uppercase tracking-wider`}>Screenshot Attachment *</label>
              {currentScreenshotUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 p-2 group">
                  <img
                    src={currentScreenshotUrl}
                    alt="UAT Defect Screenshot"
                    className="w-full max-h-36 object-contain rounded-lg"
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="absolute top-4 right-4 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <label className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all bg-black/20 hover:bg-black/30 ${defectStyles.uploadBorder} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 text-brand-teal animate-spin" />
                        <span className="text-[10px] text-gray-400">Uploading screenshot...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] font-semibold text-gray-300">Click to upload defect screenshot</span>
                      </>
                    )}
                    <input
                      type="file"
                      disabled={disabled || uploading}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {uploadError && <p className="text-[10px] text-red-500 mt-1 font-medium">{uploadError}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // CHECKLIST
  if (field.fieldType === "CHECKLIST") {
    const steps = field.steps || []
    
    // Checked array representation
    const checkedArray: boolean[] = Array.isArray(currentValue?.checked)
      ? currentValue.checked
      : new Array(steps.length).fill(false)

    const handleCheckboxToggle = (idx: number) => {
      if (disabled) return
      const updatedChecked = [...checkedArray]
      updatedChecked[idx] = !updatedChecked[idx]
      onChange(field.id, { checked: updatedChecked }, currentScreenshotUrl || undefined)
    }

    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.fieldName}</label>
        <div className="space-y-2.5 bg-white/5 border border-white/10 p-4 rounded-xl">
          {steps.map((step, idx) => {
            const isChecked = !!checkedArray[idx]
            return (
              <label
                key={idx}
                className={`flex items-start space-x-3 text-xs select-none transition-colors ${
                  disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={isChecked}
                  onChange={() => handleCheckboxToggle(idx)}
                  className="mt-0.5 rounded border-white/10 text-brand-teal focus:ring-brand-teal accent-brand-teal w-4 h-4"
                />
                <span className={`leading-relaxed ${
                  isChecked ? "line-through text-gray-500" : "text-gray-300 font-medium"
                }`}>
                  {step}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}
