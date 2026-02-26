/**
 * Prompt构建器
 * 将镜头语言配置转换为AI生成Prompt
 */

import type {
  ShotConfiguration,
  GeneratedPrompt,
  SceneDescriptionInput,
  ShotType,
  CameraMovement,
  CompositionType,
  LightingType,
  CameraAngle,
  DepthOfField,
} from "./types";
import { SHOT_TYPES } from "./shot-types";
import { CAMERA_MOVEMENTS } from "./camera-movements";
import { COMPOSITIONS } from "./compositions";
import { LIGHTING_TYPES } from "./lighting";
import { CAMERA_ANGLES } from "./camera-angles";
import { DEPTH_OF_FIELD } from "./depth-of-field";

const STYLE_PROMPTS: Record<string, string> = {
  realistic: "photorealistic, hyperrealistic, 8k resolution, ultra detailed, professional photography",
  cinematic: "cinematic, film grain, anamorphic lens, movie still, professional cinematography",
  anime: "anime style, Japanese animation, vibrant colors, clean lines, studio ghibli inspired",
  cartoon: "cartoon style, bright colors, playful, exaggerated features, animation",
  watercolor: "watercolor painting style, soft edges, delicate colors, artistic, traditional art",
  oil_painting: "oil painting style, thick brushstrokes, rich colors, classical art, masterpiece",
  sketch: "pencil sketch style, detailed linework, grayscale, artistic drawing, hand drawn",
  cyberpunk: "cyberpunk style, neon lights, futuristic, dark atmosphere, tech aesthetic, blade runner",
  fantasy: "fantasy style, magical elements, ethereal, dreamlike, mystical, epic fantasy art",
  scifi: "sci-fi style, futuristic, high-tech, space age, advanced technology, science fiction",
};

const MOOD_PROMPTS: Record<string, string> = {
  happy: "joyful atmosphere, bright and cheerful, uplifting mood",
  sad: "melancholic atmosphere, somber mood, emotional depth",
  tense: "tense atmosphere, suspenseful, edge of seat",
  romantic: "romantic atmosphere, intimate, loving mood",
  mysterious: "mysterious atmosphere, enigmatic, intriguing",
  dramatic: "dramatic atmosphere, intense, powerful emotions",
  peaceful: "peaceful atmosphere, calm, serene, tranquil",
  horror: "horror atmosphere, scary, unsettling, dark and creepy",
  epic: "epic atmosphere, grand scale, heroic, majestic",
  nostalgic: "nostalgic atmosphere, vintage feel, sentimental",
};

const TIME_OF_DAY_PROMPTS: Record<string, string> = {
  dawn: "dawn, early morning light, first light of day, sunrise approaching",
  morning: "morning light, fresh daylight, bright morning sun",
  noon: "midday, bright overhead sun, harsh daylight",
  afternoon: "afternoon light, warm sunlight, late day",
  dusk: "dusk, sunset, golden hour, evening light",
  night: "night time, darkness, artificial lights, stars",
};

const WEATHER_PROMPTS: Record<string, string> = {
  sunny: "sunny day, clear sky, bright sunlight",
  cloudy: "overcast sky, diffused light, cloudy weather",
  rainy: "rain, wet surfaces, raindrops, stormy weather",
  snowy: "snow, winter scene, white landscape, cold",
  foggy: "fog, mist, low visibility, atmospheric haze",
  stormy: "storm, dark clouds, dramatic weather, wind",
};

export function buildImagePrompt(
  sceneDescription: string,
  config: Partial<ShotConfiguration>,
  input?: Partial<SceneDescriptionInput>
): string {
  const parts: string[] = [];

  const shotType = config.shotType || "MS";
  const shotDef = SHOT_TYPES[shotType];
  parts.push(shotDef.promptSuffix);

  const composition = config.composition || "rule_of_thirds";
  const compDef = COMPOSITIONS[composition];
  parts.push(compDef.promptSuffix);

  const lighting = config.lighting || "natural";
  const lightDef = LIGHTING_TYPES[lighting];
  parts.push(lightDef.promptSuffix);

  if (config.cameraAngle) {
    const angleDef = CAMERA_ANGLES[config.cameraAngle];
    if (angleDef) parts.push(angleDef.promptSuffix);
  }

  if (config.depthOfField) {
    const dofDef = DEPTH_OF_FIELD[config.depthOfField];
    if (dofDef) parts.push(dofDef.promptSuffix);
  }

  parts.push(sceneDescription);

  if (input?.style) {
    const stylePrompt = STYLE_PROMPTS[input.style];
    if (stylePrompt) parts.push(stylePrompt);
  } else {
    parts.push(STYLE_PROMPTS.cinematic);
  }

  if (input?.mood) {
    const moodPrompt = MOOD_PROMPTS[input.mood];
    if (moodPrompt) parts.push(moodPrompt);
  }

  if (input?.timeOfDay) {
    const timePrompt = TIME_OF_DAY_PROMPTS[input.timeOfDay];
    if (timePrompt) parts.push(timePrompt);
  }

  if (input?.weather) {
    const weatherPrompt = WEATHER_PROMPTS[input.weather];
    if (weatherPrompt) parts.push(weatherPrompt);
  }

  if (input?.customRequirements) {
    parts.push(input.customRequirements);
  }

  parts.push("high quality, professional, masterpiece");

  return parts.join(", ");
}

