/**
 * 景别系统定义
 * 专业影视景别分类与Prompt映射
 */

import type { ShotType, ShotTypeDefinition } from "./types";

export const SHOT_TYPES: Record<ShotType, ShotTypeDefinition> = {
  ELS: {
    code: "ELS",
    name: "极远景",
    nameEn: "Extreme Long Shot",
    description: "极端遥远的镜头景观，人物小如蚂蚁，主要用于交代宏大环境、地理风貌、城市全景等",
    promptSuffix: "extreme wide shot, extreme long shot, vast landscape, tiny figures in distance, establishing shot, panoramic view, epic scale, environmental storytelling",
    aspectRatio: "16:9",
    typicalDuration: 5,
    emotionalEffect: ["震撼", "孤独", "渺小", "壮阔", "史诗感"],
    useCases: ["开场建立镜头", "城市全景", "自然风光", "战争场面", "灾难场景"],
  },
  LS: {
    code: "LS",
    name: "远景",
    nameEn: "Long Shot",
    description: "深远的镜头景观，人物在画面中占有较小位置，强调环境与人物的关系",
    promptSuffix: "long shot, wide shot, full environment visible, subject small in frame, environmental context, establishing shot, cinematic wide angle",
    aspectRatio: "16:9",
    typicalDuration: 4,
    emotionalEffect: ["开阔", "自由", "孤独", "沉思", "探索"],
    useCases: ["场景建立", "人物出场", "动作场面", "追逐戏", "户外场景"],
  },
  FS: {
    code: "FS",
    name: "全景",
    nameEn: "Full Shot",
    description: "展现人物全身，从头顶到脚底完整可见，强调人物与环境的互动",
    promptSuffix: "full shot, full body shot, character fully visible head to toe, body language visible, costume details, environmental interaction, standing pose",
    aspectRatio: "16:9",
    typicalDuration: 3,
    emotionalEffect: ["完整", "行动", "展示", "互动", "动态"],
    useCases: ["人物介绍", "服装展示", "动作表演", "舞蹈场景", "对话场景"],
  },
  MS: {
    code: "MS",
    name: "中景",
    nameEn: "Medium Shot",
    description: "人物腰部以上可见，最常用的对话镜头，平衡人物表情与肢体语言",
    promptSuffix: "medium shot, waist up, upper body visible, hand gestures visible, conversational framing, balanced composition, professional cinematography",
    aspectRatio: "16:9",
    typicalDuration: 3,
    emotionalEffect: ["亲近", "对话", "互动", "自然", "舒适"],
    useCases: ["对话场景", "新闻报道", "会议场景", "日常互动", "表演展示"],
  },
  MCU: {
    code: "MCU",
    name: "中近景",
    nameEn: "Medium Close-Up",
    description: "胸部以上可见，重点刻画面部表情，同时保留部分肢体信息",
    promptSuffix: "medium close-up, chest up, face clearly visible, emotional expression, intimate framing, facial details, professional portrait",
    aspectRatio: "16:9",
    typicalDuration: 3,
    emotionalEffect: ["亲密", "关注", "情感", "真诚", "交流"],
    useCases: ["情感对话", "采访镜头", "反应镜头", "情感表达", "重要对白"],
  },
  CU: {
    code: "CU",
    name: "特写",
    nameEn: "Close-Up",
    description: "面部特写，强调情感表达和细节，是情感叙事的核心镜头",
    promptSuffix: "close-up shot, face fills frame, emotional detail, intimate, shallow depth of field, dramatic lighting on face, cinematic portrait, emotional storytelling",
    aspectRatio: "1:1",
    typicalDuration: 2,
    emotionalEffect: ["强烈", "情感", "细节", "聚焦", "冲击"],
    useCases: ["情感高潮", "重要对白", "反应镜头", "细节展示", "心理描写"],
  },
  ECU: {
    code: "ECU",
    name: "极特写",
    nameEn: "Extreme Close-Up",
    description: "极度放大细节，如眼睛、嘴唇、手指等，用于强调关键细节或制造紧张感",
    promptSuffix: "extreme close-up, macro shot, extreme detail, eye close-up, lips, fingers, intense focus, dramatic detail, shallow depth of field, cinematic macro",
    aspectRatio: "1:1",
    typicalDuration: 2,
    emotionalEffect: ["紧张", "聚焦", "震撼", "细节", "冲击"],
    useCases: ["关键细节", "情感高潮", "悬念制造", "物品特写", "心理描写"],
  },
};

export const SHOT_TYPE_LIST = Object.values(SHOT_TYPES);

export function getShotTypeByCode(code: ShotType): ShotTypeDefinition {
  return SHOT_TYPES[code];
}

export function getShotTypeByEmotion(emotion: string): ShotType[] {
  return SHOT_TYPE_LIST.filter((shot) =>
    shot.emotionalEffect.some((e) => e.includes(emotion) || emotion.includes(e))
  ).map((shot) => shot.code);
}

export function getRecommendedShotType(
  context: "dialogue" | "action" | "emotional" | "establishing" | "detail"
): ShotType {
  const recommendations: Record<string, ShotType> = {
    dialogue: "MS",
    action: "FS",
    emotional: "CU",
    establishing: "LS",
    detail: "ECU",
  };
  return recommendations[context] || "MS";
}
