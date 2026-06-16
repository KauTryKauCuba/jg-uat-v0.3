import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatTargetGroups } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { groupIds } = body; // Array of target group UUID strings in ordered sequence

    if (!Array.isArray(groupIds)) {
      return NextResponse.json({ data: null, error: "groupIds array is required" }, { status: 400 });
    }

    // Execute updates in database
    const updates = groupIds.map((groupId, index) =>
      db
        .update(uatTargetGroups)
        .set({ order: index })
        .where(eq(uatTargetGroups.id, groupId))
    );

    await Promise.all(updates);

    return NextResponse.json({ data: { message: "Target groups reordered successfully" }, error: null });
  } catch (error: any) {
    console.error("Reorder target groups failed:", error);
    return NextResponse.json({ data: null, error: "Failed to reorder target groups" }, { status: 500 });
  }
}
