/**
 * POST /api/generate/shot-video
 * Create a Volcengine Doubao Seedance video generation task for a single shot.
 * Returns immediately with a taskId — the client polls /api/generate/shot-video/status
 * to check progress and retrieve the final video URL.
 */

import { NextResponse } from "next/server";
import { shotStore } from "@/lib/data-store";
import {
  createVideoTask,
  isVolcVideoConfigured,
  VolcVideoApiError,
  type ContentItem,
  type CreateVideoTaskOptions,
} from "@/lib/ai/volc-video";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      shotId,
      prompt,
      storyboardId,
      // Optional rich content
      imageUrl,
      referenceImageUrls,
      referenceVideoUrl,
      referenceAudioUrl,
      generateAudio,
      ratio,
      duration,
    } = body;

    if (!shotId) {
      return NextResponse.json({ error: "缺少必要参数: shotId" }, { status: 400 });
    }

    // Check API configuration
    if (!isVolcVideoConfigured()) {
      return NextResponse.json(
        { error: "视频生成服务未配置，请设置 VOLC_API_KEY 环境变量" },
        { status: 503 }
      );
    }

    // Get shot from store to fill in defaults
    const shot = shotStore.getById(shotId);
    const finalPrompt: string = prompt || shot?.videoPrompt || shot?.description || "";
    const finalImageUrl: string = imageUrl || shot?.imageUrl || "";

    if (!finalPrompt && !finalImageUrl) {
      return NextResponse.json(
        { error: "需要提供提示词或图片URL才能生成视频" },
        { status: 400 }
      );
    }

    // Build options
    const opts: CreateVideoTaskOptions = {
      duration: duration ?? 5,
      watermark: false,
      ratio: ratio || "16:9",
      generateAudio: generateAudio ?? false,
      referenceImageUrls: referenceImageUrls || [],
      referenceVideoUrl: referenceVideoUrl || undefined,
      referenceAudioUrl: referenceAudioUrl || undefined,
    };

    // Create the async task
    const task = await createVideoTask(finalPrompt, finalImageUrl || undefined, opts);

    // Persist taskId + status on the shot record
    shotStore.update(shotId, {
      videoStatus: "generating",
      videoTaskId: task.taskId,
    } as Parameters<typeof shotStore.update>[1]);

    return NextResponse.json({
      success: true,
      shotId,
      taskId: task.taskId,
      status: task.status,
      message: "视频生成任务已创建，请轮询状态接口获取进度",
    });
  } catch (error) {
    console.error("Error creating shot video task:", error);

    if (error instanceof VolcVideoApiError) {
      return NextResponse.json(
        { error: `视频生成失败: ${error.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: "视频生成任务创建失败" }, { status: 500 });
  }
}
