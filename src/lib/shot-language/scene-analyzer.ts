/**
 * 场景分析器
 * 使用AI分析场景描述，推荐最佳镜头配置
 */

import type {
  ShotConfiguration,
  ShotAnalysis,
  SceneDescriptionInput,
  ShotType,
  CameraMovement,
  CompositionType,
  LightingType,
  CameraAngle,
  DepthOfField,
} from "./types";
import { SHOT_TYPES, getRecommendedShotType } from "./shot-types";
import { CAMERA_MOVEMENTS, getRecommendedCameraMovement } from "./camera-movements";
import { COMPOSITIONS, getRecommendedComposition } from "./compositions";
import { LIGHTING_TYPES, getRecommendedLighting } from "./lighting";
import { CAMERA_ANGLES } from "./camera-angles";
import { DEPTH_OF_FIELD } from "./depth-of-field";

const EMOTION_KEYWORDS: Record<string, string[]> = {
  happy: ["快乐", "开心", "喜悦", "欢乐", "幸福", "happy", "joy", "cheerful"],
  sad: ["悲伤", "难过", "忧郁", "伤心", "失落", "sad", "melancholy", "sorrow"],
  tense: ["紧张", "紧张", "悬疑", "危险", "压迫", "tense", "suspense", "danger"],
  romantic: ["浪漫", "爱情", "温馨", "甜蜜", "romantic", "love", "intimate"],
  mysterious: ["神秘", "诡异", "未知", "谜", "mysterious", "enigmatic"],
  dramatic: ["戏剧", "激烈", "冲突", "高潮", "dramatic", "intense", "conflict"],
  peaceful: ["平静", "宁静", "安详", "和谐", "peaceful", "calm", "serene"],
  horror: ["恐怖", "惊悚", "可怕", "恐惧", "horror", "scary", "terrifying"],
  epic: ["史诗", "宏大", "壮阔", "英雄", "epic", "grand", "heroic"],
  action: ["动作", "打斗", "追逐", "战斗", "action", "fight", "chase"],
};

const CONTEXT_KEYWORDS: Record<string, string[]> = {
  dialogue: ["对话", "交谈", "说话", "谈话", "dialogue", "conversation", "talking"],
  action: ["动作", "打斗", "追逐", "战斗", "奔跑", "action", "fight", "chase", "running"],
  emotional: ["情感", "情绪", "内心", "感动", "emotional", "feeling", "inner"],
  establishing: ["建立", "全景", "环境", "场景", "establishing", "environment", "scene"],
  detail: ["细节", "特写", "微观", "detail", "close-up", "micro"],
};

const LOCATION_KEYWORDS: Record<string, string[]> = {
  indoor: ["室内", "房间", "屋内", "建筑内", "indoor", "inside", "room", "interior"],
  outdoor: ["室外", "户外", "外面", "街道", "自然", "outdoor", "outside", "street", "nature"],
  night: ["夜晚", "夜间", "晚上", "黑夜", "night", "evening", "dark"],
};

function analyzeEmotion(description: string): string {
  const lowerDesc = description.toLowerCase();

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return emotion;
      }
    }
  }

  return "neutral";
}

function analyzeContext(description: string): string {
  const lowerDesc = description.toLowerCase();

  for (const [context, keywords] of Object.entries(CONTEXT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return context;
      }
    }
  }

  return "general";
}

function analyzeLocation(description: string): "indoor" | "outdoor" | "studio" {
  const lowerDesc = description.toLowerCase();

  for (const keyword of LOCATION_KEYWORDS.indoor) {
    if (lowerDesc.includes(keyword.toLowerCase())) {
      return "indoor";
    }
  }

  for (const keyword of LOCATION_KEYWORDS.outdoor) {
    if (lowerDesc.includes(keyword.toLowerCase())) {
      return "outdoor";
    }
  }

  return "outdoor";
}

