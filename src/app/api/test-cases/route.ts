import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testCases, testFields, testRuns, testCaseCategories, testAnswers } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

import { memoryCache } from "@/lib/cache";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `test-cases:${session.user.role}:${session.user.id}:${session.user.testerGroup || ""}`;
    const cached = memoryCache.get(cacheKey, 5000);
    if (cached) {
      return NextResponse.json({ data: cached, error: null });
    }

    if (session.user.role === "TESTER") {
      const list = await db
        .select({
          id: testCases.id,
          title: testCases.title,
          description: testCases.description,
          pdfUrl: testCases.pdfUrl,
          categoryId: testCases.categoryId,
          categoryName: testCaseCategories.name,
          categoryTargetGroup: testCaseCategories.targetGroup,
          timer: testCases.timer,
          createdById: testCases.createdById,
          createdAt: testCases.createdAt,
          updatedAt: testCases.updatedAt,
          fieldsCount: sql<number>`count(distinct ${testFields.id})::int`,
          runStatus: testRuns.status,
          runId: testRuns.id,
        })
        .from(testCases)
        .leftJoin(testCaseCategories, eq(testCaseCategories.id, testCases.categoryId))
        .leftJoin(testFields, eq(testFields.testCaseId, testCases.id))
        .leftJoin(
          testRuns,
          and(
            eq(testRuns.testCaseId, testCases.id),
            eq(testRuns.testerId, session.user.id)
          )
        )
        .where(
          and(
            eq(testCaseCategories.targetGroup, session.user.testerGroup || ""),
            eq(testCases.hidden, false)
          )
        )
        .groupBy(
          testCases.id,
          testCases.title,
          testCases.description,
          testCases.pdfUrl,
          testCases.categoryId,
          testCaseCategories.name,
          testCaseCategories.targetGroup,
          testCases.timer,
          testCases.createdById,
          testCases.createdAt,
          testCases.updatedAt,
          testRuns.id,
          testRuns.status
        )
        .orderBy(sql`${testCaseCategories.order} ASC, ${testCases.order} ASC, ${testCases.createdAt} DESC`);

      const mappedList = list.map((item) => {
        let testerStatus = "not_started";
        if (item.runStatus === "PENDING") {
          testerStatus = "in_progress";
        } else if (
          item.runStatus === "SUBMITTED" ||
          item.runStatus === "PASSED" ||
          item.runStatus === "FAILED"
        ) {
          testerStatus = "submitted";
        }
        return {
          ...item,
          testerStatus,
        };
      });

      memoryCache.set(cacheKey, mappedList);
      return NextResponse.json({ data: mappedList, error: null });
    }

    const list = await db
      .select({
        id: testCases.id,
        title: testCases.title,
        description: testCases.description,
        pdfUrl: testCases.pdfUrl,
        categoryId: testCases.categoryId,
        categoryName: testCaseCategories.name,
        categoryTargetGroup: testCaseCategories.targetGroup,
        timer: testCases.timer,
        hidden: testCases.hidden,
        createdById: testCases.createdById,
        createdAt: testCases.createdAt,
        updatedAt: testCases.updatedAt,
        fieldsCount: sql<number>`count(distinct ${testFields.id})::int`,
        runsCount: sql<number>`count(distinct ${testRuns.id})::int`,
        passedRunsCount: sql<number>`count(distinct case when ${testRuns.status} = 'PASSED' then ${testRuns.id} end)::int`,
        submittedRunsCount: sql<number>`count(distinct case when ${testRuns.status} != 'PENDING' then ${testRuns.id} end)::int`,
      })
      .from(testCases)
      .leftJoin(testCaseCategories, eq(testCaseCategories.id, testCases.categoryId))
      .leftJoin(testFields, eq(testFields.testCaseId, testCases.id))
      .leftJoin(testRuns, eq(testRuns.testCaseId, testCases.id))
      .groupBy(
        testCases.id,
        testCases.title,
        testCases.description,
        testCases.pdfUrl,
        testCases.categoryId,
        testCaseCategories.name,
        testCaseCategories.targetGroup,
        testCases.timer,
        testCases.hidden,
        testCases.createdById,
        testCases.createdAt,
        testCases.updatedAt
      )
      .orderBy(sql`${testCases.order} ASC, ${testCases.createdAt} DESC`);

    // Fetch all answers for submitted runs group by testCaseId
    const answersQuery = await db
      .select({
        testCaseId: testRuns.testCaseId,
        value: testAnswers.value,
      })
      .from(testAnswers)
      .innerJoin(testRuns, eq(testRuns.id, testAnswers.testRunId))
      .where(sql`${testRuns.status} != 'PENDING'`);

    // Group and calculate pass rate per test case
    const testCaseStats: Record<string, { passed: number; total: number }> = {};
    for (const ans of answersQuery) {
      if (!ans.value || !ans.testCaseId) continue;
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
        if (!testCaseStats[ans.testCaseId]) {
          testCaseStats[ans.testCaseId] = { passed: 0, total: 0 };
        }
        testCaseStats[ans.testCaseId].passed++;
        testCaseStats[ans.testCaseId].total++;
      } else if (
        choiceLower === "failed" ||
        choiceLower === "fail" ||
        choiceLower === "false" ||
        choiceLower === "blocked" ||
        choiceLower === "block" ||
        choiceLower.includes("n/a") ||
        choiceLower.includes("na") ||
        choiceLower.includes("not execute") ||
        choiceLower.includes("could not")
      ) {
        if (!testCaseStats[ans.testCaseId]) {
          testCaseStats[ans.testCaseId] = { passed: 0, total: 0 };
        }
        testCaseStats[ans.testCaseId].total++;
      }
    }

    const mappedList = list.map((item) => {
      const stats = testCaseStats[item.id];
      const passRate = stats && stats.total > 0
        ? Math.round((stats.passed / stats.total) * 100)
        : 0;
      return {
        ...item,
        passRate,
      };
    });

    memoryCache.set(cacheKey, mappedList);
    return NextResponse.json({ data: mappedList, error: null });
  } catch (error: any) {
    console.error("GET test cases failed:", error);
    return NextResponse.json({ data: null, error: "Failed to fetch test cases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, pdfUrl, categoryId, timer, hidden } = body;

    if (!title) {
      return NextResponse.json({ data: null, error: "Title is required" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ data: null, error: "Category is required" }, { status: 400 });
    }

    const newTestCase = await db
      .insert(testCases)
      .values({
        title,
        description,
        pdfUrl,
        categoryId,
        timer,
        hidden: hidden || false,
        createdById: session.user.id,
      })
      .returning();

    memoryCache.clear();
    return NextResponse.json({ data: newTestCase[0], error: null }, { status: 201 });
  } catch (error: any) {
    console.error("POST test case failed:", error);
    return NextResponse.json({ data: null, error: "Failed to create test case" }, { status: 500 });
  }
}
