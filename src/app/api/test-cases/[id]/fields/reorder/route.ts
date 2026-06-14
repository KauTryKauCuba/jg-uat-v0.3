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
    const { fieldIds } = body; // Array of IDs in ordered sequence

    if (!Array.isArray(fieldIds)) {
      return NextResponse.json({ data: null, error: "fieldIds array is required" }, { status: 400 });
    }

    // Execute updates
    const updates = fieldIds.map((fieldId, index) =>
      db
        .update(testFields)
        .set({ order: index })
        .where(eq(testFields.id, fieldId))
    );

    await Promise.all(updates);

    return NextResponse.json({ data: { message: "Fields reordered successfully" }, error: null });
  } catch (error: any) {
    console.error("Reorder fields failed:", error);
    return NextResponse.json({ data: null, error: "Failed to reorder fields" }, { status: 500 });
  }
}
