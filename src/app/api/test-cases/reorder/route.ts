import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testCases } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { testCaseIds } = body; // Array of UUID strings in ordered sequence

    if (!Array.isArray(testCaseIds)) {
      return NextResponse.json({ data: null, error: "testCaseIds array is required" }, { status: 400 });
    }

    // Execute updates
    const updates = testCaseIds.map((testCaseId, index) =>
      db
        .update(testCases)
        .set({ order: index })
        .where(eq(testCases.id, testCaseId))
    );

    await Promise.all(updates);

    return NextResponse.json({ data: { message: "Test cases reordered successfully" }, error: null });
  } catch (error: any) {
    console.error("Reorder test cases failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to reorder test cases" }, { status: 500 });
  }
}
