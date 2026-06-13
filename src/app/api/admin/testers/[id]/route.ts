import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "toggle-lock" or "reset-choice"

    // Check if user exists
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json({ error: "Tester not found" }, { status: 404 });
    }

    const user = foundUsers[0];
    if (user.role !== "TESTER") {
      return NextResponse.json({ error: "User is not a tester" }, { status: 400 });
    }

    if (action === "toggle-lock") {
      const newLockStatus = !user.employerLocked;
      await db
        .update(users)
        .set({
          employerLocked: newLockStatus,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      return NextResponse.json({ success: true, employerLocked: newLockStatus });
    } else if (action === "reset-choice") {
      await db
        .update(users)
        .set({
          testerGroup: null,
          employerLocked: true, // Reset back to default lock
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      return NextResponse.json({ success: true, testerGroup: null, employerLocked: true });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Failed to update tester:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
