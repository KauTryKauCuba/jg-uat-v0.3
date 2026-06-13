import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { testRuns, testCases, testFields, testAnswers } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { TestRunClient } from "@/components/tester/TestRunClient"

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/")
  }

  const { id: runId } = await params

  // Fetch the run metadata
  const runResult = await db
    .select()
    .from(testRuns)
    .where(eq(testRuns.id, runId))
    .limit(1)

  if (runResult.length === 0) {
    redirect("/tester")
  }

  const run = runResult[0]

  // Validate ownership: only run owner or admin can access
  if (session.user.role !== "ADMIN" && run.testerId !== session.user.id) {
    redirect("/tester")
  }

  // Fetch associated test case
  const caseResult = await db
    .select({
      id: testCases.id,
      title: testCases.title,
      pdfUrl: testCases.pdfUrl,
      timer: testCases.timer,
    })
    .from(testCases)
    .where(eq(testCases.id, run.testCaseId))
    .limit(1)

  if (caseResult.length === 0) {
    redirect("/tester")
  }

  const testCase = caseResult[0]

  // Fetch test fields ordered by order ASC
  const fields = await db
    .select({
      id: testFields.id,
      testCaseId: testFields.testCaseId,
      fieldName: testFields.fieldName,
      fieldType: testFields.fieldType,
      choices: testFields.choices,
      steps: testFields.steps,
      order: testFields.order,
    })
    .from(testFields)
    .where(eq(testFields.testCaseId, testCase.id))
    .orderBy(sql`${testFields.order} ASC`)

  // Fetch existing answers
  const answersList = await db
    .select()
    .from(testAnswers)
    .where(eq(testAnswers.testRunId, run.id))

  const answersMap: Record<string, any> = {}
  answersList.forEach((ans) => {
    answersMap[ans.testFieldId] = {
      id: ans.id,
      value: ans.value ? JSON.parse(ans.value) : null,
      screenshotUrl: ans.screenshotUrl,
    }
  })

  const runData = {
    id: run.id,
    status: run.status,
    submittedAt: run.submittedAt ? run.submittedAt.toISOString() : null,
    createdAt: run.createdAt.toISOString(),
    testCase: {
      ...testCase,
      fields,
    },
    answers: answersMap,
  }

  return <TestRunClient run={runData} />
}
