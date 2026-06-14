import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mobileUploads } from "@/db/schema";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testRunId, testFieldId } = await req.json();

    if (!testRunId || !testFieldId) {
      return NextResponse.json({ error: "Missing testRunId or testFieldId" }, { status: 400 });
    }

    const [newSession] = await db
      .insert(mobileUploads)
      .values({
        testRunId,
        testFieldId,
        status: "PENDING",
      })
      .returning();

    return NextResponse.json({ data: { sessionId: newSession.id }, error: null });
  } catch (error: any) {
    console.error("Failed to create mobile upload session:", error);
    return NextResponse.json({ error: error.message || "Failed to create session" }, { status: 500 });
  }
}
