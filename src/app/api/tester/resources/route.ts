import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatResourceSets, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

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

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
      .then((res) => res[0]);

    return NextResponse.json({
      data: sets,
      selectCount: user?.resourceSelectCount ?? 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch resource sets" }, { status: 500 });
  }
}
