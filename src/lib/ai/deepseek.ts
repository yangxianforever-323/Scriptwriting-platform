/**
 * DeepSeek AI API wrapper via Volcano Engine.
 * Generates professional cinematic storyboard content.
 * Separates image prompt (NanoBananaPro) from video script (4-10s video).
 */

import type {
  SceneDescription,
  StoryToScenesResult,
} from "@/types/ai";

const VOLC_API_KEY = process.env.VOLC_API_KEY;
const VOLC_RESPONSES_URL = process.env.VOLC_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3/responses";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v3-2-251201";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 300000; // 5 minutes for detailed content generation

export class DeepSeekApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = "DeepSeekApiError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isDeepSeekConfigured(): boolean {
  return !!VOLC_API_KEY;
}

function buildSystemPrompt(shotCount: number): string {
  return `你是专业电影导演。将故事转化为分镜，输出两部分内容：

## 1. image_prompt (图片生成)
- 20-30个英文单词，关键词格式
- 公式：[Shot Type] + [Subject & Action] + [Environment] + [Style] + "no timecode, no subtitles"
- 示例："Medium Shot, warrior drawing sword, ancient temple ruins, dramatic lighting, cinematic, 8k, no timecode, no subtitles"

## 2. 视频脚本 (4-10秒分镜)

### 核心字段：
- **duration_seconds**: 时长(4-10秒)
- **location/time_weather**: 地点/时间天气
- **shot_type/shot_type_name**: 景别代码(EWS/LS/FS/MS/MCU/CU/ECU)和中文
- **camera_movement/movement_name/details**: 运镜方式、名称、详细说明
- **camera_angle/angle_name**: 角度代码和中文
- **lighting_type/lighting_name**: 光影代码和中文
- **composition/composition_name**: 构图代码和中文
- **performance_start/action/end**: 关键帧表演(起始/动作/结束)
- **emotion_curve**: 情绪曲线(如"迷茫(0-2秒)→犹豫(2-4秒)→坚定(4-6秒)")
- **dialogue/dialogue_timing**: 对白内容和时间点
- **ambient_sound/action_sound/special_sound/music**: 音效(环境/动作/特效/音乐)
- **sound_timing**: 音效时间点
- **creative_intent/narrative_function/film_reference**: 创意意图/叙事功能/参考影片
- **description**: 中文画面描述

### 景别代码：
EWS(极远景), LS(远景), FS(全景), MS(中景), MCU(中近景), CU(特写), ECU(极特写)

### 分镜策略(${shotCount}个)：
${getShotDistribution(shotCount)}

### 输出格式：
\`\`\`json
{
  "scenes": [{
    "order_index": 1,
    "duration_seconds": 6,
    "location": "古老神殿废墟",
    "time_weather": "黄昏，阴天",
    "image_prompt": "Medium Shot, warrior drawing sword, ancient temple ruins, dramatic lighting, cinematic, 8k, no timecode, no subtitles",
    "shot_type": "MS",
    "shot_type_name": "中景",
    "camera_movement": "缓慢推镜头",
    "camera_movement_name": "推镜头",
    "movement_details": "起幅：人物全身；运动：匀速推进到MCU；落幅：胸部特写",
    "camera_angle": "eye_level",
    "camera_angle_name": "平视",
    "lighting_type": "dramatic",
    "lighting_name": "戏剧性光",
    "composition": "rule_of_thirds",
    "composition_name": "三分法",
    "performance_start": "战士单膝跪地，右手握剑柄，头低垂，眼神迷茫",
    "performance_action": "缓缓抬头，眼神逐渐坚定，右手开始拔剑",
    "performance_end": "站立，剑出鞘一半，眼神坚定看向前方",
    "emotion_curve": "迷茫(0-2秒)→犹豫(2-4秒)→坚定(4-6秒)",
    "dialogue": "这是我最后的机会...",
    "dialogue_timing": "2-4秒",
    "ambient_sound": "远处风声呼啸",
    "action_sound": "剑鞘摩擦声，金属碰撞声",
    "music": "低沉弦乐渐入",
    "sound_timing": "0-2秒：环境音；2-4秒：加入心跳；4-6秒：音乐高潮",
    "creative_intent": "通过推镜头表现战士内心的觉醒和决心",
    "film_reference": "参考《角斗士》马克西姆斯觉醒镜头",
    "description": "黄昏时分，战士在神殿废墟中缓缓拔剑，眼神从迷茫转为坚定"
  }]
}
\`\`\`

## 要求：
1. 只输出JSON，无其他文字
2. 精确生成${shotCount}个场景
3. image_prompt纯英文关键词
4. 视频脚本用中文`;
}

