import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mobileUploads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let sessionId = "";
  try {
    const parsedParams = await params;
    sessionId = parsedParams.sessionId;
    console.log(`[GET POLL] Request for sessionId: ${sessionId}`);

    const session = await db
      .select()
      .from(mobileUploads)
      .where(eq(mobileUploads.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      console.log(`[GET POLL] Session ${sessionId} not found in DB`);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    console.log(`[GET POLL] Session ${sessionId} status is currently: ${session[0].status}`);

    return NextResponse.json(
      { data: session[0], error: null },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    console.error(`[GET POLL ERROR] Session ${sessionId} failed:`, error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let sessionId = "";
  try {
    const parsedParams = await params;
    sessionId = parsedParams.sessionId;

    // Check if session exists
    const sessionList = await db
      .select()
      .from(mobileUploads)
      .where(eq(mobileUploads.id, sessionId))
      .limit(1);

    if (sessionList.length === 0) {
      console.log(`[POST ERROR] Session ${sessionId} not found in DB`);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionList[0];
    const contentType = req.headers.get("content-type") || "";

    // If it's multipart/form-data, it is the phone uploading the photo!
    if (contentType.includes("multipart/form-data")) {
      console.log(`[UPLOAD REQUEST] Received photo upload request from phone for sessionId: ${sessionId}`);

      // 1. Session state validation
      if (session.status !== "PENDING") {
        console.log(`[UPLOAD ERROR] Session ${sessionId} is not PENDING. Status: ${session.status}`);
        return NextResponse.json({ error: "Session is no longer active" }, { status: 400 });
      }

      // 2. Expiration validation (15 minutes)
      const expirationTime = 15 * 60 * 1000;
      if (Date.now() - new Date(session.createdAt).getTime() > expirationTime) {
        console.log(`[UPLOAD ERROR] Session ${sessionId} expired`);
        return NextResponse.json({ error: "Session has expired" }, { status: 400 });
      }

      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        console.log(`[UPLOAD ERROR] No file payload in request for sessionId: ${sessionId}`);
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      // 3. File extension validation
      const fileName = file.name.toLowerCase();
      const allowedExtensions = [".png", ".jpeg", ".jpg", ".webp"];
      const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      if (!hasAllowedExtension) {
        console.log(`[UPLOAD ERROR] File name ${file.name} does not have allowed extension for sessionId: ${sessionId}`);
        return NextResponse.json({ error: "Only PNG, JPEG, and WEBP image files are allowed" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // 4. Magic number validation
      const isPng = buffer.length >= 8 && buffer.readUInt32BE(0) === 0x89504E47 && buffer.readUInt32BE(4) === 0x0D0A1A0A;
      const isJpeg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isWebp = buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

      if (!isPng && !isJpeg && !isWebp) {
        console.log(`[UPLOAD ERROR] Invalid image file content for sessionId: ${sessionId}`);
        return NextResponse.json({ error: "Invalid image file content" }, { status: 400 });
      }
      const uploadDir = join(process.cwd(), "uploads", "screenshots");
      await mkdir(uploadDir, { recursive: true });

      const uuid = crypto.randomUUID();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${uuid}-${sanitizedName}`;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      const fileUrl = `/uploads/screenshots/${filename}`;

      console.log(`[UPLOAD SUCCESS] File saved to ${filepath}. Updating DB status for sessionId: ${sessionId}`);

      // Update session in db
      const updatedRows = await db
        .update(mobileUploads)
        .set({
          imageUrl: fileUrl,
          status: "COMPLETED",
          updatedAt: new Date(),
        })
        .where(eq(mobileUploads.id, sessionId))
        .returning();

      console.log(`[UPLOAD DB UPDATE] Rows updated in DB:`, updatedRows);

      return NextResponse.json({ data: { url: fileUrl }, error: null });
    } else {
      // Consume body stream just in case to prevent socket connection hangs
      try {
        await req.text();
      } catch (e) {}

      // It is a desktop status poll query (POST is completely uncacheable)
      console.log(`[POST POLL] Poll status request for sessionId: ${sessionId}. Current DB status: ${session.status}, imageUrl: ${session.imageUrl}`);
      
      return NextResponse.json(
        { data: session, error: null },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }
  } catch (error: any) {
    console.error(`[POST ERROR] Failed processing request for sessionId: ${sessionId}:`, error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
