"use client"

import * as React from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react"

// Configure pdfjs worker dynamically matching the loaded library version
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  fileUrl: string
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = React.useState<number | null>(null)
  const [pageNumber, setPageNumber] = React.useState(1)
  const [scale, setScale] = React.useState(1.0)
  const [error, setError] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
    setError(null)
  }

  function onDocumentLoadError(err: Error) {
    console.error("PDF load error:", err)
    setError("Failed to load PDF UAT specification.")
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 2.0))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const scrollToPage = (pageNum: number) => {
    if (!containerRef.current) return
    const el = containerRef.current.querySelector(`[data-page-number="${pageNum}"]`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handlePrevPage = () => {
    const prev = Math.max(pageNumber - 1, 1)
    setPageNumber(prev)
    scrollToPage(prev)
  }

  const handleNextPage = () => {
    if (numPages) {
      const next = Math.min(pageNumber + 1, numPages)
      setPageNumber(next)
      scrollToPage(next)
    }
  }

  // Update active page number on scroll
  React.useEffect(() => {
    if (!numPages || !containerRef.current) return

    const container = containerRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageAttr = entry.target.getAttribute("data-page-number")
            if (pageAttr) {
              setPageNumber(parseInt(pageAttr, 10))
            }
          }
        })
      },
      {
        root: container,
        threshold: 0.3,
      }
    )

    const pages = container.querySelectorAll("[data-page-number]")
    pages.forEach((page) => observer.observe(page))

    return () => observer.disconnect()
  }, [numPages])

  return (
    <div className="relative flex flex-col h-full bg-zinc-950/40 border border-white/5 overflow-hidden select-none backdrop-blur-md">
      {/* Scrollable PDF container */}
      <div ref={containerRef} className="flex-1 overflow-auto p-6 flex flex-col items-center pb-20 space-y-6">
        {error ? (
          <div className="m-auto text-sm text-red-400 bg-red-950/20 border border-red-500/20 px-4 py-3 rounded-xl max-w-md text-center font-medium">
            {error}
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="m-auto flex flex-col items-center justify-center space-y-2 py-20">
                <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
                <p className="text-xs text-gray-400">Loading PDF document...</p>
              </div>
            }
          >
            <div className="flex flex-col items-center space-y-6">
              {Array.from(new Array(numPages || 0), (el, index) => {
                const pageNum = index + 1
                return (
                  <div
                    key={pageNum}
                    data-page-number={pageNum}
                    className="bg-zinc-900 border border-white/10 shadow-2xl shadow-black/50 rounded-lg overflow-hidden"
                  >
                    <Page
                      pageNumber={pageNum}
                      scale={scale}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      width={700}
                      className="max-w-full"
                    />
                  </div>
                )
              })}
            </div>
          </Document>
        )}
      </div>

      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/60 border-t border-white/5 px-6 flex items-center justify-between shadow-lg backdrop-blur-md text-white">
        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={handlePrevPage}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!numPages || pageNumber >= numPages}
            onClick={handleNextPage}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Page X of Y */}
        <div className="text-xs font-semibold text-gray-300">
          Page {pageNumber} of {numPages || "?"}
        </div>

        {/* Zoom */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={scale <= 0.5}
            onClick={handleZoomOut}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-gray-400 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            disabled={scale >= 2.0}
            onClick={handleZoomIn}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
