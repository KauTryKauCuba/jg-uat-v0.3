import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users, organisations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TESTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, organisationId, newOrganisationName } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    let finalOrgId: string | null = organisationId || null;

    // If they typed a custom organization name
    if (newOrganisationName && newOrganisationName.trim()) {
      const trimmedName = newOrganisationName.trim();
      
      // Check if it already exists case-insensitively
      const [existing] = await db
        .select()
        .from(organisations)
        .where(sql`LOWER(${organisations.name}) = LOWER(${trimmedName})`)
        .limit(1);

      if (existing) {
        finalOrgId = existing.id;
      } else {
        // Create new organisation
        const [newOrg] = await db
          .insert(organisations)
          .values({
            name: trimmedName,
          })
          .returning();
        finalOrgId = newOrg.id;
      }
    }

    if (!finalOrgId) {
      return NextResponse.json({ error: "Please select or type an organisation" }, { status: 400 });
    }

    // Update user record
    await db
      .update(users)
      .set({
        name: name.trim(),
        organisationId: finalOrgId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, organisationId: finalOrgId });
  } catch (error: any) {
    console.error("Profile setup failed:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
