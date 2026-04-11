/**
 * AI Novel Analysis API
 * POST /api/ai/analyze-novel - Analyze a novel and break it down into story elements
 * Uses Doubao model via Volcano Engine
 */

import { NextResponse } from "next/server";

const DOUCIBASE_API_KEY = process.env.DOUCIBASE_API_KEY;
const DOUCIBASE_BASE_URL = process.env.DOUCIBASE_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3/responses";
const DOUCIBASE_MODEL = process.env.DOUCIBASE_MODEL || "doubao-pro-32k";

async function callDoubaoAPI(inputs: any[]): Promise<any> {
  if (!DOUCIBASE_API_KEY) {
    throw new Error("DOUCIBASE_API_KEY is not configured");
  }

  const requestBody = {
    model: DOUCIBASE_MODEL,
    stream: false,
    input: inputs,
  };

  console.log("Doubao API request URL:", DOUCIBASE_BASE_URL);
  console.log("Model:", DOUCIBASE_MODEL);

  const response = await fetch(DOUCIBASE_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DOUCIBASE_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Doubao API error:", errorData);
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function extractTextFromResponse(response: any): string {
  if (response.output && Array.isArray(response.output) && response.output.length > 0) {
    const firstOutput = response.output[0];
    if (firstOutput.content && Array.isArray(firstOutput.content) && firstOutput.content.length > 0) {
      const textContent = firstOutput.content.find((c: any) => c.type === "output_text");
      if (textContent && textContent.text) {
        return textContent.text;
      }
    }
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const { content, title } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Novel content is required" },
        { status: 400 }
      );
    }

    if (!DOUCIBASE_API_KEY) {
      console.warn("Doubao API key not configured, using mock analysis");
      const mockAnalysis = generateMockAnalysis(content, title);
      return NextResponse.json(mockAnalysis);
    }

    const systemPrompt = `你是一个专业的小说分析助手。请分析用户提供的小说内容，并将其拆解为结构化的剧本元素。

请分析并返回以下JSON格式的数据：

{
  "title": "故事标题",
  "logline": "一句话概括（50-100字）",
  "synopsis": "详细概要（200-500字）",
  "genre": "题材类型（如：都市、玄幻、科幻、悬疑、爱情等）",
  "targetDuration": 预估时长（分钟，数字）,
  "characters": [
    {
      "name": "角色名",
      "description": "角色描述",
      "role": "protagonist（主角）/antagonist（反派）/supporting（配角）/minor（龙套）",
      "appearance": "外貌特征简述"
    }
  ],
  "locations": [
    {
      "name": "地点名称",
      "description": "地点描述"
    }
  ],
  "acts": [
    {
      "title": "幕标题",
      "description": "幕描述",
      "scenes": [
        {
          "title": "场景标题",
          "description": "场景描述",
          "location": "地点名称",
          "characters": ["角色名1", "角色名2"]
        }
      ]
    }
  ]
}

注意：
- 必须返回有效的JSON格式，可以被直接解析
- 根据小说长度合理分幕，通常3-5幕
- characters数组中最多包含5-8个主要角色`;

    const userPrompt = `请分析以下小说内容（标题：${title || "未命名"}）：

${content.substring(0, 20000)}

请直接返回JSON格式的分析结果，不要包含其他文字。`;

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

    let response = await callDoubaoAPI(inputs);
    let aiResponse = extractTextFromResponse(response);

    // If empty response, try alternative parsing
    if (!aiResponse && response.output?.choices) {
      aiResponse = response.output.choices[0]?.message?.content || "";
    }

    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    console.log("AI Response length:", aiResponse.length);

    // Parse JSON from response
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[1]);
        } catch {
          throw new Error("Failed to parse JSON from markdown");
        }
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    result.title = title || result.title || "未命名项目";
    if (!result.acts) result.acts = [];
    if (!result.characters) result.characters = [];
    if (!result.locations) result.locations = [];

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

function generateMockAnalysis(content: string, title: string) {
  const lines = content.split("\n").filter((l) => l.trim());
  const firstLine = lines[0] || "故事";
  const wordCount = content.length;

  return {
    title: title || firstLine.substring(0, 30) || "未命名项目",
    logline: `这是一个关于${firstLine.substring(0, 50)}的精彩故事。`,
    synopsis: `本故事总字数约${wordCount}字，讲述了${firstLine.substring(0, 100)}。`,
    genre: "都市",
    targetDuration: Math.max(30, Math.round(wordCount / 500)),
    characters: [
      { name: "主角", description: "故事的主人公", role: "protagonist", appearance: "普通外貌" },
      { name: "配角", description: "协助主角的角色", role: "supporting", appearance: "温和亲切" },
    ],
    locations: [{ name: "主要场景", description: "故事发生的主要地点" }],
    acts: [
      {
        title: "第一幕：开端", description: "介绍故事背景",
        scenes: [{ title: "开场", description: lines.slice(0, 3).join(" ") || "故事开始", location: "主要场景", characters: ["主角"] }],
      },
      {
        title: "第二幕：发展", description: "冲突升级",
        scenes: [{ title: "冲突", description: lines.slice(3, 6).join(" ") || "矛盾出现", location: "主要场景", characters: ["主角", "配角"] }],
      },
      {
        title: "第三幕：高潮与结局", description: "冲突解决",
        scenes: [{ title: "高潮", description: "故事达到最高潮", location: "主要场景", characters: ["主角", "配角"] }],
      },
    ],
  };
}
