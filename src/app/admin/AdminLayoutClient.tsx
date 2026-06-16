"use client"

import * as React from "react"
import { LayoutDashboard, ClipboardList, Folder, Users, BarChart3, Files, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { NavLink } from "./nav-link"
import { HelpRequestNavLink } from "@/components/admin/HelpRequestNavLink"
import { SignOutButton } from "@/components/ui/sign-out-button"
import { LavaLampBackground } from "@/components/ui/lava-lamp-background"
import { cn } from "@/lib/utils"

interface AdminLayoutClientProps {
  userEmail: string | null | undefined
  children: React.ReactNode
}

export function AdminLayoutClient({ userEmail, children }: AdminLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleToggle = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem("admin-sidebar-collapsed", String(nextState))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex font-sans relative">
      {/* Full-width background lava lamp behind sidebar and content */}
      <div className="absolute top-0 left-0 right-0 h-[200px] overflow-hidden pointer-events-none z-0">
        <LavaLampBackground className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
      </div>

      {/* Fixed Sidebar - Floating Pill Design */}
      <aside
        className={cn(
          "fixed top-5 bottom-5 left-5 z-20 border border-white/[0.08] bg-zinc-950/40 backdrop-blur-xl flex flex-col justify-between p-4 rounded-[15px] shadow-2xl shadow-black/80",
          isMounted ? "transition-all duration-300 ease-in-out" : "transition-none duration-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="space-y-8">
          {/* Logo & Toggle Header Section */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between h-8 px-1">
              <div className="flex items-center space-x-2">
                <img src="/icon.png" alt="JobGiga Logo" className="w-6 h-6 object-contain shrink-0" />
                <span className="text-base font-bold text-white select-none whitespace-nowrap">
                  JobGiga UAT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-cyan shrink-0">
                  Admin
                </span>
              </div>
              <button
                onClick={handleToggle}
                className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <img src="/icon.png" alt="JobGiga Logo" className="w-6 h-6 object-contain shrink-0" />
              <button
                onClick={handleToggle}
                className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Nav Links */}
          <nav className="space-y-2">
            <NavLink href="/admin/dashboard" isCollapsed={isCollapsed}>
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
            <NavLink href="/admin/testers" isCollapsed={isCollapsed}>
              <Users className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Testers</span>}
            </NavLink>
            <NavLink href="/admin/categories" isCollapsed={isCollapsed}>
              <Folder className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Categories</span>}
            </NavLink>
            <NavLink href="/admin/test-cases" isCollapsed={isCollapsed}>
              <ClipboardList className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Test Cases</span>}
            </NavLink>
            <NavLink href="/admin/resources" isCollapsed={isCollapsed}>
              <Files className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Testing Resources</span>}
            </NavLink>
            <NavLink href="/admin/results" isCollapsed={isCollapsed}>
              <BarChart3 className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Run Results</span>}
            </NavLink>
            <HelpRequestNavLink isCollapsed={isCollapsed} />
            <NavLink href="/admin/ai-uatgiga" isCollapsed={isCollapsed}>
              <Sparkles className="w-5 h-5 shrink-0 text-brand-cyan" />
              {!isCollapsed && <span>AI UATGiga</span>}
            </NavLink>
          </nav>
        </div>

        {/* Footer User Info & Sign Out */}
        <div className="border-t border-white/5 pt-4 space-y-3">
          {!isCollapsed ? (
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-gray-300 truncate" title={userEmail || ""}>{userEmail}</p>
              <p className="text-gray-500 font-mono text-[10px]">ROLE: ADMIN</p>
            </div>
          ) : (
            <div className="flex justify-center" title={userEmail || ""}>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-teal/10 border border-brand-teal/20 text-brand-cyan select-none uppercase">
                ADM
              </span>
            </div>
          )}
          <SignOutButton isCollapsed={isCollapsed} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 min-h-screen flex flex-col relative z-10 overflow-hidden",
          isMounted ? "transition-all duration-300 ease-in-out" : "transition-none duration-0",
          isCollapsed ? "ml-[100px]" : "ml-[276px]"
        )}
      >
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
