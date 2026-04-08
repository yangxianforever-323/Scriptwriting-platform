/**
 * POST /api/generate/shot-image
 * Generate image for a single shot
 */

import { NextResponse } from "next/server";
import { shotDb } from "@/lib/db/storyboard";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shotId, prompt, storyboardId } = body;

    if (!shotId || !prompt) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const mockImageUrl = `https://picsum.photos/seed/${shotId}-${Date.now()}/1024/576`;

    shotDb.update(shotId, {
      imageUrl: mockImageUrl,
      imageStatus: "completed",
    });

    return NextResponse.json({
      success: true,
      shotId,
      imageUrl: mockImageUrl,
      message: "图片生成成功",
    });
  } catch (error) {
    console.error("Error generating shot image:", error);
    return NextResponse.json(
      { error: "生成失败" },
      { status: 500 }
    );
  }
}
