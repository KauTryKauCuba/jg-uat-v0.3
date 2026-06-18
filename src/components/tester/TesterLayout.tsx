"use client"

import * as React from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Compass } from "lucide-react"

import { HelpWidget } from "@/components/tester/HelpWidget"
import { LavaLampBackground } from "@/components/ui/lava-lamp-background"
import { ThemeToggle } from "@/components/ui/theme-toggle"

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
  const pathname = usePathname()
  const showTourBtn = pathname === "/tester"

  const handleTriggerTour = () => {
    window.dispatchEvent(new CustomEvent("trigger-tour"))
  }

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      <div className="tester-layout-root min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 right-0 h-[200px] overflow-hidden pointer-events-none z-0">
          <LavaLampBackground className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background transition-colors duration-300" />
        </div>

        {/* Top Bar - Floating Header */}
        <header className="fixed top-2 left-2 right-2 md:top-5 md:left-5 md:right-5 z-30 h-14 bg-white/70 dark:bg-zinc-950/40 border border-black/[0.08] dark:border-white/[0.08] px-4 sm:px-6 flex items-center justify-between rounded-[12px] md:rounded-[15px] shadow-lg dark:shadow-2xl dark:shadow-black/80 backdrop-blur-xl transition-colors duration-300">
          {/* Left: Logo */}
          <div className="flex items-center space-x-2">
            <Link href="/tester" className="flex items-center space-x-2 text-base font-bold text-zinc-900 dark:text-white select-none">
              <img src="/icon.png" alt="JobGiga Logo" className="w-5 h-5 object-contain" />
              <span>JobGiga UAT</span>
            </Link>
          </div>

          {/* Center: Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
            <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          </div>

          {/* Right: User + Theme + Sign Out */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[80px] sm:max-w-[150px]" title={userName}>
                {userName}
              </span>
              <span className="hidden sm:inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-cyan">
                TESTER
              </span>
            </div>
            <ThemeToggle />
            <button
              onClick={() => {
                localStorage.removeItem("jg-uat-tour-completed")
                localStorage.removeItem("jg-uat-tour-shown")
                sessionStorage.removeItem("jg-uat-tour-completed")
                sessionStorage.removeItem("jg-uat-tour-shown")
                sessionStorage.removeItem("jg-uat-tour-session-seen")
                signOut({ callbackUrl: "/" })
              }}
              className="text-xs font-semibold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="tester-container pt-24 flex-1 flex flex-col relative z-10">
          {children}
        </div>

        {showTourBtn && (
          <button
            type="button"
            onClick={handleTriggerTour}
            className="fixed bottom-6 right-24 z-50 p-4 rounded-full bg-brand-teal hover:bg-brand-teal/95 text-white shadow-xl shadow-brand-teal/20 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            title="Start Guide Tour"
          >
            <Compass className="w-6 h-6 animate-pulse" />
          </button>
        )}

        <HelpWidget />
      </div>
    </PageTitleContext.Provider>
  )
}
