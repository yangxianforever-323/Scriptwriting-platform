/**
 * 镜头角度系统定义
 */

import type { CameraAngle, CameraAngleDefinition } from "./types";

export const CAMERA_ANGLES: Record<CameraAngle, CameraAngleDefinition> = {
  eye_level: {
    code: "eye_level",
    name: "平视",
    nameEn: "Eye Level",
    description: "摄像机与被摄对象眼睛平齐，最自然的视角",
    promptSuffix: "eye level angle, neutral perspective, natural viewpoint",
    emotionalEffect: ["自然", "平等", "客观", "真实", "日常"],
    useCases: ["对话场景", "日常场景", "纪录片", "客观叙述"],
  },
  high_angle: {
    code: "high_angle",
    name: "俯拍",
    nameEn: "High Angle",
    description: "摄像机从高处向下拍摄，使被摄对象显得渺小",
    promptSuffix: "high angle shot, looking down, overhead angle, superior viewpoint",
    emotionalEffect: ["渺小", "弱势", "脆弱", "控制", "俯视"],
    useCases: ["弱势角色", "被压迫感", "全景展示", "控制感"],
  },
  low_angle: {
    code: "low_angle",
    name: "仰拍",
    nameEn: "Low Angle",
    description: "摄像机从低处向上拍摄，使被摄对象显得高大",
    promptSuffix: "low angle shot, looking up, heroic angle, powerful perspective",
    emotionalEffect: ["强大", "威严", "英雄", "力量", "崇拜"],
    useCases: ["英雄镜头", "权威人物", "力量展示", "崇敬感"],
  },
  dutch_angle: {
    code: "dutch_angle",
    name: "荷兰角",
    nameEn: "Dutch Angle / Canted Angle",
    description: "摄像机倾斜拍摄，制造不安和紧张感",
    promptSuffix: "dutch angle, canted frame, tilted horizon, diagonal composition, unsettling",
    emotionalEffect: ["不安", "紧张", "混乱", "疯狂", "失衡"],
    useCases: ["恐怖片", "心理片", "紧张场景", "混乱状态"],
  },
  birds_eye: {
    code: "birds_eye",
    name: "鸟瞰",
    nameEn: "Bird's Eye View",
    description: "从极高处垂直向下拍摄，展示全景布局",
    promptSuffix: "bird's eye view, overhead shot, aerial perspective, top-down view",
    emotionalEffect: ["全景", "上帝视角", "客观", "布局", "距离"],
    useCases: ["城市全景", "战场布局", "空间关系", "上帝视角"],
  },
  worms_eye: {
    code: "worms_eye",
    name: "虫视",
    nameEn: "Worm's Eye View",
    description: "从极低处向上拍摄，极端的仰视效果",
    promptSuffix: "worm's eye view, extreme low angle, ground level looking up, dramatic perspective",
    emotionalEffect: ["极端", "戏剧", "震撼", "夸张", "力量"],
    useCases: ["建筑摄影", "极端效果", "戏剧性", "夸张表达"],
  },
  over_shoulder: {
    code: "over_shoulder",
    name: "过肩镜头",
    nameEn: "Over the Shoulder",
    description: "从一人肩膀后方拍摄另一人，常用于对话",
    promptSuffix: "over the shoulder shot, OTS, character's shoulder in foreground, conversation framing",
    emotionalEffect: ["对话", "关系", "互动", "亲密", "连接"],
    useCases: ["对话场景", "关系展示", "互动表达", "双人镜头"],
  },
};

export const CAMERA_ANGLE_LIST = Object.values(CAMERA_ANGLES);

export function getCameraAngleByCode(code: CameraAngle): CameraAngleDefinition {
  return CAMERA_ANGLES[code];
}