function analyzeCharacterCount(description: string): number {
  const personKeywords = ["人", "角色", "人物", "person", "character", "man", "woman", "girl", "boy"];
  let count = 1;

  const lowerDesc = description.toLowerCase();
  for (const keyword of personKeywords) {
    const regex = new RegExp(keyword, "gi");
    const matches = lowerDesc.match(regex);
    if (matches) {
      count = Math.max(count, matches.length);
    }
  }

  if (lowerDesc.includes("群") || lowerDesc.includes("crowd") || lowerDesc.includes("group")) {
    count = Math.max(count, 5);
  }

  return Math.min(count, 10);
}

function suggestShotTypeByDescription(description: string, emotion: string, context: string): ShotType {
  if (context === "detail") return "ECU";
  if (context === "establishing") return "LS";
  if (context === "emotional") return "CU";
  if (context === "action") return "FS";
  if (context === "dialogue") return "MS";

  if (emotion === "horror" || emotion === "tense") return "CU";
  if (emotion === "epic") return "LS";
  if (emotion === "romantic") return "MCU";

  return "MS";
}

function suggestCameraMovementByDescription(description: string, emotion: string, context: string): CameraMovement {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes("跟随") || lowerDesc.includes("follow")) return "track";
  if (lowerDesc.includes("环绕") || lowerDesc.includes("circle")) return "orbit";
  if (lowerDesc.includes("上升") || lowerDesc.includes("rise")) return "crane_up";
  if (lowerDesc.includes("下降") || lowerDesc.includes("descend")) return "crane_down";
  if (lowerDesc.includes("推进") || lowerDesc.includes("approach")) return "push";
  if (lowerDesc.includes("拉远") || lowerDesc.includes("reveal")) return "pull";

  if (emotion === "tense" || emotion === "horror") return "push";
  if (emotion === "epic") return "crane_up";
  if (emotion === "action") return "track";
  if (context === "dialogue") return "static";

  return "static";
}

function suggestCompositionByDescription(description: string, characterCount: number): CompositionType {
  if (characterCount >= 3) return "triangle";
  if (characterCount === 2) return "rule_of_thirds";

  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes("对称") || lowerDesc.includes("symmetry")) return "symmetry";
  if (lowerDesc.includes("孤独") || lowerDesc.includes("alone") || lowerDesc.includes("solitary")) {
    return "negative_space";
  }
  if (lowerDesc.includes("道路") || lowerDesc.includes("路") || lowerDesc.includes("path")) {
    return "leading_lines";
  }
  if (lowerDesc.includes("剪影") || lowerDesc.includes("silhouette")) return "silhouette";
  if (lowerDesc.includes("框架") || lowerDesc.includes("门窗") || lowerDesc.includes("frame")) {
    return "frame_in_frame";
  }

  return "rule_of_thirds";
}

function suggestLightingByDescription(description: string, location: string, timeOfDay?: string): LightingType {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes("日落") || lowerDesc.includes("黄昏") || lowerDesc.includes("sunset")) {
    return "golden_hour";
  }
  if (lowerDesc.includes("夜晚") || lowerDesc.includes("晚上") || lowerDesc.includes("night")) {
    if (lowerDesc.includes("霓虹") || lowerDesc.includes("neon")) return "neon";
    return "moonlight";
  }
  if (lowerDesc.includes("戏剧") || lowerDesc.includes("dramatic")) return "dramatic";
  if (lowerDesc.includes("柔和") || lowerDesc.includes("soft")) return "soft";
  if (lowerDesc.includes("逆光") || lowerDesc.includes("backlight")) return "backlight";

  if (timeOfDay === "dusk" || timeOfDay === "dawn") return "golden_hour";
  if (timeOfDay === "night") return "moonlight";

  return "natural";
}

function suggestCameraAngleByDescription(description: string, emotion: string): CameraAngle {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes("俯视") || lowerDesc.includes("俯拍") || lowerDesc.includes("high angle")) {
    return "high_angle";
  }
  if (lowerDesc.includes("仰视") || lowerDesc.includes("仰拍") || lowerDesc.includes("low angle")) {
    return "low_angle";
  }
  if (lowerDesc.includes("鸟瞰") || lowerDesc.includes("俯瞰") || lowerDesc.includes("aerial")) {
    return "birds_eye";
  }
  if (lowerDesc.includes("过肩") || lowerDesc.includes("shoulder")) {
    return "over_shoulder";
  }

  if (emotion === "epic" || emotion === "action") return "low_angle";
  if (emotion === "horror" || emotion === "tense") return "dutch_angle";

  return "eye_level";
}

