import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testFields } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { fieldName, fieldType, choices, steps } = body;

    if (!fieldName || !fieldType) {
      return NextResponse.json({ data: null, error: "fieldName and fieldType are required" }, { status: 400 });
    }

    const updatedField = await db
      .update(testFields)
      .set({
        fieldName,
        fieldType,
        choices: choices || null,
        steps: steps || null,
        updatedAt: new Date(),
      })
      .where(eq(testFields.id, id))
      .returning();

    if (updatedField.length === 0) {
      return NextResponse.json({ data: null, error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedField[0], error: null });
  } catch (error: any) {
    console.error("PUT field by ID failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to update field" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const deletedField = await db
      .delete(testFields)
      .where(eq(testFields.id, id))
      .returning();

    if (deletedField.length === 0) {
      return NextResponse.json({ data: null, error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { id: deletedField[0].id }, error: null });
  } catch (error: any) {
    console.error("DELETE field failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to delete field" }, { status: 500 });
  }
}
