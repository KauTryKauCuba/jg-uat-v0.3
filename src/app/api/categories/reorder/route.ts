import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testCaseCategories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { categoryIds } = body; // Array of UUID strings in ordered sequence

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ data: null, error: "categoryIds array is required" }, { status: 400 });
    }

    // Execute updates
    const updates = categoryIds.map((categoryId, index) =>
      db
        .update(testCaseCategories)
        .set({ order: index })
        .where(eq(testCaseCategories.id, categoryId))
    );

    await Promise.all(updates);

    return NextResponse.json({ data: { message: "Categories reordered successfully" }, error: null });
  } catch (error: any) {
    console.error("Reorder categories failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to reorder categories" }, { status: 500 });
  }
}
