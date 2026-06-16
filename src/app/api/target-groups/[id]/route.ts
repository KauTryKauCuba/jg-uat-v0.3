import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatTargetGroups } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name, displayName, locked } = await req.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) {
      updateData.name = name.toUpperCase().trim();
    }
    if (displayName) {
      updateData.displayName = displayName.trim();
    }
    if (typeof locked === "boolean") {
      updateData.locked = locked;
    }

    const updated = await db
      .update(uatTargetGroups)
      .set(updateData)
      .where(eq(uatTargetGroups.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Target group not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("PATCH target group failed:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "Target group name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update target group" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const deleted = await db
      .delete(uatTargetGroups)
      .where(eq(uatTargetGroups.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Target group not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE target group failed:", error);
    return NextResponse.json({ error: "Failed to delete target group" }, { status: 500 });
  }
}
