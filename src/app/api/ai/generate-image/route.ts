
/**
 * Simplified AI Image Generation API.
 * POST /api/ai/generate-image - Generate images directly using generateImage
 */

import { NextResponse } from "next/server";
import {
  generateImage,
  isGeminiConfigured,
  GeminiImageApiError,
} from "@/lib/ai/gemini-image";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "generated-images");

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function saveBase64Image(base64Data: string, fileName: string): string {
  ensureUploadDir();

  let base64Content = base64Data;
  if (base64Data.startsWith("data:")) {
    base64Content = base64Data.split(",")[1];
  }

  const buffer = Buffer.from(base64Content, "base64");
  const filePath = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/generated-images/${fileName}`;
}

export async function POST(request: Request) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: "Gemini image generation service is not configured. Please set GEMINI_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { prompt, style, type, aspectRatio, resolution, count = 1 } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const images: string[] = [];

    for (let i = 0; i &lt; count; i++) {
      const generatedImages = await generateImage(prompt, {
        style,
        type,
        aspectRatio,
        resolution,
        n: 1,
      });

      if (generatedImages.length &gt; 0) {
        const fileName = `generated-${timestamp}-${i}.png`;
        const url = saveBase64Image(generatedImages[0], fileName);
        images.push(url);
      }
    }

    return NextResponse.json({
      success: true,
      images: images.map(url =&gt; ({ url })),
      count: images.length,
    });
  } catch (error) {
    console.error("Error generating image:", error);

    if (error instanceof GeminiImageApiError) {
      return NextResponse.json(
        { error: `Image generation error: ${error.message}` },
        { status: error.statusCode || 502 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate image",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    configured: isGeminiConfigured(),
    model: "gemini-3.1-flash-image-preview",
    endpoint: "/api/ai/generate-image",
  });
}

