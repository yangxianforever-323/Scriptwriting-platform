/**
 * POST /api/ai/optimize-content (Enhanced)
 * Optimizes story content using AI with full script context
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

    const title = context?.title || "未命名项目";
    const genre = context?.genre || "";
    const tone = context?.tone || "";
    const synopsis = context?.synopsis || "";

    let systemPrompt = "";
    let userPrompt = "";

    switch (field) {
      case "logline":
        systemPrompt = `你是一个专业的影视剧本策划。请优化用户提供的"一句话梗概（logline）"，使其更具吸引力和市场竞争力。

【剧本背景】
- 标题：《${title}》
- 题材：${genre}
- 基调：${tone}
- 故事概要：${synopsis.substring(0, 300)}

要求：
1. 突出核心冲突和独特卖点
2. 语言精炼有力，有画面感
3. 控制在50-80字
4. 直接返回优化后的文本`;
        userPrompt = `请优化以下一句话梗概：\n\n${content}`;
        break;

      case "synopsis":
        systemPrompt = `你是一个专业的影视编剧。请优化用户提供的"故事概要（synopsis）"，使其结构更清晰、叙事更有吸引力。

【完整剧本上下文】
- 标题：《${title}》
- 题材：${genre}
- 基调：${tone}
- 原始概要：${synopsis}

要求：
1. 采用三幕式/五幕式结构组织内容
2. 每个阶段有明确的情绪走向描述
3. 控制在300-600字
4. 直接返回优化后的文本`;
        userPrompt = `请优化以下故事概要（《${title}》，${genre}题材）：\n\n${content}`;
        break;

      case "character":
        systemPrompt = `你是一个专业的角色设计顾问。请深度优化用户提供的角色设定，使其更加立体、丰满、具有画面感。

【剧本上下文】
- 标题：《${title}》
- 题材：${genre}
- 整体基调：${tone}
- 故事概要：${synopsis?.substring(0, 200) || ""}

要求：
1. description（角色深度描述）：扩展至150-250字，包含身份定位、核心动机、内在矛盾、成长弧线
2. appearance（外貌特征）：扩展至80-150字，具体到体型比例、发型细节、面部特征、标志性服装配饰、年龄感、气质类型——这些将用于AI图像生成
3. personality（性格）：30-50字，5-7个关键词+每个词的简要行为表现说明
4. background（背景故事）：80-150字，出身环境、关键转折事件、与主线的深层关联
5. keyProps（新增）：提取该角色相关的2-4个重要道具/物品/武器
6. relationships（新增）：列出该角色与其他主要角色的关系（至少2条）
7. visualKeywords（新增）：提供5-8个AI图像生成可用的视觉关键词

返回完整的JSON对象。`;
        userPrompt = `请深度优化以下角色设定（《${title}》中的角色）：\n\n当前数据：\n${typeof content === "string" ? content : JSON.stringify(content, null, 2)}`;
        break;

      case "scene":
        systemPrompt = `你是一个专业的分镜设计师和场景编剧。请深度优化场景设定，使其对后续AI图像生成和分镜拆解具有直接指导价值。

【剧本上下文】
- 标题：《${title}》
- 题材：${genre}
- 整体基调：${tone}
- 所属幕信息：${context?.actTitle || "未指定"}
- 本幕情绪：${context?.actMood || ""}
- 出场角色：${context?.actCharacters?.join("、") || "未指定"}

要求：
1. description（场景描述）：扩展至150-250字，详细描述场景中发生的事件、关键动作、对话要点、情节推进作用
2. timeOfDay（时间建议）：给出具体的时间设定建议（如"黄昏时分，残阳如血"而非简单的"傍晚"）
3. mood（情绪）：15-25字的精准情绪描述
4. props（道具列表）：仔细分析此场景中应该出现的所有道具/物品/武器，每项包含name/type/description/holder
5. visualStyle（视觉风格建议）：
   - style: 从{写实电影感/动漫渲染/水墨国风/赛博朋克/暗黑哥特/温暖治愈/冷峻科幻/复古胶片/油画质感/3D卡通}中选择最合适的
   - colorTone: 具体的色调建议（如"暖金转冷蓝的对比色调"）
   - lighting: 具体光影方案（如"侧光伦勃朗光效 + 背景暗化"）
   - cameraAngle: 建议的主导镜头角度
6. atmosphereRef（氛围参考）：40-80字的氛围描写，用于指导AI生成画面时的情绪表达
7. narrativePurpose（叙事目的）：明确此场景在整体叙事中的功能

返回完整的JSON对象。`;
        userPrompt = `请深度优化以下场景设定（《${title}》${context?.actTitle ? `·${context.actTitle}` : ""}）：\n\n当前数据：\n${typeof content === "string" ? content : JSON.stringify(content, null, 2)}`;
        break;

      case "act":
        systemPrompt = `你是一个专业的叙事结构分析师。请优化整幕（Act）的结构和内容安排。

【剧本上下文】
- 标题：《${title}》
- 题材：${genre}
- 整体基调：${tone}
- 故事概要：${synopsis?.substring(0, 300) || ""}

要求：
1. title：幕标题要有主题性（格式："第X幕：主题关键词"）
2. description：本幕概述200-300字，明确：
   - 核心事件序列
   - 角色情感变化轨迹
   - 与前后幕的衔接关系
3. narrativeFunction：精确的叙事功能定义
4. moodTone：主导情绪及变化过程
5. pacing：节奏曲线描述（哪里快哪里慢，为什么）
6. 检查并优化本幕下所有场景的 props 提取是否完整
7. 确保场景之间的逻辑连贯性和情绪递进

返回完整的JSON对象。`;
        userPrompt = `请优化以下分幕设定（《${title}》）：\n\n当前数据：\n${typeof content === "string" ? content : JSON.stringify(content, null, 2)}`;
        break;

      case "location":
        systemPrompt = `你是一个专业的美术指导和场景设计师。请优化地点设定，使其为AI背景图生成提供充分的视觉参考。

【剧本上下文】
- 标题：《${title}》
- 题材：${genre}
- 基调：${tone}

要求：
1. description：地点详细描述150-250字，包含空间布局、建筑风格、自然环境、标志性元素
2. atmosphere：感官层面的氛围描写50-80字（光线质感、气味、声音、温度感）
3. timeSettings：该地点在不同时间段呈现的不同面貌（至少3个时段）
4. visualElements：8-12个具体的视觉元素关键词（用于AI提示词）
5. associatedProps：与此地点强关联的道具或物品列表

返回完整的JSON对象。`;
        userPrompt = `请优化以下地点设定（《${title}》）：\n\n${typeof content === "string" ? content : JSON.stringify(content, null, 2)}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid field type. Supported: logline/synopsis/character/scene/act/location" }, { status: 400 });
    }

    const inputs = [
      { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
      { role: "user", content: [{ type: "input_text", text: userPrompt }] },
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

    if (["character", "scene", "act", "location"].includes(field)) {
      try {
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          optimized = JSON.parse(jsonMatch[1]);
        } else {
          optimized = JSON.parse(aiResponse);
        }
      } catch {
        optimized = field === "logline" || field === "synopsis"
          ? aiResponse
          : { description: aiResponse };
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
