import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { organisations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if name is already taken by another organisation
    const [existing] = await db
      .select()
      .from(organisations)
      .where(sql`LOWER(${organisations.name}) = LOWER(${name.trim()}) AND ${organisations.id} != ${id}`)
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Organisation name already taken" }, { status: 400 });
    }

    const [updatedOrg] = await db
      .update(organisations)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(organisations.id, id))
      .returning();

    return NextResponse.json({ data: updatedOrg });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update organisation" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(organisations).where(eq(organisations.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete organisation" }, { status: 500 });
  }
}