function getShotDistribution(shotCount: number): string {
  if (shotCount === 9) {
    return `【9分镜 - 短视频/广告，总时长约45-60秒】
- 分镜1 (EWS, 4秒): 开场大全景，建立环境，震撼开场
- 分镜2 (LS, 5秒): 远景展示人物与环境关系
- 分镜3 (FS, 6秒): 全景介绍主要人物
- 分镜4 (MS, 6秒): 中景，故事开始发展
- 分镜5 (MS, 7秒): 中景，冲突升级
- 分镜6 (MCU, 6秒): 中近景，情感加深
- 分镜7 (CU, 5秒): 特写，情感高潮
- 分镜8 (ECU, 4秒): 极特写，关键细节/眼神
- 分镜9 (LS, 5秒): 远景收尾，情感释放`;
  } else if (shotCount === 16) {
    return `【16分镜 - 短片/MV，总时长约80-100秒】
- 分镜1-2 (EWS+LS, 4+5秒): 开场建立，环境与氛围
- 分镜3-4 (FS+MS, 5+6秒): 人物引入，角色介绍
- 分镜5-7 (MS×3, 6秒×3): 故事铺垫，冲突建立
- 分镜8-10 (MS+MCU×2, 6+5秒×2): 情节发展，情感积累
- 分镜11-13 (MCU+CU×2, 5+4秒×2): 情感高潮，戏剧张力
- 分镜14-16 (CU+MS+LS, 4+5+6秒): 结局释放，情感收尾`;
  } else {
    return `【25分镜 - 完整短片，总时长约120-150秒】
- 分镜1-3 (EWS+LS+FS, 4+5+5秒): 开场三部曲，世界观建立
- 分镜4-6 (FS+MS×2, 5+6+6秒): 人物塑造，角色深度
- 分镜7-10 (MS×4, 6秒×4): 故事铺垫，细节展开
- 分镜11-14 (MS+MCU×3, 6+5秒×3): 冲突升级，情节推进
- 分镜15-18 (MCU+CU×3, 5+4秒×3): 情感高潮，戏剧巅峰
- 分镜19-22 (CU+ECU×3, 4+3秒×3): 情感深度，细节刻画
- 分镜23-25 (MS+LS+EWS, 5+5+6秒): 结局三部曲，完整闭环`;
  }
}

