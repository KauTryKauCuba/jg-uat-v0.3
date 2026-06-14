import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ data: null, error: "No file uploaded" }, { status: 400 });
    }

    // Image validation (png, jpeg, webp)
    const fileType = file.type;
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ data: null, error: "Only PNG, JPEG, and WEBP image files are allowed" }, { status: 400 });
    }

    // Max 5MB validation
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ data: null, error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = join(process.cwd(), "uploads", "screenshots");
    
    // Ensure dir exists
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename following [uuid]-[name].[ext]
    const uuid = crypto.randomUUID();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${uuid}-${sanitizedName}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/screenshots/${filename}`;

    return NextResponse.json({ data: { url: fileUrl }, error: null });
  } catch (error: any) {
    console.error("Screenshot upload failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to upload screenshot" }, { status: 500 });
  }
}
