/**
 * Storyboard database operations
 * Local file-based storage for storyboards and shots
 */

import type { Storyboard, Shot, ShotImageStatus, ShotVideoStatus } from "@/types/storyboard";

const STORYBOARDS_KEY = "storyboards";
const SHOTS_KEY = "shots";

// Helper functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getLocalData<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setLocalData<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Storyboard operations
export const storyboardDb = {
  // Create a new storyboard
  create(projectId: string, storyboardData: Partial<Storyboard>): Storyboard {
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    const now = new Date().toISOString();

    // Deactivate other storyboards for this project
    storyboards.forEach((sb) => {
      if (sb.projectId === projectId) {
        sb.isActive = false;
      }
    });

    // Get next version number
    const projectStoryboards = storyboards.filter((sb) => sb.projectId === projectId);
    const nextVersion = projectStoryboards.length > 0 
      ? Math.max(...projectStoryboards.map((sb) => sb.version)) + 1 
      : 1;

    const storyboard: Storyboard = {
      id: generateId(),
      projectId,
      storyId: storyboardData.storyId,
      name: storyboardData.name || `版本 ${nextVersion}`,
      version: nextVersion,
      isActive: true,
      description: storyboardData.description || "",
      shotCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    storyboards.push(storyboard);
    setLocalData(STORYBOARDS_KEY, storyboards);
    return storyboard;
  },

  // Get storyboard by ID
  getById(storyboardId: string): Storyboard | null {
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    return storyboards.find((sb) => sb.id === storyboardId) || null;
  },

  // Get storyboards by project ID
  getByProjectId(projectId: string): Storyboard[] {
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    return storyboards
      .filter((sb) => sb.projectId === projectId)
      .sort((a, b) => b.version - a.version);
  },

  // Get active storyboard for project
  getActiveByProjectId(projectId: string): Storyboard | null {
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    return storyboards.find((sb) => sb.projectId === projectId && sb.isActive) || null;
  },

  // Update storyboard
  update(storyboardId: string, updates: Partial<Storyboard>): Storyboard | null {
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    const index = storyboards.findIndex((sb) => sb.id === storyboardId);
    if (index === -1) return null;

    storyboards[index] = {
      ...storyboards[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setLocalData(STORYBOARDS_KEY, storyboards);
    return storyboards[index];
  },

  // Set active storyboard
  setActive(storyboardId: string): Storyboard | null {
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    const targetIndex = storyboards.findIndex((sb) => sb.id === storyboardId);
    if (targetIndex === -1) return null;

    const projectId = storyboards[targetIndex].projectId;

    // Deactivate all storyboards for this project
    storyboards.forEach((sb) => {
      if (sb.projectId === projectId) {
        sb.isActive = false;
      }
    });

    // Activate target
    storyboards[targetIndex].isActive = true;
    storyboards[targetIndex].updatedAt = new Date().toISOString();

    setLocalData(STORYBOARDS_KEY, storyboards);
    return storyboards[targetIndex];
  },

  // Delete storyboard
  delete(storyboardId: string): boolean {
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    const filtered = storyboards.filter((sb) => sb.id !== storyboardId);
    if (filtered.length === storyboards.length) return false;
    setLocalData(STORYBOARDS_KEY, filtered);
    
    // Also delete associated shots
    const shots = getLocalData<Shot>(SHOTS_KEY);
    const filteredShots = shots.filter((s) => s.storyboardId !== storyboardId);
    setLocalData(SHOTS_KEY, filteredShots);
    
    return true;
  },

  // Duplicate storyboard
  duplicate(storyboardId: string, newName?: string): Storyboard | null {
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    const source = storyboards.find((sb) => sb.id === storyboardId);
    if (!source) return null;

    // Create new storyboard
    const newStoryboard = this.create(source.projectId, {
      name: newName || `${source.name} (复制)`,
      description: source.description,
      storyId: source.storyId,
    });

    // Copy shots
    const shots = getLocalData<Shot>(SHOTS_KEY);
    const sourceShots = shots.filter((s) => s.storyboardId === storyboardId);
    
    sourceShots.forEach((shot) => {
      shotDb.create(newStoryboard.id, {
        ...shot,
        imageUrl: undefined,
        imageStatus: "pending",
        videoUrl: undefined,
        videoStatus: "pending",
      });
    });

    return newStoryboard;
  },
};

// Shot operations
export const shotDb = {
  // Create a new shot
  create(storyboardId: string, shotData: Partial<Shot>): Shot {
    const shots = getLocalData<Shot>(SHOTS_KEY);
    const storyboardShots = shots.filter((s) => s.storyboardId === storyboardId);
    const now = new Date().toISOString();

    const shot: Shot = {
      id: generateId(),
      storyboardId,
      index: shotData.index ?? storyboardShots.length,
      title: shotData.title || `分镜 ${storyboardShots.length + 1}`,
      description: shotData.description || "",
      duration: shotData.duration ?? 6,
      storySceneId: shotData.storySceneId,
      actId: shotData.actId,
      characterIds: shotData.characterIds || [],
      locationId: shotData.locationId,
      propIds: shotData.propIds || [],
      imagePrompt: shotData.imagePrompt,
      imageUrl: shotData.imageUrl,
      imageStatus: (shotData.imageStatus as ShotImageStatus) || "pending",
      imageConfirmed: shotData.imageConfirmed ?? false,
      imageVersions: shotData.imageVersions || [],
      videoUrl: shotData.videoUrl,
      videoStatus: (shotData.videoStatus as ShotVideoStatus) || "pending",
      videoConfirmed: shotData.videoConfirmed ?? false,
      shotType: shotData.shotType || "MS",
      shotTypeName: shotData.shotTypeName || "中景",
      cameraPosition: shotData.cameraPosition,
      cameraMovement: shotData.cameraMovement,
      cameraMovementName: shotData.cameraMovementName,
      movementDetails: shotData.movementDetails,
      cameraAngle: shotData.cameraAngle,
      cameraAngleName: shotData.cameraAngleName,
      focalLength: shotData.focalLength,
      depthOfField: shotData.depthOfField,
      depthOfFieldName: shotData.depthOfFieldName,
      lightingType: shotData.lightingType,
      lightingName: shotData.lightingName,
      lightSource: shotData.lightSource,
      lightPosition: shotData.lightPosition,
      lightQuality: shotData.lightQuality,
      colorTone: shotData.colorTone,
      composition: shotData.composition,
      compositionName: shotData.compositionName,
      subjectPosition: shotData.subjectPosition,
      foreground: shotData.foreground,
      background: shotData.background,
      performanceStart: shotData.performanceStart,
      performanceAction: shotData.performanceAction,
      performanceEnd: shotData.performanceEnd,
      emotionCurve: shotData.emotionCurve,
      dialogue: shotData.dialogue,
      dialogueTiming: shotData.dialogueTiming,
      ambientSound: shotData.ambientSound,
      actionSound: shotData.actionSound,
      music: shotData.music,
      creativeIntent: shotData.creativeIntent,
      filmReference: shotData.filmReference,
      createdAt: now,
      updatedAt: now,
    };

    shots.push(shot);
    setLocalData(SHOTS_KEY, shots);

    // Update storyboard shot count
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    const sbIndex = storyboards.findIndex((sb) => sb.id === storyboardId);
    if (sbIndex !== -1) {
      storyboards[sbIndex].shotCount = shots.filter((s) => s.storyboardId === storyboardId).length;
      storyboards[sbIndex].updatedAt = now;
      setLocalData(STORYBOARDS_KEY, storyboards);
    }

    return shot;
  },

  // Get shots by storyboard ID
  getByStoryboardId(storyboardId: string): Shot[] {
    const shots = getLocalData<Shot>(SHOTS_KEY);
    return shots
      .filter((s) => s.storyboardId === storyboardId)
      .sort((a, b) => a.index - b.index);
  },

  // Get shot by ID
  getById(shotId: string): Shot | null {
    const shots = getLocalData<Shot>(SHOTS_KEY);
    return shots.find((s) => s.id === shotId) || null;
  },

  // Update shot
  update(shotId: string, updates: Partial<Shot>): Shot | null {
    const shots = getLocalData<Shot>(SHOTS_KEY);
    const index = shots.findIndex((s) => s.id === shotId);
    if (index === -1) return null;

    shots[index] = {
      ...shots[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setLocalData(SHOTS_KEY, shots);
    return shots[index];
  },

  // Delete shot
  delete(shotId: string): boolean {
    const shots = getLocalData<Shot>(SHOTS_KEY);
    const shot = shots.find((s) => s.id === shotId);
    if (!shot) return false;

    const filtered = shots.filter((s) => s.id !== shotId);
    setLocalData(SHOTS_KEY, filtered);

    // Reorder remaining shots
    const remainingShots = filtered.filter((s) => s.storyboardId === shot.storyboardId);
    remainingShots.forEach((s, idx) => {
      s.index = idx;
    });
    setLocalData(SHOTS_KEY, filtered);

    // Update storyboard shot count
    const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
    const sbIndex = storyboards.findIndex((sb) => sb.id === shot.storyboardId);
    if (sbIndex !== -1) {
      storyboards[sbIndex].shotCount = remainingShots.length;
      storyboards[sbIndex].updatedAt = new Date().toISOString();
      setLocalData(STORYBOARDS_KEY, storyboards);
    }

    return true;
  },

  // Reorder shots
  reorder(storyboardId: string, shotIds: string[]): boolean {
    const shots = getLocalData<Shot>(SHOTS_KEY);
    let updated = false;

    shotIds.forEach((id, index) => {
      const shotIndex = shots.findIndex((s) => s.id === id && s.storyboardId === storyboardId);
      if (shotIndex !== -1) {
        shots[shotIndex].index = index;
        shots[shotIndex].updatedAt = new Date().toISOString();
        updated = true;
      }
    });

    if (updated) {
      setLocalData(SHOTS_KEY, shots);
    }
    return updated;
  },

  // Batch delete
  batchDelete(shotIds: string[]): number {
    const shots = getLocalData<Shot>(SHOTS_KEY);
    const filtered = shots.filter((s) => !shotIds.includes(s.id));
    const deletedCount = shots.length - filtered.length;
    
    if (deletedCount > 0) {
      setLocalData(SHOTS_KEY, filtered);
      
      // Update storyboard shot counts
      const storyboards = getLocalData<Storyboard>(STORYBOARDS_KEY);
      storyboards.forEach((sb) => {
        sb.shotCount = filtered.filter((s) => s.storyboardId === sb.id).length;
        sb.updatedAt = new Date().toISOString();
      });
      setLocalData(STORYBOARDS_KEY, storyboards);
    }
    
    return deletedCount;
  },
};
