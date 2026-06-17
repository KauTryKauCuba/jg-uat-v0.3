import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatEnvironment } from "@/db/schema";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [env] = await db.select().from(uatEnvironment).limit(1);
    return NextResponse.json({ data: env || null });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch environment link" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Clear existing environment links
    await db.delete(uatEnvironment);

    const [newEnv] = await db
      .insert(uatEnvironment)
      .values({
        url,
      })
      .returning();

    return NextResponse.json({ data: newEnv });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to save environment link" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.delete(uatEnvironment);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete environment link" }, { status: 500 });
  }
}