function buildStyleGuidance(style?: string): string {
  const styleMap: Record<string, { 
    name: string; 
    prompt: string; 
    lighting: string;
    colorTone: string;
    filmReference: string;
  }> = {
    realistic: { 
      name: "写实风格 - 现实主义纪录片风格", 
      prompt: "photorealistic, natural lighting, documentary style, 8k, ultra detailed, shot on Arri Alexa",
      lighting: "natural",
      colorTone: "自然色调，轻微去饱和",
      filmReference: "参考《罗马》《寄生虫》的写实风格"
    },
    anime: { 
      name: "日本动漫风格 - 新海诚/宫崎骏风格", 
      prompt: "anime style, Makoto Shinkai style, vibrant colors, detailed backgrounds, cel shading, 8k",
      lighting: "high_key",
      colorTone: "鲜艳饱和，天空蓝和草地绿",
      filmReference: "参考《你的名字》《千与千寻》的视觉风格"
    },
    cartoon: { 
      name: "卡通风格 - 皮克斯/迪士尼风格", 
      prompt: "3D cartoon style, Pixar style, bright colors, stylized characters, soft lighting, 8k",
      lighting: "high_key",
      colorTone: "明亮欢快，高饱和度",
      filmReference: "参考《寻梦环游记》《头脑特工队》的色彩"
    },
    cinematic: { 
      name: "电影质感 - 好莱坞大片风格", 
      prompt: "cinematic, film grain, anamorphic lens, dramatic lighting, 8k, color graded",
      lighting: "dramatic",
      colorTone: "电影级调色， teal and orange",
      filmReference: "参考《银翼杀手2049》《沙丘》的电影感"
    },
    watercolor: { 
      name: "水彩画风格 - 印象派艺术风格", 
      prompt: "watercolor painting, impressionist style, soft edges, artistic, ethereal, dreamy",
      lighting: "soft",
      colorTone: "柔和淡雅，色彩交融",
      filmReference: "参考莫奈、梵高的印象派画作"
    },
    oil_painting: { 
      name: "油画风格 - 古典艺术风格", 
      prompt: "oil painting, classical art, rich textures, chiaroscuro lighting, masterpiece, Rembrandt style",
      lighting: "rim",
      colorTone: "厚重质感，明暗对比强烈",
      filmReference: "参考伦勃朗、卡拉瓦乔的油画光影"
    },
    sketch: { 
      name: "素描风格 - 手绘线条风格", 
      prompt: "pencil sketch, graphite drawing, detailed linework, artistic, black and white, cross hatching",
      lighting: "hard",
      colorTone: "黑白灰调，线条为主",
      filmReference: "参考素描大师的线条表现力"
    },
    cyberpunk: { 
      name: "赛博朋克风格 - 霓虹未来风格", 
      prompt: "cyberpunk, neon lights, futuristic city, high contrast, rain, reflections, 8k, Blade Runner style",
      lighting: "neon",
      colorTone: "霓虹紫+青+粉，高对比",
      filmReference: "参考《银翼杀手》《攻壳机动队》的霓虹美学"
    },
    fantasy: { 
      name: "奇幻风格 - 魔法史诗风格", 
      prompt: "fantasy art, magical atmosphere, ethereal lighting, volumetric fog, enchanted forest, 8k",
      lighting: "golden_hour",
      colorTone: "梦幻色彩，金色光芒，魔法光效",
      filmReference: "参考《指环王》《霍比特人》的史诗感"
    },
    scifi: { 
      name: "科幻风格 - 未来科技风格", 
      prompt: "science fiction, futuristic technology, sleek design, holographic displays, space station, 8k",
      lighting: "blue_hour",
      colorTone: "冷色调，蓝青为主，科技感",
      filmReference: "参考《星际穿越》《2001太空漫游》"
    },
  };

  if (style && styleMap[style]) {
    const s = styleMap[style];
    return `${s.name}
推荐光影：${s.lighting}
色彩方向：${s.colorTone}
Prompt标签：${s.prompt}
参考影片：${s.filmReference}`;
  }
  return `写实风格
推荐光影：natural
色彩方向：自然色调
Prompt标签：photorealistic, natural lighting, 8k
参考影片：参考现实主义电影风格`;
}

