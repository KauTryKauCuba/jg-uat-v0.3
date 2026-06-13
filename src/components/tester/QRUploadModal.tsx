"use client"

import * as React from "react"
import { X, Smartphone, Loader2, QrCode, CheckCircle2 } from "lucide-react"
import QRCode from "qrcode"

interface QRUploadModalProps {
  isOpen: boolean
  onClose: () => void
  testRunId: string
  testFieldId: string
  onUploadComplete: (imageUrl: string) => void
}

export function QRUploadModal({
  isOpen,
  onClose,
  testRunId,
  testFieldId,
  onUploadComplete,
}: QRUploadModalProps) {
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isCompleted, setIsCompleted] = React.useState(false)

  // Initialize session
  React.useEffect(() => {
    if (!isOpen) {
      setSessionId(null)
      setQrCodeDataUrl(null)
      setIsCompleted(false)
      setError(null)
      return
    }

    const createSession = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/mobile-upload/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testRunId, testFieldId }),
        })
        const json = await res.json()
        if (json.error) {
          setError(json.error)
        } else {
          setSessionId(json.data.sessionId)
        }
      } catch {
        setError("Failed to initialize upload session.")
      } finally {
        setLoading(false)
      }
    }

    createSession()
  }, [isOpen, testRunId, testFieldId])

  // Generate local QR Code
  React.useEffect(() => {
    if (!sessionId) {
      setQrCodeDataUrl(null)
      return
    }
    const mobilePageUrl = `${window.location.origin}/tester/upload-mobile/${sessionId}`
    QRCode.toDataURL(mobilePageUrl, { width: 250, margin: 2 })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Failed to generate QR code:", err))
  }, [sessionId])

  // Poll session status
  React.useEffect(() => {
    if (!isOpen || !sessionId || isCompleted) return

    let intervalId: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/mobile-upload/${sessionId}`, {
          method: "POST",
        })
        const json = await res.json()
        
        // Log status to help debugging
        console.log("QR Poll Response:", json.data)

        if (json.data && json.data.status === "COMPLETED") {
          const imageUrl = json.data.imageUrl || json.data.image_url
          if (imageUrl) {
            setIsCompleted(true)
            clearInterval(intervalId)
            
            // Let the user see completion before closing
            setTimeout(() => {
              onUploadComplete(imageUrl)
              onClose()
            }, 1500)
          }
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }

    intervalId = setInterval(checkStatus, 2000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOpen, sessionId, isCompleted, onUploadComplete, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-brand-cyan" />
            <h3 className="font-bold text-white text-base">Upload with Phone</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center justify-center py-4 text-center space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-3 py-10">
              <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
              <p className="text-xs text-gray-400">Generating QR code link...</p>
            </div>
          )}

          {error && (
            <div className="py-10 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {sessionId && !loading && !error && (
            <>
              {isCompleted ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-6 animate-fade-in text-emerald-400">
                  <CheckCircle2 className="w-12 h-12" />
                  <p className="text-sm font-bold">Photo Received!</p>
                  <p className="text-xs text-gray-400">Syncing with desktop UAT run...</p>
                </div>
              ) : (
                <div className="space-y-6 flex flex-col items-center">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-300 font-semibold">Scan QR Code with your Phone</p>
                    <p className="text-[10px] text-gray-500 max-w-[280px] leading-relaxed mx-auto">
                      Open your phone camera, scan the QR code to take a photo directly and instantly link it here.
                    </p>
                  </div>

                  {/* QR Code Frame */}
                  <div className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center min-w-[200px] min-h-[200px]">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Scan to upload screenshot"
                        className="w-48 h-48"
                      />
                    ) : (
                      <Loader2 className="w-8 h-8 text-zinc-950 animate-spin" />
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-brand-cyan font-bold uppercase tracking-wider animate-pulse bg-brand-cyan/5 border border-brand-cyan/20 px-3 py-1.5 rounded-full">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Waiting for mobile capture...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
