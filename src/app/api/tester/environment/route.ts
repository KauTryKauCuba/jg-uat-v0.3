import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatEnvironment } from "@/db/schema";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [env] = await db.select().from(uatEnvironment).limit(1);
    return NextResponse.json({ data: env || null });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch environment link" }, { status: 500 });
  }
}
