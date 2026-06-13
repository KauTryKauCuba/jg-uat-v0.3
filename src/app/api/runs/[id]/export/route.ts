import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testRuns, testFields, testAnswers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

function escapeCSV(val: string): string {
  if (!val) return "";
  const escaped = val.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id: runId } = await params;

    // Fetch the run metadata
    const runResult = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.id, runId))
      .limit(1);

    if (runResult.length === 0) {
      return NextResponse.json({ data: null, error: "Test run not found" }, { status: 404 });
    }

    const run = runResult[0];

    // Fetch test fields ordered by order ASC
    const fieldsList = await db
      .select()
      .from(testFields)
      .where(eq(testFields.testCaseId, run.testCaseId))
      .orderBy(sql`${testFields.order} ASC`);

    // Fetch existing answers
    const answersList = await db
      .select()
      .from(testAnswers)
      .where(eq(testAnswers.testRunId, run.id));

    const answersMap = new Map();
    answersList.forEach((ans) => {
      answersMap.set(ans.testFieldId, ans);
    });

    const submittedAtStr = run.submittedAt ? run.submittedAt.toISOString() : "Not submitted";

    // Build CSV Content
    let csvContent = `"Field Label","Field Type","Answer","Screenshot URL","Submitted At"\n`;

    fieldsList.forEach((field) => {
      const answer = answersMap.get(field.id);
      let answerText = "No answer";
      let screenshotUrl = "";

      if (answer) {
        screenshotUrl = answer.screenshotUrl || "";
        
        if (answer.value) {
          try {
            const parsedVal = JSON.parse(answer.value);
            
            if (field.fieldType === "BOOLEAN") {
              answerText = parsedVal === true ? "Pass" : parsedVal === false ? "Fail" : "No answer";
            } else if (field.fieldType === "CHECKLIST" && parsedVal.checked) {
              const checkedArray = parsedVal.checked as boolean[];
              const steps = field.steps as string[];
              const completed = steps
                .filter((_, idx) => checkedArray[idx])
                .join(" | ");
              answerText = completed || "None completed";
            } else if (typeof parsedVal === "object") {
              answerText = JSON.stringify(parsedVal);
            } else {
              answerText = String(parsedVal);
            }
          } catch {
            answerText = String(answer.value);
          }
        }
      }

      csvContent += `${escapeCSV(field.fieldName)},${escapeCSV(field.fieldType)},${escapeCSV(answerText)},${escapeCSV(screenshotUrl)},${escapeCSV(submittedAtStr)}\n`;
    });

    // Return as downloadable file response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="run-${runId}-results.csv"`,
      },
    });
  } catch (error: any) {
    console.error("GET export run failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to export CSV" }, { status: 500 });
  }
}
