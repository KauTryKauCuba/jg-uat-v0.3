import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mobileUploads, testRuns } from "@/db/schema";
import { getToken } from "next-auth/jwt";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testRunId, testFieldId } = await req.json();

    if (!testRunId || !testFieldId) {
      return NextResponse.json({ error: "Missing testRunId or testFieldId" }, { status: 400 });
    }

    // Verify the test run belongs to the authenticated user
    const runResult = await db
      .select({ testerId: testRuns.testerId })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1);

    if (runResult.length === 0) {
      return NextResponse.json({ error: "Test run not found" }, { status: 404 });
    }

    if (runResult[0].testerId !== token.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [session] = await db
      .insert(mobileUploads)
      .values({
        testRunId,
        testFieldId,
        status: "PENDING",
      })
      .returning();

    return NextResponse.json({ data: { sessionId: session.id }, error: null });
  } catch (error: any) {
    console.error("Failed to create mobile upload session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
