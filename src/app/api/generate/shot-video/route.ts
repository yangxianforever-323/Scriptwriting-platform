/**
 * POST /api/generate/shot-video
 * Generate video for a single shot
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

    const mockVideoUrl = `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`;

    shotDb.update(shotId, {
      videoUrl: mockVideoUrl,
      videoStatus: "completed",
    });

    return NextResponse.json({
      success: true,
      shotId,
      videoUrl: mockVideoUrl,
      message: "视频生成成功",
    });
  } catch (error) {
    console.error("Error generating shot video:", error);
    return NextResponse.json(
      { error: "生成失败" },
      { status: 500 }
    );
  }
}
