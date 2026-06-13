import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatResourceSets } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TESTER") {
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
