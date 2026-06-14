import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const testers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        testerGroup: users.testerGroup,
        employerLocked: users.employerLocked,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "TESTER"))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ testers });
  } catch (error: any) {
    console.error("Failed to fetch testers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
