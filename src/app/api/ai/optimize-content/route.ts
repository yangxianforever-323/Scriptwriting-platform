/**
 * POST /api/ai/optimize-content
 * Optimizes story content using AI (descriptions, loglines, etc.)
 */

import { NextResponse } from "next/server";

const DOUCIBASE_API_KEY = process.env.DOUCIBASE_API_KEY;
const DOUCIBASE_BASE_URL = process.env.DOUCIBASE_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3/responses";
const DOUCIBASE_MODEL = process.env.DOUCIBASE_MODEL || "ep-20260301183547-bbw2x";

export async function POST(request: Request) {
  try {
    const { field, content, context } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (!DOUCIBASE_API_KEY) {
      return NextResponse.json({ optimized: content });
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (field) {
      case "logline":
        systemPrompt = `你是一个专业的剧本编辑。请优化用户提供的"一句话概括"，使其更加吸引人、简洁有力。
要求：
1. 保持核心情节不变
2. 语言更有张力
3. 控制在50-100字
4. 直接返回优化后的文本，不要解释`;
        userPrompt = `请优化以下一句话概括（${context?.genre || ""}题材）：\n\n${content}`;
        break;

      case "synopsis":
        systemPrompt = `你是一个专业的剧本编辑。请优化用户提供的"详细概要"，使其更加生动、结构清晰。
要求：
1. 保持核心情节不变
2. 增强叙事吸引力
3. 控制在200-500字
4. 保持JSON格式`;
        userPrompt = `请优化以下详细概要（《${context?.title || "未命名"}》，${context?.genre || ""}题材）：\n\n${content}`;
        break;

      case "character":
        systemPrompt = `你是一个专业的角色设计顾问。请优化用户提供的人物设定，使其更加立体、有深度。
要求：
1. 丰富人物性格和背景
2. 增加外貌细节描写
3. 确保角色动机合理
4. 返回优化后的完整JSON对象，包含：name, description, appearance, personality(新增), background(新增)字段`;
        userPrompt = `请优化以下角色设定（《${context?.title || "未命名"}》中的角色）：\n\n${content}`;
        break;

      case "scene":
        systemPrompt = `你是一个专业的场景编剧。请优化用户提供的场景描述，使其更具画面感和戏剧性。
要求：
1. 增强场景氛围描写
2. 明确视觉焦点
3. 暗示镜头语言
4. 返回优化后的完整JSON对象，包含：title, description, timeOfDay(建议), mood(建议)字段`;
        userPrompt = `请优化以下场景描述（《${context?.title || "未命名"}》中的场景）：\n\n${content}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid field type" }, { status: 400 });
    }

    const inputs = [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }],
      },
    ];

    const response = await fetch(DOUCIBASE_BASE_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DOUCIBASE_API_KEY}`,
      },
      body: JSON.stringify({
        model: DOUCIBASE_MODEL,
        stream: false,
        input: inputs,
      }),
    });

    if (!response.ok) {
      console.error("Doubao API error for optimization:", response.status);
      return NextResponse.json({ optimized: content });
    }

    const data = await response.json();
    let aiResponse = "";

    if (data.output && Array.isArray(data.output) && data.output.length > 0) {
      const firstOutput = data.output[0];
      if (firstOutput.content && Array.isArray(firstOutput.content)) {
        const textContent = firstOutput.content.find((c: any) => c.type === "output_text");
        if (textContent && textContent.text) {
          aiResponse = textContent.text.trim();
        }
      }
    }

    if (!aiResponse) {
      return NextResponse.json({ optimized: content });
    }

    let optimized: any = aiResponse;

    if (field === "character" || field === "scene") {
      try {
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          optimized = JSON.parse(jsonMatch[1]);
        } else {
          optimized = JSON.parse(aiResponse);
        }
      } catch {
        optimized = { description: aiResponse };
      }
    }

    return NextResponse.json({ optimized });
  } catch (error) {
    console.error("Error optimizing content:", error);
    return NextResponse.json(
      { error: "Optimization failed" },
      { status: 500 }
    );
  }
}