export function buildVideoPrompt(
  sceneDescription: string,
  config: Partial<ShotConfiguration>,
  input?: Partial<SceneDescriptionInput>
): string {
  const parts: string[] = [];

  const cameraMovement = config.cameraMovement || "static";
  const movementDef = CAMERA_MOVEMENTS[cameraMovement];
  parts.push(movementDef.videoPrompt);

  const shotType = config.shotType || "MS";
  const shotDef = SHOT_TYPES[shotType];
  parts.push(shotDef.promptSuffix);

  parts.push(sceneDescription);

  if (input?.style) {
    const stylePrompt = STYLE_PROMPTS[input.style];
    if (stylePrompt) parts.push(stylePrompt);
  } else {
    parts.push(STYLE_PROMPTS.cinematic);
  }

  parts.push("smooth motion, high quality video, professional cinematography");

  return parts.join(", ");
}

export function buildNegativePrompt(): string {
  const negativeElements = [
    "blurry",
    "low quality",
    "distorted",
    "deformed",
    "ugly",
    "bad anatomy",
    "bad proportions",
    "extra limbs",
    "missing limbs",
    "disconnected limbs",
    "mutation",
    "gross",
    "text",
    "watermark",
    "signature",
    "logo",
    "cropped",
    "out of frame",
    "worst quality",
    "jpeg artifacts",
    "duplicate",
    "morbid",
    "mutilated",
    "poorly drawn face",
    "poorly drawn hands",
    "more than 2 people",
  ];

  return negativeElements.join(", ");
}

export function generatePrompts(
  sceneDescription: string,
  config: Partial<ShotConfiguration>,
  input?: Partial<SceneDescriptionInput>
): GeneratedPrompt {
  const shotType = config.shotType || "MS";
  const shotDef = SHOT_TYPES[shotType];

  return {
    imagePrompt: buildImagePrompt(sceneDescription, config, input),
    videoPrompt: buildVideoPrompt(sceneDescription, config, input),
    negativePrompt: buildNegativePrompt(),
    parameters: {
      aspectRatio: shotDef.aspectRatio,
      duration: config.duration || shotDef.typicalDuration,
      style: input?.style || "cinematic",
    },
  };
}

export function generateShotSequence(
  sceneDescription: string,
  shotCount: number = 5,
  style?: string
): Array<{ shotNumber: number; config: Partial<ShotConfiguration>; prompts: GeneratedPrompt }> {
  const sequence: Array<{
    shotNumber: number;
    config: Partial<ShotConfiguration>;
    prompts: GeneratedPrompt;
  }> = [];

  const shotSequence: ShotType[] = ["LS", "FS", "MS", "MCU", "CU"];
  const movementSequence: CameraMovement[] = ["static", "push", "static", "push", "static"];

  for (let i = 0; i < Math.min(shotCount, 5); i++) {
    const config: Partial<ShotConfiguration> = {
      shotType: shotSequence[i],
      cameraMovement: movementSequence[i],
      composition: i === 0 ? "rule_of_thirds" : i === 4 ? "center" : "rule_of_thirds",
      lighting: "dramatic",
      duration: SHOT_TYPES[shotSequence[i]].typicalDuration,
    };

    sequence.push({
      shotNumber: i + 1,
      config,
      prompts: generatePrompts(sceneDescription, config, { style }),
    });
  }

  return sequence;
}

export { STYLE_PROMPTS, MOOD_PROMPTS, TIME_OF_DAY_PROMPTS, WEATHER_PROMPTS };
