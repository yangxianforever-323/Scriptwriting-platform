/**
 * Scene System Utilities
 * Manage scene details, atmosphere, and environment settings
 */

import type { Location, LocationType } from "@/types/story";

export interface SceneEnvironment {
  timeOfDay: string;
  weather: string;
  season?: string;
  temperature?: string;
}

export interface SceneAtmosphere {
  mood: string;
  lighting: string;
  colorTone: string;
  sound?: string;
}

export interface SceneDetail {
  locationId: string;
  environment: SceneEnvironment;
  atmosphere: SceneAtmosphere;
  props: string[];
  backgroundElements: string[];
  specialEffects?: string[];
}

export const TIME_OF_DAY_OPTIONS = [
  { value: "dawn", label: "黎明", description: "日出前的微光时刻" },
  { value: "morning", label: "早晨", description: "清晨的阳光" },
  { value: "noon", label: "正午", description: "中午强烈的阳光" },
  { value: "afternoon", label: "下午", description: "午后的斜阳" },
  { value: "sunset", label: "黄昏", description: "日落时分的金色光线" },
  { value: "dusk", label: "傍晚", description: "日落后的暮色" },
  { value: "night", label: "夜晚", description: "夜间场景" },
  { value: "midnight", label: "深夜", description: "午夜时分" },
];

export const WEATHER_OPTIONS = [
  { value: "clear", label: "晴朗", description: "晴朗无云" },
  { value: "cloudy", label: "多云", description: "多云天气" },
  { value: "overcast", label: "阴天", description: "阴沉的天空" },
  { value: "rain", label: "雨天", description: "下雨" },
  { value: "storm", label: "暴风雨", description: "暴风雨天气" },
  { value: "snow", label: "雪天", description: "下雪" },
  { value: "fog", label: "雾天", description: "大雾弥漫" },
  { value: "windy", label: "大风", description: "大风天气" },
];

export const SEASON_OPTIONS = [
  { value: "spring", label: "春季", description: "春暖花开" },
  { value: "summer", label: "夏季", description: "炎炎夏日" },
  { value: "autumn", label: "秋季", description: "秋高气爽" },
  { value: "winter", label: "冬季", description: "寒冬腊月" },
];

export const MOOD_OPTIONS = [
  { value: "peaceful", label: "宁静", color: "#87CEEB" },
  { value: "tense", label: "紧张", color: "#8B0000" },
  { value: "romantic", label: "浪漫", color: "#FF69B4" },
  { value: "mysterious", label: "神秘", color: "#4B0082" },
  { value: "joyful", label: "欢乐", color: "#FFD700" },
  { value: "sad", label: "悲伤", color: "#708090" },
  { value: "scary", label: "恐怖", color: "#000000" },
  { value: "epic", label: "史诗", color: "#FF4500" },
  { value: "melancholic", label: "忧郁", color: "#4682B4" },
  { value: "exciting", label: "激动", color: "#FF6347" },
];

export const LIGHTING_OPTIONS = [
  { value: "natural", label: "自然光", description: "自然日光" },
  { value: "warm", label: "暖光", description: "温暖的黄色光线" },
  { value: "cool", label: "冷光", description: "冷色调蓝色光线" },
  { value: "dramatic", label: "戏剧光", description: "强烈的明暗对比" },
  { value: "soft", label: "柔光", description: "柔和的漫射光" },
  { value: "backlight", label: "逆光", description: "逆光剪影效果" },
  { value: "candlelight", label: "烛光", description: "温暖的烛光" },
  { value: "neon", label: "霓虹", description: "霓虹灯光" },
  { value: "moonlight", label: "月光", description: "柔和的月光" },
  { value: "firelight", label: "火光", description: "跳动的火光" },
];

export const COLOR_TONE_OPTIONS = [
  { value: "warm", label: "暖色调", colors: ["#FF6B35", "#F7931E", "#FFD700"] },
  { value: "cool", label: "冷色调", colors: ["#4169E1", "#00CED1", "#87CEEB"] },
  { value: "neutral", label: "中性色调", colors: ["#808080", "#A9A9A9", "#D3D3D3"] },
  { value: "vibrant", label: "鲜艳色调", colors: ["#FF1493", "#00FF00", "#FFD700"] },
  { value: "muted", label: "柔和色调", colors: ["#D8BFD8", "#F0E68C", "#E6E6FA"] },
  { value: "dark", label: "暗色调", colors: ["#2F4F4F", "#000080", "#800000"] },
  { value: "pastel", label: "粉色调", colors: ["#FFB6C1", "#98FB98", "#87CEFA"] },
  { value: "monochrome", label: "单色调", colors: ["#000000", "#FFFFFF", "#808080"] },
];

export const LOCATION_TYPE_OPTIONS = [
  { value: "interior", label: "室内", icon: "🏠" },
  { value: "exterior", label: "室外", icon: "🌳" },
  { value: "both", label: "室内外", icon: "🏡" },
];

