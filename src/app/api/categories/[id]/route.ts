import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testCaseCategories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id: categoryId } = await params;
    const body = await req.json();
    const { name, description, targetGroup } = body;

    if (!name) {
      return NextResponse.json({ data: null, error: "Category name is required" }, { status: 400 });
    }

    const validGroup = targetGroup === "EMPLOYER" ? "EMPLOYER" : "JOBSEEKER";

    const updated = await db
      .update(testCaseCategories)
      .set({
        name,
        description,
        targetGroup: validGroup,
        updatedAt: new Date(),
      })
      .where(eq(testCaseCategories.id, categoryId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ data: null, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0], error: null });
  } catch (error: any) {
    console.error("PATCH category failed:", error);
    if (error.code === "23505") {
      return NextResponse.json({ data: null, error: "Category name already exists" }, { status: 400 });
    }
    return NextResponse.json({ data: null, error: error.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id: categoryId } = await params;

    const deleted = await db
      .delete(testCaseCategories)
      .where(eq(testCaseCategories.id, categoryId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ data: null, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { message: "Category deleted successfully" }, error: null });
  } catch (error: any) {
    console.error("DELETE category failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to delete category" }, { status: 500 });
  }
}
