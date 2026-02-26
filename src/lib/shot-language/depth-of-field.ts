/**
 * 景深系统定义
 */

import type { DepthOfField, DepthOfFieldDefinition } from "./types";

export const DEPTH_OF_FIELD: Record<DepthOfField, DepthOfFieldDefinition> = {
  shallow: {
    code: "shallow",
    name: "浅景深",
    nameEn: "Shallow Depth of Field",
    description: "主体清晰，背景模糊，突出主体",
    promptSuffix: "shallow depth of field, bokeh background, blurred background, subject in focus, creamy bokeh",
    visualEffect: ["聚焦主体", "背景虚化", "梦幻", "专业", "电影感"],
  },
  deep: {
    code: "deep",
    name: "深景深",
    nameEn: "Deep Depth of Field",
    description: "前景到背景都清晰，展示完整空间",
    promptSuffix: "deep depth of field, everything in focus, sharp foreground and background, wide aperture",
    visualEffect: ["全景清晰", "空间感", "细节丰富", "环境展示", "全景深"],
  },
  rack_focus: {
    code: "rack_focus",
    name: "变焦",
    nameEn: "Rack Focus",
    description: "焦点从一个主体转移到另一个主体",
    promptSuffix: "rack focus, focus pull, shifting focus between subjects, cinematic focus change",
    visualEffect: ["焦点转移", "叙事引导", "动态", "戏剧", "电影感"],
  },
  tilt_shift: {
    code: "tilt_shift",
    name: "移轴",
    nameEn: "Tilt Shift",
    description: "特殊镜头效果，使场景看起来像微缩模型",
    promptSuffix: "tilt shift effect, miniature effect, toy town look, selective focus, miniature world",
    visualEffect: ["微缩效果", "玩具感", "艺术", "特殊", "创意"],
  },
};

export const DEPTH_OF_FIELD_LIST = Object.values(DEPTH_OF_FIELD);

export function getDepthOfFieldByCode(code: DepthOfField): DepthOfFieldDefinition {
  return DEPTH_OF_FIELD[code];
}
