import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "TESTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { group } = body;

    if (group !== "JOBSEEKER" && group !== "EMPLOYER") {
      return NextResponse.json({ error: "Invalid group. Must be JOBSEEKER or EMPLOYER" }, { status: 400 });
    }

    // Check if the user already has a group set
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = foundUsers[0];
    if (user.testerGroup) {
      return NextResponse.json({ error: "Tester group is already set and locked." }, { status: 400 });
    }

    // Set group and locked status
    await db
      .update(users)
      .set({
        testerGroup: group,
        employerLocked: false, // do not lock by default when choosing role
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, group, employerLocked: false });
  } catch (error: any) {
    console.error("Failed to select group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
