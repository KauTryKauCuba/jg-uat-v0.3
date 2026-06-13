"use client"

import * as React from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"

import { HelpWidget } from "@/components/tester/HelpWidget"
import { LavaLampBackground } from "@/components/ui/lava-lamp-background"

const PageTitleContext = React.createContext<{
  title: string
  setTitle: (title: string) => void
}>({
  title: "Tester Dashboard",
  setTitle: () => {},
})

export function usePageTitle(initialTitle?: string) {
  const { title, setTitle } = React.useContext(PageTitleContext)
  React.useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle)
    }
  }, [initialTitle, setTitle])
  return { title, setTitle }
}

interface TesterLayoutProps {
  userName: string
  children: React.ReactNode
}

export function TesterLayout({ userName, children }: TesterLayoutProps) {
  const [title, setTitle] = React.useState("Tester Dashboard")

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[200px] overflow-hidden pointer-events-none z-0">
          <LavaLampBackground className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
        </div>

        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-black/60 border-b border-white/5 px-6 flex items-center justify-between shadow-sm backdrop-blur-md">
          {/* Left: Logo */}
          <div className="flex items-center space-x-2">
            <Link href="/tester" className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-teal to-brand-cyan select-none">
              JobGiga UAT
            </Link>
          </div>

          {/* Center: Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
            <h1 className="text-sm font-semibold text-gray-200">{title}</h1>
          </div>

          {/* Right: User + Sign Out */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="text-xs font-semibold text-gray-300 truncate max-w-[80px] sm:max-w-[150px]" title={userName}>
                {userName}
              </span>
              <span className="hidden sm:inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-cyan">
                TESTER
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs font-semibold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-all cursor-pointer shrink-0"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="pt-14 flex-1 flex flex-col relative z-10">
          {children}
        </div>

        <HelpWidget />
      </div>
    </PageTitleContext.Provider>
  )
}
