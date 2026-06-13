import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> }
) {
  try {
    const { type, filename } = await params;
    
    // Resolve filepath to the /app/uploads folder outside public
    const filepath = join(process.cwd(), "uploads", type, filename);

    if (!existsSync(filepath)) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const fileBuffer = await readFile(filepath);
    
    // Set appropriate content type header
    let contentType = "application/octet-stream";
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      contentType = "application/pdf";
    } else if (ext === "png") {
      contentType = "image/png";
    } else if (ext === "jpg" || ext === "jpeg") {
      contentType = "image/jpeg";
    } else if (ext === "webp") {
      contentType = "image/webp";
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    console.error("Failed to serve upload:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
