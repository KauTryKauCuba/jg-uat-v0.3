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
    return NextResponse.json({ error: error.message || "Failed to fetch session" }, { status: 500 });
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

      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        console.log(`[UPLOAD ERROR] No file payload in request for sessionId: ${sessionId}`);
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      // Image validation (png, jpeg, webp)
      const fileType = file.type;
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!allowedTypes.includes(fileType)) {
        console.log(`[UPLOAD ERROR] File type ${fileType} not allowed for sessionId: ${sessionId}`);
        return NextResponse.json({ error: "Only PNG, JPEG, and WEBP image files are allowed" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
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
    return NextResponse.json({ error: error.message || "Request failed" }, { status: 500 });
  }
}
