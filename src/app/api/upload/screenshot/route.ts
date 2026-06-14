import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ data: null, error: "No file uploaded" }, { status: 400 });
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const allowedExtensions = [".png", ".jpeg", ".jpg", ".webp"];
    const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasAllowedExtension) {
      return NextResponse.json({ data: null, error: "Only PNG, JPEG, and WEBP image files are allowed" }, { status: 400 });
    }

    // Max 5MB validation
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ data: null, error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic number validation
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    // JPEG: FF D8 FF
    // WEBP: RIFF at 0, WEBP at 8
    const isPng = buffer.length >= 8 && buffer.readUInt32BE(0) === 0x89504E47 && buffer.readUInt32BE(4) === 0x0D0A1A0A;
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isWebp = buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

    if (!isPng && !isJpeg && !isWebp) {
      return NextResponse.json({ data: null, error: "Invalid image file content" }, { status: 400 });
    }
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
    return NextResponse.json({ data: null, error: "Failed to upload screenshot" }, { status: 500 });
  }
}
