/**
 * GET /api/generate/shot-video/status?taskId=xxx&shotId=xxx
 * Poll the Volcengine task status for a shot video generation task.
 * When completed, saves the video URL to the shot record and returns it.
 * The client calls this endpoint every ~5s while videoStatus === "generating".
 */

import { NextResponse } from "next/server";
import { shotStore } from "@/lib/data-store";
import {
  getVideoTaskStatus,
  isVolcVideoConfigured,
  VolcVideoApiError,
} from "@/lib/ai/volc-video";
import fs from "fs";
import path from "path";

const VIDEO_DIR = path.join(process.cwd(), "public", "uploads", "generated-videos");

function ensureVideoDir(): void {
  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const shotId = searchParams.get("shotId");

  if (!taskId) {
    return NextResponse.json({ error: "缺少 taskId 参数" }, { status: 400 });
  }

  if (!isVolcVideoConfigured()) {
    return NextResponse.json(
      { error: "视频生成服务未配置，请设置 VOLC_API_KEY 环境变量" },
      { status: 503 }
    );
  }

  try {
    const result = await getVideoTaskStatus(taskId);

    // If completed, download and save the video locally for persistence
    if (result.status === "completed" && result.videoUrl) {
      try {
        ensureVideoDir();
        const fileName = `video-${taskId}-${Date.now()}.mp4`;
        const filePath = path.join(VIDEO_DIR, fileName);
        const localUrl = `/uploads/generated-videos/${fileName}`;

        // Only download if not already saved
        if (!fs.existsSync(filePath)) {
          const videoRes = await fetch(result.videoUrl);
          if (videoRes.ok) {
            const buffer = Buffer.from(await videoRes.arrayBuffer());
            fs.writeFileSync(filePath, buffer);
          }
        }

        // Update the shot record
        if (shotId) {
          shotStore.update(shotId, {
            videoStatus: "completed",
            videoUrl: localUrl,
          } as Parameters<typeof shotStore.update>[1]);
        }

        return NextResponse.json({
          success: true,
          status: "completed",
          videoUrl: localUrl,
          externalVideoUrl: result.videoUrl,
        });
      } catch (saveError) {
        console.error("Failed to save video locally:", saveError);
        // Still return the external URL so the user can see the video
        if (shotId) {
          shotStore.update(shotId, {
            videoStatus: "completed",
            videoUrl: result.videoUrl,
          } as Parameters<typeof shotStore.update>[1]);
        }
        return NextResponse.json({
          success: true,
          status: "completed",
          videoUrl: result.videoUrl,
        });
      }
    }

    // If failed, update shot status
    if (result.status === "failed" && shotId) {
      shotStore.update(shotId, {
        videoStatus: "failed",
      } as Parameters<typeof shotStore.update>[1]);
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      videoUrl: result.videoUrl,
      errorMessage: result.errorMessage,
    });
  } catch (error) {
    console.error("Error polling video task status:", error);

    if (error instanceof VolcVideoApiError) {
      return NextResponse.json(
        { error: `状态查询失败: ${error.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: "状态查询失败" }, { status: 500 });
  }
}
