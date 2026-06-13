import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { helpRequests, helpMessages, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "ADMIN") {
      // Admin sees all pending help requests
      const requests = await db
        .select({
          id: helpRequests.id,
          type: helpRequests.type,
          status: helpRequests.status,
          createdAt: helpRequests.createdAt,
          testerName: users.name,
          testerEmail: users.email,
        })
        .from(helpRequests)
        .innerJoin(users, eq(users.id, helpRequests.testerId))
        .where(eq(helpRequests.status, "PENDING"))
        .orderBy(desc(helpRequests.createdAt));
      return NextResponse.json({ data: requests, error: null });
    } else {
      // Tester sees their active/pending help requests
      const activeRequest = await db
        .select()
        .from(helpRequests)
        .where(
          and(
            eq(helpRequests.testerId, session.user.id),
            eq(helpRequests.status, "PENDING")
          )
        )
        .limit(1);

      if (activeRequest.length === 0) {
        return NextResponse.json({ data: null, error: null });
      }

      // Fetch messages for this request
      const messages = await db
        .select({
          id: helpMessages.id,
          senderId: helpMessages.senderId,
          message: helpMessages.message,
          createdAt: helpMessages.createdAt,
          senderName: users.name,
          senderRole: users.role,
        })
        .from(helpMessages)
        .innerJoin(users, eq(users.id, helpMessages.senderId))
        .where(eq(helpMessages.helpRequestId, activeRequest[0].id))
        .orderBy(helpMessages.createdAt);

      return NextResponse.json({
        data: {
          request: activeRequest[0],
          messages,
        },
        error: null,
      });
    }
  } catch (error: any) {
    console.error("GET help requests failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to fetch help requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body; // "CHAT" | "IN_PERSON"

    if (!type || (type !== "CHAT" && type !== "IN_PERSON")) {
      return NextResponse.json({ data: null, error: "Invalid request type" }, { status: 400 });
    }

    // Check if there is already a pending help request for this tester
    const existing = await db
      .select()
      .from(helpRequests)
      .where(
        and(
          eq(helpRequests.testerId, session.user.id),
          eq(helpRequests.status, "PENDING")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ data: existing[0], error: "You already have a pending request" }, { status: 400 });
    }

    const [newRequest] = await db
      .insert(helpRequests)
      .values({
        testerId: session.user.id,
        type,
        status: "PENDING",
      })
      .returning();

    // Insert an initial message if it is a chat request
    if (type === "CHAT") {
      await db.insert(helpMessages).values({
        helpRequestId: newRequest.id,
        senderId: session.user.id,
        message: "I started a chat request. Waiting for admin...",
      });
    } else {
      await db.insert(helpMessages).values({
        helpRequestId: newRequest.id,
        senderId: session.user.id,
        message: "I requested in-person help. Admin will come to my desk.",
      });
    }

    return NextResponse.json({ data: newRequest, error: null }, { status: 201 });
  } catch (error: any) {
    console.error("POST help request failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to create help request" }, { status: 500 });
  }
}
