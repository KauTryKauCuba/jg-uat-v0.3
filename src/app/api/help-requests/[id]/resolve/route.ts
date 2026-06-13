import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { helpRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the request exists
    const request = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.id, id))
      .limit(1);

    if (request.length === 0) {
      return NextResponse.json({ data: null, error: "Help request not found" }, { status: 404 });
    }

    // If sender is a TESTER, make sure it's their own request
    if (session.user.role === "TESTER" && request[0].testerId !== session.user.id) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const [updated] = await db
      .update(helpRequests)
      .set({
        status: "RESOLVED",
        updatedAt: new Date(),
      })
      .where(eq(helpRequests.id, id))
      .returning();

    return NextResponse.json({ data: updated, error: null });
  } catch (error: any) {
    console.error("POST resolve failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to resolve help request" }, { status: 500 });
  }
}
