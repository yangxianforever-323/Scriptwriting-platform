
/**
 * Simplified AI Image Generation API.
 * POST /api/ai/generate-image - Generate images with parallel processing
 * Supports generating multiple style variations in parallel
 */

import { NextResponse } from "next/server";
import {
  generateImage,
  generateImageWithStyle,
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

// 风格变体列表 - 用于生成不同风格的图片
const STYLE_VARIATIONS = [
  { name: "realistic", prompt: "Photorealistic, natural lighting, professional photography" },
  { name: "cinematic", prompt: "Cinematic, dramatic lighting, film grain, movie still quality" },
  { name: "anime", prompt: "Anime style, vibrant colors, clean lines, Japanese animation" },
  { name: "oil_painting", prompt: "Oil painting style, thick brushstrokes, rich colors, classical art" },
  { name: "watercolor", prompt: "Watercolor painting, soft edges, delicate colors, artistic illustration" },
  { name: "cyberpunk", prompt: "Cyberpunk style, neon lights, futuristic, dark atmosphere" },
  { name: "fantasy", prompt: "Fantasy style, magical elements, ethereal, dreamlike, mystical" },
  { name: "cartoon", prompt: "Cartoon style, bright colors, playful, exaggerated features" },
];

export async function POST(request: Request) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: "Gemini image generation service is not configured. Please set GEMINI_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { prompt, style, type, aspectRatio, resolution, count = 1, referenceImages = [] } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const images: { url: string; style?: string }[] = [];

    // 风格变体数量
    const styleVariationCount = Math.min(count, STYLE_VARIATIONS.length);
    const variations = STYLE_VARIATIONS.slice(0, styleVariationCount);

    console.log(`Starting parallel generation of ${styleVariationCount} images...`);
    console.log("Request details:", {
      promptLength: prompt.length,
      style,
      type,
      aspectRatio,
      resolution,
      count,
      referenceImagesCount: referenceImages?.length || 0
    });

    // 使用 Promise.all 并行生成多张图片
    const generatePromises = variations.map(async (variation, index) => {
      try {
        console.log(`Generating image ${index + 1}/${styleVariationCount} with style: ${variation.name}`);

        const result = await generateImageWithStyle(prompt, {
          style: style || variation.name,
          type,
          aspectRatio,
          resolution,
          referenceImages,
          customStyleSuffix: variation.prompt,
        });

        if (result && result.length > 0) {
          const fileName = `generated-${timestamp}-${index}.png`;
          const url = saveBase64Image(result[0], fileName);
          console.log(`Image ${index + 1} generated successfully: ${url}`);
          return { url, style: variation.name };
        }
        return null;
      } catch (error) {
        console.error(`Error generating image ${index + 1}:`, error);
        return null;
      }
    });

    const results = await Promise.all(generatePromises);

    // 收集成功生成的图片
    for (const result of results) {
      if (result) {
        images.push(result);
      }
    }

    console.log(`Generated ${images.length} images successfully out of ${count} requested`);

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
      totalRequested: count,
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
    supportedStyles: STYLE_VARIATIONS.map(v => v.name),
  });
}
