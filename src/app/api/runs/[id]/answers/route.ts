import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testRuns, testAnswers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id: runId } = await params;
    const body = await req.json();
    const { testFieldId, value, screenshotUrl } = body;

    if (!testFieldId) {
      return NextResponse.json({ data: null, error: "testFieldId is required" }, { status: 400 });
    }

    // Verify run exists and belongs to this tester
    const runResult = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.id, runId))
      .limit(1);

    if (runResult.length === 0) {
      return NextResponse.json({ data: null, error: "Test run not found" }, { status: 404 });
    }

    const run = runResult[0];

    if (run.testerId !== session.user.id) {
      return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    if (run.status !== "PENDING") {
      return NextResponse.json({ data: null, error: "Cannot modify a submitted test run" }, { status: 400 });
    }

    // Check if answer already exists
    const existingAnswer = await db
      .select()
      .from(testAnswers)
      .where(
        and(
          eq(testAnswers.testRunId, runId),
          eq(testAnswers.testFieldId, testFieldId)
        )
      )
      .limit(1);

    let answerId: string;
    const serializedValue = value !== undefined ? JSON.stringify(value) : null;

    if (existingAnswer.length > 0) {
      // Update
      const updated = await db
        .update(testAnswers)
        .set({
          value: serializedValue,
          screenshotUrl: screenshotUrl !== undefined ? screenshotUrl : existingAnswer[0].screenshotUrl,
          updatedAt: new Date(),
        })
        .where(eq(testAnswers.id, existingAnswer[0].id))
        .returning();
      answerId = updated[0].id;
    } else {
      // Insert
      const inserted = await db
        .insert(testAnswers)
        .values({
          testRunId: runId,
          testFieldId,
          value: serializedValue,
          screenshotUrl: screenshotUrl || null,
        })
        .returning();
      answerId = inserted[0].id;
    }

    return NextResponse.json({ data: { answerId }, error: null });
  } catch (error: any) {
    console.error("POST answers failed:", error);
    return NextResponse.json({ data: null, error: "Failed to save answer" }, { status: 500 });
  }
}
