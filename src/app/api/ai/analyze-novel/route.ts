/**
 * AI Novel Analysis API
 * POST /api/ai/analyze-novel - Analyze a novel and break it down into story elements
 */

import { NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const { content, title } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Novel content is required" },
        { status: 400 }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      console.warn("DeepSeek API key not configured, using mock analysis");
      const mockAnalysis = generateMockAnalysis(content, title);
      return NextResponse.json(mockAnalysis);
    }

    const systemPrompt = `你是一个专业的小说分析助手。请分析用户提供的小说内容，并将其拆解为结构化的剧本元素。

请分析并返回以下JSON格式的数据：

1. **title**: 故事标题
2. **logline**: 一句话概括（50-100字）
3. **synopsis**: 详细概要（200-500字）
4. **genre**: 题材类型（如：都市、玄幻、科幻、悬疑、爱情等）
5. **targetDuration**: 预估时长（分钟）
6. **characters**: 角色列表，每项包含：
   - name: 角色名
   - description: 角色描述
   - role: 角色类型（protagonist主角/antagonist反派/supporting配角/minor龙套）
   - appearance: 外貌特征（简述）
7. **locations**: 场景地点列表，每项包含：
   - name: 地点名称
   - description: 地点描述
8. **acts**: 分幕结构，每幕包含：
   - title: 幕标题
   - description: 幕描述
   - scenes: 场景列表，每项包含：
     - title: 场景标题
     - description: 场景描述
     - location: 地点
     - characters: 出场角色名列表

请以JSON格式返回，结构如下：
{
  "title": "故事标题",
  "logline": "一句话概括",
  "synopsis": "详细概要",
  "genre": "题材",
  "targetDuration": 60,
  "characters": [...],
  "locations": [...],
  "acts": [...]
}

注意：
- 请确保JSON格式正确，可以被直接解析
- 根据小说长度合理分幕，通常3-5幕
- 场景描述要简洁但包含关键情节信息
- 角色类型判断要准确
- 小说的幕/章节结构应该被识别并转换`;

    const userPrompt = `请分析以下小说内容（标题：${title || "未命名"}）：\n\n${content.substring(0, 20000)}\n\n请返回JSON格式的完整分析结果。`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Deepseek API error:", errorData);
      throw new Error("AI API 调用失败");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    result.title = title || result.title || "未命名项目";

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing novel:", error);

    try {
      const { content, title } = await request.clone().json();
      const mockAnalysis = generateMockAnalysis(content, title);
      return NextResponse.json(mockAnalysis);
    } catch {
      return NextResponse.json(
        { error: "分析失败，请重试" },
        { status: 500 }
      );
    }
  }
}

function generateMockAnalysis(
  content: string,
  title: string
): {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  targetDuration: number;
  characters: Array<{
    name: string;
    description: string;
    role: string;
    appearance: string;
  }>;
  locations: Array<{ name: string; description: string }>;
  acts: Array<{
    title: string;
    description: string;
    scenes: Array<{
      title: string;
      description: string;
      location: string;
      characters: string[];
    }>;
  }>;
} {
  const lines = content.split("\n").filter((l) => l.trim());
  const firstLine = lines[0] || "故事";
  const wordCount = content.length;

  const mockTitle =
    title ||
    firstLine.substring(0, 30) ||
    "未命名项目";

  return {
    title: mockTitle,
    logline: `这是一个关于${firstLine.substring(0, 50)}的精彩故事。`,
    synopsis: `本故事总字数约${wordCount}字，讲述了${firstLine.substring(0, 100)}。故事包含多条情节线索，人物关系复杂，期待精彩的戏剧冲突。`,
    genre: "都市",
    targetDuration: Math.max(30, Math.round(wordCount / 500)),
    characters: [
      {
        name: "主角",
        description: "故事的主人公，经历各种冒险和挑战",
        role: "protagonist",
        appearance: "普通外貌",
      },
      {
        name: "配角",
        description: "协助主角的重要角色",
        role: "supporting",
        appearance: "温和亲切",
      },
    ],
    locations: [
      {
        name: "主要场景",
        description: "故事发生的主要地点",
      },
    ],
    acts: [
      {
        title: "第一幕：开端",
        description: "介绍故事背景和主要角色",
        scenes: [
          {
            title: "开场",
            description: lines.slice(0, 3).join(" ") || "故事开始",
            location: "主要场景",
            characters: ["主角"],
          },
        ],
      },
      {
        title: "第二幕：发展",
        description: "冲突升级，情节推进",
        scenes: [
          {
            title: "冲突",
            description: lines.slice(3, 6).join(" ") || "矛盾出现",
            location: "主要场景",
            characters: ["主角", "配角"],
          },
        ],
      },
      {
        title: "第三幕：高潮与结局",
        description: "冲突达到顶点并解决",
        scenes: [
          {
            title: "高潮",
            description: "故事达到最高潮",
            location: "主要场景",
            characters: ["主角", "配角"],
          },
        ],
      },
    ],
  };
}
