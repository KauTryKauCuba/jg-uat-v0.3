import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { uatTargetGroups, testCaseCategories, testCases, testFields } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Fetch original target group
    const srcGroups = await db
      .select()
      .from(uatTargetGroups)
      .where(eq(uatTargetGroups.id, id))
      .limit(1);

    if (srcGroups.length === 0) {
      return NextResponse.json({ error: "Source target group not found" }, { status: 404 });
    }

    const srcGroup = srcGroups[0];

    // 2. Generate unique name for target group
    let uniqueName = `${srcGroup.name}_COPY`;
    let uniqueDisplayName = `${srcGroup.displayName} (Copy)`;
    let counter = 1;

    while (true) {
      const existing = await db
        .select({ id: uatTargetGroups.id })
        .from(uatTargetGroups)
        .where(eq(uatTargetGroups.name, uniqueName))
        .limit(1);

      if (existing.length === 0) {
        break;
      }
      counter++;
      uniqueName = `${srcGroup.name}_COPY_${counter}`;
      uniqueDisplayName = `${srcGroup.displayName} (Copy ${counter})`;
    }

    // 3. Get next order index
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(uatTargetGroups);
    const nextOrder = countResult[0]?.count || 0;

    // 4. Create the new target group
    const [newGroup] = await db
      .insert(uatTargetGroups)
      .values({
        name: uniqueName,
        displayName: uniqueDisplayName,
        order: nextOrder,
        locked: false,
      })
      .returning();

    // 5. Fetch all categories belonging to source target group
    const categoriesToCopy = await db
      .select()
      .from(testCaseCategories)
      .where(eq(testCaseCategories.targetGroup, srcGroup.name));

    for (const cat of categoriesToCopy) {
      // Generate unique name for the category
      let uniqueCatName = `${cat.name} (Copy)`;
      let catCounter = 1;

      while (true) {
        const existingCat = await db
          .select({ id: testCaseCategories.id })
          .from(testCaseCategories)
          .where(eq(testCaseCategories.name, uniqueCatName))
          .limit(1);

        if (existingCat.length === 0) {
          break;
        }
        catCounter++;
        uniqueCatName = `${cat.name} (Copy ${catCounter})`;
      }

      // Insert category
      const [newCategory] = await db
        .insert(testCaseCategories)
        .values({
          name: uniqueCatName,
          description: cat.description,
          order: cat.order,
          targetGroup: newGroup.name,
        })
        .returning();

      // Fetch all cases in this category
      const casesToCopy = await db
        .select()
        .from(testCases)
        .where(eq(testCases.categoryId, cat.id));

      for (const c of casesToCopy) {
        // Insert test case
        const [newCase] = await db
          .insert(testCases)
          .values({
            title: `${c.title} (Copy)`,
            description: c.description,
            pdfUrl: c.pdfUrl,
            categoryId: newCategory.id,
            timer: c.timer,
            order: c.order,
            hidden: c.hidden,
            createdById: session.user.id,
          })
          .returning();

        // Fetch all fields in this test case
        const fieldsToCopy = await db
          .select()
          .from(testFields)
          .where(eq(testFields.testCaseId, c.id));

        for (const f of fieldsToCopy) {
          // Insert test field
          await db
            .insert(testFields)
            .values({
              testCaseId: newCase.id,
              fieldName: f.fieldName,
              fieldType: f.fieldType,
              choices: f.choices,
              steps: f.steps,
              order: f.order,
            });
        }
      }
    }

    return NextResponse.json({ data: newGroup });
  } catch (error: any) {
    console.error("Duplicate target group failed:", error);
    return NextResponse.json({ error: "Failed to duplicate target group" }, { status: 500 });
  }
}
