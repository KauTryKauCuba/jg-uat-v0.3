import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testerSignOffs, signOffAuditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { testerId, designation, action } = body;

    if (!testerId) {
      return NextResponse.json({ error: "Tester ID is required" }, { status: 400 });
    }

    if (action === "revoke") {
      await db.delete(testerSignOffs).where(eq(testerSignOffs.testerId, testerId));
      return NextResponse.json({ success: true });
    }

    const title = designation || "UAT Approver";

    // Check if they already submitted
    const [existing] = await db
      .select()
      .from(testerSignOffs)
      .where(eq(testerSignOffs.testerId, testerId))
      .limit(1);

    if (existing) {
      // Create Audit Log of previous sign off state
      await db.insert(signOffAuditLogs).values({
        signOffId: existing.id,
        testerId: testerId,
        previousData: {
          designation: existing.designation,
          updatedAt: existing.updatedAt.toISOString(),
        },
      });

      // Update sign off record
      await db
        .update(testerSignOffs)
        .set({
          designation: title.trim(),
          updatedAt: new Date(),
        })
        .where(eq(testerSignOffs.id, existing.id));

      return NextResponse.json({ success: true });
    }

    // If new sign off
    await db.insert(testerSignOffs).values({
      testerId: testerId,
      designation: title.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to toggle sign off:", error);
    return NextResponse.json({ error: "Failed to update sign off status" }, { status: 500 });
  }
}
