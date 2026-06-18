"use client"

import * as React from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("dark")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      localStorage.theme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.theme = "light"
    }
  }

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full border border-black/5 dark:border-white/5 bg-white/10 dark:bg-zinc-900/10 animate-pulse" />
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 text-gray-800 dark:text-gray-200 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white dark:hover:bg-zinc-800 focus:outline-none cursor-pointer"
      aria-label="Toggle dark mode"
    >
      <div className="relative w-5 h-5">
        <span
          className={`absolute inset-0 transform transition-all duration-500 ease-in-out ${
            theme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-50"
          }`}
        >
          <Moon className="w-5 h-5 text-brand-cyan" />
        </span>
        <span
          className={`absolute inset-0 transform transition-all duration-500 ease-in-out ${
            theme === "light"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-50"
          }`}
        >
          <Sun className="w-5 h-5 text-brand-teal" />
        </span>
      </div>
    </button>
  )
}