export function generateScenePrompt(
  location: Location,
  environment: SceneEnvironment,
  atmosphere: SceneAtmosphere,
  additionalDetails?: string
): string {
  const parts: string[] = [];

  parts.push(location.name);
  
  if (location.description) {
    parts.push(location.description);
  }

  const timeOfDay = TIME_OF_DAY_OPTIONS.find(t => t.value === environment.timeOfDay);
  if (timeOfDay) {
    parts.push(timeOfDay.label);
  }

  const weather = WEATHER_OPTIONS.find(w => w.value === environment.weather);
  if (weather && weather.value !== "clear") {
    parts.push(weather.label);
  }

  if (environment.season) {
    const season = SEASON_OPTIONS.find(s => s.value === environment.season);
    if (season) {
      parts.push(season.label);
    }
  }

  const mood = MOOD_OPTIONS.find(m => m.value === atmosphere.mood);
  if (mood) {
    parts.push(mood.label);
  }

  const lighting = LIGHTING_OPTIONS.find(l => l.value === atmosphere.lighting);
  if (lighting) {
    parts.push(lighting.label);
  }

  if (atmosphere.colorTone) {
    const colorTone = COLOR_TONE_OPTIONS.find(c => c.value === atmosphere.colorTone);
    if (colorTone) {
      parts.push(colorTone.label);
    }
  }

  if (additionalDetails) {
    parts.push(additionalDetails);
  }

  return parts.filter(Boolean).join(", ");
}

export function generateEnvironmentDescription(
  environment: SceneEnvironment
): string {
  const parts: string[] = [];

  const timeOfDay = TIME_OF_DAY_OPTIONS.find(t => t.value === environment.timeOfDay);
  if (timeOfDay) {
    parts.push(timeOfDay.description);
  }

  const weather = WEATHER_OPTIONS.find(w => w.value === environment.weather);
  if (weather) {
    parts.push(weather.description);
  }

  if (environment.season) {
    const season = SEASON_OPTIONS.find(s => s.value === environment.season);
    if (season) {
      parts.push(season.description);
    }
  }

  return parts.join("，");
}

export function generateAtmosphereDescription(
  atmosphere: SceneAtmosphere
): string {
  const parts: string[] = [];

  const mood = MOOD_OPTIONS.find(m => m.value === atmosphere.mood);
  if (mood) {
    parts.push(`${mood.label}的氛围`);
  }

  const lighting = LIGHTING_OPTIONS.find(l => l.value === atmosphere.lighting);
  if (lighting) {
    parts.push(lighting.description);
  }

  if (atmosphere.colorTone) {
    const colorTone = COLOR_TONE_OPTIONS.find(c => c.value === atmosphere.colorTone);
    if (colorTone) {
      parts.push(colorTone.label);
    }
  }

  return parts.join("，");
}

export function suggestAtmosphereByMood(mood: string): Partial<SceneAtmosphere> {
  const moodAtmosphereMap: Record<string, Partial<SceneAtmosphere>> = {
    peaceful: { lighting: "natural", colorTone: "pastel", mood: "peaceful" },
    tense: { lighting: "dramatic", colorTone: "dark", mood: "tense" },
    romantic: { lighting: "warm", colorTone: "warm", mood: "romantic" },
    mysterious: { lighting: "cool", colorTone: "dark", mood: "mysterious" },
    joyful: { lighting: "natural", colorTone: "vibrant", mood: "joyful" },
    sad: { lighting: "soft", colorTone: "muted", mood: "sad" },
    scary: { lighting: "dramatic", colorTone: "dark", mood: "scary" },
    epic: { lighting: "dramatic", colorTone: "vibrant", mood: "epic" },
    melancholic: { lighting: "soft", colorTone: "cool", mood: "melancholic" },
    exciting: { lighting: "vibrant", colorTone: "vibrant", mood: "exciting" },
  };

  return moodAtmosphereMap[mood] || { lighting: "natural", colorTone: "neutral", mood };
}

export function suggestEnvironmentByTime(timeOfDay: string): Partial<SceneEnvironment> {
  const timeEnvironmentMap: Record<string, Partial<SceneEnvironment>> = {
    dawn: { timeOfDay: "dawn", weather: "clear" },
    morning: { timeOfDay: "morning", weather: "clear" },
    noon: { timeOfDay: "noon", weather: "clear" },
    afternoon: { timeOfDay: "afternoon", weather: "clear" },
    sunset: { timeOfDay: "sunset", weather: "clear" },
    dusk: { timeOfDay: "dusk", weather: "clear" },
    night: { timeOfDay: "night", weather: "clear" },
    midnight: { timeOfDay: "midnight", weather: "clear" },
  };

  return timeEnvironmentMap[timeOfDay] || { timeOfDay: "noon", weather: "clear" };
}
