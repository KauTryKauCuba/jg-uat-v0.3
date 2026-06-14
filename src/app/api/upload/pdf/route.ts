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

    // PDF only validation
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pdf")) {
      return NextResponse.json({ data: null, error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Max 20MB validation (20 * 1024 * 1024 bytes)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ data: null, error: "File size exceeds 20MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic number validation for PDF: %PDF- (0x25 50 44 46 2D)
    const isPdf = buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "%PDF-";
    if (!isPdf) {
      return NextResponse.json({ data: null, error: "Invalid PDF file content" }, { status: 400 });
    }
    const uploadDir = join(process.cwd(), "uploads", "pdfs");
    
    // Ensure dir exists
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uniqueId = crypto.randomUUID();
    const filename = `${uniqueId}.pdf`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/pdfs/${filename}`;

    return NextResponse.json({ data: { url: fileUrl }, error: null });
  } catch (error: any) {
    console.error("PDF upload failed:", error);
    return NextResponse.json({ data: null, error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