function parseScenesJson(content: string, expectedCount?: number): StoryToScenesResult {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new DeepSeekApiError("Failed to parse scenes from response: no JSON found");
  }

  try {
    const result = JSON.parse(jsonMatch[0]) as StoryToScenesResult;

    if (!result.scenes || !Array.isArray(result.scenes)) {
      throw new DeepSeekApiError("Invalid response structure: missing scenes array");
    }

    // Validate and clean up each scene
    result.scenes = result.scenes.map((scene, index) => {
      const wordCount = scene.image_prompt ? scene.image_prompt.split(/\s+/).length : 0;
      
      // Ensure image_prompt ends with exclusion words
      let imagePrompt = scene.image_prompt || "";
      if (!imagePrompt.toLowerCase().includes("no timecode")) {
        imagePrompt += ", no timecode, no subtitles";
      }
      
      return {
        order_index: scene.order_index ?? index + 1,
        description: scene.description || "",
        duration_seconds: scene.duration_seconds ?? 6,
        location: scene.location,
        time_weather: scene.time_weather,
        
        // Image generation
        image_prompt: imagePrompt,
        
        // Visual design
        shot_type: scene.shot_type || "MS",
        shot_type_name: scene.shot_type_name || "中景",
        camera_position: scene.camera_position,
        camera_movement: scene.camera_movement || "static",
        camera_movement_name: scene.camera_movement_name || "固定镜头",
        movement_details: scene.movement_details,
        camera_angle: scene.camera_angle || "eye_level",
        camera_angle_name: scene.camera_angle_name || "平视",
        focal_length: scene.focal_length,
        depth_of_field: scene.depth_of_field || "shallow",
        depth_of_field_name: scene.depth_of_field_name || "浅景深",
        
        // Lighting
        lighting_type: scene.lighting_type || "natural",
        lighting_name: scene.lighting_name || "自然光",
        light_source: scene.light_source,
        light_position: scene.light_position,
        light_quality: scene.light_quality,
        color_tone: scene.color_tone,
        
        // Composition
        composition: scene.composition || "rule_of_thirds",
        composition_name: scene.composition_name || "三分法",
        subject_position: scene.subject_position,
        foreground: scene.foreground,
        background: scene.background,
        
        // Performance
        performance_start: scene.performance_start,
        performance_action: scene.performance_action,
        performance_end: scene.performance_end,
        emotion_curve: scene.emotion_curve,
        
        // Dialogue
        dialogue: scene.dialogue,
        dialogue_tone: scene.dialogue_tone,
        voice_type: scene.voice_type,
        dialogue_timing: scene.dialogue_timing,
        
        // Sound
        ambient_sound: scene.ambient_sound,
        action_sound: scene.action_sound,
        special_sound: scene.special_sound,
        music: scene.music,
        music_mood: scene.music_mood,
        sound_timing: scene.sound_timing,
        
        // VFX
        vfx: scene.vfx,
        color_grading: scene.color_grading,
        speed_effect: scene.speed_effect,
        transition: scene.transition,
        
        // Creative
        creative_intent: scene.creative_intent,
        narrative_function: scene.narrative_function,
        film_reference: scene.film_reference,
        director_notes: scene.director_notes,
        
        // Legacy
        prompt_text: imagePrompt,
        
        // Log warning if word count is off
        ...(wordCount < 20 || wordCount > 35 ? { _wordCountWarning: wordCount } : {}),
      };
    });

    if (expectedCount && result.scenes.length !== expectedCount) {
      console.warn(`Expected ${expectedCount} scenes but got ${result.scenes.length}`);
    }

    return result;
  } catch (e) {
    if (e instanceof DeepSeekApiError) throw e;
    throw new DeepSeekApiError(`Failed to parse JSON: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

interface VolcResponseInput {
  role: "system" | "user" | "assistant";
  content: Array<{
    type: "input_text";
    text: string;
  }>;
}

interface VolcResponseAPIResponse {
  id: string;
  created: number;
  model: string;
  output: Array<{
    id: string;
    status: string;
    content: Array<{
      type: "output_text";
      text: string;
    }>;
  }>;
  status: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

async function callVolcAPI(
  inputs: VolcResponseInput[],
  options: {
    stream?: boolean;
  } = {}
): Promise<VolcResponseAPIResponse> {
  if (!VOLC_API_KEY) {
    throw new DeepSeekApiError("VOLC_API_KEY is not configured");
  }

  const requestBody = {
    model: DEEPSEEK_MODEL,
    stream: options.stream ?? false,
    input: inputs,
  };

  console.log("DeepSeek API request URL:", VOLC_RESPONSES_URL);
  console.log("Request timeout:", REQUEST_TIMEOUT_MS, "ms");

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Create a new AbortController for each attempt
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      console.log(`API attempt ${attempt}/${MAX_RETRIES}...`);
      const response = await fetch(VOLC_RESPONSES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VOLC_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || `HTTP error ${response.status}`;
        throw new DeepSeekApiError(
          errorMessage,
          response.status,
          data.error?.code || data.code
        );
      }

      console.log(`API call successful on attempt ${attempt}`);
      return data as VolcResponseAPIResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (error instanceof DeepSeekApiError) {
        if (error.statusCode === 401 || error.statusCode === 403) {
          throw error;
        }
      }

      if ((error as Error).name === "AbortError") {
        console.error(`Attempt ${attempt} timed out after ${REQUEST_TIMEOUT_MS}ms`);
        if (attempt >= MAX_RETRIES) {
          throw new DeepSeekApiError(`Request timed out after ${MAX_RETRIES} attempts`);
        }
      }

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.warn(`Volc API attempt ${attempt} failed, retrying in ${delay}ms...`, error);
        await sleep(delay);
      }
    }
  }

  throw new DeepSeekApiError(
    `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

function extractTextFromResponse(response: VolcResponseAPIResponse): string {
  if (response.output && Array.isArray(response.output) && response.output.length > 0) {
    const firstOutput = response.output[0];
    if (firstOutput.content && Array.isArray(firstOutput.content) && firstOutput.content.length > 0) {
      const textContent = firstOutput.content.find((c) => c.type === "output_text");
      if (textContent && textContent.text) {
        return textContent.text;
      }
    }
  }
  return "";
}

export async function storyToScenes(
  story: string,
  style?: string,
  shotCount: number = 9
): Promise<SceneDescription[]> {
  const validShotCounts = [9, 16, 25];
  const finalShotCount = validShotCounts.includes(shotCount) ? shotCount : 9;

  const systemPrompt = buildSystemPrompt(finalShotCount);
  const styleGuidance = buildStyleGuidance(style);
  const userPrompt = `请将以下故事转化为 ${finalShotCount} 个专业的分镜内容。

【故事内容】
${story}

【风格指导】
${styleGuidance}

【要求】
1. 每个分镜必须包含 image_prompt（精简英文，20-30词）和完整的视频生成分镜脚本
2. 视频脚本按 4-10 秒时长设计
3. 角色表演必须包含起始状态、动作过程、结束状态
4. 情绪变化要有明确的时间曲线
5. 对白和音效要标注时间点
6. 提供具体的参考影片`;

  const inputs: VolcResponseInput[] = [
    {
      role: "system",
      content: [{ type: "input_text", text: systemPrompt }],
    },
    {
      role: "user",
      content: [{ type: "input_text", text: userPrompt }],
    },
  ];

  const response = await callVolcAPI(inputs, {
    stream: false,
  });

  const content = extractTextFromResponse(response);
  if (!content) {
    throw new DeepSeekApiError("Empty response from model");
  }

  const result = parseScenesJson(content, finalShotCount);
  
  // Log word count warnings
  result.scenes.forEach((scene, idx) => {
    const wordCount = scene.image_prompt?.split(/\s+/).length || 0;
    if (wordCount < 20 || wordCount > 35) {
      console.warn(`Scene ${idx + 1} image_prompt word count (${wordCount}) is outside recommended range (20-30)`);
    }
  });
  
  return result.scenes;
}

export async function regenerateScenes(
  story: string,
  style?: string,
  shotCount: number = 9,
  previousScenes?: SceneDescription[],
  feedback?: string
): Promise<SceneDescription[]> {
  const validShotCounts = [9, 16, 25];
  const finalShotCount = validShotCounts.includes(shotCount) ? shotCount : 9;

  const systemPrompt = buildSystemPrompt(finalShotCount);
  const styleGuidance = buildStyleGuidance(style);

  let additionalContext = "";
  if (feedback) {
    additionalContext += `\n\n【用户反馈】${feedback}`;
  }
  
  // 简化之前的场景信息，只保留关键信息
  if (previousScenes && previousScenes.length > 0) {
    additionalContext += `\n\n【参考信息】已生成 ${previousScenes.length} 个分镜，请重新优化生成。`;
  }

  const userPrompt = `请将以下故事转化为 ${finalShotCount} 个专业的分镜内容${additionalContext}：

【故事内容】
${story}

【风格指导】
${styleGuidance}

【要求】
1. 每个分镜必须包含 image_prompt（精简英文，20-30词）和完整的视频生成分镜脚本
2. 视频脚本按 4-10 秒时长设计
3. 角色表演必须包含起始状态、动作过程、结束状态
4. 情绪变化要有明确的时间曲线
5. 对白和音效要标注时间点
6. 提供具体的参考影片`;

  const inputs: VolcResponseInput[] = [
    {
      role: "system",
      content: [{ type: "input_text", text: systemPrompt }],
    },
    {
      role: "user",
      content: [{ type: "input_text", text: userPrompt }],
    },
  ];

  const response = await callVolcAPI(inputs, {
    stream: false,
  });

  const content = extractTextFromResponse(response);
  if (!content) {
    throw new DeepSeekApiError("Empty response from model");
  }

  const result = parseScenesJson(content, finalShotCount);
  return result.scenes;
}
