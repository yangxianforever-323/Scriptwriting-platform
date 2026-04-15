/**
 * Prompt Generation Utilities
 * Generate image and video prompts for AI generation
 */

import type { Shot } from "@/types/storyboard";
import type { Character, Location } from "@/types/story";
import {
  getExpressionDescription,
  getActionDescription,
  getLightingDescription,
  getMoodDescription,
} from "./character-consistency";
import {
  generateScenePrompt,
  TIME_OF_DAY_OPTIONS,
  MOOD_OPTIONS,
  LIGHTING_OPTIONS,
} from "./scene-system";

export interface PromptGenerationConfig {
  style?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "21:9";
  quality?: "standard" | "high" | "ultra";
  includeStyle?: boolean;
  includeTechnical?: boolean;
  language?: "zh" | "en";
}

export const SHOT_TYPE_PROMPTS: Record<string, { zh: string; en: string }> = {
  LS: { zh: "远景", en: "long shot" },
  ELS: { zh: "大远景", en: "extreme long shot" },
  FS: { zh: "全景", en: "full shot" },
  MS: { zh: "中景", en: "medium shot" },
  MCU: { zh: "中近景", en: "medium close-up" },
  CU: { zh: "特写", en: "close-up" },
  ECU: { zh: "大特写", en: "extreme close-up" },
  OTS: { zh: "过肩镜头", en: "over the shoulder shot" },
  POV: { zh: "主观视角", en: "point of view shot" },
  TWO: { zh: "双人镜头", en: "two shot" },
  THREE: { zh: "三人镜头", en: "three shot" },
};

export const CAMERA_MOVEMENT_PROMPTS: Record<string, { zh: string; en: string }> = {
  static: { zh: "固定镜头", en: "static shot" },
  pan_left: { zh: "左摇", en: "pan left" },
  pan_right: { zh: "右摇", en: "pan right" },
  tilt_up: { zh: "上仰", en: "tilt up" },
  tilt_down: { zh: "下俯", en: "tilt down" },
  dolly_in: { zh: "推进", en: "dolly in" },
  dolly_out: { zh: "拉远", en: "dolly out" },
  zoom_in: { zh: "放大", en: "zoom in" },
  zoom_out: { zh: "缩小", en: "zoom out" },
  tracking: { zh: "跟拍", en: "tracking shot" },
  crane_up: { zh: "升镜头", en: "crane up" },
  crane_down: { zh: "降镜头", en: "crane down" },
  handheld: { zh: "手持", en: "handheld" },
  steadicam: { zh: "稳定器", en: "steadicam" },
  slow_push: { zh: "缓慢推进", en: "slow push in" },
  slow_pull: { zh: "缓慢拉远", en: "slow pull out" },
};

export const CAMERA_ANGLE_PROMPTS: Record<string, { zh: string; en: string }> = {
  eye_level: { zh: "平视", en: "eye level" },
  high_angle: { zh: "俯拍", en: "high angle" },
  low_angle: { zh: "仰拍", en: "low angle" },
  dutch_angle: { zh: "倾斜角度", en: "dutch angle" },
  birds_eye: { zh: "鸟瞰", en: "bird's eye view" },
  worms_eye: { zh: "虫视", en: "worm's eye view" },
};

export const STYLE_PRESETS = [
  { value: "cinematic", label: "电影感", prompt: "cinematic, film grain, dramatic lighting" },
  { value: "anime", label: "动漫风格", prompt: "anime style, vibrant colors, clean lines" },
  { value: "realistic", label: "写实风格", prompt: "photorealistic, highly detailed, natural lighting" },
  { value: "painterly", label: "绘画风格", prompt: "painterly, artistic, brush strokes" },
  { value: "noir", label: "黑色电影", prompt: "film noir, high contrast, shadows, moody" },
  { value: "fantasy", label: "奇幻风格", prompt: "fantasy art, magical, ethereal" },
  { value: "scifi", label: "科幻风格", prompt: "science fiction, futuristic, neon lights" },
  { value: "vintage", label: "复古风格", prompt: "vintage, retro, film grain, warm tones" },
  { value: "minimalist", label: "极简风格", prompt: "minimalist, clean, simple composition" },
  { value: "documentary", label: "纪录片风格", prompt: "documentary style, natural, candid" },
];

