"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-brand-teal/15 to-brand-cyan/15 border border-brand-teal/20 text-brand-cyan"
          : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
      )}
    >
      {children}
    </Link>
  )
}
export default NavLink;
