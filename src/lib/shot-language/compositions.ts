/**
 * 构图系统定义
 * 专业影视构图分类与Prompt映射
 */

import type { CompositionType, CompositionDefinition } from "./types";

export const COMPOSITIONS: Record<CompositionType, CompositionDefinition> = {
  rule_of_thirds: {
    code: "rule_of_thirds",
    name: "三分法构图",
    nameEn: "Rule of Thirds",
    description: "将画面分为九等份，主体放置在交叉点或线条上，最经典的构图方式",
    promptSuffix: "rule of thirds composition, subject at intersection, balanced framing, classic composition",
    visualGuide: "画面分为3x3网格，主体放在交叉点",
    emotionalEffect: ["平衡", "和谐", "自然", "专业", "经典"],
    useCases: ["人像摄影", "风景摄影", "通用构图", "初学者友好"],
  },
  golden_ratio: {
    code: "golden_ratio",
    name: "黄金分割构图",
    nameEn: "Golden Ratio / Fibonacci",
    description: "基于黄金比例(1:1.618)的构图，更具艺术感和自然美感",
    promptSuffix: "golden ratio composition, Fibonacci spiral, divine proportion, artistic framing, natural balance",
    visualGuide: "黄金螺旋线引导视线",
    emotionalEffect: ["艺术", "自然", "和谐", "高级", "美感"],
    useCases: ["艺术摄影", "自然风景", "人像艺术", "高级构图"],
  },
  symmetry: {
    code: "symmetry",
    name: "对称构图",
    nameEn: "Symmetry",
    description: "画面左右或上下对称，制造庄重、正式或超现实感",
    promptSuffix: "symmetrical composition, perfect symmetry, centered subject, mirror image, balanced frame",
    visualGuide: "画面中心为对称轴",
    emotionalEffect: ["庄重", "正式", "稳定", "超现实", "仪式感"],
    useCases: ["建筑摄影", "仪式场景", "超现实艺术", "正式场合"],
  },
  center: {
    code: "center",
    name: "中心构图",
    nameEn: "Center Composition",
    description: "主体位于画面正中央，强调重要性和聚焦感",
    promptSuffix: "center composition, centered subject, symmetrical framing, focus on center, dominant subject",
    visualGuide: "主体位于画面正中央",
    emotionalEffect: ["聚焦", "重要", "权威", "力量", "强调"],
    useCases: ["人物特写", "产品展示", "英雄镜头", "强调主体"],
  },
  leading_lines: {
    code: "leading_lines",
    name: "引导线构图",
    nameEn: "Leading Lines",
    description: "利用线条引导视线指向主体，增强画面深度和动感",
    promptSuffix: "leading lines composition, lines directing to subject, depth perspective, visual flow, converging lines",
    visualGuide: "线条从边缘指向主体",
    emotionalEffect: ["深度", "引导", "动感", "方向", "空间"],
    useCases: ["道路摄影", "建筑摄影", "风景摄影", "深度表达"],
  },
  frame_in_frame: {
    code: "frame_in_frame",
    name: "框架构图",
    nameEn: "Frame within Frame",
    description: "利用前景元素形成框架，突出主体并增加层次感",
    promptSuffix: "frame within frame, natural frame, doorway shot, window framing, layered composition",
    visualGuide: "前景元素形成框架包围主体",
    emotionalEffect: ["层次", "聚焦", "窥视", "深度", "故事"],
    useCases: ["门窗构图", "自然框架", "层次表达", "故事感"],
  },
  diagonal: {
    code: "diagonal",
    name: "对角线构图",
    nameEn: "Diagonal Composition",
    description: "主体沿对角线排列，制造动感和紧张感",
    promptSuffix: "diagonal composition, dynamic angle, diagonal lines, tension, dynamic framing",
    visualGuide: "主体沿对角线方向排列",
    emotionalEffect: ["动感", "紧张", "活力", "冲突", "戏剧"],
    useCases: ["动作场面", "冲突场景", "动感表达", "戏剧效果"],
  },
  triangle: {
    code: "triangle",
    name: "三角形构图",
    nameEn: "Triangle Composition",
    description: "主体形成三角形排列，稳定而有层次",
    promptSuffix: "triangle composition, triangular arrangement, stable composition, layered subjects",
    visualGuide: "三个主体形成三角形",
    emotionalEffect: ["稳定", "层次", "和谐", "完整", "群体"],
    useCases: ["群体合影", "三人对话", "稳定构图", "层次表达"],
  },
  negative_space: {
    code: "negative_space",
    name: "留白构图",
    nameEn: "Negative Space",
    description: "大面积空白区域，强调主体并制造意境",
    promptSuffix: "negative space, minimalist composition, empty space, isolated subject, artistic minimalism",
    visualGuide: "大面积空白，主体很小",
    emotionalEffect: ["孤独", "意境", "简约", "思考", "艺术"],
    useCases: ["艺术摄影", "孤独表达", "意境营造", "极简风格"],
  },
  fill_frame: {
    code: "fill_frame",
    name: "填充构图",
    nameEn: "Fill the Frame",
    description: "主体填满整个画面，强调细节和冲击力",
    promptSuffix: "fill the frame, subject fills entire frame, no background, close-up detail, impactful",
    visualGuide: "主体填满整个画面",
    emotionalEffect: ["冲击", "细节", "强调", "专注", "强烈"],
    useCases: ["特写镜头", "细节展示", "冲击力", "产品摄影"],
  },
  depth_layers: {
    code: "depth_layers",
    name: "景深层次构图",
    nameEn: "Depth Layers",
    description: "前景、中景、背景层次分明，增强空间深度",
    promptSuffix: "depth layers, foreground midground background, layered composition, deep space, cinematic depth",
    visualGuide: "前景、中景、背景三层分明",
    emotionalEffect: ["深度", "空间", "层次", "电影感", "立体"],
    useCases: ["电影场景", "风景摄影", "空间表达", "层次构图"],
  },
  silhouette: {
    code: "silhouette",
    name: "剪影构图",
    nameEn: "Silhouette",
    description: "主体呈剪影状，强调轮廓和意境",
    promptSuffix: "silhouette composition, backlit subject, dark outline, dramatic lighting, contour emphasis",
    visualGuide: "逆光拍摄，主体呈黑色剪影",
    emotionalEffect: ["神秘", "意境", "艺术", "戏剧", "情感"],
    useCases: ["日落场景", "艺术摄影", "情感表达", "戏剧效果"],
  },
};

export const COMPOSITION_LIST = Object.values(COMPOSITIONS);

export function getCompositionByCode(code: CompositionType): CompositionDefinition {
  return COMPOSITIONS[code];
}

export function getCompositionByEmotion(emotion: string): CompositionType[] {
  return COMPOSITION_LIST.filter((comp) =>
    comp.emotionalEffect.some((e) => e.includes(emotion) || emotion.includes(e))
  ).map((comp) => comp.code);
}

export function getRecommendedComposition(
  context: "portrait" | "landscape" | "action" | "artistic" | "dramatic"
): CompositionType {
  const recommendations: Record<string, CompositionType> = {
    portrait: "rule_of_thirds",
    landscape: "leading_lines",
    action: "diagonal",
    artistic: "golden_ratio",
    dramatic: "silhouette",
  };
  return recommendations[context] || "rule_of_thirds";
}
