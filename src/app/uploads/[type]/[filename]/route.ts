import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> }
) {
  try {
    const { type, filename } = await params;

    // Validate against path traversal
    if (
      type.includes("..") || type.includes("/") || type.includes("\\") ||
      filename.includes("..") || filename.includes("/") || filename.includes("\\")
    ) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Resolve filepath and verify it stays within the uploads directory
    const uploadsRoot = resolve(process.cwd(), "uploads");
    const filepath = resolve(uploadsRoot, type, filename);

    if (!filepath.startsWith(uploadsRoot)) {
      return new NextResponse("Bad Request", { status: 400 });
    }

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