function suggestDepthOfFieldByDescription(description: string, shotType: ShotType): DepthOfField {
  if (shotType === "CU" || shotType === "ECU" || shotType === "MCU") {
    return "shallow";
  }

  if (shotType === "ELS" || shotType === "LS") {
    return "deep";
  }

  return "shallow";
}

export function analyzeScene(input: SceneDescriptionInput): ShotAnalysis {
  const { description, mood, timeOfDay } = input;

  const emotion = mood || analyzeEmotion(description);
  const context = analyzeContext(description);
  const location = input.location || analyzeLocation(description);
  const characterCount = input.characterCount || analyzeCharacterCount(description);

  const suggestedShotType = suggestShotTypeByDescription(description, emotion, context);
  const suggestedCameraMovement = suggestCameraMovementByDescription(description, emotion, context);
  const suggestedComposition = suggestCompositionByDescription(description, characterCount);
  const suggestedLighting = suggestLightingByDescription(description, location, timeOfDay);
  const suggestedCameraAngle = suggestCameraAngleByDescription(description, emotion);
  const suggestedDepthOfField = suggestDepthOfFieldByDescription(description, suggestedShotType);

  const reasoning = generateReasoning(
    suggestedShotType,
    suggestedCameraMovement,
    suggestedComposition,
    suggestedLighting,
    suggestedCameraAngle,
    emotion,
    context
  );

  const alternativeOptions = generateAlternatives(
    suggestedShotType,
    suggestedCameraMovement,
    suggestedComposition
  );

  return {
    suggestedShotType,
    suggestedCameraMovement,
    suggestedComposition,
    suggestedLighting,
    suggestedCameraAngle,
    suggestedDepthOfField,
    reasoning,
    alternativeOptions,
  };
}

function generateReasoning(
  shotType: ShotType,
  movement: CameraMovement,
  composition: CompositionType,
  lighting: LightingType,
  angle: CameraAngle,
  emotion: string,
  context: string
): string {
  const shotDef = SHOT_TYPES[shotType];
  const movementDef = CAMERA_MOVEMENTS[movement];
  const compDef = COMPOSITIONS[composition];
  const lightDef = LIGHTING_TYPES[lighting];
  const angleDef = CAMERA_ANGLES[angle];

  return `基于场景分析，推荐以下镜头配置：

【景别】${shotDef.name}(${shotDef.nameEn})：${shotDef.description}
【运镜】${movementDef.name}(${movementDef.nameEn})：${movementDef.description}
【构图】${compDef.name}(${compDef.nameEn})：${compDef.description}
【光影】${lightDef.name}(${lightDef.nameEn})：${lightDef.description}
【角度】${angleDef.name}(${angleDef.nameEn})：${angleDef.description}

情感基调：${emotion}
场景类型：${context}`;
}

function generateAlternatives(
  shotType: ShotType,
  movement: CameraMovement,
  composition: CompositionType
): Partial<ShotConfiguration>[] {
  const alternatives: Partial<ShotConfiguration>[] = [];

  if (shotType !== "CU") {
    alternatives.push({
      shotType: "CU",
      cameraMovement: "push",
      composition: "center",
    });
  }

  if (shotType !== "LS") {
    alternatives.push({
      shotType: "LS",
      cameraMovement: "static",
      composition: "rule_of_thirds",
    });
  }

  if (movement !== "orbit") {
    alternatives.push({
      shotType: "MS",
      cameraMovement: "orbit",
      composition: "center",
    });
  }

  return alternatives.slice(0, 3);
}

export function getOptimalConfiguration(analysis: ShotAnalysis): ShotConfiguration {
  return {
    shotType: analysis.suggestedShotType,
    cameraMovement: analysis.suggestedCameraMovement,
    composition: analysis.suggestedComposition,
    lighting: analysis.suggestedLighting,
    cameraAngle: analysis.suggestedCameraAngle,
    depthOfField: analysis.suggestedDepthOfField,
    duration: SHOT_TYPES[analysis.suggestedShotType].typicalDuration,
  };
}
