import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testCases, testFields } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { memoryCache } from "@/lib/cache";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const caseResult = await db
      .select()
      .from(testCases)
      .where(eq(testCases.id, id))
      .limit(1);

    if (caseResult.length === 0) {
      return NextResponse.json({ data: null, error: "Test case not found" }, { status: 404 });
    }

    const fieldsList = await db
      .select()
      .from(testFields)
      .where(eq(testFields.testCaseId, id))
      .orderBy(sql`${testFields.order} ASC`);

    const data = {
      ...caseResult[0],
      fields: fieldsList,
    };

    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    console.error("GET test case by ID failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to fetch test case" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

        const { id } = await params;
    const body = await req.json();
    const { title, description, pdfUrl, categoryId, timer } = body;

    if (!title) {
      return NextResponse.json({ data: null, error: "Title is required" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ data: null, error: "Category is required" }, { status: 400 });
    }

    const updatedCase = await db
      .update(testCases)
      .set({
        title,
        description,
        pdfUrl,
        categoryId,
        timer,
        updatedAt: new Date(),
      })
      .where(eq(testCases.id, id))
      .returning();

    if (updatedCase.length === 0) {
      return NextResponse.json({ data: null, error: "Test case not found" }, { status: 404 });
    }

    memoryCache.clear();
    return NextResponse.json({ data: updatedCase[0], error: null });
  } catch (error: any) {
    console.error("PUT test case failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to update test case" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const deletedCase = await db
      .delete(testCases)
      .where(eq(testCases.id, id))
      .returning();

    if (deletedCase.length === 0) {
      return NextResponse.json({ data: null, error: "Test case not found" }, { status: 404 });
    }

    memoryCache.clear();
    return NextResponse.json({ data: { id: deletedCase[0].id }, error: null });
  } catch (error: any) {
    console.error("DELETE test case failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to delete test case" }, { status: 500 });
  }
}
