/**
 * AI Script Analysis API
 * POST /api/ai/analyze-script - Analyze a script and break it down into acts, scenes, characters, and locations
 */

import { NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const { script, storyId } = await request.json();

    if (!script || typeof script !== "string") {
      return NextResponse.json(
        { error: "Script content is required" },
        { status: 400 }
      );
    }

    // Prepare the prompt for Deepseek
    const systemPrompt = `你是一个专业的剧本分析助手。请分析用户提供的剧本内容，并将其拆解为以下结构化数据：

1. **分幕结构**：将剧本分为多个幕（Act），每幕包含标题、描述和场景列表
2. **场景详情**：每个场景包含标题、描述、地点、时间、氛围、出场角色
3. **角色列表**：识别所有角色，包括姓名、描述和角色类型（主角/反派/配角/龙套）
4. **场景地点**：列出所有出现的地点及其描述

请以JSON格式返回，结构如下：
{
  "acts": [
    {
      "title": "第一幕：开端",
      "description": "故事背景介绍，主角登场",
      "scenes": [
        {
          "title": "场景1：开场",
          "description": "场景描述",
          "location": "地点名称",
          "timeOfDay": "时间（早晨/下午/夜晚）",
          "mood": "氛围（紧张/轻松/悲伤等）",
          "characters": ["角色1", "角色2"]
        }
      ]
    }
  ],
  "characters": [
    {
      "name": "角色名",
      "description": "角色描述",
      "role": "protagonist/antagonist/supporting/minor"
    }
  ],
  "locations": [
    {
      "name": "地点名",
      "description": "地点描述"
    }
  ]
}

注意：
- 请确保JSON格式正确，可以被直接解析
- 根据剧本长度合理分幕，通常3-5幕
- 场景描述要简洁但包含关键情节信息
- 角色类型判断要准确`;

    const userPrompt = `请分析以下剧本内容：\n\n${script.substring(0, 15000)}\n\n请返回JSON格式的分析结果。`;

    // Call Deepseek API
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
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Deepseek API error:", errorData);
      
      // Fallback to mock analysis if API fails
      const mockAnalysis = generateMockAnalysis(script);
      return NextResponse.json({ analysis: mockAnalysis });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    // Extract JSON from the response
    let analysis;
    try {
      // Try to parse the entire response as JSON
      analysis = JSON.parse(aiResponse);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    // Validate the analysis structure
    if (!analysis.acts || !Array.isArray(analysis.acts)) {
      analysis.acts = [];
    }
    if (!analysis.characters || !Array.isArray(analysis.characters)) {
      analysis.characters = [];
    }
    if (!analysis.locations || !Array.isArray(analysis.locations)) {
      analysis.locations = [];
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error analyzing script:", error);
    
    // Fallback to mock analysis
    const { script } = await request.json().catch(() => ({ script: "" }));
    const mockAnalysis = generateMockAnalysis(script);
    return NextResponse.json({ analysis: mockAnalysis });
  }
}

// Mock analysis generator for fallback
function generateMockAnalysis(script: string): {
  acts: Array<{
    title: string;
    description: string;
    scenes: Array<{
      title: string;
      description: string;
      location?: string;
      timeOfDay?: string;
      mood?: string;
      characters?: string[];
    }>;
  }>;
  characters: Array<{
    name: string;
    description: string;
    role: "protagonist" | "antagonist" | "supporting" | "minor";
  }>;
  locations: Array<{
    name: string;
    description: string;
  }>;
} {
  // Simple heuristic to extract some content
  const lines = script.split("\n").filter(l => l.trim());
  const firstLine = lines[0] || "剧本";
  
  return {
    acts: [
      {
        title: "第一幕：开端",
        description: "故事开始，介绍背景和主要角色",
        scenes: [
          {
            title: "场景1：开场",
            description: lines.slice(0, 3).join(" ") || "故事开场",
            location: "主要场景",
            timeOfDay: "白天",
            mood: "平静",
            characters: ["主角"],
          },
          {
            title: "场景2：冲突引入",
            description: lines.slice(3, 6).join(" ") || "冲突开始",
            location: "主要场景",
            timeOfDay: "夜晚",
            mood: "紧张",
            characters: ["主角", "配角"],
          },
        ],
      },
      {
        title: "第二幕：发展",
        description: "冲突升级，情节推进",
        scenes: [
          {
            title: "场景3：情节推进",
            description: lines.slice(6, 9).join(" ") || "情节发展",
            location: "次要场景",
            timeOfDay: "下午",
            mood: "紧张",
            characters: ["主角"],
          },
        ],
      },
      {
        title: "第三幕：高潮与结局",
        description: "冲突达到顶点并解决",
        scenes: [
          {
            title: "场景4：高潮",
            description: "故事高潮",
            location: "主要场景",
            timeOfDay: "夜晚",
            mood: "激烈",
            characters: ["主角", "反派"],
          },
          {
            title: "场景5：结局",
            description: "故事收尾",
            location: "主要场景",
            timeOfDay: "早晨",
            mood: "释然",
            characters: ["主角"],
          },
        ],
      },
    ],
    characters: [
      {
        name: "主角",
        description: "故事的主人公",
        role: "protagonist",
      },
      {
        name: "配角",
        description: "协助主角的角色",
        role: "supporting",
      },
      {
        name: "反派",
        description: "与主角对立的角色",
        role: "antagonist",
      },
    ],
    locations: [
      {
        name: "主要场景",
        description: "故事发生的主要地点",
      },
      {
        name: "次要场景",
        description: "故事发生的次要地点",
      },
    ],
  };
}
