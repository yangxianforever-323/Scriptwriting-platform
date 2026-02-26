/**
 * 运镜系统定义
 * 专业影视运镜分类与Prompt映射
 */

import type { CameraMovement, CameraMovementDefinition } from "./types";

export const CAMERA_MOVEMENTS: Record<CameraMovement, CameraMovementDefinition> = {
  static: {
    code: "static",
    name: "静止镜头",
    nameEn: "Static Shot",
    description: "摄像机固定不动，画面稳定，强调画面内元素的动态",
    promptSuffix: "static camera, locked shot, tripod, stable frame, no camera movement",
    videoPrompt: "static camera, no movement, locked frame",
    typicalDuration: 3,
    speed: "slow",
    emotionalEffect: ["稳定", "冷静", "观察", "客观", "沉思"],
    useCases: ["对话场景", "风景展示", "静态构图", "观察镜头", "纪录片"],
  },
  push: {
    code: "push",
    name: "推镜头",
    nameEn: "Push In / Dolly In",
    description: "摄像机向前移动，逐渐靠近被摄对象，用于聚焦、强调或揭示",
    promptSuffix: "push in, dolly in, camera moving forward, approaching subject, zoom in effect",
    videoPrompt: "slow push in, camera moving forward, approaching subject, increasing focus, dramatic reveal",
    typicalDuration: 4,
    speed: "slow",
    emotionalEffect: ["聚焦", "强调", "紧张", "揭示", "重要"],
    useCases: ["情感强调", "揭示真相", "聚焦细节", "紧张氛围", "重要时刻"],
  },
  pull: {
    code: "pull",
    name: "拉镜头",
    nameEn: "Pull Back / Dolly Out",
    description: "摄像机向后移动，逐渐远离被摄对象，用于揭示环境或制造疏离感",
    promptSuffix: "pull back, dolly out, camera moving backward, revealing context, zoom out effect",
    videoPrompt: "slow pull back, camera moving backward, revealing environment, widening perspective",
    typicalDuration: 4,
    speed: "slow",
    emotionalEffect: ["揭示", "疏离", "孤独", "思考", "环境"],
    useCases: ["场景揭示", "结局镜头", "孤独感", "环境展示", "反思时刻"],
  },
  pan_left: {
    code: "pan_left",
    name: "左摇镜头",
    nameEn: "Pan Left",
    description: "摄像机水平向左转动，用于展示空间或跟随运动",
    promptSuffix: "pan left, horizontal pan left, camera rotating left",
    videoPrompt: "pan left, camera rotating horizontally to the left, revealing more of the scene",
    typicalDuration: 4,
    speed: "medium",
    emotionalEffect: ["流动", "探索", "跟随", "空间", "连续"],
    useCases: ["空间展示", "跟随运动", "场景转换", "寻找", "观察"],
  },
  pan_right: {
    code: "pan_right",
    name: "右摇镜头",
    nameEn: "Pan Right",
    description: "摄像机水平向右转动，用于展示空间或跟随运动",
    promptSuffix: "pan right, horizontal pan right, camera rotating right",
    videoPrompt: "pan right, camera rotating horizontally to the right, revealing more of the scene",
    typicalDuration: 4,
    speed: "medium",
    emotionalEffect: ["流动", "探索", "跟随", "空间", "连续"],
    useCases: ["空间展示", "跟随运动", "场景转换", "寻找", "观察"],
  },
  tilt_up: {
    code: "tilt_up",
    name: "上仰镜头",
    nameEn: "Tilt Up",
    description: "摄像机垂直向上转动，用于展示高大物体或制造崇高感",
    promptSuffix: "tilt up, vertical tilt up, camera looking up, low angle reveal",
    videoPrompt: "tilt up, camera tilting upward, revealing tall structure, dramatic upward movement",
    typicalDuration: 3,
    speed: "medium",
    emotionalEffect: ["崇高", "敬畏", "力量", "希望", "上升"],
    useCases: ["建筑展示", "人物出场", "英雄镜头", "希望象征", "力量展示"],
  },
  tilt_down: {
    code: "tilt_down",
    name: "下俯镜头",
    nameEn: "Tilt Down",
    description: "摄像机垂直向下转动，用于展示地面或制造压抑感",
    promptSuffix: "tilt down, vertical tilt down, camera looking down, high angle reveal",
    videoPrompt: "tilt down, camera tilting downward, revealing ground level, dramatic downward movement",
    typicalDuration: 3,
    speed: "medium",
    emotionalEffect: ["压抑", "悲伤", "坠落", "俯视", "控制"],
    useCases: ["建筑顶部开始", "悲剧氛围", "俯视视角", "控制感", "坠落象征"],
  },
  track: {
    code: "track",
    name: "移动镜头",
    nameEn: "Tracking Shot",
    description: "摄像机跟随被摄对象平行移动，保持相对距离不变",
    promptSuffix: "tracking shot, camera following subject, parallel movement, side tracking",
    videoPrompt: "tracking shot, camera moving alongside subject, following movement, parallel tracking",
    typicalDuration: 5,
    speed: "medium",
    emotionalEffect: ["跟随", "参与", "流动", "陪伴", "动态"],
    useCases: ["行走对话", "追逐戏", "运动跟随", "街头场景", "舞蹈"],
  },
  dolly: {
    code: "dolly",
    name: "推轨镜头",
    nameEn: "Dolly Shot",
    description: "摄像机在轨道上平滑移动，专业电影常用运镜方式",
    promptSuffix: "dolly shot, smooth camera movement, rail shot, professional cinematography",
    videoPrompt: "smooth dolly shot, camera gliding on rails, professional cinematic movement",
    typicalDuration: 4,
    speed: "slow",
    emotionalEffect: ["专业", "流畅", "优雅", "电影感", "高级"],
    useCases: ["电影场景", "高级感镜头", "情感表达", "专业制作", "艺术表达"],
  },
  crane_up: {
    code: "crane_up",
    name: "升降上升",
    nameEn: "Crane Up",
    description: "摄像机通过升降机向上移动，制造宏大视角变化",
    promptSuffix: "crane up, camera rising, ascending shot, crane movement upward",
    videoPrompt: "crane up, camera rising smoothly, ascending perspective, dramatic height increase",
    typicalDuration: 5,
    speed: "slow",
    emotionalEffect: ["宏大", "升华", "希望", "超越", "壮观"],
    useCases: ["开场镜头", "结局升华", "城市展示", "人群场景", "壮观场面"],
  },
  crane_down: {
    code: "crane_down",
    name: "升降下降",
    nameEn: "Crane Down",
    description: "摄像机通过升降机向下移动，从高处逐渐接近地面",
    promptSuffix: "crane down, camera descending, lowering shot, crane movement downward",
    videoPrompt: "crane down, camera descending smoothly, lowering perspective, approaching ground level",
    typicalDuration: 5,
    speed: "slow",
    emotionalEffect: ["降落", "接近", "现实", "落地", "聚焦"],
    useCases: ["开场引入", "接近人物", "回归现实", "聚焦场景", "降落镜头"],
  },
  orbit: {
    code: "orbit",
    name: "环绕镜头",
    nameEn: "Orbit / Arc Shot",
    description: "摄像机围绕被摄对象旋转，展示360度视角",
    promptSuffix: "orbit shot, arc shot, camera circling around subject, 360 degree rotation",
    videoPrompt: "orbit shot, camera circling around subject, 360 degree rotation, dramatic circular movement",
    typicalDuration: 6,
    speed: "medium",
    emotionalEffect: ["立体", "完整", "戏剧", "英雄", "重要"],
    useCases: ["英雄镜头", "人物介绍", "重要时刻", "产品展示", "戏剧时刻"],
  },
  handheld: {
    code: "handheld",
    name: "手持镜头",
    nameEn: "Handheld Shot",
    description: "摄影师手持摄像机拍摄，制造真实感和紧张感",
    promptSuffix: "handheld camera, shaky cam, documentary style, raw footage, realistic feel",
    videoPrompt: "handheld camera, slight shake, documentary style, raw realistic movement",
    typicalDuration: 4,
    speed: "fast",
    emotionalEffect: ["真实", "紧张", "临场", "纪实", "紧迫"],
    useCases: ["动作场面", "纪录片", "恐怖片", "战争场面", "紧急场景"],
  },
  steadicam: {
    code: "steadicam",
    name: "稳定器镜头",
    nameEn: "Steadicam Shot",
    description: "使用稳定器拍摄的长镜头，流畅而专业",
    promptSuffix: "steadicam shot, smooth tracking, long take, fluid movement, professional cinematography",
    videoPrompt: "steadicam shot, smooth fluid movement, long take, professional tracking",
    typicalDuration: 6,
    speed: "medium",
    emotionalEffect: ["流畅", "专业", "沉浸", "连贯", "电影感"],
    useCases: ["长镜头", "复杂调度", "电影场景", "高级制作", "艺术表达"],
  },
  zoom_in: {
    code: "zoom_in",
    name: "变焦推",
    nameEn: "Zoom In",
    description: "通过调整镜头焦距放大画面，背景压缩效果",
    promptSuffix: "zoom in, optical zoom, lens zoom, background compression, dolly zoom effect",
    videoPrompt: "slow zoom in, lens zooming, background compression, focusing on subject",
    typicalDuration: 3,
    speed: "slow",
    emotionalEffect: ["聚焦", "强调", "紧张", "重要", "关注"],
    useCases: ["情感强调", "重要时刻", "紧张氛围", "细节聚焦", "戏剧效果"],
  },
  zoom_out: {
    code: "zoom_out",
    name: "变焦拉",
    nameEn: "Zoom Out",
    description: "通过调整镜头焦距缩小画面，揭示更多环境",
    promptSuffix: "zoom out, optical zoom out, revealing context, widening view",
    videoPrompt: "slow zoom out, lens zooming out, revealing more of the scene, widening perspective",
    typicalDuration: 3,
    speed: "slow",
    emotionalEffect: ["揭示", "环境", "疏离", "思考", "全局"],
    useCases: ["场景揭示", "环境展示", "疏离感", "思考时刻", "结局镜头"],
  },
};

export const CAMERA_MOVEMENT_LIST = Object.values(CAMERA_MOVEMENTS);

export function getCameraMovementByCode(code: CameraMovement): CameraMovementDefinition {
  return CAMERA_MOVEMENTS[code];
}

export function getCameraMovementByEmotion(emotion: string): CameraMovement[] {
  return CAMERA_MOVEMENT_LIST.filter((movement) =>
    movement.emotionalEffect.some((e) => e.includes(emotion) || emotion.includes(e))
  ).map((movement) => movement.code);
}

export function getRecommendedCameraMovement(
  context: "emotional" | "action" | "dialogue" | "establishing" | "tension"
): CameraMovement {
  const recommendations: Record<string, CameraMovement> = {
    emotional: "push",
    action: "track",
    dialogue: "static",
    establishing: "crane_up",
    tension: "zoom_in",
  };
  return recommendations[context] || "static";
}
