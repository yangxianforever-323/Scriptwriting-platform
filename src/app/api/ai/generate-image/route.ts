/**
 * Unified AI Image Generation API.
 * POST /api/ai/generate-image - Generate images for characters, locations, props, and scenes
 */

import { NextResponse } from "next/server";
import {
  generateImage,
  generateCharacterImages,
  generateLocationImage,
  generatePropImage,
  generateSceneImage,
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
    const { type, ...options } = body;

    if (!type || !["character", "location", "prop", "scene", "general"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be one of: character, location, prop, scene, general" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    let result: Record<string, unknown>;

    switch (type) {
      case "character": {
        const { name, appearance, personality, views, style } = options;

        if (!name || !appearance) {
          return NextResponse.json(
            { error: "Character name and appearance are required" },
            { status: 400 }
          );
        }

        const images = await generateCharacterImages(name, appearance, personality, {
          views: views || ["front", "side", "back", "three_quarter", "close_up"],
          style,
        });

        const savedImages = images.map((img, index) => {
          const fileName = `character-${timestamp}-${img.view}.png`;
          const url = saveBase64Image(img.imageData, fileName);
          return {
            view: img.view,
            url,
            fileName,
          };
        });

        result = {
          type: "character",
          name,
          images: savedImages,
          count: savedImages.length,
        };
        break;
      }

      case "location": {
        const { name, description, atmosphere, style } = options;

        if (!name || !description) {
          return NextResponse.json(
            { error: "Location name and description are required" },
            { status: 400 }
          );
        }

        const imageData = await generateLocationImage(name, description, atmosphere, { style });
        const fileName = `location-${timestamp}.png`;
        const url = saveBase64Image(imageData, fileName);

        result = {
          type: "location",
          name,
          url,
          fileName,
        };
        break;
      }

      case "prop": {
        const { name, description, importance, style } = options;

        if (!name || !description) {
          return NextResponse.json(
            { error: "Prop name and description are required" },
            { status: 400 }
          );
        }

        const imageData = await generatePropImage(name, description, importance, { style });
        const fileName = `prop-${timestamp}.png`;
        const url = saveBase64Image(imageData, fileName);

        result = {
          type: "prop",
          name,
          url,
          fileName,
        };
        break;
      }

      case "scene": {
        const {
          description,
          characters,
          location,
          props,
          mood,
          style,
          shotType,
        } = options;

        if (!description) {
          return NextResponse.json(
            { error: "Scene description is required" },
            { status: 400 }
          );
        }

        const imageData = await generateSceneImage(
          description,
          characters,
          location,
          props,
          mood,
          { style, shotType }
        );
        const fileName = `scene-${timestamp}-${shotType || "default"}.png`;
        const url = saveBase64Image(imageData, fileName);

        result = {
          type: "scene",
          url,
          fileName,
          metadata: {
            characters,
            location,
            props,
            mood,
            shotType,
          },
        };
        break;
      }

      case "general": {
        const { prompt, style, size, n } = options;

        if (!prompt) {
          return NextResponse.json(
            { error: "Prompt is required for general image generation" },
            { status: 400 }
          );
        }

        const images = await generateImage(prompt, {
          style,
          size,
          n: n || 1,
        });

        const savedImages = images.map((img, index) => {
          const fileName = `general-${timestamp}-${index + 1}.png`;
          const url = saveBase64Image(img, fileName);
          return { url, fileName, index };
        });

        result = {
          type: "general",
          images: savedImages,
          count: savedImages.length,
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${type} image(s)`,
      generatedAt: new Date().toISOString(),
      model: "gemini-3.1-flash-image-preview",
      ...result,
    });
  } catch (error) {
    console.error("Error generating image:", error);

    if (error instanceof GeminiImageApiError) {
      return NextResponse.json(
        { error: `Image generation error: ${error.message}`, code: error.errorCode },
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
    supportedTypes: ["character", "location", "prop", "scene", "general"],
    examples: {
      character: {
        type: "character",
        name: "李璧",
        appearance: "身着青色官袍，容貌俊朗，眼神锐利，气质儒雅中带着威严",
        views: ["front", "side", "back", "three_quarter", "close_up"],
        style: "realistic",
      },
      location: {
        type: "location",
        name: "靖安司大殿",
        description: "宽敞肃穆的大殿，中央摆放着巨大的案牍架，墙上挂着长安城防图，烛火摇曳",
        atmosphere: "紧张、神秘、充满权谋气息",
        style: "cinematic",
      },
      prop: {
        type: "prop",
        name: "望楼传信装置",
        description: "精巧的机械装置，用于传递信号和消息，带有复杂的齿轮和镜面结构",
        importance: "关键道具，用于追踪狼卫位置",
        style: "realistic",
      },
      scene: {
        type: "scene",
        description: "李璧站在望楼前，手持文书，凝视远方灯火辉煌的长安城",
        characters: ["李璧"],
        location: "靖安司望楼",
        mood: "凝重、决然",
        style: "cinematic",
        shotType: "MS",
      },
    },
  });
}
