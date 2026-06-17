import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testRuns, testAnswers, testRunAuditLogs } from "@/db/schema";
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

    // Validate status is PENDING (in_progress)
    if (run.status !== "PENDING") {
      return NextResponse.json({ data: null, error: "Test run has already been submitted" }, { status: 400 });
    }

    // Fetch answers for this run to compute final status
    const answers = await db
      .select()
      .from(testAnswers)
      .where(eq(testAnswers.testRunId, runId));

    let hasNonPassing = false;
    for (const ans of answers) {
      if (ans.value) {
        try {
          const parsed = JSON.parse(ans.value);
          let choice = "";
          if (typeof parsed === "object" && parsed !== null) {
            choice = parsed.choice || "";
          } else {
            choice = String(parsed || "");
          }

          const choiceLower = choice.toLowerCase().trim();
          const isPassed = choiceLower === "passed" || choiceLower === "pass";
          if (!isPassed) {
            hasNonPassing = true;
            break;
          }
        } catch {
          const valLower = String(ans.value).toLowerCase().trim();
          const isPassed = valLower === "passed" || valLower === "pass";
          if (!isPassed) {
            hasNonPassing = true;
            break;
          }
        }
      } else {
        hasNonPassing = true;
        break;
      }
    }

    const now = new Date();
    const sessionElapsedSeconds = Math.max(0, Math.floor((now.getTime() - run.updatedAt.getTime()) / 1000));
    const newElapsedSeconds = run.elapsedSeconds + sessionElapsedSeconds;

    const finalStatus = hasNonPassing ? "FAILED" : "PASSED";

    // Update status, set submittedAt to current date, and add elapsed seconds
    const updated = await db
      .update(testRuns)
      .set({
        status: finalStatus,
        submittedAt: now,
        elapsedSeconds: newElapsedSeconds,
        updatedAt: now,
      })
      .where(eq(testRuns.id, runId))
      .returning();

    const updatedRun = updated[0];

    // Log submit audit trail
    await db.insert(testRunAuditLogs).values({
      testRunId: runId,
      userId: session.user.id,
      action: "SUBMIT",
      previousStatus: run.status,
      newStatus: finalStatus,
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
    console.error("POST submit run failed:", error);
    return NextResponse.json({ data: null, error: "Failed to submit test run" }, { status: 500 });
  }
}
