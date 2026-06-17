import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testRuns, testCases, testFields, testAnswers, users, testerFeedbacks, testerSignOffs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { runId, groupFilter, messages } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    let systemPrompt = "You are AI UATGiga, a helpful AI assistant integrated into the JobGiga UAT system. Your goal is to review UAT run results and give analytical feedback to administrators. Analyze the test run context carefully, evaluate if the tester answered correctly based on constraints, and format your responses clearly with markdown bullet points and highlight key actions.";

    if (runId) {
      // Fetch UAT Run, associated Test Case, fields, and tester answers
      const runRecord = await db
        .select({
          id: testRuns.id,
          status: testRuns.status,
          submittedAt: testRuns.submittedAt,
          createdAt: testRuns.createdAt,
          testerName: users.name,
          testerEmail: users.email,
          testCaseTitle: testCases.title,
          testCaseDesc: testCases.description,
        })
        .from(testRuns)
        .leftJoin(users, eq(users.id, testRuns.testerId))
        .leftJoin(testCases, eq(testCases.id, testRuns.testCaseId))
        .where(eq(testRuns.id, runId))
        .limit(1);

      if (runRecord.length > 0) {
        const run = runRecord[0];
        
        // Fetch answers and fields
        const answersList = await db
          .select({
            fieldName: testFields.fieldName,
            fieldType: testFields.fieldType,
            choices: testFields.choices,
            steps: testFields.steps,
            value: testAnswers.value,
            screenshotUrl: testAnswers.screenshotUrl,
            pdfUrl: testAnswers.pdfUrl,
          })
          .from(testAnswers)
          .leftJoin(testFields, eq(testFields.id, testAnswers.testFieldId))
          .where(eq(testAnswers.testRunId, runId));

        const formattedAnswers = answersList.map(a => {
          let parsedVal = a.value;
          try {
            const parsed = JSON.parse(a.value || "");
            if (parsed && typeof parsed === "object") {
              parsedVal = JSON.stringify(parsed);
            }
          } catch {}
          
          const attachments = [];
          if (a.screenshotUrl) attachments.push(`Screenshot = "${a.screenshotUrl}"`);
          if (a.pdfUrl) attachments.push(`PDF = "${a.pdfUrl}"`);
          const attachmentsStr = attachments.length > 0 ? ` (Attachments: ${attachments.join(", ")})` : "";

          return `- Field "${a.fieldName}" (${a.fieldType}): Answer = "${parsedVal}"${attachmentsStr}`;
        }).join("\n");

        systemPrompt += `\n\n[CONTEXT: UAT TEST RUN DETAILS]
- Test Case: "${run.testCaseTitle}"
- Description: "${run.testCaseDesc || "N/A"}"
- Tester Name: "${run.testerName || "N/A"}" (${run.testerEmail})
- Run Status: "${run.status}"
- Submitted At: "${run.submittedAt ? run.submittedAt.toISOString() : "Not submitted yet"}"
- Answers Submitted by Tester:
${formattedAnswers || "No answers submitted yet."}
`;
      }
    } else {
      let runsQuery = db
        .select({ status: testRuns.status })
        .from(testRuns);

      let feedbacksQuery = db
        .select({
          ratingOverall: testerFeedbacks.ratingOverall,
          ratingEaseOfUse: testerFeedbacks.ratingEaseOfUse,
          ratingInstructions: testerFeedbacks.ratingInstructions,
          ratingResultForm: testerFeedbacks.ratingResultForm,
        })
        .from(testerFeedbacks);

      let signOffsQuery = db
        .select()
        .from(testerSignOffs);

      if (groupFilter && groupFilter !== "ALL") {
        runsQuery = runsQuery
          .leftJoin(users, eq(users.id, testRuns.testerId))
          .where(eq(users.testerGroup, groupFilter)) as any;

        feedbacksQuery = feedbacksQuery
          .leftJoin(users, eq(users.id, testerFeedbacks.testerId))
          .where(eq(users.testerGroup, groupFilter)) as any;

        signOffsQuery = signOffsQuery
          .leftJoin(users, eq(users.id, testerSignOffs.testerId))
          .where(eq(users.testerGroup, groupFilter)) as any;
      }

      const allRuns = await runsQuery;
      const allFeedbacks = await feedbacksQuery;
      const allSignOffs = await signOffsQuery;

      const totalRuns = allRuns.length;
      const passedRuns = allRuns.filter(r => r.status === "PASSED").length;
      const failedRuns = allRuns.filter(r => r.status === "FAILED").length;
      const pendingRuns = allRuns.filter(r => r.status === "PENDING").length;

      const totalFeedbacks = allFeedbacks.length;
      const avgOverall = totalFeedbacks > 0 ? (allFeedbacks.reduce((acc, f) => acc + f.ratingOverall, 0) / totalFeedbacks).toFixed(1) : "0.0";
      const avgEaseOfUse = totalFeedbacks > 0 ? (allFeedbacks.reduce((acc, f) => acc + f.ratingEaseOfUse, 0) / totalFeedbacks).toFixed(1) : "0.0";
      const avgInstructions = totalFeedbacks > 0 ? (allFeedbacks.reduce((acc, f) => acc + f.ratingInstructions, 0) / totalFeedbacks).toFixed(1) : "0.0";
      const avgResultForm = totalFeedbacks > 0 ? (allFeedbacks.reduce((acc, f) => acc + f.ratingResultForm, 0) / totalFeedbacks).toFixed(1) : "0.0";

      const runFilterLabel = groupFilter && groupFilter !== "ALL" ? `GROUP "${groupFilter}"` : "ALL UAT GROUPS";

      systemPrompt += `\n\n[CONTEXT: GLOBAL UAT STATUS OVERVIEW FOR ${runFilterLabel}]
- Total Runs: ${totalRuns} (Passed: ${passedRuns}, Failed: ${failedRuns}, In Progress: ${pendingRuns})
- Tester Survey Feedbacks: ${totalFeedbacks} submissions
  - Avg Overall Rating: ${avgOverall}/5.0
  - Avg Platform Ease of Use: ${avgEaseOfUse}/5.0
  - Avg Instruction Clarity: ${avgInstructions}/5.0
  - Avg Result Form Ease: ${avgResultForm}/5.0
- Total UAT Sign Offs: ${allSignOffs.length}
`;
    }

    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
    const modelName = process.env.OLLAMA_MODEL || "llama3.2:1b";

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const ollamaRes = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        messages: chatMessages,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama API returned ${ollamaRes.status}`);
    }

    const json = await ollamaRes.json();
    const assistantMessage = json.message?.content || "";

    return NextResponse.json({ message: assistantMessage });
  } catch (error: any) {
    console.error("AI chat failed:", error);
    return NextResponse.json({ error: "Failed to communicate with local AI" }, { status: 500 });
  }
}
