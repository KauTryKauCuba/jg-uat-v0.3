import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatResourceSets } from "@/db/schema";
import { eq, and, ne, isNotNull } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TESTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { setId } = await req.json();
    const testerId = session.user.id;

    // 1. Unclaim any set currently claimed by this tester (to allow selecting a different one)
    await db
      .update(uatResourceSets)
      .set({ testerId: null })
      .where(eq(uatResourceSets.testerId, testerId));

    if (setId) {
      // 2. Check if the target set is already claimed by someone else
      const existing = await db
        .select()
        .from(uatResourceSets)
        .where(
          and(
            eq(uatResourceSets.id, setId),
            isNotNull(uatResourceSets.testerId),
            ne(uatResourceSets.testerId, testerId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "This testing resource set has already been claimed by another tester." },
          { status: 400 }
        );
      }

      // 3. Claim the new set
      await db
        .update(uatResourceSets)
        .set({ testerId })
        .where(eq(uatResourceSets.id, setId));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to select resource set" }, { status: 500 });
  }
}
