/**
 * Database types for Supabase.
 * These types are generated from the database schema.
 * Run `npx supabase gen types typescript --project-id your-project-id > src/types/database.ts` to regenerate.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          story: string | null;
          style: string | null;
          shot_count: number;
          stage: project_stage;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          story?: string | null;
          style?: string | null;
          shot_count?: number;
          stage?: project_stage;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          story?: string | null;
          style?: string | null;
          shot_count?: number;
          stage?: project_stage;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      scenes: {
        Row: SceneRow;
        Insert: SceneInsertType;
        Update: SceneUpdateType;
        Relationships: [
          {
            foreignKeyName: "scenes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      images: {
        Row: {
          id: string;
          scene_id: string;
          storage_path: string;
          url: string;
          width: number | null;
          height: number | null;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          scene_id: string;
          storage_path: string;
          url: string;
          width?: number | null;
          height?: number | null;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          scene_id?: string;
          storage_path?: string;
          url?: string;
          width?: number | null;
          height?: number | null;
          version?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "images_scene_id_fkey";
            columns: ["scene_id"];
            isOneToOne: false;
            referencedRelation: "scenes";
            referencedColumns: ["id"];
          },
        ];
      };
      videos: {
        Row: {
          id: string;
          scene_id: string;
          storage_path: string;
          url: string;
          duration: number | null;
          task_id: string | null;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          scene_id: string;
          storage_path: string;
          url: string;
          duration?: number | null;
          task_id?: string | null;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          scene_id?: string;
          storage_path?: string;
          url?: string;
          duration?: number | null;
          task_id?: string | null;
          version?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "videos_scene_id_fkey";
            columns: ["scene_id"];
            isOneToOne: false;
            referencedRelation: "scenes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      project_stage: project_stage;
      image_status: image_status;
      video_status: video_status;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type project_stage = "draft" | "scenes" | "images" | "videos" | "completed";
export type image_status = "pending" | "processing" | "completed" | "failed";
export type video_status = "pending" | "processing" | "completed" | "failed";

// Scene type definitions (simplified for local storage)
interface SceneBase {
  id: string;
  project_id: string;
  order_index: number;
  description: string;
  description_confirmed: boolean;
  image_status: image_status;
  image_confirmed: boolean;
  video_status: video_status;
  video_confirmed: boolean;
  created_at: string;
  // Basic info
  duration_seconds: number | null;
  location: string | null;
  time_weather: string | null;
  
  // ============================================
  // 1. Image Generation (For NanoBananaPro)
  // ============================================
  image_prompt: string | null;
  
  // ============================================
  // 2. Video Generation Script (For 4-10s Video)
  // ============================================
  
  // 2.1 Visual Design
  shot_type: string | null;
  shot_type_name: string | null;
  camera_position: string | null;
  camera_movement: string | null;
  camera_movement_name: string | null;
  movement_details: string | null;
  camera_angle: string | null;
  camera_angle_name: string | null;
  focal_length: string | null;
  depth_of_field: string | null;
  depth_of_field_name: string | null;
  
  // 2.2 Lighting
  lighting_type: string | null;
  lighting_name: string | null;
  light_source: string | null;
  light_position: string | null;
  light_quality: string | null;
  color_tone: string | null;
  
  // 2.3 Composition
  composition: string | null;
  composition_name: string | null;
  subject_position: string | null;
  foreground: string | null;
  background: string | null;
  
  // 2.4 Character Performance (Keyframes - Full Video Content)
  performance_start: string | null;
  performance_action: string | null;
  performance_end: string | null;
  emotion_curve: string | null;
  facial_expression: string | null;
  eye_direction: string | null;
  body_language: string | null;
  interaction_with_environment: string | null;
  
  // 2.5 Dialogue
  dialogue: string | null;
  dialogue_tone: string | null;
  voice_type: string | null;
  dialogue_timing: string | null;
  
  // 2.6 Sound Design
  ambient_sound: string | null;
  action_sound: string | null;
  special_sound: string | null;
  music: string | null;
  music_mood: string | null;
  sound_timing: string | null;
  
  // 2.7 VFX/Post
  vfx: string | null;
  color_grading: string | null;
  speed_effect: string | null;
  transition: string | null;
  
  // ============================================
  // 3. Creative Notes
  // ============================================
  creative_intent: string | null;
  narrative_function: string | null;
  film_reference: string | null;
  director_notes: string | null;
  
  // ============================================
  // 4. Legacy (deprecated)
  // ============================================
  prompt_text: string | null;
  performance: string | null;
  performance_rhythm: string | null;
}

export type SceneRow = SceneBase;
export type SceneInsertType = Omit<SceneBase, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
export type SceneUpdateType = Partial<SceneBase>;

export type Scene = SceneRow;

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type Image = Database["public"]["Tables"]["images"]["Row"];
export type ImageInsert = Database["public"]["Tables"]["images"]["Insert"];
export type ImageUpdate = Database["public"]["Tables"]["images"]["Update"];

export type Video = Database["public"]["Tables"]["videos"]["Row"];
export type VideoInsert = Database["public"]["Tables"]["videos"]["Insert"];
export type VideoUpdate = Database["public"]["Tables"]["videos"]["Update"];

export type SceneWithMedia = Scene & {
  images: Image[];
  videos: Video[];
};

export type ProjectWithScenes = Project & {
  scenes: SceneWithMedia[];
};
