import { db } from "@/lib/db";
import { testRuns, testCases, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { AIChatPageClient } from "../../../components/admin/AIChatPageClient";

export default async function AIUatGigaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch UAT Runs ordered by submission date/created date
  const runs = await db
    .select({
      id: testRuns.id,
      status: testRuns.status,
      submittedAt: testRuns.submittedAt,
      createdAt: testRuns.createdAt,
      testerName: users.name,
      testCaseTitle: testCases.title,
    })
    .from(testRuns)
    .leftJoin(users, eq(users.id, testRuns.testerId))
    .leftJoin(testCases, eq(testCases.id, testRuns.testCaseId))
    .orderBy(desc(testRuns.createdAt));

  // Serialize timestamps for Client Component
  const serializedRuns = runs.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
  }));

  return <AIChatPageClient runs={serializedRuns} />;
}