export function generateImagePrompt(
  shot: Shot,
  characters: Character[],
  location?: Location | null,
  config: PromptGenerationConfig = {}
): string {
  const language = config.language || "zh";
  const isEnglish = language === "en";

  // ── 1. Cinematic framing (safety-safe preamble) ────────────────
  const framingParts: string[] = [];

  // Style preset — establishes artistic context upfront to reduce safety filter risk
  if (config.style) {
    const stylePreset = STYLE_PRESETS.find(s => s.value === config.style);
    framingParts.push(stylePreset ? stylePreset.prompt : config.style);
  } else {
    framingParts.push("cinematic film still, professional cinematography");
  }

  // Shot type
  if (shot.shotType && SHOT_TYPE_PROMPTS[shot.shotType]) {
    framingParts.push(SHOT_TYPE_PROMPTS[shot.shotType][language]);
  }

  // ── 2. Location (scene setting) ───────────────────────────────
  const locationParts: string[] = [];
  if (location) {
    locationParts.push(location.name);
    if (location.description && location.description.length > 0) {
      // Use first sentence of description as setting context
      const firstSentence = location.description.split(/[。.！!]/)[0];
      if (firstSentence && firstSentence.length > 0) {
        locationParts.push(firstSentence);
      }
    }
    if (location.atmosphere) {
      locationParts.push(location.atmosphere);
    }
    if (location.keyFeatures && location.keyFeatures.length > 0) {
      // Take up to 3 key visual features for specificity
      locationParts.push(...location.keyFeatures.slice(0, 3));
    }
  }

  // ── 3. Lighting & time context ────────────────────────────────
  const lightingParts: string[] = [];

  if (shot.lightingType) {
    const lightingDesc = getLightingDescription(shot.lightingType);
    if (lightingDesc) lightingParts.push(lightingDesc);
  }
  if (shot.colorTone) {
    lightingParts.push(shot.colorTone);
  }
  if (shot.lightingName) {
    lightingParts.push(shot.lightingName);
  }

  // timeOfDay from shot metadata (stored as string)
  const shotTimeOfDay = (shot as unknown as Record<string, string>).timeOfDay;
  if (shotTimeOfDay) {
    const timeOption = TIME_OF_DAY_OPTIONS.find(t => t.value === shotTimeOfDay);
    if (timeOption) lightingParts.push(timeOption.label);
  }

  // ── 4. Atmosphere / mood ──────────────────────────────────────
  const moodParts: string[] = [];

  const shotMood = (shot as unknown as Record<string, string>).mood;
  if (shotMood) {
    const moodOption = MOOD_OPTIONS.find(m => m.value === shotMood);
    if (moodOption) moodParts.push(moodOption.label);
    else moodParts.push(shotMood);
  }
  if (shot.emotionCurve) {
    moodParts.push(getMoodDescription(shot.emotionCurve));
  }

  // ── 5. Characters (most detailed section) ────────────────────
  const characterParts: string[] = [];
  const shotCharacters = characters.filter(c => shot.characterIds?.includes(c.id));

  shotCharacters.forEach(char => {
    const charDesc: string[] = [];

    // Name as anchor
    charDesc.push(isEnglish ? char.name : `角色${char.name}`);

    // Appearance is the primary visual descriptor — always include in full
    if (char.appearance) {
      charDesc.push(char.appearance);
    }

    // Gender/age provide visual specificity that helps safety filters
    if (char.age) charDesc.push(char.age);
    if (char.gender) charDesc.push(char.gender);

    // Personality keywords add behavioral context for the pose/expression
    if (char.personality) {
      // Trim to first 50 chars to avoid bloating the prompt
      const shortPersonality = char.personality.split("；")[0].substring(0, 50);
      if (shortPersonality) charDesc.push(shortPersonality);
    }

    characterParts.push(charDesc.filter(Boolean).join(", "));
  });

  // ── 6. Action / performance ───────────────────────────────────
  const actionParts: string[] = [];

  if (shot.performanceAction) {
    actionParts.push(shot.performanceAction);
  }
  if (shot.performanceStart) {
    actionParts.push(shot.performanceStart);
  }

  // ── 7. Scene description (narrative content) ──────────────────
  if (shot.description) {
    actionParts.push(shot.description);
  }

  // ── 8. Technical camera params ────────────────────────────────
  const technicalParts: string[] = [];
  if (config.includeTechnical !== false) {
    if (shot.cameraAngle && CAMERA_ANGLE_PROMPTS[shot.cameraAngle]) {
      technicalParts.push(CAMERA_ANGLE_PROMPTS[shot.cameraAngle][language]);
    }
    if (shot.cameraMovement && CAMERA_MOVEMENT_PROMPTS[shot.cameraMovement]) {
      technicalParts.push(CAMERA_MOVEMENT_PROMPTS[shot.cameraMovement][language]);
    }
    if (shot.focalLength) {
      technicalParts.push(shot.focalLength);
    }
    if (shot.depthOfField) {
      technicalParts.push(shot.depthOfFieldName || shot.depthOfField);
    }
  }

  // ── 9. Quality suffix ─────────────────────────────────────────
  const qualityParts: string[] = [];
  if (config.aspectRatio) {
    qualityParts.push(`aspect ratio ${config.aspectRatio}`);
  }
  if (config.quality === "high") {
    qualityParts.push("high quality, detailed");
  } else if (config.quality === "ultra") {
    qualityParts.push("ultra high quality, extremely detailed, 8k");
  }

  // ── Assemble in logical order ──────────────────────────────────
  const allSections = [
    framingParts.join(", "),
    locationParts.join(", "),
    lightingParts.join(", "),
    moodParts.join(", "),
    characterParts.join("; "),
    actionParts.join(", "),
    technicalParts.join(", "),
    qualityParts.join(", "),
  ];

  return allSections.filter(s => s.length > 0).join(". ");
}

