"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowUp, ArrowDown, Trash2, Plus, Upload, X, Check, RefreshCw } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TestFieldWithOptions } from "@/types"

interface TestCaseFormProps {
  initialData?: {
    id?: string
    title: string
    description: string | null
    pdfUrl: string | null
    categoryId?: string | null
    timer?: number | null
    hidden?: boolean
    fields: TestFieldWithOptions[]
  }
}

interface TempField {
  id: string // Client-side unique ID
  fieldName: string
  fieldType: "TEXT" | "NUMBER" | "FILE" | "BOOLEAN" | "DROPDOWN" | "CHECKLIST"
  choices: string[]
  steps: string[]
}

export function TestCaseForm({ initialData }: TestCaseFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryCategoryId = searchParams ? searchParams.get("categoryId") : null

  const [title, setTitle] = React.useState(initialData?.title || "")
  const [description, setDescription] = React.useState(initialData?.description || "")
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(initialData?.pdfUrl || null)
  const [categories, setCategories] = React.useState<{ id: string; name: string; targetGroup: string }[]>([])
  const [categoryId, setCategoryId] = React.useState(initialData?.categoryId || queryCategoryId || "")
  const [timer, setTimer] = React.useState<number>(initialData?.timer || 0)
  const [hidden, setHidden] = React.useState(initialData?.hidden || false)
  const [loadingCategories, setLoadingCategories] = React.useState(true)

  React.useEffect(() => {
    if (queryCategoryId && !categoryId && !initialData?.categoryId) {
      setCategoryId(queryCategoryId)
    }
  }, [queryCategoryId, categoryId, initialData])
  
  const [fields, setFields] = React.useState<TempField[]>(
    initialData?.fields.map((f, idx) => ({
      id: f.id || `field-${idx}`,
      fieldName: f.fieldName,
      fieldType: f.fieldType,
      choices: f.choices || [],
      steps: f.steps || [],
    })) || []
  )

  // Fetch categories
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        const json = await res.json()
        if (json.data) {
          setCategories(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  // Uploading states
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null)

  // Drag & drop file states
  const [dragActive, setDragActive] = React.useState(false)

  // Field editing helper states
  const [newFieldName, setNewFieldName] = React.useState("")
  const [newFieldType, setNewFieldType] = React.useState<TempField["fieldType"]>("TEXT")
  const [newFieldChoices, setNewFieldChoices] = React.useState<string[]>([])
  const [newFieldSteps, setNewFieldSteps] = React.useState<string[]>([])
  const [choiceInput, setChoiceInput] = React.useState("")
  const [stepInput, setStepInput] = React.useState("")

  const handleFileUpload = (file: File) => {
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are supported")
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload/pdf", true)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        setUploadProgress(percent)
      }
    }

    xhr.onload = () => {
      setUploading(false)
      setUploadProgress(null)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText)
          if (json.error) {
            setUploadError(json.error)
          } else {
            setPdfUrl(json.data.url)
          }
        } catch (err) {
          setUploadError("Failed to parse response")
        }
      } else {
        setUploadError(`Upload failed with status ${xhr.status}`)
      }
    }

    xhr.onerror = () => {
      setUploading(false)
      setUploadProgress(null)
      setUploadError("Network error during PDF upload")
    }

    xhr.send(formData)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0])
    }
  }

  const handleAddField = () => {
    if (!newFieldName) return

    // Validations
    if (newFieldType === "DROPDOWN" && newFieldChoices.length < 2) {
      alert("Dropdown fields require at least 2 choices.")
      return
    }
    if (newFieldType === "CHECKLIST" && newFieldSteps.length < 1) {
      alert("Checklist fields require at least 1 step.")
      return
    }

    setFields([
      ...fields,
      {
        id: Math.random().toString(),
        fieldName: newFieldName,
        fieldType: newFieldType,
        choices: newFieldType === "DROPDOWN" ? newFieldChoices : [],
        steps: newFieldType === "CHECKLIST" ? newFieldSteps : [],
      },
    ])

    // Reset inputs
    setNewFieldName("")
    setNewFieldType("TEXT")
    setNewFieldChoices([])
    setNewFieldSteps([])
    setChoiceInput("")
    setStepInput("")
  }

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const moveField = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= fields.length) return
    const updated = [...fields]
    const temp = updated[index]
    updated[index] = updated[nextIndex]
    updated[nextIndex] = temp
    setFields(updated)
  }

  const addChoice = () => {
    if (choiceInput && !newFieldChoices.includes(choiceInput)) {
      setNewFieldChoices([...newFieldChoices, choiceInput])
      setChoiceInput("")
    }
  }

  const removeChoice = (idx: number) => {
    setNewFieldChoices(newFieldChoices.filter((_, i) => i !== idx))
  }

  const addStep = () => {
    if (stepInput && !newFieldSteps.includes(stepInput)) {
      setNewFieldSteps([...newFieldSteps, stepInput])
      setStepInput("")
    }
  }

  const removeStep = (idx: number) => {
    setNewFieldSteps(newFieldSteps.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (!title || !pdfUrl || !categoryId) return
    setSaving(true)

    const payload = {
      title,
      description,
      pdfUrl,
      categoryId,
      timer: timer === 0 ? null : timer,
      hidden,
      fields: [
        {
          fieldName: "Result",
          fieldType: "DROPDOWN" as const,
          choices: ["Passed", "Failed", "Blocked", "N/A - Could not execute"],
          steps: [],
          order: 0,
        }
      ],
    }

    try {
      const isEdit = !!initialData?.id
      const url = isEdit ? `/api/test-cases/${initialData.id}` : "/api/test-cases"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (json.error) {
        alert(json.error)
      } else {
        const caseId = json.data.id
        await fetch(`/api/test-cases/${caseId}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: payload.fields }),
        })
        
        router.push("/admin/test-cases")
        router.refresh()
      }
    } catch (err: any) {
      alert("Failed to save testcase config")
    } finally {
      setSaving(false)
    }
  }

  const isSaveDisabled = !title || !pdfUrl || !categoryId || saving

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold">General Information</h2>
          <div className="space-y-4">
            <div className="space-y-4">
              <label className="block text-xs text-gray-400 font-semibold">Category *</label>
              {loadingCategories ? (
                <div className="text-xs text-gray-500 py-2">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="text-xs text-amber-500 py-2">
                  No categories found. Please{" "}
                  <Link href="/admin/categories" className="text-brand-cyan hover:underline">
                    create a category
                  </Link>{" "}
                  first.
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.targetGroup.charAt(0) + c.targetGroup.slice(1).toLowerCase()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-4">
              <label className="block text-xs text-gray-400 font-semibold">UAT Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., UAT Suite for Candidate Job Search Features"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs text-gray-400 font-semibold">Timer Limit</label>
              <select
                value={timer}
                onChange={(e) => setTimer(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
              >
                <option value={0}>None</option>
                <option value={3}>3 Minutes</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                id="hidden"
                type="checkbox"
                checked={hidden}
                onChange={(e) => setHidden(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-brand-cyan focus:ring-brand-cyan cursor-pointer"
              />
              <label htmlFor="hidden" className="text-xs text-gray-300 font-semibold cursor-pointer select-none">
                Hide this test case from testers
              </label>
            </div>

            <div className="space-y-4">
              <label className="block text-xs text-gray-400 font-semibold">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Details of the scope of this testing phase..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>
          </div>
        </div>

        {/* Drag & Drop PDF */}
        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4 flex flex-col">
          <h2 className="text-lg font-bold">Verification PDF *</h2>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex-1 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center space-y-2 transition-all min-h-[280px] ${
              dragActive
                ? "border-brand-cyan bg-brand-cyan/5"
                : pdfUrl
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center space-y-3 w-full max-w-xs">
                <LoadingSpinner size="md" />
                <p className="text-xs text-gray-400">
                  Uploading PDF document... {uploadProgress !== null ? `${uploadProgress}%` : ""}
                </p>
                {uploadProgress !== null && (
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-brand-cyan h-1.5 transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ) : pdfUrl ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 rounded-full bg-emerald-500/15 text-emerald-400">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-emerald-400">PDF Uploaded Successfully</p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-cyan hover:underline truncate max-w-xs"
                >
                  {pdfUrl}
                </a>
                <button
                  type="button"
                  onClick={() => setPdfUrl(null)}
                  className="text-xs text-gray-500 hover:text-red-400 flex items-center space-x-1 pt-2 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Remove file</span>
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-500" />
                <p className="text-sm font-semibold text-gray-300">Drag and drop UAT PDF specification here</p>
                <p className="text-xs text-gray-500">Only PDF formats supported (maximum 20MB)</p>
                <label className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-xs font-semibold cursor-pointer transition-all">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </>
            )}
            {uploadError && <p className="text-xs text-red-500 pt-2 font-medium">{uploadError}</p>}
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          disabled={isSaveDisabled}
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-teal to-brand-cyan text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-brand-teal/10"
        >
          {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
          <span>{initialData?.id ? "Update Configuration" : "Publish UAT Test Case"}</span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/test-cases")}
          className="px-6 py-3.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
