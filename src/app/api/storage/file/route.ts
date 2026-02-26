/**
 * Local storage file serving API.
 * GET /api/storage/file - Serve a file from local storage
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MEDIA_DIR = path.join(process.cwd(), "data", "media");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const sanitizedPath = filePath.replace(/\.\./g, "");
    const fullPath = path.join(MEDIA_DIR, sanitizedPath);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);

    const ext = path.extname(fullPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
