import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatBriefingDeck } from "@/db/schema";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deck] = await db.select().from(uatBriefingDeck).limit(1);
    return NextResponse.json({ data: deck || null });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch briefing deck" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, fileName } = await req.json();

    if (!url || !fileName) {
      return NextResponse.json({ error: "URL and file name are required" }, { status: 400 });
    }

    // Clear existing briefing deck
    await db.delete(uatBriefingDeck);

    const [newDeck] = await db
      .insert(uatBriefingDeck)
      .values({
        url,
        fileName,
      })
      .returning();

    return NextResponse.json({ data: newDeck });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to save briefing deck" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.delete(uatBriefingDeck);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete briefing deck" }, { status: 500 });
  }
}
