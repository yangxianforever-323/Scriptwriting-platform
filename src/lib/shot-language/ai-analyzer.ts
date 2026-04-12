import { callVolcAPI } from "@/lib/ai/deepseek";
import type {
  ShotConfiguration,
  ShotAnalysis,
  SceneDescriptionInput,
} from "./types";

const VOLC_API_KEY = process.env.VOLC_API_KEY;

export interface AIAnalysisResult {
  analysis: ShotAnalysis;
  confidence: number;
  reasoning: string;
}

export async function analyzeSceneWithAI(
  input: SceneDescriptionInput
): Promise<AIAnalysisResult> {
  if (!VOLC_API_KEY) {
    throw new Error("VOLC_API_KEY is not configured");
  }

  const systemPrompt = `你是专业电影导演和摄影指导。分析以下场景描述，推荐最佳的镜头配置。

## 可用选项：
### 景别(shotType):
- EWS(极远景): 建立环境，宏大场面
- LS(远景): 展示人物与环境关系
- FS(全景): 展示完整人物和动作
- MS(中景): 对话、互动
- MCU(中近景): 情感表达
- CU(特写): 情感高潮、细节
- ECU(极特写): 极端细节

### 运镜(cameraMovement):
- static(固定), push(推进), pull(拉远), track(跟随), pan(摇摄)
- tilt(俯仰), orbit(环绕), crane_up(上摇), crane_down(下摇)
- dolly_in(推轨), dolly_out(拉轨), handheld(手持)

### 构图(composition):
- rule_of_thirds(三分法), center(居中), symmetry(对称)
- leading_lines(引导线), negative_space(留白), frame_in_frame(画中画)
- triangle(三角构图), silhouette(剪影)

### 光影(lighting):
- natural(自然光), dramatic(戏剧光), soft(柔和光), golden_hour(黄金时刻)
- moonlight(月光), neon(霓虹), backlight(逆光), rim(轮廓光)

### 角度(cameraAngle):
- eye_level(平视), high_angle(俯视), low_angle(仰视)
- dutch_angle(荷兰角), birds_eye(鸟瞰), over_shoulder(过肩)

### 景深(depthOfField):
- shallow(浅景深), deep(深景深), medium(中等景深)

## 输出格式(JSON):
{
  "shotType": "MS",
  "cameraMovement": "push",
  "composition": "rule_of_thirds",
  "lighting": "dramatic",
  "cameraAngle": "eye_level",
  "depthOfField": "shallow",
  "confidence": 0.9,
  "reasoning": "推荐理由"
}`;

  const userPrompt = `请分析以下场景并推荐最佳镜头配置：

**场景描述**: ${input.description}
${input.mood ? `\n**情感/氛围**: ${input.mood}` : ""}
${input.location ? `\n**地点**: ${input.location}` : ""}
${input.timeOfDay ? `\n**时间**: ${input.timeOfDay}` : ""}
${input.weather ? `\n**天气**: ${input.weather}` : ""}
${input.characterCount ? `\n**角色数量**: ${input.characterCount}` : ""}
${input.customRequirements ? `\n**特殊要求**: ${input.customRequirements}` : ""}

请返回JSON格式的分析结果。`;

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
    const response = await callVolcAPI(inputs, { stream: false });

    let content = "";
    if (response.output && Array.isArray(response.output) && response.output.length > 0) {
      const firstOutput = response.output[0];
      if (firstOutput.content && Array.isArray(firstOutput.content)) {
        const textContent = firstOutput.content.find((c) => c.type === "output_text");
        if (textContent) content = textContent.text;
      }
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      analysis: {
        suggestedShotType: result.shotType || "MS",
        suggestedCameraMovement: result.cameraMovement || "static",
        suggestedComposition: result.composition || "rule_of_thirds",
        suggestedLighting: result.lighting || "natural",
        suggestedCameraAngle: result.cameraAngle || "eye_level",
        suggestedDepthOfField: result.depthOfField || "shallow",
        reasoning: result.reasoning || "",
        alternativeOptions: [],
      },
      confidence: result.confidence || 0.7,
      reasoning: result.reasoning || "",
    };
  } catch (error) {
    console.error("AI scene analysis failed:", error);
    throw error;
  }
}

export async function generateShotSequenceWithAI(
  description: string,
  shotCount: number = 3,
  style?: string
): Promise<Array<{
  shotNumber: number;
  config: Partial<ShotConfiguration>;
  reasoning: string;
}>> {
  if (!VOLC_API_KEY) {
    throw new Error("VOLC_API_KEY is not configured");
  }

  const styleHint = style ? `\n**视觉风格**: ${style}` : "";

  const systemPrompt = `你是专业电影导演。根据场景描述生成一个分镜序列。

## 分镜序列设计原则：
1. **开场镜头**: 建立环境或引入角色（LS/FS）
2. **发展镜头**: 展示动作和对话（MS/MCU）
3. **高潮镜头**: 情感表达或关键动作（CU/ECU）
4. **收尾镜头**: 过渡到下一场景（LS/FS）

## 输出格式(JSON数组):
[
  {
    "shotNumber": 1,
    "shotType": "LS",
    "cameraMovement": "static",
    "composition": "rule_of_thirds",
    "lighting": "natural",
    "cameraAngle": "eye_level",
    "depthOfField": "deep",
    "duration": 5,
    "reasoning": "这个镜头的作用"
  }
]`;

  const userPrompt = `请为以下场景设计一个包含 ${shotCount} 个镜头的分镜序列：

**场景描述**: ${description}
${styleHint}

要求：
1. 每个镜头都要有明确的叙事功能
2. 镜头之间要有节奏变化（远景→中景→特写 或 特写→中景→远景）
3. 考虑情感曲线的起伏
4. 提供每个镜头的设计理由

返回JSON数组。`;

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
    const response = await callVolcAPI(inputs, { stream: false });

    let content = "";
    if (response.output && Array.isArray(response.output) && response.output.length > 0) {
      const firstOutput = response.output[0];
      if (firstOutput.content && Array.isArray(firstOutput.content)) {
        const textContent = firstOutput.content.find((c) => c.type === "output_text");
        if (textContent) content = textContent.text;
      }
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI shot sequence");
    }

    const results = JSON.parse(jsonMatch[0]);

    return results.map((result: any, index: number) => ({
      shotNumber: result.shotNumber || index + 1,
      config: {
        shotType: result.shotType || "MS",
        cameraMovement: result.cameraMovement || "static",
        composition: result.composition || "rule_of_thirds",
        lighting: result.lighting || "natural",
        cameraAngle: result.cameraAngle || "eye_level",
        depthOfField: result.depthOfField || "shallow",
        duration: result.duration || 6,
      },
      reasoning: result.reasoning || "",
    }));
  } catch (error) {
    console.error("AI shot sequence generation failed:", error);
    throw error;
  }
}

export function isAIAnalysisAvailable(): boolean {
  return !!VOLC_API_KEY;
}
