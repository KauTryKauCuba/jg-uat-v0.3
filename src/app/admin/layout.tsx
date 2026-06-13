import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { SignOutButton } from "@/components/ui/sign-out-button"
import Link from "next/link"
import { LayoutDashboard, ClipboardList, Folder, Users, BarChart3, Files } from "lucide-react"
import { NavLink } from "./nav-link"
import { HelpRequestNavLink } from "@/components/admin/HelpRequestNavLink"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const userEmail = session.user.email

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex font-sans">

      {/* Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-white/5 bg-black/60 backdrop-blur-md flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-teal to-brand-cyan select-none">
              JobGiga UAT
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-cyan">
              Admin
            </span>
          </div>

          {/* Nav Links */}
          <nav className="space-y-2">
            <NavLink href="/admin/dashboard">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink href="/admin/testers">
              <Users className="w-5 h-5" />
              <span>Testers</span>
            </NavLink>
            <NavLink href="/admin/categories">
              <Folder className="w-5 h-5" />
              <span>Categories</span>
            </NavLink>
            <NavLink href="/admin/test-cases">
              <ClipboardList className="w-5 h-5" />
              <span>Test Cases</span>
            </NavLink>
            <NavLink href="/admin/resources">
              <Files className="w-5 h-5" />
              <span>Testing Resources</span>
            </NavLink>
            <NavLink href="/admin/results">
              <BarChart3 className="w-5 h-5" />
              <span>Run Results</span>
            </NavLink>
            <HelpRequestNavLink />
          </nav>
        </div>

        {/* Footer User Info & Sign Out */}
        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-gray-300 truncate">{userEmail}</p>
            <p className="text-gray-500 font-mono text-[10px]">ROLE: ADMIN</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col relative z-10">
        {children}
      </div>
    </div>
  )
}
