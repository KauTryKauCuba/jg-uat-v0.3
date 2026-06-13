"use client"

import * as React from "react"
import { HelpCircle, MessageSquare, UserCheck, X, Send, Loader2 } from "lucide-react"

interface HelpRequest {
  id: string
  testerId: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
}

interface HelpMessage {
  id: string
  senderId: string
  message: string
  createdAt: string
  senderName: string
  senderRole: string
}

export function HelpWidget() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [request, setRequest] = React.useState<HelpRequest | null>(null)
  const [messages, setMessages] = React.useState<HelpMessage[]>([])
  const [newMessage, setNewMessage] = React.useState("")
  const [sending, setSending] = React.useState(false)

  // Fetch active request
  const fetchActiveRequest = React.useCallback(async () => {
    try {
      const res = await fetch("/api/help-requests")
      const json = await res.json()
      if (json.data) {
        setRequest(json.data.request)
        setMessages(json.data.messages)
      } else {
        setRequest(null)
        setMessages([])
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  // Poll for new messages/status if widget is open or if there is an active request
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchActiveRequest()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchActiveRequest])

  React.useEffect(() => {
    if (!request) return
    const interval = setInterval(() => {
      fetchActiveRequest()
    }, 4000)
    return () => clearInterval(interval)
  }, [request, fetchActiveRequest])

  const handleCreateRequest = async (type: "CHAT" | "IN_PERSON") => {
    setLoading(true)
    try {
      const res = await fetch("/api/help-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        await fetchActiveRequest()
      }
    } catch {
      alert("Failed to request help.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !request) return
    setSending(true)
    try {
      const res = await fetch(`/api/help-requests/${request.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      })
      const json = await res.json()
      if (!json.error) {
        setNewMessage("")
        await fetchActiveRequest()
      }
    } catch {
      alert("Failed to send message.")
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async () => {
    if (!request) return
    setLoading(true)
    try {
      await fetch(`/api/help-requests/${request.id}/resolve`, {
        method: "POST",
      })
      setRequest(null)
      setMessages([])
    } catch {
      alert("Failed to resolve request.")
    } finally {
      setLoading(false)
    }
  }

  // Scroll to bottom of messages
  const chatEndRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-brand-cyan hover:bg-brand-cyan/95 text-white shadow-xl shadow-brand-cyan/20 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
        title="Get Admin Help"
      >
        {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
      </button>

      {/* Help Popup Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[480px] bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md text-white">
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-brand-cyan" />
              <span className="font-bold text-sm">Ask Admin for Help</span>
            </div>
            {request && (
              <button
                onClick={handleResolve}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold transition-all disabled:opacity-50"
              >
                Close Request
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!request ? (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6 px-4">
                <div className="space-y-2">
                  <p className="font-bold text-sm text-gray-200">What kind of help do you need?</p>
                  <p className="text-xs text-gray-400">Choose an option below to contact the admin team.</p>
                </div>
                <div className="w-full flex flex-col space-y-3">
                  <button
                    onClick={() => handleCreateRequest("IN_PERSON")}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-brand-cyan" />
                    <span>In-Person Help (Desk Visit)</span>
                  </button>
                  <button
                    onClick={() => handleCreateRequest("CHAT")}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 p-3.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan/95 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-brand-cyan/10"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat Help (Online Conversation)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full space-y-3">
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1 text-center">
                  <p className="text-xs font-bold text-brand-teal">
                    {request.type === "IN_PERSON" ? "In-Person Request Active" : "Chat Session Active"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {request.type === "IN_PERSON"
                      ? "Please wait at your desk. The admin is coming to you."
                      : "Type your query below to chat with the admin."}
                  </p>
                </div>

                {/* Chat Message List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 p-2 bg-black/20 rounded-xl border border-white/5 min-h-[200px]">
                  {messages.map((m) => {
                    const isSelf = m.senderRole === "TESTER"
                    return (
                      <div key={m.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                        <span className="text-[9px] text-gray-500 px-1 font-semibold">
                          {isSelf ? "You" : m.senderName || "Admin"}
                        </span>
                        <div className={`mt-0.5 max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                          isSelf
                            ? "bg-brand-cyan text-white rounded-tr-none"
                            : "bg-zinc-800 text-gray-100 rounded-tl-none border border-white/5"
                        }`}>
                          {m.message}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Message input */}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 border-t border-white/5 pt-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan/50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="p-2.5 rounded-xl bg-brand-cyan text-white hover:bg-brand-cyan/90 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
