/**
 * 光影系统定义
 * 专业影视光影分类与Prompt映射
 */

import type { LightingType, LightingDefinition } from "./types";

export const LIGHTING_TYPES: Record<LightingType, LightingDefinition> = {
  natural: {
    code: "natural",
    name: "自然光",
    nameEn: "Natural Light",
    description: "利用自然光源，真实自然，适合户外和纪实风格",
    promptSuffix: "natural lighting, soft natural light, realistic illumination, daylight",
    moodEffect: ["真实", "自然", "清新", "舒适", "日常"],
    useCases: ["户外场景", "纪录片", "日常生活", "自然风光"],
  },
  golden_hour: {
    code: "golden_hour",
    name: "黄金时刻",
    nameEn: "Golden Hour",
    description: "日出后或日落前的温暖光线，电影感最强",
    promptSuffix: "golden hour lighting, warm sunlight, sunset glow, cinematic warmth, magical light",
    moodEffect: ["温暖", "浪漫", "电影感", "梦幻", "怀旧"],
    useCases: ["浪漫场景", "电影镜头", "风景摄影", "情感高潮"],
  },
  blue_hour: {
    code: "blue_hour",
    name: "蓝调时刻",
    nameEn: "Blue Hour",
    description: "日出前或日落后的冷色调光线，神秘而宁静",
    promptSuffix: "blue hour lighting, twilight, cool blue tones, ambient glow, mysterious atmosphere",
    moodEffect: ["神秘", "宁静", "忧郁", "浪漫", "梦幻"],
    useCases: ["城市夜景", "浪漫场景", "神秘氛围", "情绪表达"],
  },
  high_key: {
    code: "high_key",
    name: "高调光",
    nameEn: "High Key Lighting",
    description: "明亮均匀的光线，画面整体明亮，适合喜剧和轻松场景",
    promptSuffix: "high key lighting, bright illumination, even lighting, minimal shadows, cheerful atmosphere",
    moodEffect: ["明亮", "快乐", "轻松", "纯洁", "希望"],
    useCases: ["喜剧场景", "广告拍摄", "时尚摄影", "轻松氛围"],
  },
  low_key: {
    code: "low_key",
    name: "低调光",
    nameEn: "Low Key Lighting",
    description: "强烈的明暗对比，大面积阴影，适合悬疑和戏剧",
    promptSuffix: "low key lighting, dramatic shadows, high contrast, chiaroscuro, moody atmosphere",
    moodEffect: ["神秘", "紧张", "戏剧", "危险", "深度"],
    useCases: ["悬疑片", "黑色电影", "戏剧场景", "紧张氛围"],
  },
  rim: {
    code: "rim",
    name: "轮廓光",
    nameEn: "Rim Lighting",
    description: "从背后照亮主体边缘，分离主体与背景",
    promptSuffix: "rim lighting, edge lighting, backlit outline, halo effect, subject separation",
    moodEffect: ["分离", "神圣", "戏剧", "立体", "电影感"],
    useCases: ["人物分离", "神圣感", "戏剧效果", "电影镜头"],
  },
  backlight: {
    code: "backlight",
    name: "逆光",
    nameEn: "Backlight",
    description: "光源在主体背后，制造剪影或光晕效果",
    promptSuffix: "backlighting, strong backlight, silhouetting, lens flare, dramatic contre-jour",
    moodEffect: ["戏剧", "神秘", "艺术", "情感", "意境"],
    useCases: ["剪影效果", "艺术摄影", "情感表达", "戏剧效果"],
  },
  side_light: {
    code: "side_light",
    name: "侧光",
    nameEn: "Side Lighting",
    description: "光线从侧面照射，强调质感和立体感",
    promptSuffix: "side lighting, directional light from side, texture emphasis, dramatic shadows, volumetric",
    moodEffect: ["立体", "质感", "戏剧", "深度", "艺术"],
    useCases: ["人像摄影", "质感展示", "戏剧效果", "艺术表达"],
  },
  dramatic: {
    code: "dramatic",
    name: "戏剧性光",
    nameEn: "Dramatic Lighting",
    description: "强烈的明暗对比，制造紧张和戏剧感",
    promptSuffix: "dramatic lighting, strong contrast, cinematic shadows, film noir style, intense atmosphere",
    moodEffect: ["戏剧", "紧张", "重要", "冲突", "高潮"],
    useCases: ["高潮场景", "冲突场面", "重要时刻", "电影镜头"],
  },
  soft: {
    code: "soft",
    name: "柔光",
    nameEn: "Soft Lighting",
    description: "柔和均匀的光线，减少阴影，适合美颜和温馨场景",
    promptSuffix: "soft lighting, diffused light, gentle shadows, flattering illumination, beauty lighting",
    moodEffect: ["柔和", "温馨", "美丽", "舒适", "浪漫"],
    useCases: ["美颜拍摄", "浪漫场景", "温馨氛围", "人物特写"],
  },
  hard: {
    code: "hard",
    name: "硬光",
    nameEn: "Hard Lighting",
    description: "强烈直射的光线，清晰阴影，强调质感",
    promptSuffix: "hard lighting, direct light, sharp shadows, high contrast, texture emphasis",
    moodEffect: ["强烈", "质感", "真实", "力量", "冲击"],
    useCases: ["产品摄影", "质感展示", "力量表达", "真实感"],
  },
  neon: {
    code: "neon",
    name: "霓虹光",
    nameEn: "Neon Lighting",
    description: "霓虹灯效果，赛博朋克和都市夜景常用",
    promptSuffix: "neon lighting, cyberpunk atmosphere, colorful neon lights, urban night, futuristic glow",
    moodEffect: ["赛博朋克", "都市", "未来", "酷炫", "神秘"],
    useCases: ["赛博朋克", "都市夜景", "未来感", "音乐视频"],
  },
  candlelight: {
    code: "candlelight",
    name: "烛光",
    nameEn: "Candlelight",
    description: "温暖的烛光效果，制造温馨和浪漫氛围",
    promptSuffix: "candlelight, warm flickering light, intimate atmosphere, romantic glow, soft warm tones",
    moodEffect: ["温馨", "浪漫", "亲密", "古典", "情感"],
    useCases: ["浪漫场景", "古典电影", "晚餐场景", "情感表达"],
  },
  moonlight: {
    code: "moonlight",
    name: "月光",
    nameEn: "Moonlight",
    description: "冷色调的月光效果，神秘而宁静",
    promptSuffix: "moonlight, cool blue tones, night scene, ethereal glow, mysterious atmosphere",
    moodEffect: ["神秘", "宁静", "浪漫", "梦幻", "夜晚"],
    useCases: ["夜景场景", "浪漫夜晚", "神秘氛围", "梦境"],
  },
};

export const LIGHTING_LIST = Object.values(LIGHTING_TYPES);

export function getLightingByCode(code: LightingType): LightingDefinition {
  return LIGHTING_TYPES[code];
}

export function getLightingByMood(mood: string): LightingType[] {
  return LIGHTING_LIST.filter((light) =>
    light.moodEffect.some((m) => m.includes(mood) || mood.includes(m))
  ).map((light) => light.code);
}

export function getRecommendedLighting(
  context: "daytime" | "night" | "indoor" | "dramatic" | "romantic"
): LightingType {
  const recommendations: Record<string, LightingType> = {
    daytime: "natural",
    night: "moonlight",
    indoor: "soft",
    dramatic: "low_key",
    romantic: "golden_hour",
  };
  return recommendations[context] || "natural";
}
