import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatResourceSets, users } from "@/db/schema";
import { eq, and, ne, isNotNull } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TESTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { setId } = await req.json();
    const testerId = session.user.id;

    // 1. Fetch tester details to check selection limit
    const tester = await db
      .select()
      .from(users)
      .where(eq(users.id, testerId))
      .limit(1)
      .then((res) => res[0]);

    if (!tester) {
      return NextResponse.json({ error: "Tester not found" }, { status: 404 });
    }

    // 2. Fetch currently claimed set for this tester
    const currentClaimedSet = await db
      .select()
      .from(uatResourceSets)
      .where(eq(uatResourceSets.testerId, testerId))
      .limit(1)
      .then((res) => res[0]);

    const isChanging = setId !== (currentClaimedSet?.id || null);

    if (isChanging) {
      if (tester.resourceSelectCount >= 2) {
        return NextResponse.json(
          { error: "Your testing resource selection is permanent and cannot be changed anymore." },
          { status: 400 }
        );
      }
    }

    // 3. Unclaim any set currently claimed by this tester
    await db
      .update(uatResourceSets)
      .set({ testerId: null })
      .where(eq(uatResourceSets.testerId, testerId));

    if (setId) {
      // 4. Check if the target set is already claimed by someone else
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

      // 5. Claim the new set
      await db
        .update(uatResourceSets)
        .set({ testerId })
        .where(eq(uatResourceSets.id, setId));

      // 6. Increment selection count if it was a change/new selection
      if (isChanging) {
        await db
          .update(users)
          .set({ resourceSelectCount: tester.resourceSelectCount + 1 })
          .where(eq(users.id, testerId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to select resource set" }, { status: 500 });
  }
}
