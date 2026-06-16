import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testRuns, testRunAuditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id: runId } = await params;

    // Fetch the run
    const runResult = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.id, runId))
      .limit(1);

    if (runResult.length === 0) {
      return NextResponse.json({ data: null, error: "Test run not found" }, { status: 404 });
    }

    const run = runResult[0];

    // Validate ownership
    if (run.testerId !== session.user.id) {
      return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();

    // Update status back to PENDING and clear submittedAt
    const updated = await db
      .update(testRuns)
      .set({
        status: "PENDING",
        submittedAt: null,
        updatedAt: now,
      })
      .where(eq(testRuns.id, runId))
      .returning();

    const updatedRun = updated[0];

    // Log reopen audit trail
    await db.insert(testRunAuditLogs).values({
      testRunId: runId,
      userId: session.user.id,
      action: "REOPEN",
      previousStatus: run.status,
      newStatus: "PENDING",
    });

    return NextResponse.json({
      data: {
        runId: updatedRun.id,
        status: updatedRun.status,
        submittedAt: updatedRun.submittedAt,
      },
      error: null,
    });
  } catch (error: any) {
    console.error("POST reopen run failed:", error);
    return NextResponse.json({ data: null, error: "Failed to reopen test run" }, { status: 500 });
  }
}
