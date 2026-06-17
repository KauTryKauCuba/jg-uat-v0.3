import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { 
  testRuns, 
  testCases, 
  users, 
  testAnswers, 
  testFields, 
  testerFeedbacks, 
  organisations, 
  testerSignOffs, 
  uatTargetGroups,
  testCaseCategories
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { TestSummaryClient } from "@/components/admin/TestSummaryClient";

export const dynamic = "force-dynamic";

export default async function AdminTestSummaryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // 1. Fetch UAT Target Groups
  const targetGroupsList = await db
    .select({
      id: uatTargetGroups.id,
      name: uatTargetGroups.name,
      displayName: uatTargetGroups.displayName,
    })
    .from(uatTargetGroups)
    .orderBy(uatTargetGroups.order);

  // 1.5 Fetch all active test cases with targetGroup info
  const testCasesList = await db
    .select({
      id: testCases.id,
      categoryId: testCases.categoryId,
      targetGroup: testCaseCategories.targetGroup,
    })
    .from(testCases)
    .leftJoin(testCaseCategories, eq(testCaseCategories.id, testCases.categoryId))
    .where(eq(testCases.hidden, false));

  // 2. Fetch all runs
  const runsList = await db
    .select({
      id: testRuns.id,
      status: testRuns.status,
      submittedAt: testRuns.submittedAt,
      createdAt: testRuns.createdAt,
      testerId: testRuns.testerId,
      testerName: users.name,
      testerEmail: users.email,
      testerGroup: users.testerGroup,
      organisationName: organisations.name,
      testCaseId: testRuns.testCaseId,
      testCaseTitle: testCases.title,
      categoryName: testCaseCategories.name,
      elapsedSeconds: testRuns.elapsedSeconds,
    })
    .from(testRuns)
    .leftJoin(users, eq(users.id, testRuns.testerId))
    .leftJoin(organisations, eq(organisations.id, users.organisationId))
    .leftJoin(testCases, eq(testCases.id, testRuns.testCaseId))
    .leftJoin(testCaseCategories, eq(testCaseCategories.id, testCases.categoryId))
    .orderBy(sql`${testRuns.submittedAt} DESC, ${testRuns.createdAt} DESC`);

  // 3. Fetch all answers
  const allAnswers = await db
    .select({
      testRunId: testAnswers.testRunId,
      value: testAnswers.value,
      screenshotUrl: testAnswers.screenshotUrl,
      pdfUrl: testAnswers.pdfUrl,
      fieldName: testFields.fieldName,
    })
    .from(testAnswers)
    .leftJoin(testFields, eq(testFields.id, testAnswers.testFieldId));

  // Group answers by run ID
  const answersMap: Record<string, typeof allAnswers> = {};
  for (const ans of allAnswers) {
    if (!answersMap[ans.testRunId]) {
      answersMap[ans.testRunId] = [];
    }
    answersMap[ans.testRunId].push(ans);
  }

  // 4. Fetch all test fields counts per testcase
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

    const evidences: { fieldName: string; screenshotUrl: string | null; pdfUrl: string | null }[] = [];
    const defects: { fieldName: string; choice: string; defectDetails: string; screenshotUrl: string | null; pdfUrl: string | null }[] = [];

    for (const ans of runAnswers) {
      if (ans.screenshotUrl || ans.pdfUrl) {
        evidences.push({
          fieldName: ans.fieldName || "Evidence",
          screenshotUrl: ans.screenshotUrl,
          pdfUrl: ans.pdfUrl,
        });
      }

      if (ans.value) {
        let choice = "";
        let defectDetails = "";
        try {
          const parsed = JSON.parse(ans.value);
          if (typeof parsed === "object" && parsed !== null) {
            choice = parsed.choice || "";
            defectDetails = parsed.defectDetails || "";
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
          if (defectDetails) {
            defects.push({
              fieldName: ans.fieldName || "Step Check",
              choice: "FAILED",
              defectDetails,
              screenshotUrl: ans.screenshotUrl,
              pdfUrl: ans.pdfUrl,
            });
          }
        } else if (choiceLower === "blocked" || choiceLower === "block") {
          blocked++;
          if (defectDetails) {
            defects.push({
              fieldName: ans.fieldName || "Step Check",
              choice: "BLOCKED",
              defectDetails,
              screenshotUrl: ans.screenshotUrl,
              pdfUrl: ans.pdfUrl,
            });
          }
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
      module: run.categoryName || "Uncategorized",
      elapsedSeconds: run.elapsedSeconds || 0,
      tester: {
        id: run.testerId,
        name: run.testerName || "Tester",
        email: run.testerEmail || "",
        testerGroup: run.testerGroup,
        organisationName: run.organisationName,
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
      evidences,
      defects,
    };
  });

  // 5. Fetch all feedbacks
  const feedbacksList = await db
    .select({
      id: testerFeedbacks.id,
      ratingOverall: testerFeedbacks.ratingOverall,
      ratingEaseOfUse: testerFeedbacks.ratingEaseOfUse,
      ratingInstructions: testerFeedbacks.ratingInstructions,
      ratingResultForm: testerFeedbacks.ratingResultForm,
      impressiveAspects: testerFeedbacks.impressiveAspects,
      improvementAreas: testerFeedbacks.improvementAreas,
      otherFeedback: testerFeedbacks.otherFeedback,
      createdAt: testerFeedbacks.createdAt,
      testerId: testerFeedbacks.testerId,
      testerName: users.name,
      testerEmail: users.email,
      testerRole: users.testerGroup,
      organisationName: organisations.name,
    })
    .from(testerFeedbacks)
    .leftJoin(users, eq(users.id, testerFeedbacks.testerId))
    .leftJoin(organisations, eq(organisations.id, users.organisationId))
    .orderBy(sql`${testerFeedbacks.createdAt} DESC`);

  // 6. Fetch all sign offs
  const signOffsList = await db
    .select({
      id: testerSignOffs.id,
      designation: testerSignOffs.designation,
      createdAt: testerSignOffs.createdAt,
      testerId: testerSignOffs.testerId,
      testerName: users.name,
      testerEmail: users.email,
      testerRole: users.testerGroup,
      organisationName: organisations.name,
    })
    .from(testerSignOffs)
    .leftJoin(users, eq(users.id, testerSignOffs.testerId))
    .leftJoin(organisations, eq(organisations.id, users.organisationId));

  // 7. Fetch all testers in the system
  const testersList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      testerGroup: users.testerGroup,
      organisationName: organisations.name,
    })
    .from(users)
    .leftJoin(organisations, eq(organisations.id, users.organisationId))
    .where(eq(users.role, "TESTER"));

  return (
    <TestSummaryClient
      targetGroups={targetGroupsList}
      testCases={testCasesList}
      initialRuns={processedRuns}
      initialFeedbacks={feedbacksList.map(f => ({ ...f, createdAt: f.createdAt.toISOString() }))}
      initialSignOffs={signOffsList.map(s => ({ ...s, createdAt: s.createdAt.toISOString() }))}
      testers={testersList}
    />
  );
}
