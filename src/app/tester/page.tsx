import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { testCases, testRuns, testCaseCategories, testFields, testAnswers } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { TesterPageClient } from "@/components/tester/TesterPageClient"

export default async function TesterPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "TESTER") {
    redirect("/")
  }

  const testerGroup = session.user.testerGroup
  const employerLocked = session.user.employerLocked

  let categories: any[] = []
  let cases: any[] = []

  // Only query database if they have selected a group and are not locked
  if (testerGroup && !(testerGroup === "EMPLOYER" && employerLocked)) {
    // Fetch all categories for this group ordered by order ASC
    categories = await db
      .select({
        id: testCaseCategories.id,
        name: testCaseCategories.name,
      })
      .from(testCaseCategories)
      .where(eq(testCaseCategories.targetGroup, testerGroup))
      .orderBy(sql`${testCaseCategories.order} ASC`);

    // Fetch test cases joined with runs and answers for this tester
    const rawCases = await db
      .select({
        id: testCases.id,
        title: testCases.title,
        description: testCases.description,
        categoryId: testCases.categoryId,
        timer: testCases.timer,
        fieldsCount: sql<number>`count(distinct ${testFields.id})::int`,
        runStatus: testRuns.status,
        runId: testRuns.id,
        runCreatedAt: testRuns.createdAt,
        runResultValue: testAnswers.value,
      })
      .from(testCases)
      .leftJoin(testFields, eq(testFields.testCaseId, testCases.id))
      .leftJoin(testCaseCategories, eq(testCaseCategories.id, testCases.categoryId))
      .leftJoin(
        testRuns,
        and(
          eq(testRuns.testCaseId, testCases.id),
          eq(testRuns.testerId, session.user.id)
        )
      )
      .leftJoin(
        testAnswers,
        eq(testAnswers.testRunId, testRuns.id)
      )
      .where(
        and(
          eq(testCaseCategories.targetGroup, testerGroup),
          eq(testCases.hidden, false)
        )
      )
      .groupBy(
        testCases.id,
        testCases.title,
        testCases.description,
        testCases.categoryId,
        testCases.timer,
        testRuns.id,
        testRuns.status,
        testRuns.createdAt,
        testAnswers.value
      )
      .orderBy(sql`${testCases.order} ASC, ${testCases.createdAt} DESC`);

    // Map database status to testerStatus
    const mappedCases = rawCases.map((c) => {
      let testerStatus = "not_started"
      if (c.runStatus === "PENDING") {
        testerStatus = "in_progress"
      } else if (
        c.runStatus === "SUBMITTED" ||
        c.runStatus === "PASSED" ||
        c.runStatus === "FAILED"
      ) {
        testerStatus = "submitted"
      }

      let runResult: string | null = null
      if (c.runResultValue) {
        try {
          const parsed = JSON.parse(c.runResultValue)
          if (typeof parsed === "object" && parsed !== null) {
            runResult = parsed.choice || null
          } else {
            runResult = String(parsed || "")
          }
        } catch {
          runResult = String(c.runResultValue)
        }
      }

      return {
        id: c.id,
        title: c.title,
        description: c.description || "",
        categoryId: c.categoryId,
        timer: c.timer,
        fieldsCount: c.fieldsCount,
        runId: c.runId || null,
        runCreatedAt: c.runCreatedAt ? c.runCreatedAt.toISOString() : null,
        testerStatus,
        runResult,
      }
    })

    // Order categories and their cases globally to determine lock sequence
    const orderedCases: typeof mappedCases = [];
    for (const cat of categories) {
      const catCases = mappedCases.filter((c) => c.categoryId === cat.id);
      orderedCases.push(...catCases);
    }
    const uncategorizedCases = mappedCases.filter((c) => !c.categoryId);
    orderedCases.push(...uncategorizedCases);

    // Determine locked status sequentially 1-by-1
    let previousCasesSubmitted = true;
    cases = orderedCases.map((c) => {
      const isLocked = !previousCasesSubmitted;
      if (c.testerStatus !== "submitted") {
        previousCasesSubmitted = false;
      }
      return {
        ...c,
        locked: isLocked,
      };
    });
  }

  return (
    <TesterPageClient
      initialCategories={categories}
      initialCases={cases}
      userName={session?.user?.name || "Tester"}
      testerGroup={testerGroup as "JOBSEEKER" | "EMPLOYER" | null}
      employerLocked={employerLocked}
      testerId={session.user.id}
    />
  )
}
