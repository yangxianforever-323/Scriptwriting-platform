/**
 * Storyboard and Shot type definitions
 * For storyboard design and shot management
 */

// Shot status for image/video generation
export type ShotImageStatus = "pending" | "generating" | "completed" | "failed";
export type ShotVideoStatus = "pending" | "generating" | "completed" | "failed";

// Storyboard version
export interface Storyboard {
  id: string;
  projectId: string;
  storyId?: string;
  name: string;
  version: number;
  isActive: boolean;
  description: string;
  shotCount: number;
  createdAt: string;
  updatedAt: string;
}

// Shot (分镜)
export interface Shot {
  id: string;
  storyboardId: string;
  index: number;
  
  // Basic info
  title?: string;
  description: string;
  duration: number; // seconds
  
  // Story relationship
  storySceneId?: string;
  actId?: string;
  characterIds: string[];
  locationId?: string;
  propIds: string[];
  
  // Image generation
  imagePrompt?: string;
  imageUrl?: string;
  imageStatus: ShotImageStatus;
  imageConfirmed: boolean;
  imageVersions: string[]; // history URLs
  
  // Video generation
  videoPrompt?: string;
  videoUrl?: string;
  videoStatus: ShotVideoStatus;
  videoConfirmed: boolean;
  
  // Shot metadata (visual design)
  shotType: string;
  shotTypeName: string;
  cameraPosition?: string;
  cameraMovement?: string;
  cameraMovementName?: string;
  movementDetails?: string;
  cameraAngle?: string;
  cameraAngleName?: string;
  focalLength?: string;
  depthOfField?: string;
  depthOfFieldName?: string;
  
  // Lighting
  lightingType?: string;
  lightingName?: string;
  lightSource?: string;
  lightPosition?: string;
  lightQuality?: string;
  colorTone?: string;
  
  // Composition
  composition?: string;
  compositionName?: string;
  subjectPosition?: string;
  foreground?: string;
  background?: string;
  
  // Performance
  performanceStart?: string;
  performanceAction?: string;
  performanceEnd?: string;
  emotionCurve?: string;
  
  // Dialogue/Audio
  dialogue?: string;
  dialogueTiming?: string;
  ambientSound?: string;
  actionSound?: string;
  music?: string;
  
  // Creative
  creativeIntent?: string;
  filmReference?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Shot template for quick creation
export interface ShotTemplate {
  id: string;
  name: string;
  description: string;
  shotType: string;
  cameraMovement: string;
  lighting: string;
  composition: string;
}

// Storyboard generation request
export interface StoryboardGenerateRequest {
  storyId: string;
  shotCount: number;
  style?: string;
  useStoryScenes: boolean;
}

// Shot generation request
export interface ShotGenerateRequest {
  storyboardId: string;
  sceneDescription: string;
  style?: string;
  shotIndex: number;
}

// Batch operations
export interface BatchShotOperation {
  shotIds: string[];
  operation: "generate_image" | "generate_video" | "delete" | "update_status";
  params?: Record<string, unknown>;
}
