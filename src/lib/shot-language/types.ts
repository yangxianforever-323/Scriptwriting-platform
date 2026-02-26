/**
 * 镜头语言类型定义
 * 专业影视镜头语言系统
 */

// ============================================
// 景别类型 (Shot Types)
// ============================================

export type ShotType =
  | "ELS"   // Extreme Long Shot - 极远景
  | "LS"    // Long Shot - 远景
  | "FS"    // Full Shot - 全景
  | "MS"    // Medium Shot - 中景
  | "MCU"   // Medium Close-Up - 中近景
  | "CU"    // Close-Up - 特写
  | "ECU";  // Extreme Close-Up - 极特写

export interface ShotTypeDefinition {
  code: ShotType;
  name: string;
  nameEn: string;
  description: string;
  promptSuffix: string;
  aspectRatio: string;
  typicalDuration: number;
  emotionalEffect: string[];
  useCases: string[];
}

// ============================================
// 运镜类型 (Camera Movements)
// ============================================

export type CameraMovement =
  | "static"      // 静止
  | "push"        // 推镜头
  | "pull"        // 拉镜头
  | "pan_left"    // 左摇
  | "pan_right"   // 右摇
  | "tilt_up"     // 上仰
  | "tilt_down"   // 下俯
  | "track"       // 移动镜头
  | "dolly"       // 推轨镜头
  | "crane_up"    // 升降上升
  | "crane_down"  // 升降下降
  | "orbit"       // 环绕
  | "handheld"    // 手持
  | "steadicam"   // 稳定器
  | "zoom_in"     // 变焦推
  | "zoom_out";   // 变焦拉

export interface CameraMovementDefinition {
  code: CameraMovement;
  name: string;
  nameEn: string;
  description: string;
  promptSuffix: string;
  videoPrompt: string;
  typicalDuration: number;
  speed: "slow" | "medium" | "fast";
  emotionalEffect: string[];
  useCases: string[];
}

// ============================================
// 构图类型 (Compositions)
// ============================================

export type CompositionType =
  | "rule_of_thirds"     // 三分法
  | "golden_ratio"       // 黄金分割
  | "symmetry"           // 对称构图
  | "center"             // 中心构图
  | "leading_lines"      // 引导线
  | "frame_in_frame"     // 框架构图
  | "diagonal"           // 对角线构图
  | "triangle"           // 三角形构图
  | "negative_space"     // 留白构图
  | "fill_frame"         // 填充构图
  | "depth_layers"       // 景深层次
  | "silhouette";        // 剪影构图

export interface CompositionDefinition {
  code: CompositionType;
  name: string;
  nameEn: string;
  description: string;
  promptSuffix: string;
  visualGuide: string;
  emotionalEffect: string[];
  useCases: string[];
}

// ============================================
// 光影类型 (Lighting)
// ============================================

export type LightingType =
  | "natural"        // 自然光
  | "golden_hour"    // 黄金时刻
  | "blue_hour"      // 蓝调时刻
  | "high_key"       // 高调光
  | "low_key"        // 低调光
  | "rim"            // 轮廓光
  | "backlight"      // 逆光
  | "side_light"     // 侧光
  | "dramatic"       // 戏剧性光
  | "soft"           // 柔光
  | "hard"           // 硬光
  | "neon"           // 霓虹光
  | "candlelight"    // 烛光
  | "moonlight";     // 月光

export interface LightingDefinition {
  code: LightingType;
  name: string;
  nameEn: string;
  description: string;
  promptSuffix: string;
  moodEffect: string[];
  useCases: string[];
}

// ============================================
// 镜头角度 (Camera Angles)
// ============================================

export type CameraAngle =
  | "eye_level"      // 平视
  | "high_angle"     // 俯拍
  | "low_angle"      // 仰拍
  | "dutch_angle"    // 荷兰角/倾斜
  | "birds_eye"      // 鸟瞰
  | "worms_eye"      // 虫视
  | "over_shoulder"; // 过肩镜头

export interface CameraAngleDefinition {
  code: CameraAngle;
  name: string;
  nameEn: string;
  description: string;
  promptSuffix: string;
  emotionalEffect: string[];
  useCases: string[];
}

// ============================================
// 景深类型 (Depth of Field)
// ============================================

export type DepthOfField =
  | "shallow"        // 浅景深
  | "deep"           // 深景深
  | "rack_focus"     // 变焦
  | "tilt_shift";    // 移轴

export interface DepthOfFieldDefinition {
  code: DepthOfField;
  name: string;
  nameEn: string;
  description: string;
  promptSuffix: string;
  visualEffect: string[];
}

// ============================================
// 转场类型 (Transitions)
// ============================================

export type TransitionType =
  | "cut"            // 切
  | "fade_in"        // 淡入
  | "fade_out"       // 淡出
  | "dissolve"       // 叠化
  | "wipe"           // 划变
  | "iris"           // 圈入圈出
  | "match_cut"      // 匹配剪辑
  | "jump_cut"       // 跳跃剪辑
  | "cross_cut"      // 交叉剪辑
  | "L_cut"          // L切
  | "J_cut";         // J切

export interface TransitionDefinition {
  code: TransitionType;
  name: string;
  nameEn: string;
  description: string;
  promptSuffix: string;
  useCases: string[];
}

// ============================================
// 完整镜头配置 (Shot Configuration)
// ============================================

export interface ShotConfiguration {
  shotType: ShotType;
  cameraMovement: CameraMovement;
  composition: CompositionType;
  lighting: LightingType;
  cameraAngle: CameraAngle;
  depthOfField: DepthOfField;
  duration: number;
  transition?: TransitionType;
}

// ============================================
// 镜头分析结果 (Shot Analysis)
// ============================================

export interface ShotAnalysis {
  suggestedShotType: ShotType;
  suggestedCameraMovement: CameraMovement;
  suggestedComposition: CompositionType;
  suggestedLighting: LightingType;
  suggestedCameraAngle: CameraAngle;
  suggestedDepthOfField: DepthOfField;
  reasoning: string;
  alternativeOptions: Partial<ShotConfiguration>[];
}

// ============================================
// Prompt生成结果
// ============================================

export interface GeneratedPrompt {
  imagePrompt: string;
  videoPrompt: string;
  negativePrompt: string;
  parameters: {
    aspectRatio: string;
    duration: number;
    style: string;
  };
}

// ============================================
// 场景描述输入
// ============================================

export interface SceneDescriptionInput {
  description: string;
  mood?: string;
  style?: string;
  characterCount?: number;
  location?: "indoor" | "outdoor" | "studio";
  timeOfDay?: "dawn" | "morning" | "noon" | "afternoon" | "dusk" | "night";
  weather?: "sunny" | "cloudy" | "rainy" | "snowy" | "foggy" | "stormy";
  customRequirements?: string;
}
