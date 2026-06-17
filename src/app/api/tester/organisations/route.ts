import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { organisations } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await db.select().from(organisations).orderBy(asc(organisations.name));
    return NextResponse.json({ data: list });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch organisations" }, { status: 500 });
  }
}
