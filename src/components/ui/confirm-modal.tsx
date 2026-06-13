"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "neutral"
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "neutral",
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">{description}</p>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5 border border-white/5 transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all shadow-md cursor-pointer",
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-500 shadow-red-600/10"
                : "bg-gradient-to-r from-brand-teal to-brand-cyan hover:opacity-90 shadow-brand-teal/10"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
export default ConfirmModal;
