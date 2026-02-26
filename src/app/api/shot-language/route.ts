/**
 * 镜头语言API
 * POST /api/shot-language - 分析场景描述并生成镜头Prompt
 */

import { NextResponse } from "next/server";
import { ShotLanguageEngine } from "@/lib/shot-language";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, description, options } = body;

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "analyze": {
        const analysis = ShotLanguageEngine.analyzeScene({ description, ...options });
        return NextResponse.json({ analysis });
      }

      case "generate": {
        const result = ShotLanguageEngine.generateShotFromDescription(description, options);
        return NextResponse.json(result);
      }

      case "sequence": {
        const { shotCount, style } = options || {};
        const sequence = ShotLanguageEngine.generateSequenceFromDescription(
          description,
          shotCount,
          style
        );
        return NextResponse.json({ sequence });
      }

      default: {
        const result = ShotLanguageEngine.generateShotFromDescription(description, options);
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error("Shot language API error:", error);
    return NextResponse.json(
      { error: "Failed to process shot language request", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    const { SHOT_TYPES, CAMERA_MOVEMENTS, COMPOSITIONS, LIGHTING_TYPES, CAMERA_ANGLES, DEPTH_OF_FIELD } = await import("@/lib/shot-language");

    switch (type) {
      case "shot-types":
        return NextResponse.json({ shotTypes: Object.values(SHOT_TYPES) });
      case "camera-movements":
        return NextResponse.json({ cameraMovements: Object.values(CAMERA_MOVEMENTS) });
      case "compositions":
        return NextResponse.json({ compositions: Object.values(COMPOSITIONS) });
      case "lighting":
        return NextResponse.json({ lighting: Object.values(LIGHTING_TYPES) });
      case "camera-angles":
        return NextResponse.json({ cameraAngles: Object.values(CAMERA_ANGLES) });
      case "depth-of-field":
        return NextResponse.json({ depthOfField: Object.values(DEPTH_OF_FIELD) });
      case "all":
        return NextResponse.json({
          shotTypes: Object.values(SHOT_TYPES),
          cameraMovements: Object.values(CAMERA_MOVEMENTS),
          compositions: Object.values(COMPOSITIONS),
          lighting: Object.values(LIGHTING_TYPES),
          cameraAngles: Object.values(CAMERA_ANGLES),
          depthOfField: Object.values(DEPTH_OF_FIELD),
        });
      default:
        return NextResponse.json({
          message: "Shot Language API",
          endpoints: {
            "GET ?type=shot-types": "Get all shot types",
            "GET ?type=camera-movements": "Get all camera movements",
            "GET ?type=compositions": "Get all compositions",
            "GET ?type=lighting": "Get all lighting types",
            "GET ?type=camera-angles": "Get all camera angles",
            "GET ?type=depth-of-field": "Get all depth of field options",
            "GET ?type=all": "Get all options",
            "POST {action: 'analyze', description: '...'}": "Analyze scene",
            "POST {action: 'generate', description: '...'}": "Generate shot prompts",
            "POST {action: 'sequence', description: '...'}": "Generate shot sequence",
          },
        });
    }
  } catch (error) {
    console.error("Shot language API error:", error);
    return NextResponse.json(
      { error: "Failed to get shot language data" },
      { status: 500 }
    );
  }
}
