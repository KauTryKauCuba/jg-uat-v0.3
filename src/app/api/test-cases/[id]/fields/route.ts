import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testFields } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const fieldsList = await db
      .select()
      .from(testFields)
      .where(eq(testFields.testCaseId, id))
      .orderBy(sql`${testFields.order} ASC`);

    return NextResponse.json({ data: fieldsList, error: null });
  } catch (error: any) {
    console.error("GET test fields failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to fetch test fields" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { fields, fieldName, fieldType, choices, steps, order } = body;

    // Check if batch insert of fields
    if (fields && Array.isArray(fields)) {
      // Delete existing fields to overwrite
      await db.delete(testFields).where(eq(testFields.testCaseId, id));

      if (fields.length === 0) {
        return NextResponse.json({ data: [], error: null });
      }

      const inserted = await db
        .insert(testFields)
        .values(
          fields.map((f: any, idx: number) => ({
            testCaseId: id,
            fieldName: f.fieldName,
            fieldType: f.fieldType,
            choices: f.choices,
            steps: f.steps,
            order: f.order !== undefined ? f.order : idx,
          }))
        )
        .returning();

      return NextResponse.json({ data: inserted, error: null }, { status: 201 });
    }

    if (!fieldName || !fieldType) {
      return NextResponse.json({ data: null, error: "fieldName and fieldType are required" }, { status: 400 });
    }

    // Default order is counts of current fields
    let fieldOrder = order;
    if (fieldOrder === undefined) {
      const currentFields = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(testFields)
        .where(eq(testFields.testCaseId, id));
      fieldOrder = currentFields[0]?.count || 0;
    }

    const newField = await db
      .insert(testFields)
      .values({
        testCaseId: id,
        fieldName,
        fieldType,
        choices,
        steps,
        order: fieldOrder,
      })
      .returning();

    return NextResponse.json({ data: newField[0], error: null }, { status: 201 });
  } catch (error: any) {
    console.error("POST test field failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to create test field" }, { status: 500 });
  }
}
