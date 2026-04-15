/**
 * Story-related type definitions
 * For story development, characters, locations, and props
 */

// Story structure types
export type StoryStructure = "three-act" | "five-act" | "serial" | "hero-journey";

export interface Story {
  id: string;
  projectId: string;
  title: string;
  logline: string;
  synopsis: string;
  structure: StoryStructure;
  theme: string;
  tone: string;
  genre: string;
  targetDuration: number;
  acts: Act[];
  characters: Character[];
  locations: Location[];
  props: Prop[];
  createdAt: string;
  updatedAt: string;
}

// Act / Chapter
export interface Act {
  id: string;
  storyId: string;
  index: number;
  title: string;
  description: string;
  goal: string;
  conflict: string;
  resolution: string;
  scenes: StoryScene[];
}

// Story Scene (script scene)
export interface StoryScene {
  id: string;
  actId: string;
  index: number;
  title: string;
  description: string;
  locationId?: string;
  characterIds: string[];
  propIds: string[];
  timeOfDay: string;
  weather: string;
  mood: string;
  dialogue?: string;
  notes: string;
}

// Character Image Types for multi-type image storage
export type CharacterImageType = "portrait" | "fullbody" | "combo" | "fullbody-threeview" | "closeup-threeview";

export interface CharacterTypeImages {
  portrait?: string;           // 肖像图
  fullbody?: string;           // 全身图
  combo?: string;              // 组合图
  "fullbody-threeview"?: string;  // 全身三视图
  "closeup-threeview"?: string;   // 特写三视图
}

export type CharacterRole = "protagonist" | "antagonist" | "supporting" | "minor";

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: CharacterRole;
  age: string;
  gender: string;
  appearance: string;
  personality: string;
  background: string;
  motivation: string;
  arc: string;
  referenceImages: string[];
  typeImages?: CharacterTypeImages;  // 多类型图片
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Location View Types for multi-angle image storage
export type LocationViewType = "wide" | "medium" | "closeup" | "aerial";

export interface LocationViewImages {
  wide?: string;      // 广角全景
  medium?: string;    // 中景构图
  closeup?: string;   // 特写细节
  aerial?: string;    // 俯视/仰视
}

export type LocationType = "interior" | "exterior" | "both";

export interface Location {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: LocationType;
  atmosphere: string;
  keyFeatures: string[];
  referenceImages: string[];
  viewImages?: LocationViewImages;  // 多视角图片
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Prop
export type PropImportance = "key" | "supporting" | "background";

export interface Prop {
  id: string;
  projectId: string;
  name: string;
  description: string;
  importance: PropImportance;
  referenceImages: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Story generation request
export interface StoryGenerateRequest {
  logline: string;
  structure: StoryStructure;
  genre: string;
  targetDuration: number;
}

// Character generation request
export interface CharacterGenerateRequest {
  storyContext: string;
  role: CharacterRole;
  count?: number;
}

// Scene generation request
export interface SceneGenerateRequest {
  actDescription: string;
  characters: string[];
  location?: string;
  mood: string;
}
