import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatResourceSets } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sets = await db
      .select()
      .from(uatResourceSets)
      .orderBy(desc(uatResourceSets.createdAt));

    return NextResponse.json({ data: sets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch resource sets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, photoUrl, resumeUrl, icUrl } = await req.json();

    if (!name || !photoUrl || !resumeUrl || !icUrl) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const [newSet] = await db
      .insert(uatResourceSets)
      .values({
        name,
        photoUrl,
        resumeUrl,
        icUrl,
      })
      .returning();

    return NextResponse.json({ data: newSet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create resource set" }, { status: 500 });
  }
}
