"use client"

import * as React from "react"
import { HelpCircle, MessageSquare, UserCheck, Send, Loader2, CheckCircle } from "lucide-react"

interface HelpRequest {
  id: string
  type: string
  status: string
  createdAt: string
  testerName: string
  testerEmail: string
}

interface Message {
  id: string
  senderId: string
  message: string
  createdAt: string
  senderName: string
  senderRole: string
}

export default function AdminHelpRequests() {
  const [requests, setRequests] = React.useState<HelpRequest[]>([])
  const [selectedRequest, setSelectedRequest] = React.useState<HelpRequest | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [newMessage, setNewMessage] = React.useState("")
  const [loadingRequests, setLoadingRequests] = React.useState(true)
  const [loadingMessages, setLoadingMessages] = React.useState(false)
  const [sendingMessage, setSendingMessage] = React.useState(false)
  const [resolving, setResolving] = React.useState(false)

  const fetchRequests = React.useCallback(async () => {
    try {
      const res = await fetch("/api/help-requests")
      const json = await res.json()
      if (json.data) {
        setRequests(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  const fetchMessages = React.useCallback(async (requestId: string) => {
    try {
      const messagesRes = await fetch(`/api/help-requests/${requestId}/messages`)
      const messagesJson = await messagesRes.json()
      if (messagesJson.data) {
        setMessages(messagesJson.data)
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  // Poll for requests list and messages
  React.useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 5000)
    return () => clearInterval(interval)
  }, [fetchRequests])

  React.useEffect(() => {
    if (!selectedRequest) return
    fetchMessages(selectedRequest.id)
    const interval = setInterval(() => {
      fetchMessages(selectedRequest.id)
    }, 4000)
    return () => clearInterval(interval)
  }, [selectedRequest, fetchMessages])

  const handleSelectRequest = (req: HelpRequest) => {
    setSelectedRequest(req)
    setMessages([])
    fetchMessages(req.id)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRequest) return
    setSendingMessage(true)
    try {
      const res = await fetch(`/api/help-requests/${selectedRequest.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      })
      const json = await res.json()
      if (!json.error) {
        setNewMessage("")
        fetchMessages(selectedRequest.id)
      }
    } catch {
      alert("Failed to send message.")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleResolve = async () => {
    if (!selectedRequest) return
    setResolving(true)
    try {
      const res = await fetch(`/api/help-requests/${selectedRequest.id}/resolve`, {
        method: "POST",
      })
      const json = await res.json()
      if (!json.error) {
        setSelectedRequest(null)
        setMessages([])
        fetchRequests()
      }
    } catch {
      alert("Failed to resolve request.")
    } finally {
      setResolving(false)
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
    <main className="p-8 space-y-8 flex-1 flex flex-col h-screen overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help Requests</h1>
        <p className="text-gray-400 mt-2">Manage tester help requests, chat with testers, and close tickets.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 min-h-0">
        {/* Left column: List of pending requests */}
        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Incoming Requests ({requests.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingRequests ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
              </div>
            ) : requests.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center text-gray-500 py-10">
                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold">All requests resolved!</p>
                <p className="text-xs text-gray-600 mt-1">No testers currently need assistance.</p>
              </div>
            ) : (
              requests.map((req) => {
                const isActive = selectedRequest?.id === req.id
                return (
                  <button
                    key={req.id}
                    onClick={() => handleSelectRequest(req)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col space-y-2 cursor-pointer ${
                      isActive
                        ? "bg-brand-cyan/10 border-brand-cyan/30 text-white"
                        : "bg-black/20 border-white/5 hover:border-white/10 text-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs">{req.testerName}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                        req.type === "IN_PERSON"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-brand-teal/10 text-brand-cyan border border-brand-teal/20"
                      }`}>
                        {req.type === "IN_PERSON" ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>In Person</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3 h-3" />
                            <span>Chat</span>
                          </>
                        )}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Started: {new Date(req.createdAt).toLocaleTimeString()}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right columns: Chat panel */}
        <div className="md:col-span-2 border border-white/5 bg-zinc-900/40 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden">
          {selectedRequest ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold">{selectedRequest.testerName}</h2>
                  <p className="text-[11px] text-gray-400">{selectedRequest.testerEmail}</p>
                </div>
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-500/90 text-white font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {resolving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Resolve Request</span>
                </button>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedRequest.type === "IN_PERSON" && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex items-start space-x-2">
                    <UserCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">In-Person Desk Visit Requested</p>
                      <p className="mt-1 text-gray-300">Please go visit the tester at their desk to assist. You can also chat with them below if needed, or close the ticket here when resolved.</p>
                    </div>
                  </div>
                )}

                {/* Message Log */}
                <div className="space-y-4">
                  {messages.map((m) => {
                    const isSelf = m.senderRole === "ADMIN"
                    return (
                      <div key={m.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-gray-500 px-1 font-semibold">
                          {isSelf ? "You (Admin)" : m.senderName || "Tester"}
                        </span>
                        <div className={`mt-1 max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${
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
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/5">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan/50"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="p-3 rounded-xl bg-brand-cyan text-white hover:bg-brand-cyan/90 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500 p-8">
              <HelpCircle className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm font-semibold">No Request Selected</p>
              <p className="text-xs text-gray-600 mt-1">Select an incoming help request from the list to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
