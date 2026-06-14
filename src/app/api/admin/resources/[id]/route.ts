import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatResourceSets } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    await db.delete(uatResourceSets).where(eq(uatResourceSets.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete resource set" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, photoUrl, resumeUrl, icUrl } = body;

    if (!name || !photoUrl || !resumeUrl || !icUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updated = await db
      .update(uatResourceSets)
      .set({
        name,
        photoUrl,
        resumeUrl,
        icUrl,
        updatedAt: new Date(),
      })
      .where(eq(uatResourceSets.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Resource set not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update resource set" }, { status: 500 });
  }
}

