import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testRuns, testCases, testFields, testAnswers, users, testRunAuditLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id: runId } = await params;

    // Fetch the run metadata with tester info
    const runResult = await db
      .select({
        id: testRuns.id,
        testCaseId: testRuns.testCaseId,
        testerId: testRuns.testerId,
        status: testRuns.status,
        submittedAt: testRuns.submittedAt,
        createdAt: testRuns.createdAt,
        testerName: users.name,
        testerEmail: users.email,
      })
      .from(testRuns)
      .leftJoin(users, eq(users.id, testRuns.testerId))
      .where(eq(testRuns.id, runId))
      .limit(1);

    if (runResult.length === 0) {
      return NextResponse.json({ data: null, error: "Test run not found" }, { status: 404 });
    }

    const run = runResult[0];

    // Access check: run owner or ADMIN
    if (session.user.role !== "ADMIN" && run.testerId !== session.user.id) {
      return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    // Fetch test case
    const caseResult = await db
      .select({
        id: testCases.id,
        title: testCases.title,
        pdfUrl: testCases.pdfUrl,
        timer: testCases.timer,
      })
      .from(testCases)
      .where(eq(testCases.id, run.testCaseId))
      .limit(1);

    if (caseResult.length === 0) {
      return NextResponse.json({ data: null, error: "Associated test case not found" }, { status: 404 });
    }

    const testCase = caseResult[0];

    // Fetch test case fields ordered by order ASC
    const fieldsList = await db
      .select({
        id: testFields.id,
        fieldName: testFields.fieldName,
        fieldType: testFields.fieldType,
        choices: testFields.choices,
        steps: testFields.steps,
        order: testFields.order,
      })
      .from(testFields)
      .where(eq(testFields.testCaseId, testCase.id))
      .orderBy(sql`${testFields.order} ASC`);

    // Fetch existing answers for this run
    const answersList = await db
      .select()
      .from(testAnswers)
      .where(eq(testAnswers.testRunId, run.id));

    // Key answers by testFieldId
    const answersMap: Record<string, any> = {};
    answersList.forEach((ans) => {
      answersMap[ans.testFieldId] = {
        id: ans.id,
        value: ans.value ? JSON.parse(ans.value) : null,
        screenshotUrl: ans.screenshotUrl,
      };
    });

    // Fetch UAT audit logs
    const auditLogs = await db
      .select({
        id: testRunAuditLogs.id,
        action: testRunAuditLogs.action,
        previousStatus: testRunAuditLogs.previousStatus,
        newStatus: testRunAuditLogs.newStatus,
        createdAt: testRunAuditLogs.createdAt,
      })
      .from(testRunAuditLogs)
      .where(eq(testRunAuditLogs.testRunId, run.id))
      .orderBy(sql`${testRunAuditLogs.createdAt} DESC`);

    const data = {
      id: run.id,
      status: run.status,
      submittedAt: run.submittedAt,
      createdAt: run.createdAt,
      testerId: run.testerId,
      tester: {
        name: run.testerName,
        email: run.testerEmail,
      },
      testCase: {
        ...testCase,
        fields: fieldsList,
      },
      answers: answersMap,
      auditLogs,
    };

    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    console.error("GET run detail failed:", error);
    return NextResponse.json({ data: null, error: "Failed to fetch run details" }, { status: 500 });
  }
}
