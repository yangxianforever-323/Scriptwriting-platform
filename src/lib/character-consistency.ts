/**
 * Character Consistency Utilities
 * Generate consistent prompts and manage character appearance
 */

import type { Character } from "@/types/story";

export interface CharacterOutfit {
  id: string;
  name: string;
  description: string;
  scenes: string[];
  referenceImage?: string;
}

export interface CharacterConsistencyConfig {
  characterId: string;
  seed?: number;
  lora?: string;
  ipAdapter?: string;
  controlnet?: {
    type: string;
    image: string;
  };
}

export interface PromptGenerationOptions {
  includeAppearance?: boolean;
  includePersonality?: boolean;
  includeOutfit?: string;
  includeExpression?: string;
  includeAction?: string;
  shotType?: string;
  lighting?: string;
  mood?: string;
}

export function generateCharacterPrompt(
  character: Character,
  options: PromptGenerationOptions = {}
): string {
  const parts: string[] = [];

  if (options.shotType) {
    parts.push(options.shotType);
  }

  parts.push(character.name);

  if (options.includeAppearance !== false && character.appearance) {
    parts.push(character.appearance);
  }

  if (options.includeOutfit) {
    parts.push(`wearing ${options.includeOutfit}`);
  }

  if (options.includeExpression) {
    parts.push(options.includeExpression);
  }

  if (options.includeAction) {
    parts.push(options.includeAction);
  }

  if (options.lighting) {
    parts.push(options.lighting);
  }

  if (options.mood) {
    parts.push(options.mood);
  }

  return parts.filter(Boolean).join(", ");
}

export function generateBatchCharacterPrompts(
  characters: Character[],
  options: PromptGenerationOptions = {}
): Map<string, string> {
  const prompts = new Map<string, string>();
  
  characters.forEach(char => {
    prompts.set(char.id, generateCharacterPrompt(char, options));
  });
  
  return prompts;
}

export function generateScenePrompt(
  sceneDescription: string,
  characters: Character[],
  location?: { name: string; description: string; atmosphere?: string },
  options: PromptGenerationOptions = {}
): string {
  const parts: string[] = [];

  if (options.shotType) {
    parts.push(options.shotType);
  }

  if (location) {
    parts.push(location.name);
    if (location.atmosphere) {
      parts.push(location.atmosphere);
    }
  }

  characters.forEach(char => {
    parts.push(char.name);
    if (options.includeAppearance !== false && char.appearance) {
      parts.push(char.appearance);
    }
  });

  if (options.lighting) {
    parts.push(options.lighting);
  }

  if (options.mood) {
    parts.push(options.mood);
  }

  parts.push(sceneDescription);

  return parts.filter(Boolean).join(", ");
}

export function generateConsistentCharacterPrompt(
  character: Character,
  consistencyConfig: CharacterConsistencyConfig,
  options: PromptGenerationOptions = {}
): { prompt: string; config: CharacterConsistencyConfig } {
  const basePrompt = generateCharacterPrompt(character, options);
  
  let enhancedPrompt = basePrompt;
  
  if (consistencyConfig.seed) {
    enhancedPrompt += ` [seed: ${consistencyConfig.seed}]`;
  }
  
  if (consistencyConfig.lora) {
    enhancedPrompt += ` [lora: ${consistencyConfig.lora}]`;
  }
  
  return {
    prompt: enhancedPrompt,
    config: consistencyConfig,
  };
}

export const EXPRESSION_PRESETS = [
  { name: "平静", description: "表情平静，眼神温和" },
  { name: "微笑", description: "嘴角微微上扬，面带微笑" },
  { name: "严肃", description: "表情严肃，眉头微皱" },
  { name: "惊讶", description: "眼睛睁大，嘴巴微张，表情惊讶" },
  { name: "悲伤", description: "眼神忧郁，嘴角下垂" },
  { name: "愤怒", description: "眉头紧锁，眼神锐利" },
  { name: "思考", description: "目光微垂，若有所思" },
  { name: "紧张", description: "表情紧张，眼神不安" },
];

export const ACTION_PRESETS = [
  { name: "站立", description: "站立姿势" },
  { name: "坐着", description: "坐着的姿势" },
  { name: "行走", description: "正在行走" },
  { name: "奔跑", description: "正在奔跑" },
  { name: "交谈", description: "正在交谈" },
  { name: "阅读", description: "正在阅读" },
  { name: "思考", description: "思考的姿态" },
  { name: "战斗", description: "战斗姿态" },
];

export const LIGHTING_PRESETS = [
  { name: "自然光", description: "自然日光照明" },
  { name: "暖光", description: "温暖的黄色光线" },
  { name: "冷光", description: "冷色调的蓝色光线" },
  { name: "逆光", description: "逆光剪影效果" },
  { name: "侧光", description: "侧面打光，强调轮廓" },
  { name: "顶光", description: "顶部打光，戏剧效果" },
  { name: "柔和光", description: "柔和的漫射光" },
  { name: "硬光", description: "强烈的直射光" },
];

export const MOOD_PRESETS = [
  { name: "温馨", description: "温馨舒适的氛围" },
  { name: "紧张", description: "紧张刺激的氛围" },
  { name: "神秘", description: "神秘莫测的氛围" },
  { name: "悲伤", description: "悲伤忧郁的氛围" },
  { name: "欢乐", description: "欢乐愉快的氛围" },
  { name: "浪漫", description: "浪漫唯美的氛围" },
  { name: "恐怖", description: "恐怖阴森的氛围" },
  { name: "史诗", description: "史诗宏大的氛围" },
];

export function getExpressionDescription(expressionName: string): string {
  const preset = EXPRESSION_PRESETS.find(e => e.name === expressionName);
  return preset?.description || expressionName;
}

export function getActionDescription(actionName: string): string {
  const preset = ACTION_PRESETS.find(a => a.name === actionName);
  return preset?.description || actionName;
}

export function getLightingDescription(lightingName: string): string {
  const preset = LIGHTING_PRESETS.find(l => l.name === lightingName);
  return preset?.description || lightingName;
}

export function getMoodDescription(moodName: string): string {
  const preset = MOOD_PRESETS.find(m => m.name === moodName);
  return preset?.description || moodName;
}
