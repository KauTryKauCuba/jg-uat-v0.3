import { db } from "@/lib/db"
import { testCases, testFields } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { TestCaseForm } from "@/components/admin/test-case-form"

export default async function EditTestCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const caseResult = await db.select().from(testCases).where(eq(testCases.id, id)).limit(1)
  if (caseResult.length === 0) {
    redirect("/admin/test-cases")
  }

  const fieldsList = await db.select().from(testFields).where(eq(testFields.testCaseId, id)).orderBy(sql`${testFields.order} ASC`)

  const testCaseData = {
    ...caseResult[0],
    fields: fieldsList,
  }

  return (
    <main className="p-8 space-y-6 flex-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Test Case</h1>
        <p className="text-gray-400 mt-2">Modify test details and field builders for UAT.</p>
      </div>
      <TestCaseForm initialData={testCaseData} />
    </main>
  )
}
