import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testCaseCategories } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const list = await db
      .select()
      .from(testCaseCategories)
      .orderBy(sql`${testCaseCategories.order} ASC`);

    return NextResponse.json({ data: list, error: null });
  } catch (error: any) {
    console.error("GET categories failed:", error);
    return NextResponse.json({ data: null, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, targetGroup } = body;

    if (!name) {
      return NextResponse.json({ data: null, error: "Category Name is required" }, { status: 400 });
    }

    const validGroup = targetGroup === "EMPLOYER" ? "EMPLOYER" : "JOBSEEKER";

    // Determine the next order index
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testCaseCategories);
    const nextOrder = countResult[0]?.count || 0;

    const newCategory = await db
      .insert(testCaseCategories)
      .values({
        name,
        description,
        targetGroup: validGroup,
        order: nextOrder,
      })
      .returning();

    return NextResponse.json({ data: newCategory[0], error: null }, { status: 201 });
  } catch (error: any) {
    console.error("POST category failed:", error);
    // Check for unique constraint violation
    if (error.code === "23505") {
      return NextResponse.json({ data: null, error: "Category name already exists" }, { status: 400 });
    }
    return NextResponse.json({ data: null, error: "Failed to create category" }, { status: 500 });
  }
}
