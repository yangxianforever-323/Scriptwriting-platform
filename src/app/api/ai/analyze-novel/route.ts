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
    throw new Error("AI分析服务未配置，请设置 VOLC_API_KEY 环境变量");
  }

  const systemPrompt = `你是一个专业的影视制作前期分析专家，擅长将小说改编为可以直接用于AI视频生成的结构化剧本数据。

你的分析结果将直接驱动：1）AI图片生成（需要精确的视觉描述）2）AI视频生成（需要镜头运动和场景细节）3）分镜设计（需要完整的叙事结构）4）人物关系可视化（需要完整的关系网络）

请严格按照以下JSON格式返回分析结果，所有字段尽量填写完整：

{
  "title": "故事标题",
  "logline": "一句话概括故事核心冲突和主角目标（50-80字）",
  "synopsis": "详细故事概要，包含开端-发展-高潮-结局的完整叙事弧线（300-600字）",
  "genre": "核心题材（都市/玄幻/科幻/悬疑/爱情/武侠/历史/恐怖/喜剧/动作）",
  "targetDuration": 预估剧集时长（分钟数字，根据故事复杂度，通常30-120）,

  "characters": [
    {
      "name": "角色全名（与原文一致）",
      "description": "角色在故事中的作用和重要性（100字以上）",
      "role": "protagonist（主角）/ antagonist（反派）/ supporting（重要配角）/ minor（次要角色）",
      "age": "具体年龄或年龄段，如：28岁、中年男性、约50岁",
      "gender": "男/女",
      "appearance": "【关键字段】极详细的外貌描述：发型发色（如：及肩黑发、寸头、白发）、眼睛特征（如：狭长丹凤眼、大而圆的杏眼）、肤色（如：小麦色、白皙、古铜色）、身材体型（如：高挑纤细、肌肉健壮、矮小瘦削）、标志性服装（如：永远穿黑色风衣、宽袖汉服、职业西装）、特殊标记（如：左颊有疤、戴玉扳指）。必须150字以上，用于AI图片生成安全审核",
      "personality": "性格特点：列出4-6个核心性格词并简要说明，如：外冷内热（表面冷漠但对家人极温柔）、城府极深（从不轻易表露真实意图）",
      "background": "人物背景：出身家庭、成长经历、职业、社会地位、与其他角色的历史关联（150字以上）",
      "motivation": "核心动机：这个角色最想要什么？是什么事件驱动他的行动？（50-80字，具体到事件）",
      "arc": "成长弧线：角色从故事开始到结束经历了什么内心变化？变化的转折点是什么？（50-80字）"
    }
  ],

  "relationships": [
    {
      "from": "角色A的名字（必须与characters数组中的名字完全一致）",
      "to": "角色B的名字（必须与characters数组中的名字完全一致）",
      "type": "关系类型，如：父子/母女/师徒/情侣/夫妻/兄弟姐妹/朋友/青梅竹马/对手/仇人/主仆/合作伙伴/上下级/暗恋/假夫妻",
      "description": "详细描述两人之间的关系现状、历史纠葛和情感张力（80字以上）",
      "dynamic": "关系动态，如：表面敌对实则互相欣赏/单方深情对方漠然/从仇敌到盟友的转变/相爱相杀"
    }
  ],

  "locations": [
    {
      "name": "地点名称（简洁，与场景引用一致）",
      "description": "地点详细描述，包含空间大小、结构布局、历史背景、氛围（150字以上）",
      "type": "interior（室内）/ exterior（室外）/ both（室内外兼有）",
      "atmosphere": "氛围关键词2-4个，如：神秘压抑、温馨宁静、壮阔雄伟、破败萧条、灯红酒绿",
      "keyFeatures": ["视觉特征1（如：青石板地面）", "视觉特征2（如：朱红色大门）", "视觉特征3（如：满墙爬山虎）", "视觉特征4（如：正中供奉着神像）"],
      "timeContext": "通常在什么时间/情境下出现，如：深夜密谋/白天交易/重要节点才出现"
    }
  ],

  "props": [
    {
      "name": "道具名称",
      "description": "道具在故事中的作用和象征意义（80字以上）",
      "importance": "key（关键道具，直接推动剧情）/ supporting（辅助道具，增强场景真实感）/ background（背景道具，烘托氛围）",
      "appearance": "道具的详细外观：颜色、材质、形状、大小、特殊标记或磨损痕迹（80字以上，用于AI图片生成）",
      "holder": "主要持有者或使用者的角色名",
      "storyRole": "在故事中的象征意义或关键作用，如：信物/证据/凶器/传家宝/身份象征"
    }
  ],

  "acts": [
    {
      "title": "第X幕：幕名称（如：第一幕：命运交错）",
      "description": "本幕的核心冲突、主要事件序列和戏剧性转折点（150字以上）",
      "scenes": [
        {
          "title": "场景标题（简洁有力）",
          "description": "【最重要字段】详细场景描述：①发生了什么事 ②人物的具体行动和反应 ③关键对话或内心独白 ④场景对整体剧情的推进作用（250字以上，越详细越有利于后续分镜制作）",
          "location": "地点名称（必须与上方locations数组中的name字段完全一致）",
          "characters": ["出现在本场景的角色名1", "角色名2"],
          "props": ["本场景用到的道具名1", "道具名2"],
          "timeOfDay": "morning/afternoon/evening/night/dawn/noon",
          "weather": "clear/cloudy/rainy/foggy/snowy/storm/hot",
          "mood": "tense/warm/sad/joyful/mysterious/romantic/horror/solemn/melancholy/exciting/desperate",
          "visualStyle": "视觉风格，如：高对比冷色调强调压迫感、暖金色逆光营造温馨、青绿色调渲染东方美学",
          "cameraNote": "镜头建议，如：从俯拍全景切入人物特写、跟拍步伐节奏感强、固定镜头配合沉默张力",
          "keyAction": "场景最核心的一个视觉动作（一句话，直接用于AI图片提示词，如：女子缓缓展开血染的信纸，烛光在她脸上投下阴影）",
          "keyDialogue": "最能体现人物关系或推进剧情的一句台词（原文引用或提炼）"
        }
      ]
    }
  ]
}

【严格执行规则】：
1. 必须返回可直接JSON.parse()的纯JSON，不要包含任何解释文字、注释或markdown代码块
2. characters必须覆盖所有有实质戏份的角色（包括重要配角），上限15个。判断标准：在超过2个场景中出现、或对主角有直接影响、或参与关键冲突的角色都必须纳入
3. relationships必须覆盖所有主要角色之间的关系，不遗漏任何有戏剧张力的关系
4. locations要覆盖所有实际出现的场景，上限20个
5. props要覆盖所有对剧情有影响的道具（包括信件、武器、信物、证件等），上限20个
6. 每幕scenes数量3-8个，确保故事的每个重要情节片段都有对应场景
7. appearance字段必须足够具体才能通过AI图像安全审核——禁止只写"英俊""美丽""普通"等模糊词，必须描述具体的面部特征、服装颜色材质、体型等可视化信息
8. description字段要有强烈画面感，能直接指导AI生成视频分镜
9. keyAction字段直接决定图片生成质量，必须描述具体的可视化动作（如"老人颤抖着双手将玉佩递给跪地的少年"而非"场景感人"）`;

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
    console.error("DeepSeek API failed:", error);
    throw error;
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
      return NextResponse.json(
        { error: "AI分析服务未配置，请联系管理员设置 VOLC_API_KEY" },
        { status: 503 }
      );
    }
    validationResult = await analyzeNovelWithDeepSeek(content, title);

    return NextResponse.json({
      success: true,
      result: validationResult.data,
      estimatedTime,
      warnings: validationResult.warnings.map((w) => w.message),
      hasValidationWarnings: validationResult.warnings.length > 0,
    });
  } catch (error) {
    console.error("Error analyzing novel:", error);
    const message = error instanceof Error ? error.message : "分析失败";
    return NextResponse.json(
      { error: `小说分析失败：${message}，请检查网络后重试` },
      { status: 500 }
    );
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
