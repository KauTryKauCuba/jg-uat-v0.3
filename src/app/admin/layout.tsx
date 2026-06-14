import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AdminLayoutClient } from "./AdminLayoutClient"

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
    <AdminLayoutClient userEmail={userEmail}>
      {children}
    </AdminLayoutClient>
  )
}
