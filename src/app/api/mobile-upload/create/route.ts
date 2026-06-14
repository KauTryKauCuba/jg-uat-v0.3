import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mobileUploads } from "@/db/schema";
import { getToken } from "next-auth/jwt";

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
