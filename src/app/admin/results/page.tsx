import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testRuns, testCases, users, testAnswers, testFields } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ResultsPageClient } from "@/components/admin/ResultsPageClient";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch all runs
  const runsList = await db
    .select({
      id: testRuns.id,
      status: testRuns.status,
      submittedAt: testRuns.submittedAt,
      createdAt: testRuns.createdAt,
      testerId: testRuns.testerId,
      testerName: users.name,
      testerEmail: users.email,
      testCaseId: testRuns.testCaseId,
      testCaseTitle: testCases.title,
    })
    .from(testRuns)
    .leftJoin(users, eq(users.id, testRuns.testerId))
    .leftJoin(testCases, eq(testCases.id, testRuns.testCaseId))
    .orderBy(sql`${testRuns.submittedAt} DESC, ${testRuns.createdAt} DESC`);

  // Fetch all answers
  const allAnswers = await db
    .select({
      testRunId: testAnswers.testRunId,
      value: testAnswers.value,
    })
    .from(testAnswers);

  // Group answers by run ID
  const answersMap: Record<string, typeof allAnswers> = {};
  for (const ans of allAnswers) {
    if (!answersMap[ans.testRunId]) {
      answersMap[ans.testRunId] = [];
    }
    answersMap[ans.testRunId].push(ans);
  }

  // Fetch all test fields counts per test case to get total fields count
  const fieldsCountQuery = await db
    .select({
      testCaseId: testFields.testCaseId,
      count: sql<number>`count(*)::int`,
    })
    .from(testFields)
    .groupBy(testFields.testCaseId);

  const fieldsCountMap: Record<string, number> = {};
  for (const f of fieldsCountQuery) {
    if (f.testCaseId) {
      fieldsCountMap[f.testCaseId] = f.count;
    }
  }

  // Process runs
  const processedRuns = runsList.map((run) => {
    const runAnswers = answersMap[run.id] || [];
    const totalFields = run.testCaseId ? (fieldsCountMap[run.testCaseId] || 0) : 0;

    let passed = 0;
    let failed = 0;
    let blocked = 0;
    let na = 0;

    for (const ans of runAnswers) {
      if (ans.value) {
        let choice = "";
        try {
          const parsed = JSON.parse(ans.value);
          if (typeof parsed === "object" && parsed !== null) {
            choice = parsed.choice || "";
          } else {
            choice = String(parsed || "");
          }
        } catch {
          choice = String(ans.value || "");
        }

        const choiceLower = choice.toLowerCase().trim();
        if (choiceLower === "passed" || choiceLower === "pass" || choiceLower === "true") {
          passed++;
        } else if (choiceLower === "failed" || choiceLower === "fail" || choiceLower === "false") {
          failed++;
        } else if (choiceLower === "blocked" || choiceLower === "block") {
          blocked++;
        } else if (
          choiceLower.includes("n/a") ||
          choiceLower.includes("na") ||
          choiceLower.includes("not execute") ||
          choiceLower.includes("could not")
        ) {
          na++;
        } else {
          passed++;
        }
      }
    }

    const unanswered = Math.max(0, totalFields - runAnswers.length);

    return {
      id: run.id,
      status: run.status,
      submittedAt: run.submittedAt ? run.submittedAt.toISOString() : null,
      createdAt: run.createdAt.toISOString(),
      tester: {
        id: run.testerId,
        name: run.testerName || "Tester",
        email: run.testerEmail || "",
      },
      testCase: {
        id: run.testCaseId,
        title: run.testCaseTitle || "Test Case",
      },
      passFailSummary: {
        total: totalFields,
        passed,
        failed,
        blocked,
        na,
        unanswered,
      },
    };
  });

  return (
    <ResultsPageClient initialRuns={processedRuns} />
  );
}
