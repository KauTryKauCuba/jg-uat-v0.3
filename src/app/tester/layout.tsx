import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { TesterLayout } from "@/components/tester/TesterLayout"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "TESTER") {
    redirect("/")
  }

  const userName = session.user.name || session.user.email || "Tester"

  return (
    <TesterLayout userName={userName}>
      {children}
    </TesterLayout>
  )
}
