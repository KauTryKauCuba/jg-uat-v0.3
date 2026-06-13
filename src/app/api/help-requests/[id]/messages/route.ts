import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { helpRequests, helpMessages, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the request exists
    const request = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.id, id))
      .limit(1);

    if (request.length === 0) {
      return NextResponse.json({ data: null, error: "Help request not found" }, { status: 404 });
    }

    // If sender is a TESTER, make sure it's their own request
    if (session.user.role === "TESTER" && request[0].testerId !== session.user.id) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch messages for this request
    const messagesList = await db
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
      .where(eq(helpMessages.helpRequestId, id))
      .orderBy(helpMessages.createdAt);

    return NextResponse.json({ data: messagesList, error: null });
  } catch (error: any) {
    console.error("GET messages failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json({ data: null, error: "Message content is required" }, { status: 400 });
    }

    // Verify the request exists
    const request = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.id, id))
      .limit(1);

    if (request.length === 0) {
      return NextResponse.json({ data: null, error: "Help request not found" }, { status: 404 });
    }

    if (request[0].status !== "PENDING") {
      return NextResponse.json({ data: null, error: "Help request is already resolved" }, { status: 400 });
    }

    // If sender is a TESTER, make sure it's their own request
    if (session.user.role === "TESTER" && request[0].testerId !== session.user.id) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const [newMessage] = await db
      .insert(helpMessages)
      .values({
        helpRequestId: id,
        senderId: session.user.id,
        message: message.trim(),
      })
      .returning();

    return NextResponse.json({ data: newMessage, error: null }, { status: 201 });
  } catch (error: any) {
    console.error("POST message failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to send message" }, { status: 500 });
  }
}
