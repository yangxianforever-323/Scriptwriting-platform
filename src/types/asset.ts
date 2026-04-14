/**
 * Asset Library type definitions
 * Used for managing all project media assets (images, videos, references)
 */

// Asset category - what this asset represents in the production pipeline
export type AssetCategory =
  | "style_reference"   // 参考风格 - style reference images
  | "character"         // 角色库 - character design images
  | "location"          // 场景地点库 - location/scene reference images
  | "prop"              // 道具库 - prop reference images
  | "generated_image"   // 生成图片库 - AI generated storyboard images
  | "generated_video";  // 生成视频库 - AI generated video clips

// Where the asset came from
export type AssetSource = "uploaded" | "ai_generated";

// Media file type
export type AssetMediaType = "image" | "video";

// Entity type that an asset can be linked to
export type AssetLinkedEntityType = "character" | "location" | "prop" | "shot" | "storyboard" | "project";

export interface Asset {
  id: string;
  projectId: string;
  category: AssetCategory;
  mediaType: AssetMediaType;
  source: AssetSource;

  // File information
  filename: string;
  storagePath: string;   // relative path under public/uploads/
  url: string;           // full accessible URL (/uploads/...)
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number; // for video assets

  // Metadata
  name: string;
  description: string;
  tags: string[];

  // Entity relationship (optional)
  linkedEntityId?: string;
  linkedEntityType?: AssetLinkedEntityType;
  projectStage?: string; // which stage this was generated in

  // AI generation info (only when source === "ai_generated")
  generationPrompt?: string;
  generationModel?: string;

  // Version tracking
  version: number;
  parentAssetId?: string; // points to previous version when regenerated

  createdAt: string;
  updatedAt: string;
}

// Filter options for querying assets
export interface AssetFilter {
  category?: AssetCategory;
  mediaType?: AssetMediaType;
  source?: AssetSource;
  tags?: string[];
  linkedEntityId?: string;
  search?: string;
}

// Request to upload a new asset
export interface AssetUploadRequest {
  projectId: string;
  category: AssetCategory;
  name: string;
  description?: string;
  tags?: string[];
  linkedEntityId?: string;
  linkedEntityType?: AssetLinkedEntityType;
}

// Category display metadata
export interface AssetCategoryMeta {
  key: AssetCategory;
  label: string;
  description: string;
  icon: string;
  acceptedTypes: string[]; // MIME types
}

export const ASSET_CATEGORY_META: Record<AssetCategory, AssetCategoryMeta> = {
  style_reference: {
    key: "style_reference",
    label: "参考风格",
    description: "影片风格参考图，用于指导整体视觉方向",
    icon: "🎨",
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  character: {
    key: "character",
    label: "角色库",
    description: "角色设定图、多视角图、表情图",
    icon: "👤",
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  location: {
    key: "location",
    label: "场景地点",
    description: "拍摄地点参考图、概念图",
    icon: "🏛️",
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  prop: {
    key: "prop",
    label: "道具库",
    description: "道具参考图、细节图",
    icon: "🔧",
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  generated_image: {
    key: "generated_image",
    label: "生成图片",
    description: "AI 生成的分镜图片",
    icon: "🖼️",
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  generated_video: {
    key: "generated_video",
    label: "生成视频",
    description: "AI 生成的视频片段",
    icon: "🎬",
    acceptedTypes: ["video/mp4", "video/webm"],
  },
};
