import { NextResponse } from "next/server";
import { callVolcAPI, isDeepSeekConfigured } from "@/lib/ai/deepseek";
import {
  validateNovelAnalysis,
  sanitizeNovelContent,
  estimateAnalysisTime,
  type ValidationResult,
} from "@/lib/analysis-utils";
import type { NovelAnalysisResult } from "@/types/audit";

const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v3-2-251201";

interface AnalysisState {
  status: "analyzing" | "parsing" | "validating" | "complete" | "error";
  progress: number;
  message: string;
  result?: NovelAnalysisResult;
  errors?: string[];
}

async function analyzeNovelWithDeepSeek(
  content: string,
  title?: string,
  onProgress?: (state: AnalysisState) => void
): Promise<ValidationResult> {
  onProgress?.({ status: "analyzing", progress: 10, message: "正在使用 AI 分析小说内容..." });

  if (!isDeepSeekConfigured()) {
    console.warn("VOLC_API_KEY not configured, using mock analysis");
    onProgress?.({ status: "parsing", progress: 50, message: "使用模拟分析..." });
    const mockResult = generateEnhancedMockAnalysis(content, title);
    onProgress?.({ status: "validating", progress: 80, message: "验证分析结果..." });
    const validated = validateNovelAnalysis(mockResult);
    onProgress?.({
      status: "complete",
      progress: 100,
      message: "分析完成",
      result: validated.data,
    });
    return validated;
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
  "props": [
    {
      "name": "道具名称",
      "description": "道具描述",
      "importance": "key（关键道具）/supporting（辅助道具）/background（背景道具）"
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
          "characters": ["角色名1", "角色名2"],
          "props": ["道具名1", "道具名2"]
        }
      ]
    }
  ]
}

注意：
- 必须返回有效的JSON格式，可以被直接解析
- 根据小说长度合理分幕，通常3-5幕
- characters数组中最多包含5-8个主要角色
- 场景描述要具体、有画面感
- props数组中包含故事中出现的关键道具，特别是推动剧情发展的道具
- 每个场景的props列出该场景中使用的道具名称`;

  const userPrompt = `请分析以下小说内容（标题：${title || "未命名"}）：

${sanitizeNovelContent(content)}

