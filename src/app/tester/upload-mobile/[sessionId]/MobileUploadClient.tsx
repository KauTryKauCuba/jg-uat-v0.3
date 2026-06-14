"use client"

import * as React from "react"
import { Upload, CheckCircle2, Loader2, Camera, RefreshCw } from "lucide-react"

interface MobileUploadClientProps {
  sessionId: string
  initialStatus: string
}

const compressImage = (file: File, maxW = 1600, maxH = 1600, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    // Only compress images
    if (!file.type.startsWith("image/")) {
      resolve(file)
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions to fit within bounds
        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width)
            width = maxW
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height)
            height = maxH
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          "image/jpeg",
          quality
        )
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}

export default function MobileUploadClient({ sessionId, initialStatus }: MobileUploadClientProps) {
  const [status, setStatus] = React.useState(initialStatus)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const compressed = await compressImage(file)
      setSelectedFile(compressed)

      // Generate preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(compressed)
    } catch {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const res = await fetch(`/api/mobile-upload/${sessionId}`, {
        method: "POST",
        body: formData,
      })
      const json = await res.json()

      if (json.error) {
        setError(json.error)
      } else {
        setStatus("COMPLETED")
      }
    } catch {
      setError("An unexpected error occurred during upload. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  if (status === "COMPLETED") {
    return (
      <div className="space-y-6 py-4 animate-fade-in">
        <div className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-12 h-12" />
          <h2 className="text-lg font-bold">Upload Successful!</h2>
          <p className="text-xs text-gray-300 text-center leading-relaxed">
            The photo has been successfully attached to your UAT test run. You can now return to your computer.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {previewUrl ? (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-2">
            <img
              src={previewUrl}
              alt="Preview of captured photo"
              className="w-full max-h-64 object-contain rounded-xl"
            />
          </div>

          <div className="flex gap-3">
            <label className="relative flex-1 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
              <span>Retake</span>
              <input
                type="file"
                disabled={uploading}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
            <button
              type="button"
              disabled={uploading}
              onClick={handleUpload}
              className="flex-1 py-3 px-4 rounded-xl bg-brand-teal hover:opacity-90 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-brand-teal/10 cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="relative w-full py-8 px-6 rounded-2xl border border-dashed border-white/20 bg-black/30 hover:border-brand-teal hover:bg-black/50 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group">
            <div className="p-3 rounded-full bg-white/5 border border-white/10 text-gray-400 group-hover:text-brand-teal group-hover:border-brand-teal/30 transition-all">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-center">
              <span className="text-sm font-bold text-gray-200 block">Use Phone Camera</span>
              <span className="text-[10px] text-gray-500 block">Tap here to take a photo or select an image</span>
            </div>
            <input
              type="file"
              disabled={uploading}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-semibold leading-relaxed border border-red-500/10 bg-red-500/5 p-3 rounded-xl">
          {error}
        </p>
      )}
    </div>
  )
}
