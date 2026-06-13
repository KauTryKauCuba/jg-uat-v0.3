"use client"

import * as React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Image as ImageIcon, FileText, Trash2, Loader2, Upload, Check } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface ResourceSet {
  id: string
  name: string
  photoUrl: string
  resumeUrl: string
  icUrl: string
  createdAt: string
}

export default function ResourcesPage() {
  const [resourceSets, setResourceSets] = React.useState<ResourceSet[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Form states
  const [name, setName] = React.useState("")
  const [photoUrl, setPhotoUrl] = React.useState("")
  const [resumeUrl, setResumeUrl] = React.useState("")
  const [icUrl, setIcUrl] = React.useState("")
  
  // Upload indicators
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false)
  const [uploadingResume, setUploadingResume] = React.useState(false)
  const [uploadingIc, setUploadingIc] = React.useState(false)

  const [submitting, setSubmitting] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const fetchSets = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/resources")
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setResourceSets(json.data || [])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load resource sets")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchSets()
  }, [])

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "resume" | "ic"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    if (type === "photo") setUploadingPhoto(true)
    if (type === "resume") setUploadingResume(true)
    if (type === "ic") setUploadingIc(true)

    try {
      const endpoint = type === "resume" ? "/api/upload/pdf" : "/api/upload/screenshot"
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        const url = json.data.url
        if (type === "photo") setPhotoUrl(url)
        if (type === "resume") setResumeUrl(url)
        if (type === "ic") setIcUrl(url)
      }
    } catch (err) {
      alert("File upload failed. Please try again.")
    } finally {
      if (type === "photo") setUploadingPhoto(false)
      if (type === "resume") setUploadingResume(false)
      if (type === "ic") setUploadingIc(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/admin/resources/${deletingId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setResourceSets(resourceSets.filter((s) => s.id !== deletingId))
      }
    } catch {
      alert("Failed to delete resource set")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !photoUrl || !resumeUrl || !icUrl) {
      alert("Please enter a name and upload all required files.")
      return
    }
    setSubmitting(true)

    try {
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, photoUrl, resumeUrl, icUrl }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setResourceSets([json.data, ...resourceSets])
        setName("")
        setPhotoUrl("")
        setResumeUrl("")
        setIcUrl("")
      }
    } catch (err: any) {
      alert("Failed to create resource set.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="p-8 space-y-6 flex-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">UAT Testing Resource Sets</h1>
        <p className="text-gray-400 mt-2">Manage sets of mock credentials (Photo, Resume, and IC Card) that testers can download as a package.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Resource Set Form */}
        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl h-fit space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-cyan" />
            <span>New Resource Set</span>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold">Set Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Set A (Malaysian Specimen)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all"
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold block mb-1">Portrait Photo *</label>
              {photoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <img src={photoUrl} className="w-10 h-10 object-cover rounded-lg shrink-0" alt="Preview" />
                    <span className="text-xs text-gray-400 truncate">{photoUrl.split("/").pop()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    className="text-xs font-semibold px-2 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-white/10 hover:border-brand-cyan/40 bg-white/5 hover:bg-white/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 text-brand-teal animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-300">Upload Portrait PNG/JPG</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingPhoto}
                    onChange={(e) => handleFileUpload(e, "photo")}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Resume Upload */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold block mb-1">Resume PDF *</label>
              {resumeUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-10 h-10 text-rose-400 shrink-0 p-2 bg-rose-500/10 rounded-lg" />
                    <span className="text-xs text-gray-400 truncate">{resumeUrl.split("/").pop()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeUrl("")}
                    className="text-xs font-semibold px-2 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-white/10 hover:border-brand-cyan/40 bg-white/5 hover:bg-white/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                  {uploadingResume ? (
                    <Loader2 className="w-5 h-5 text-brand-teal animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-300">Upload Resume PDF</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    disabled={uploadingResume}
                    onChange={(e) => handleFileUpload(e, "resume")}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* IC Card Upload */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold block mb-1">IC Card Image *</label>
              {icUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <img src={icUrl} className="w-10 h-10 object-cover rounded-lg shrink-0" alt="Preview" />
                    <span className="text-xs text-gray-400 truncate">{icUrl.split("/").pop()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIcUrl("")}
                    className="text-xs font-semibold px-2 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-white/10 hover:border-brand-cyan/40 bg-white/5 hover:bg-white/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                  {uploadingIc ? (
                    <Loader2 className="w-5 h-5 text-brand-teal animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-300">Upload IC Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingIc}
                    onChange={(e) => handleFileUpload(e, "ic")}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !name || !photoUrl || !resumeUrl || !icUrl}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-teal to-brand-cyan hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-brand-teal/10 flex items-center justify-center space-x-1.5"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{submitting ? "Creating Set..." : "Create Resource Set"}</span>
            </button>
          </form>
        </div>

        {/* Resource Sets List */}
        <div className="lg:col-span-2 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold">UAT Resource Sets List</h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="md" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 border border-red-500/20 bg-red-500/10 rounded-xl">
              {error}
            </div>
          ) : resourceSets.length === 0 ? (
            <p className="text-xs text-gray-500 py-16 text-center">
              No UAT resource sets created yet. Add one using the form on the left.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01]">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6 text-center">Photo</th>
                    <th className="py-4 px-6 text-center">Resume</th>
                    <th className="py-4 px-6 text-center">IC Card</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceSets.map((set) => (
                    <tr key={set.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-semibold">{set.name}</td>
                      <td className="py-4 px-6 text-center">
                        <a href={set.photoUrl} target="_blank" rel="noreferrer" className="inline-block relative group">
                          <img src={set.photoUrl} className="w-8 h-8 object-cover rounded-lg border border-white/10 group-hover:scale-105 transition-transform" alt="Photo" />
                        </a>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <a href={set.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all">
                          <FileText className="w-4 h-4" />
                        </a>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <a href={set.icUrl} target="_blank" rel="noreferrer" className="inline-block relative group">
                          <img src={set.icUrl} className="w-8 h-8 object-cover rounded-lg border border-white/10 group-hover:scale-105 transition-transform" alt="IC" />
                        </a>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setDeletingId(set.id)}
                          className="p-2 rounded-lg border border-white/5 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                          title="Delete Set"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Resource Set?"
        description="Are you sure you want to permanently delete this resource set? Testers will no longer be able to select or download this set's assets."
        confirmText="Delete permanently"
        variant="destructive"
      />
    </main>
  )
}