export function generateVideoPrompt(
  shot: Shot,
  characters: Character[],
  location?: Location | null,
  config: PromptGenerationConfig = {}
): string {
  // Base: full visual composition without technical camera
  const imagePrompt = generateImagePrompt(shot, characters, location, {
    ...config,
    includeTechnical: false,
  });

  const language = config.language || "zh";
  const motionParts: string[] = [imagePrompt];

  // Camera movement is the primary motion descriptor for video
  if (shot.cameraMovement && CAMERA_MOVEMENT_PROMPTS[shot.cameraMovement]) {
    motionParts.push(CAMERA_MOVEMENT_PROMPTS[shot.cameraMovement][language]);
  }
  if (shot.movementDetails) {
    motionParts.push(shot.movementDetails);
  }

  // Camera angle (useful for Doubao video model)
  if (shot.cameraAngle && CAMERA_ANGLE_PROMPTS[shot.cameraAngle]) {
    motionParts.push(CAMERA_ANGLE_PROMPTS[shot.cameraAngle][language]);
  }

  // Performance end state helps define the motion arc
  if (shot.performanceEnd) {
    motionParts.push(shot.performanceEnd);
  }

  // Ambient/action sounds inform video mood
  if (shot.ambientSound) {
    motionParts.push(shot.ambientSound);
  }

  if (shot.duration) {
    motionParts.push(`${shot.duration}s`);
  }

  return motionParts.filter(Boolean).join(", ");
}

export function generatePromptWithCharacterExpression(
  shot: Shot,
  characters: Character[],
  location: Location | null | undefined,
  expression: string,
  action?: string,
  config: PromptGenerationConfig = {}
): string {
  const basePrompt = generateImagePrompt(shot, characters, location, {
    ...config,
    includeTechnical: false,
  });

  const parts: string[] = [basePrompt];

  if (expression) {
    parts.push(getExpressionDescription(expression));
  }

  if (action) {
    parts.push(getActionDescription(action));
  }

  if (shot.cameraMovement && CAMERA_MOVEMENT_PROMPTS[shot.cameraMovement]) {
    parts.push(CAMERA_MOVEMENT_PROMPTS[shot.cameraMovement][config.language || "zh"]);
  }

  return parts.filter(Boolean).join(", ");
}

export function generateBatchPrompts(
  shots: Shot[],
  characters: Character[],
  locations: Location[],
  config: PromptGenerationConfig = {}
): Map<string, { imagePrompt: string; videoPrompt: string }> {
  const prompts = new Map<string, { imagePrompt: string; videoPrompt: string }>();

  shots.forEach(shot => {
    const shotLocation = locations.find(l => l.id === shot.locationId);
    
    prompts.set(shot.id, {
      imagePrompt: generateImagePrompt(shot, characters, shotLocation, config),
      videoPrompt: generateVideoPrompt(shot, characters, shotLocation, config),
    });
  });

  return prompts;
}

export function optimizePromptForModel(
  prompt: string,
  model: "kling" | "doubao" | "vidu" | "runway" | "pika"
): string {
  const optimizations: Record<string, (p: string) => string> = {
    kling: (p) => p,
    doubao: (p) => p,
    vidu: (p) => `${p}, smooth motion, natural movement`,
    runway: (p) => `${p}, high quality, cinematic`,
    pika: (p) => `${p}, creative, artistic`,
  };

  return optimizations[model] ? optimizations[model](prompt) : prompt;
}

export function translatePromptToEnglish(prompt: string): string {
  const translations: Record<string, string> = {
    "远景": "long shot",
    "中景": "medium shot",
    "特写": "close-up",
    "大特写": "extreme close-up",
    "全景": "full shot",
    "固定镜头": "static shot",
    "推进": "dolly in",
    "拉远": "dolly out",
    "平视": "eye level",
    "俯拍": "high angle",
    "仰拍": "low angle",
    "早晨": "morning",
    "黄昏": "sunset",
    "夜晚": "night",
    "温馨": "warm and cozy",
    "紧张": "tense",
    "神秘": "mysterious",
    "浪漫": "romantic",
  };

  let result = prompt;
  Object.entries(translations).forEach(([zh, en]) => {
    result = result.replace(new RegExp(zh, "g"), en);
  });

  return result;
}
