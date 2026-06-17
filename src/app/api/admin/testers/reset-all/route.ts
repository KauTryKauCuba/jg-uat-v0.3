import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users, testRuns, helpRequests, uatResourceSets, testerFeedbacks, testerSignOffs } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all feedbacks & sign offs
    await db.delete(testerFeedbacks);
    await db.delete(testerSignOffs);

    // 1. Delete all test runs (cascades to testAnswers)
    await db.delete(testRuns);

    // 2. Delete all help requests (cascades to helpMessages)
    await db.delete(helpRequests);

    // 3. Unclaim all resource sets
    await db
      .update(uatResourceSets)
      .set({ testerId: null })
      .where(isNotNull(uatResourceSets.testerId));

    // 4. Reset all testers' profile choices
    await db
      .update(users)
      .set({
        testerGroup: null,
        employerLocked: true, // Lock employer profile by default
        resourceSelectCount: 0,
        organisationId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.role, "TESTER"));

    return NextResponse.json({ success: true, message: "All testers reset successfully" });
  } catch (error: any) {
    console.error("Failed to reset testers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
