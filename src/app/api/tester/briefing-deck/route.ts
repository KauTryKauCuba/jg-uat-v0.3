import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatBriefingDeck } from "@/db/schema";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deck] = await db.select().from(uatBriefingDeck).limit(1);
    return NextResponse.json({ data: deck || null });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch briefing deck" }, { status: 500 });
  }
}
