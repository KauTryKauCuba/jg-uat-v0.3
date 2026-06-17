import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testerFeedbacks, feedbackAuditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TESTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [existing] = await db
      .select()
      .from(testerFeedbacks)
      .where(eq(testerFeedbacks.testerId, session.user.id))
      .limit(1);

    if (existing) {
      return NextResponse.json({ hasSubmitted: true, data: existing });
    }

    return NextResponse.json({ hasSubmitted: false });
  } catch (error: any) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TESTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      ratingOverall,
      ratingEaseOfUse,
      ratingInstructions,
      ratingResultForm,
      impressiveAspects,
      improvementAreas,
      otherFeedback,
      uatSessionStart,
    } = body;

    // Validation
    if (
      typeof ratingOverall !== "number" ||
      typeof ratingEaseOfUse !== "number" ||
      typeof ratingInstructions !== "number" ||
      typeof ratingResultForm !== "number"
    ) {
      return NextResponse.json({ error: "All rating fields are required" }, { status: 400 });
    }

    // Check if they already submitted
    const [existing] = await db
      .select()
      .from(testerFeedbacks)
      .where(eq(testerFeedbacks.testerId, session.user.id))
      .limit(1);

    if (existing) {
      // Create Audit Log of previous feedback state
      await db.insert(feedbackAuditLogs).values({
        feedbackId: existing.id,
        testerId: session.user.id,
        previousData: {
          ratingOverall: existing.ratingOverall,
          ratingEaseOfUse: existing.ratingEaseOfUse,
          ratingInstructions: existing.ratingInstructions,
          ratingResultForm: existing.ratingResultForm,
          impressiveAspects: existing.impressiveAspects,
          improvementAreas: existing.improvementAreas,
          otherFeedback: existing.otherFeedback,
          uatSessionStart: existing.uatSessionStart,
          updatedAt: existing.updatedAt.toISOString(),
        },
      });

      // Update feedback record
      await db
        .update(testerFeedbacks)
        .set({
          ratingOverall,
          ratingEaseOfUse,
          ratingInstructions,
          ratingResultForm,
          impressiveAspects,
          improvementAreas,
          otherFeedback,
          uatSessionStart,
          updatedAt: new Date(),
        })
        .where(eq(testerFeedbacks.id, existing.id));

      return NextResponse.json({ success: true, isUpdate: true });
    }

    // If new feedback
    await db.insert(testerFeedbacks).values({
      testerId: session.user.id,
      ratingOverall,
      ratingEaseOfUse,
      ratingInstructions,
      ratingResultForm,
      impressiveAspects,
      improvementAreas,
      otherFeedback,
      uatSessionStart,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save feedback:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
