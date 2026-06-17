import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { organisations } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await db.select().from(organisations).orderBy(asc(organisations.name));
    return NextResponse.json({ data: list });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch organisations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 450 });
    }

    // Check if it already exists
    const [existing] = await db
      .select()
      .from(organisations)
      .where(sql`LOWER(${organisations.name}) = LOWER(${name.trim()})`)
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Organisation already exists" }, { status: 400 });
    }

    const [newOrg] = await db
      .insert(organisations)
      .values({
        name: name.trim(),
      })
      .returning();

    return NextResponse.json({ data: newOrg });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create organisation" }, { status: 500 });
  }
}
import { sql } from "drizzle-orm";
