import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testerSignOffs, signOffAuditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TESTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [existing] = await db
      .select()
      .from(testerSignOffs)
      .where(eq(testerSignOffs.testerId, session.user.id))
      .limit(1);

    if (existing) {
      return NextResponse.json({ hasSubmitted: true, data: existing });
    }

    return NextResponse.json({ hasSubmitted: false });
  } catch (error: any) {
    console.error("Failed to fetch sign off:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TESTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { designation } = body;

    if (!designation || typeof designation !== "string" || designation.trim() === "") {
      return NextResponse.json({ error: "Title / Designation is required" }, { status: 400 });
    }

    // Check if they already submitted
    const [existing] = await db
      .select()
      .from(testerSignOffs)
      .where(eq(testerSignOffs.testerId, session.user.id))
      .limit(1);

    if (existing) {
      // Create Audit Log of previous sign off state
      await db.insert(signOffAuditLogs).values({
        signOffId: existing.id,
        testerId: session.user.id,
        previousData: {
          designation: existing.designation,
          updatedAt: existing.updatedAt.toISOString(),
        },
      });

      // Update sign off record
      await db
        .update(testerSignOffs)
        .set({
          designation: designation.trim(),
          updatedAt: new Date(),
        })
        .where(eq(testerSignOffs.id, existing.id));

      return NextResponse.json({ success: true, isUpdate: true });
    }

    // If new sign off
    await db.insert(testerSignOffs).values({
      testerId: session.user.id,
      designation: designation.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save sign off:", error);
    return NextResponse.json({ error: "Failed to submit sign off" }, { status: 500 });
  }
}
