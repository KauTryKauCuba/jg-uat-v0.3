import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatTargetGroups } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await db
      .select()
      .from(uatTargetGroups)
      .orderBy(asc(uatTargetGroups.name));

    return NextResponse.json({ data: groups });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch target groups" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, displayName } = await req.json();

    if (!name || !displayName) {
      return NextResponse.json({ error: "Name and Display Name are required" }, { status: 400 });
    }

    const upperName = name.toUpperCase().trim();

    const [newGroup] = await db
      .insert(uatTargetGroups)
      .values({
        name: upperName,
        displayName: displayName.trim(),
      })
      .returning();

    return NextResponse.json({ data: newGroup });
  } catch (error: any) {
    console.error("POST target group failed:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "Target group name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create target group" }, { status: 500 });
  }
}
