import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mobileUploads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await db
      .select()
      .from(mobileUploads)
      .where(eq(mobileUploads.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ data: session[0], error: null });
  } catch (error: any) {
    console.error("Failed to fetch mobile upload session:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch session" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Check if session exists and is still PENDING
    const sessionList = await db
      .select()
      .from(mobileUploads)
      .where(eq(mobileUploads.id, sessionId))
      .limit(1);

    if (sessionList.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionList[0];

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Image validation (png, jpeg, webp)
    const fileType = file.type;
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ error: "Only PNG, JPEG, and WEBP image files are allowed" }, { status: 400 });
    }

    // Max 5MB validation
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = join(process.cwd(), "uploads", "screenshots");
    
    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uuid = crypto.randomUUID();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${uuid}-${sanitizedName}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);
    const fileUrl = `/uploads/screenshots/${filename}`;

    // Update session in db
    await db
      .update(mobileUploads)
      .set({
        imageUrl: fileUrl,
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(eq(mobileUploads.id, sessionId));

    return NextResponse.json({ data: { url: fileUrl }, error: null });
  } catch (error: any) {
    console.error("Failed to handle mobile upload:", error);
    return NextResponse.json({ error: error.message || "Upload processing failed" }, { status: 500 });
  }
}
