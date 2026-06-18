import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { testCaseCategories } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, targetGroup } = body;

    if (!text) {
      return NextResponse.json({ error: "Extracted text is required" }, { status: 400 });
    }

    const activeGroup = targetGroup ? String(targetGroup).toUpperCase().trim() : "JOBSEEKER_WEB";

    // Setup Ollama parameters
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
    const modelName = process.env.OLLAMA_MODEL || "llama3.2:1b";

    const systemPrompt = `You are a UAT assistant. You will analyze the raw text of a testcase document and extract UAT category names (defined in the document as 18pt headings). 
Return ONLY a valid JSON array of objects with keys "name" and "description". 
Example output format:
[
  { "name": "Candidate Authentication", "description": "Categories for login, register, and password resets" }
]
Do not return any other text, markdown formatting blocks, or chat preamble.`;

    const userPrompt = `Here is the extracted text from the UAT document. Identify all category headers (designed at 18pt font size) and output the JSON list:
---
${text.substring(0, 10000)}
---`;

    console.log("Calling local Ollama model:", modelName);
    const ollamaRes = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama API returned status ${ollamaRes.status}`);
    }

    const json = await ollamaRes.json();
    const assistantMessage = json.message?.content || "";

    // Clean markdown wrappers if returned
    let cleanJson = assistantMessage.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    let extractedCategories: Array<{ name: string; description?: string }> = [];
    try {
      extractedCategories = JSON.parse(cleanJson);
    } catch (err) {
      console.error("Failed to parse AI response as JSON:", assistantMessage);
      return NextResponse.json({ error: "AI failed to return valid JSON list. Please try again." }, { status: 500 });
    }

    if (!Array.isArray(extractedCategories)) {
      return NextResponse.json({ error: "Invalid AI response structure. Expected array." }, { status: 500 });
    }

    const createdCategories = [];

    // Query current max order
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testCaseCategories);
    let orderIndex = countResult[0]?.count || 0;

    for (const item of extractedCategories) {
      if (!item.name) continue;
      
      try {
        const inserted = await db
          .insert(testCaseCategories)
          .values({
            name: item.name.trim(),
            description: item.description ? item.description.trim() : "",
            targetGroup: activeGroup,
            order: orderIndex++,
          })
          .returning();
          
        createdCategories.push(inserted[0]);
      } catch (err: any) {
        // Unique constraint violation (ignore duplicates)
        if (err.code !== "23505") {
          console.error("Failed to insert category:", err);
        }
      }
    }

    return NextResponse.json({ data: createdCategories, error: null });
  } catch (error: any) {
    console.error("AI import failed:", error);
    return NextResponse.json({ error: "Failed to communicate with local AI" }, { status: 500 });
  }
}