请直接返回JSON格式的分析结果，不要包含其他文字。`;

  const inputs = [
    {
      role: "system" as const,
      content: [{ type: "input_text" as const, text: systemPrompt }],
    },
    {
      role: "user" as const,
      content: [{ type: "input_text" as const, text: userPrompt }],
    },
  ];

  try {
    onProgress?.({ status: "analyzing", progress: 25, message: "AI 正在分析中，请稍候..." });
    const response = await callVolcAPI(inputs, { stream: false });

    onProgress?.({ status: "parsing", progress: 60, message: "正在解析 AI 响应..." });
    let aiResponse = "";

    if (response.output && Array.isArray(response.output) && response.output.length > 0) {
      const firstOutput = response.output[0];
      if (firstOutput.content && Array.isArray(firstOutput.content) && firstOutput.content.length > 0) {
        const textContent = firstOutput.content.find((c: any) => c.type === "output_text");
        if (textContent && textContent.text) {
          aiResponse = textContent.text;
        }
      }
    }

    if (!aiResponse && (response as any).output?.choices) {
      aiResponse = (response as any).output.choices[0]?.message?.content || "";
    }

    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    console.log("AI Response received, length:", aiResponse.length);

    let rawResult;
    try {
      rawResult = JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          rawResult = JSON.parse(jsonMatch[1]);
        } catch {
          throw new Error("Failed to parse JSON from markdown");
        }
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    onProgress?.({ status: "validating", progress: 85, message: "验证和清理数据..." });
    const validated = validateNovelAnalysis(rawResult);

    if (!validated.isValid) {
      console.warn("Validation warnings/errors:", validated.errors, validated.warnings);
    }

    onProgress?.({
      status: "complete",
      progress: 100,
      message: "分析完成",
      result: validated.data,
    });

    return validated;
  } catch (error) {
    console.warn("DeepSeek API failed, falling back to mock analysis:", error);
    onProgress?.({
      status: "analyzing",
      progress: 40,
      message: "AI 分析遇到问题，使用备用方案...",
    });

    const mockResult = generateEnhancedMockAnalysis(content, title);
    onProgress?.({ status: "validating", progress: 80, message: "验证分析结果..." });
    const validated = validateNovelAnalysis(mockResult);
    onProgress?.({
      status: "complete",
      progress: 100,
      message: "分析完成（使用备用方案）",
      result: validated.data,
    });

    return validated;
  }
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

    const estimatedTime = estimateAnalysisTime(content.length);

    let validationResult: ValidationResult | null = null;

    if (!isDeepSeekConfigured()) {
      console.warn("VOLC_API_KEY not configured, using mock analysis");
      const mockAnalysis = generateEnhancedMockAnalysis(content, title);
      validationResult = validateNovelAnalysis(mockAnalysis);
    } else {
      validationResult = await analyzeNovelWithDeepSeek(content, title);
    }

    return NextResponse.json({
      success: true,
      result: validationResult.data,
      estimatedTime,
      warnings: validationResult.warnings.map((w) => w.message),
      hasValidationWarnings: validationResult.warnings.length > 0,
    });
  } catch (error) {
    console.error("Error analyzing novel:", error);

    try {
      const { content, title } = await request.clone().json();
      const mockAnalysis = generateEnhancedMockAnalysis(content, title);
      const validationResult = validateNovelAnalysis(mockAnalysis);

      return NextResponse.json({
        success: true,
        result: validationResult.data,
        estimatedTime: estimateAnalysisTime(content?.length || 0),
        warnings: [...validationResult.warnings.map((w) => w.message), "使用备用分析方案"],
        hasValidationWarnings: true,
      });
    } catch {
      return NextResponse.json(
        { error: "分析失败，请重试" },
        { status: 500 }
      );
    }
  }
}

function generateEnhancedMockAnalysis(content: string, title?: string): NovelAnalysisResult {
  const lines = content.split("\n").filter((l) => l.trim());
  const firstLine = lines[0] || "故事";
  const wordCount = content.length;

  const characterNames = extractCharacterNames(content);
  const locationNames = extractLocationNames(content);

  return {
    title: title || firstLine.substring(0, 30) || "未命名项目",
    logline: `这是一个关于${firstLine.substring(0, Math.min(50, firstLine.length))}的精彩故事。`,
    synopsis: `本故事总字数约${wordCount}字，讲述了${firstLine.substring(0, Math.min(100, firstLine.length))}。故事结构完整，情节跌宕起伏。`,
    genre: guessGenre(content),
    targetDuration: Math.max(30, Math.min(180, Math.round(wordCount / 300))),
    characters: characterNames.length > 0
      ? characterNames.slice(0, 6).map((name, idx) => ({
          name,
          description: `${name}是故事中的重要角色。`,
          role: idx === 0 ? "protagonist" : idx === 1 ? "antagonist" : "supporting",
          appearance: idx === 0 ? "主角外貌特征" : "普通外貌",
        }))
      : [
          { name: "主角", description: "故事的主人公", role: "protagonist", appearance: "普通外貌" },
          { name: "配角", description: "协助主角的角色", role: "supporting", appearance: "温和亲切" },
        ],
    locations: locationNames.length > 0
      ? locationNames.slice(0, 10).map((name) => ({
          name,
          description: `${name}是故事发生的重要地点。`,
        }))
      : [{ name: "主要场景", description: "故事发生的主要地点" }],
    props: extractPropNames(content).slice(0, 8).map((name) => ({
      name,
      description: `${name}是故事中的重要道具。`,
      importance: "supporting" as const,
    })),
    acts: generateActs(lines, characterNames, locationNames),
  };
}

function extractCharacterNames(content: string): string[] {
  const patterns = [
    /[“"]([^"”]{2,4})[”"]说/g,
    /(\S{2,4})道：/g,
    /(\S{2,4})笑道/g,
    /(\S{2,4})问/g,
  ];

  const names = new Set<string>();

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length >= 2 && match[1].length <= 4) {
        names.add(match[1]);
      }
    }
  }

  return Array.from(names);
}

function extractLocationNames(content: string): string[] {
  const patterns = [
    /在(\S{2,5})里/g,
    /来到(\S{2,5})/g,
    /返回(\S{2,5})/g,
    /(\S{2,5})中/g,
  ];

  const locations = new Set<string>();

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length >= 2 && match[1].length <= 5) {
        locations.add(match[1]);
      }
    }
  }

  return Array.from(locations);
}

function extractPropNames(content: string): string[] {
  const patterns = [
    /拿着(\S{2,6})/g,
    /取出(\S{2,6})/g,
    /拿出(\S{2,6})/g,
    /握着(\S{2,6})/g,
    /带着(\S{2,6})/g,
    /(\S{2,4})剑/g,
    /(\S{2,4})刀/g,
    /(\S{2,4})书/g,
  ];

  const props = new Set<string>();

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length >= 2 && match[1].length <= 6) {
        props.add(match[1]);
      }
    }
  }

  return Array.from(props);
}

function guessGenre(content: string): string {
  const genreKeywords: Record<string, string[]> = {
    "玄幻": ["修仙", "修炼", "灵气", "金丹", "元婴", "渡劫", "宗门", "法宝"],
    "科幻": ["飞船", "星系", "太空", "机器人", "AI", "人工智能", "量子", "宇宙"],
    "悬疑": ["尸体", "凶手", "侦探", "调查", "线索", "秘密", "阴谋", "推理"],
    "爱情": ["喜欢", "爱", "心动", "吻", "拥抱", "恋人", "甜蜜", "幸福"],
    "武侠": ["武功", "江湖", "剑客", "内力", "真气", "门派", "剑法", "轻功"],
    "历史": ["皇帝", "大臣", "朝廷", "古代", "王朝", "战争", "战役", "将军"],
  };

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    const count = keywords.filter((kw) => content.includes(kw)).length;
    if (count >= 2) {
      return genre;
    }
  }

  return "都市";
}

function generateActs(
  lines: string[],
  characterNames: string[],
  locationNames: string[]
): NovelAnalysisResult["acts"] {
  const totalLines = lines.length;
  const characters = characterNames.length > 0 ? characterNames : ["主角", "配角"];
  const locations = locationNames.length > 0 ? locationNames : ["主要场景"];

  if (totalLines < 10) {
    return [
      {
        title: "第一幕：开端",
        description: "介绍故事背景",
        scenes: [{ title: "开场", description: lines.join(" ") || "故事开始", location: locations[0], characters: [characters[0]], props: [] }],
      },
    ];
  }

  const partSize = Math.floor(totalLines / 3);

  return [
    {
      title: "第一幕：开端",
      description: "介绍故事背景和主要人物",
      scenes: [{
        title: "故事开场",
        description: lines.slice(0, partSize).join(" "),
        location: locations[0],
        characters: characters.slice(0, 2),
        props: [],
      }],
    },
    {
      title: "第二幕：发展",
      description: "矛盾冲突逐步升级",
      scenes: [{
        title: "矛盾出现",
        description: lines.slice(partSize, partSize * 2).join(" "),
        location: locations[1] || locations[0],
        characters: characters.slice(0, 3),
        props: [],
      }],
    },
    {
      title: "第三幕：高潮与结局",
      description: "冲突达到高潮并解决",
      scenes: [{
        title: "故事高潮",
        description: lines.slice(partSize * 2).join(" "),
        location: locations[2] || locations[0],
        characters: characters.slice(0, 3),
        props: [],
      }],
    },
  ];
}
