import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testRuns, users, testFields, testAnswers, testCases, testCaseCategories } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id: testCaseId } = await params;

    // Fetch all test fields for this test case
    const fieldsList = await db
      .select({
        id: testFields.id,
        fieldType: testFields.fieldType,
      })
      .from(testFields)
      .where(eq(testFields.testCaseId, testCaseId));

    const totalFields = fieldsList.length;

    // Fetch all runs for this test case
    const runsList = await db
      .select({
        id: testRuns.id,
        status: testRuns.status,
        submittedAt: testRuns.submittedAt,
        createdAt: testRuns.createdAt,
        testerId: testRuns.testerId,
        testerName: users.name,
        testerEmail: users.email,
      })
      .from(testRuns)
      .leftJoin(users, eq(users.id, testRuns.testerId))
      .where(eq(testRuns.testCaseId, testCaseId))
      .orderBy(sql`${testRuns.createdAt} DESC`);

    const result = [];

    for (const run of runsList) {
      // Fetch answers for this run
      const answers = await db
        .select({
          testFieldId: testAnswers.testFieldId,
          value: testAnswers.value,
        })
        .from(testAnswers)
        .where(eq(testAnswers.testRunId, run.id));

      const answersMap = new Map();
      answers.forEach((ans) => {
        answersMap.set(ans.testFieldId, ans.value);
      });

      let passed = 0;
      let failed = 0;
      let blocked = 0;
      let na = 0;
      let unanswered = 0;

      for (const field of fieldsList) {
        const valueStr = answersMap.get(field.id);
        if (valueStr === undefined || valueStr === null) {
          unanswered++;
        } else {
          // Parse value
          let choice = "";
          try {
            const parsed = JSON.parse(valueStr);
            if (typeof parsed === "object" && parsed !== null) {
              choice = parsed.choice || "";
            } else {
              choice = String(parsed || "");
            }
          } catch {
            choice = String(valueStr || "");
          }

          const choiceLower = choice.toLowerCase().trim();
          if (choiceLower === "passed" || choiceLower === "pass" || choiceLower === "true") {
            passed++;
          } else if (choiceLower === "failed" || choiceLower === "fail" || choiceLower === "false") {
            failed++;
          } else if (choiceLower === "blocked" || choiceLower === "block") {
            blocked++;
          } else if (
            choiceLower.includes("n/a") ||
            choiceLower.includes("na") ||
            choiceLower.includes("not execute") ||
            choiceLower.includes("could not")
          ) {
            na++;
          } else {
            // Default fallback
            passed++;
          }
        }
      }

      result.push({
        id: run.id,
        status: run.status,
        submittedAt: run.submittedAt,
        createdAt: run.createdAt,
        tester: {
          id: run.testerId,
          name: run.testerName,
          email: run.testerEmail,
        },
        answerCount: answers.length,
        passFailSummary: {
          total: totalFields,
          passed,
          failed,
          blocked,
          na,
          unanswered,
        },
      });
    }

    return NextResponse.json({ data: result, error: null });
  } catch (error: any) {
    console.error("GET test case runs failed:", error);
    return NextResponse.json({ data: null, error: "Failed to fetch runs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id: testCaseId } = await params;
    const testerId = session.user.id;
    const testerGroup = session.user.testerGroup || "";

    // 1. Fetch categories for this group
    const categoriesList = await db
      .select()
      .from(testCaseCategories)
      .where(eq(testCaseCategories.targetGroup, testerGroup))
      .orderBy(sql`${testCaseCategories.order} ASC`);

    // 2. Fetch test cases with run status
    const rawCases = await db
      .select({
        id: testCases.id,
        categoryId: testCases.categoryId,
        runStatus: testRuns.status,
      })
      .from(testCases)
      .leftJoin(testCaseCategories, eq(testCaseCategories.id, testCases.categoryId))
      .leftJoin(
        testRuns,
        and(
          eq(testRuns.testCaseId, testCases.id),
          eq(testRuns.testerId, testerId)
        )
      )
      .where(eq(testCaseCategories.targetGroup, testerGroup))
      .orderBy(sql`${testCases.order} ASC, ${testCases.createdAt} DESC`);

    // 3. Map status to check submitted
    const mappedCases = rawCases.map((c) => {
      const isSubmitted = c.runStatus === "SUBMITTED" || c.runStatus === "PASSED" || c.runStatus === "FAILED";
      return {
        id: c.id,
        categoryId: c.categoryId,
        isSubmitted,
      };
    });

    // 4. Flatten by category sequence
    const orderedCases: typeof mappedCases = [];
    for (const cat of categoriesList) {
      const catCases = mappedCases.filter((c) => c.categoryId === cat.id);
      orderedCases.push(...catCases);
    }
    const uncategorizedCases = mappedCases.filter((c) => !c.categoryId);
    orderedCases.push(...uncategorizedCases);

    // 5. Enforce sequential lock
    let previousCasesSubmitted = true;
    let targetIsLocked = false;

    for (const c of orderedCases) {
      if (c.id === testCaseId) {
        targetIsLocked = !previousCasesSubmitted;
        break;
      }
      if (!c.isSubmitted) {
        previousCasesSubmitted = false;
      }
    }

    if (targetIsLocked) {
      return NextResponse.json({ data: null, error: "This test case is locked. Please complete previous test cases first." }, { status: 400 });
    }

    // Check if tester already has an PENDING (IN_PROGRESS) run for this testcase
    const existingRun = await db
      .select()
      .from(testRuns)
      .where(
        and(
          eq(testRuns.testCaseId, testCaseId),
          eq(testRuns.testerId, testerId),
          eq(testRuns.status, "PENDING")
        )
      )
      .limit(1);

    if (existingRun.length > 0) {
      return NextResponse.json({ data: { runId: existingRun[0].id }, error: null });
    }

    // Otherwise, create a new test run
    const newRun = await db
      .insert(testRuns)
      .values({
        testCaseId,
        testerId,
        status: "PENDING",
      })
      .returning();

    return NextResponse.json({ data: { runId: newRun[0].id }, error: null }, { status: 201 });
  } catch (error: any) {
    console.error("POST start test run failed:", error);
    return NextResponse.json({ data: null, error: "Failed to start test run" }, { status: 500 });
  }
}
