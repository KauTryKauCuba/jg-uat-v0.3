import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testCases, testFields, testRuns, users, testAnswers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    // 1. Core counters
    const totalCasesQuery = await db.select({ count: sql<number>`count(*)::int` }).from(testCases);
    const totalCases = totalCasesQuery[0]?.count || 0;

    const totalRunsQuery = await db.select({ count: sql<number>`count(*)::int` }).from(testRuns);
    const totalRuns = totalRunsQuery[0]?.count || 0;

    const submittedRunsQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testRuns)
      .where(sql`${testRuns.status} != 'PENDING'`);
    const submittedRuns = submittedRunsQuery[0]?.count || 0;

    const inProgressRunsQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testRuns)
      .where(eq(testRuns.status, "PENDING"));
    const inProgressRuns = inProgressRunsQuery[0]?.count || 0;

    // Fetch all answers for submitted runs to calculate pass rate dynamically
    const submittedAnswers = await db
      .select({
        value: testAnswers.value,
      })
      .from(testAnswers)
      .innerJoin(testRuns, eq(testRuns.id, testAnswers.testRunId))
      .where(sql`${testRuns.status} != 'PENDING'`);

    let passedAnswers = 0;
    let totalUatAnswers = 0;

    for (const ans of submittedAnswers) {
      if (ans.value) {
        let choice = "";
        try {
          const parsed = JSON.parse(ans.value);
          if (typeof parsed === "object" && parsed !== null) {
            choice = parsed.choice || "";
          } else {
            choice = String(parsed || "");
          }
        } catch {
          choice = String(ans.value || "");
        }

        const choiceLower = choice.toLowerCase().trim();
        if (choiceLower === "passed" || choiceLower === "pass" || choiceLower === "true") {
          passedAnswers++;
          totalUatAnswers++;
        } else if (
          choiceLower === "failed" ||
          choiceLower === "fail" ||
          choiceLower === "false" ||
          choiceLower === "blocked" ||
          choiceLower === "block" ||
          choiceLower.includes("n/a") ||
          choiceLower.includes("na") ||
          choiceLower.includes("not execute") ||
          choiceLower.includes("could not")
        ) {
          totalUatAnswers++;
        }
      }
    }

    const passRate = totalUatAnswers > 0 
      ? Math.round((passedAnswers / totalUatAnswers) * 100) 
      : 0;

    // 2. Recent 5 test cases
    const recentCases = await db
      .select({
        id: testCases.id,
        title: testCases.title,
        createdAt: testCases.createdAt,
        fieldsCount: sql<number>`count(distinct ${testFields.id})::int`,
        runsCount: sql<number>`count(distinct ${testRuns.id})::int`,
      })
      .from(testCases)
      .leftJoin(testFields, eq(testFields.testCaseId, testCases.id))
      .leftJoin(testRuns, eq(testRuns.testCaseId, testCases.id))
      .groupBy(testCases.id, testCases.title, testCases.createdAt)
      .orderBy(sql`${testCases.createdAt} DESC`)
      .limit(5);

    // 3. Top 5 testers by submitted run count
    const topTesters = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        submittedCount: sql<number>`count(distinct case when ${testRuns.status} != 'PENDING' then ${testRuns.id} end)::int`,
      })
      .from(users)
      .leftJoin(testRuns, eq(testRuns.testerId, users.id))
      .where(eq(users.role, "TESTER"))
      .groupBy(users.id, users.name, users.email)
      .orderBy(sql`count(distinct case when ${testRuns.status} != 'PENDING' then ${testRuns.id} end) DESC`)
      .limit(5);

    return NextResponse.json({
      data: {
        totalTestCases: totalCases,
        totalRuns,
        submittedRuns,
        inProgressRuns,
        passRate,
        recentTestCases: recentCases,
        topTesters,
      },
      error: null,
    });
  } catch (error: any) {
    console.error("GET admin stats failed:", error);
    return NextResponse.json({ data: null, error: "Failed to fetch stats" }, { status: 500 });
  }
}
