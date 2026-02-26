/**
 * AI-related type definitions.
 * Types for DeepSeek AI and Volcano Engine APIs.
 */

// ============================================
// DeepSeek AI Types (OpenAI Compatible)
// ============================================

export interface DeepSeekChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekChatCompletionRequest {
  model: string;
  messages: DeepSeekChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface DeepSeekChatCompletionChoice {
  index: number;
  finish_reason: string;
  message: {
    role: string;
    content: string;
  };
}

export interface DeepSeekChatCompletionResponse {
  id: string;
  created: number;
  model: string;
  choices: DeepSeekChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DeepSeekError {
  code: string;
  message: string;
}

// ============================================
// Story to Scenes Types
// ============================================

export interface SceneDescription {
  order_index: number;
  description: string;
  
  // 基础信息
  duration_seconds?: number;
  location?: string;
  time_weather?: string;
  
  // ============================================
  // 1. 图片生成描述 (For NanoBananaPro Grid Storyboard)
  // ============================================
  /** 精简的英文 Prompt，用于 AI 图片生成 (20-30词，遵循 Skill 规范) */
  image_prompt?: string;
  
  // ============================================
  // 2. 视频生成分镜脚本 (For 4-10s Video Generation)
  // ============================================
  
  // 2.1 画面设计
  shot_type?: string;
  shot_type_name?: string;
  camera_position?: string;
  camera_movement?: string;
  camera_movement_name?: string;
  movement_details?: string;
  camera_angle?: string;
  camera_angle_name?: string;
  focal_length?: string;
  depth_of_field?: string;
  depth_of_field_name?: string;
  
  // 2.2 光影设计
  lighting_type?: string;
  lighting_name?: string;
  light_source?: string;
  light_position?: string;
  light_quality?: string;
  color_tone?: string;
  
  // 2.3 构图设计
  composition?: string;
  composition_name?: string;
  subject_position?: string;
  foreground?: string;
  background?: string;
  
  // 2.4 角色表演 (关键帧描述 - 包含完整视频内容)
  /** 角色起始状态（0秒时的姿态、表情、位置） */
  performance_start?: string;
  /** 角色动作过程（详细描述：包含时间点标记、镜头运动、人物动作、对白时机、情绪转折、环境互动等） */
  performance_action?: string;
  /** 角色结束状态（最后帧的姿态、表情、位置） */
  performance_end?: string;
  /** 情绪变化曲线（标注时间点，如：专注(0-1秒)→震惊(1-2秒)→恐惧(2-6秒)） */
  emotion_curve?: string;
  /** 表情细节（微表情描述） */
  facial_expression?: string;
  /** 眼神方向 */
  eye_direction?: string;
  /** 肢体语言（手势、姿态、动作幅度） */
  body_language?: string;
  /** 与环境的互动（触碰物体、空间移动等） */
  interaction_with_environment?: string;
  
  // 2.5 对白/旁白
  /** 对白内容 */
  dialogue?: string;
  /** 语气语调 */
  dialogue_tone?: string;
  /** 说话方式 */
  voice_type?: string;
  /** 对白时间点 (如: 0-2秒) */
  dialogue_timing?: string;
  
  // 2.6 音效设计
  /** 环境音 */
  ambient_sound?: string;
  /** 动作音效 */
  action_sound?: string;
  /** 特殊音效 */
  special_sound?: string;
  /** 背景音乐 */
  music?: string;
  /** 音乐情绪 */
  music_mood?: string;
  /** 音效时间点 */
  sound_timing?: string;
  
  // 2.7 特效/后期
  vfx?: string;
  color_grading?: string;
  speed_effect?: string;
  transition?: string;
  
  // ============================================
  // 3. 创意说明
  // ============================================
  /** 镜头意图 */
  creative_intent?: string;
  /** 叙事功能 */
  narrative_function?: string;
  /** 参考影片 */
  film_reference?: string;
  /** 导演备注 */
  director_notes?: string;
  
  // ============================================
  // 4. 兼容旧版本 (deprecated)
  // ============================================
  prompt_text?: string;
  performance?: string;
  performance_rhythm?: string;
  dialogue_tone?: string;
  
  // 内部使用
  _wordCountWarning?: number;
}

export interface StoryToScenesResult {
  scenes: SceneDescription[];
}

// ============================================
// Volcano Engine Image Generation Types
// ============================================

export interface VolcImageGenerationRequest {
  req_key: string;
  prompt: string;
  negative_prompt?: string;
  style?: string;
  width?: number;
  height?: number;
  seed?: number;
  guidance_scale?: number;
  scheduler?: string;
}

export interface VolcImageGenerationResponse {
  code: number;
  message: string;
  data: {
    binary_data_base64: string[];
    seed?: number;
  };
  status?: string;
  time_usage?: {
    total_time: number;
  };
}

export interface VolcImageError {
  code: number;
  message: string;
}

// ============================================
// Volcano Engine Video Generation Types
// ============================================

export interface VolcVideoGenerationRequest {
  req_key: string;
  prompt?: string;
  image_url?: string;
  negative_prompt?: string;
  seed?: number;
  duration?: number;
}

export interface VolcVideoTaskResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    status: string;
  };
}

export interface VolcVideoTaskStatusResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress?: number;
    video_url?: string;
    error_message?: string;
  };
}

export interface VolcVideoError {
  code: number;
  message: string;
}

// ============================================
// API Configuration Types
// ============================================

export interface AIConfig {
  deepseek: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  volcano: {
    apiKey: string;
    baseUrl: string;
  };
}

// ============================================
// Style Types
// ============================================

export type VideoStyle =
  | "realistic"
  | "anime"
  | "cartoon"
  | "cinematic"
  | "watercolor"
  | "oil_painting"
  | "sketch"
  | "cyberpunk"
  | "fantasy"
  | "scifi";

export interface StyleOption {
  id: VideoStyle;
  name: string;
  description: string;
  prompt_suffix: string;
}

export interface ZhipuChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ZhipuChatCompletionChoice {
  index: number;
  finish_reason: string;
  message: {
    role: string;
    content: string;
  };
}

export interface ZhipuChatCompletionResponse {
  id: string;
  created: number;
  model: string;
  choices: ZhipuChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
