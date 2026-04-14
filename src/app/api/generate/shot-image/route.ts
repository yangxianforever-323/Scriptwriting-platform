/**
 * POST /api/generate/shot-image
 * Generate image for a single shot using Gemini/VectorEngine
 * Saves image to disk and records in shots.json + assets.json
 */

import { NextResponse } from "next/server";
import { shotStore, storyboardStore, assetStore } from "@/lib/data-store";
import { generateImage } from "@/lib/ai/gemini-image";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shotId, prompt, storyboardId, style, aspectRatio } = body;

    if (!shotId || !prompt) {
      return NextResponse.json({ error: "缺少必要参数：shotId、prompt" }, { status: 400 });
    }

    // Mark shot as generating
    shotStore.update(shotId, { imageStatus: "generating" });

    // Resolve projectId from storyboard
    let projectId: string | undefined;
    if (storyboardId) {
      const storyboard = storyboardStore.getById(storyboardId);
      projectId = storyboard?.projectId;
    }
    if (!projectId) {
      const shot = shotStore.getById(shotId);
      if (shot) {
        const storyboard = storyboardStore.getById(shot.storyboardId);
        projectId = storyboard?.projectId;
      }
    }

    let imageUrl: string;

    try {
      // Call AI image generation
      const images = await generateImage(prompt, {
        style: style || "cinematic",
        type: "scene",
        aspectRatio: aspectRatio || "16:9",
        resolution: "1K",
      });

      if (!images || images.length === 0) {
        throw new Error("AI 未返回图片");
      }

      const dataUrl = images[0];

      if (projectId && dataUrl.startsWith("data:image/")) {
        // Extract base64 and mime type
        const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];

          // Save to disk via assetStore and create asset record
          const asset = assetStore.saveGeneratedImage({
            projectId,
            category: "generated_image",
            name: `分镜图片 - ${shotId}`,
            base64Data,
            mimeType,
            linkedEntityId: shotId,
            linkedEntityType: "shot",
            generationPrompt: prompt,
            generationModel: "gemini-3.1-flash-image-preview",
            tags: ["分镜", "自动生成"],
          });

          imageUrl = asset.url;
        } else {
          imageUrl = dataUrl;
        }
      } else {
        imageUrl = dataUrl;
      }
    } catch (aiError) {
      console.error("AI image generation failed:", aiError);
      // Mark as failed and return error
      shotStore.update(shotId, { imageStatus: "failed" });
      return NextResponse.json(
        { error: `图片生成失败: ${aiError instanceof Error ? aiError.message : "未知错误"}` },
        { status: 500 }
      );
    }

    // Update shot with image URL and status
    const shot = shotStore.getById(shotId);
    const imageVersions = shot?.imageVersions || [];
    if (shot?.imageUrl) {
      imageVersions.push(shot.imageUrl);
    }

    shotStore.update(shotId, {
      imageUrl,
      imageStatus: "completed",
      imageVersions,
    });

    return NextResponse.json({
      success: true,
      shotId,
      imageUrl,
      message: "图片生成成功",
    });
  } catch (error) {
    console.error("Error in shot-image route:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
