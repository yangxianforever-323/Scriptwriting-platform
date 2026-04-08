/**
 * POST /api/ai/generate-suggestions
 * Generate story suggestions based on user prompt
 */

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, genre, style } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "请输入创意描述" },
        { status: 400 }
      );
    }

    const suggestions = generateSuggestions(prompt, genre, style);

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "生成失败，请重试" },
      { status: 500 }
    );
  }
}

function generateSuggestions(prompt: string, genre?: string, style?: string): string[] {
  const baseSuggestions = [
    `${prompt} - 一个充满悬疑和转折的故事`,
    `${prompt} - 融合了浪漫与冒险的元素`,
    `${prompt} - 探讨人性与科技的关系`,
    `${prompt} - 充满想象力的奇幻世界`,
    `${prompt} - 关于成长和自我救赎`,
  ];

  if (genre) {
    baseSuggestions.push(`${prompt} - ${genre}类型的故事`);
  }

  if (style) {
    baseSuggestions.push(`${prompt} - ${style}风格`);
  }

  return baseSuggestions.slice(0, 5);
}
