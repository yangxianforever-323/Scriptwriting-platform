/**
 * Story database operations
 * Local file-based storage for story, acts, scenes, characters, locations, props
 */

import type {
  Story,
  Act,
  StoryScene,
  Character,
  Location,
  Prop,
  StoryStructure,
} from "@/types/story";

const STORIES_KEY = "stories";
const ACTS_KEY = "acts";
const SCENES_KEY = "story_scenes";
const CHARACTERS_KEY = "characters";
const LOCATIONS_KEY = "locations";
const PROPS_KEY = "props";

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

// Story operations
export const storyDb = {
  // Create a new story
  create(projectId: string, storyData: Partial<Story>): Story {
    const stories = getLocalData<Story>(STORIES_KEY);
    const now = new Date().toISOString();

    const story: Story = {
      id: generateId(),
      projectId,
      title: storyData.title || "",
      logline: storyData.logline || "",
      synopsis: storyData.synopsis || "",
      structure: storyData.structure || "three-act",
      theme: storyData.theme || "",
      tone: storyData.tone || "",
      genre: storyData.genre || "",
      targetDuration: storyData.targetDuration || 60,
      acts: [],
      characters: [],
      locations: [],
      props: [],
      createdAt: now,
      updatedAt: now,
    };

    stories.push(story);
    setLocalData(STORIES_KEY, stories);
    return story;
  },

  // Get story by ID
  getById(storyId: string): Story | null {
    const stories = getLocalData<Story>(STORIES_KEY);
    return stories.find((s) => s.id === storyId) || null;
  },

  // Get story by project ID
  getByProjectId(projectId: string): Story | null {
    const stories = getLocalData<Story>(STORIES_KEY);
    return stories.find((s) => s.projectId === projectId) || null;
  },

  // Update story
  update(storyId: string, updates: Partial<Story>): Story | null {
    const stories = getLocalData<Story>(STORIES_KEY);
    const index = stories.findIndex((s) => s.id === storyId);
    if (index === -1) return null;

    stories[index] = {
      ...stories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setLocalData(STORIES_KEY, stories);
    return stories[index];
  },

  // Delete story
  delete(storyId: string): boolean {
    const stories = getLocalData<Story>(STORIES_KEY);
    const filtered = stories.filter((s) => s.id !== storyId);
    if (filtered.length === stories.length) return false;
    setLocalData(STORIES_KEY, filtered);
    return true;
  },
};

// Act operations
export const actDb = {
  create(storyId: string, actData: Partial<Act>): Act {
    const acts = getLocalData<Act>(ACTS_KEY);
    const storyActs = acts.filter((a) => a.storyId === storyId);

    const act: Act = {
      id: generateId(),
      storyId,
      index: actData.index ?? storyActs.length,
      title: actData.title || `第${storyActs.length + 1}幕`,
      description: actData.description || "",
      goal: actData.goal || "",
      conflict: actData.conflict || "",
      resolution: actData.resolution || "",
      scenes: [],
    };

    acts.push(act);
    setLocalData(ACTS_KEY, acts);
    return act;
  },

  getByStoryId(storyId: string): Act[] {
    const acts = getLocalData<Act>(ACTS_KEY);
    return acts
      .filter((a) => a.storyId === storyId)
      .sort((a, b) => a.index - b.index);
  },

  update(actId: string, updates: Partial<Act>): Act | null {
    const acts = getLocalData<Act>(ACTS_KEY);
    const index = acts.findIndex((a) => a.id === actId);
    if (index === -1) return null;

    acts[index] = { ...acts[index], ...updates };
    setLocalData(ACTS_KEY, acts);
    return acts[index];
  },

  delete(actId: string): boolean {
    const acts = getLocalData<Act>(ACTS_KEY);
    const filtered = acts.filter((a) => a.id !== actId);
    if (filtered.length === acts.length) return false;
    setLocalData(ACTS_KEY, filtered);
    return true;
  },

  reorder(storyId: string, actIds: string[]): boolean {
    const acts = getLocalData<Act>(ACTS_KEY);
    let updated = false;

    actIds.forEach((id, index) => {
      const actIndex = acts.findIndex((a) => a.id === id && a.storyId === storyId);
      if (actIndex !== -1) {
        acts[actIndex].index = index;
        updated = true;
      }
    });

    if (updated) {
      setLocalData(ACTS_KEY, acts);
    }
    return updated;
  },
};

// Story Scene operations
export const storySceneDb = {
  create(actId: string, sceneData: Partial<StoryScene>): StoryScene {
    const scenes = getLocalData<StoryScene>(SCENES_KEY);
    const actScenes = scenes.filter((s) => s.actId === actId);

    const scene: StoryScene = {
      id: generateId(),
      actId,
      index: sceneData.index ?? actScenes.length,
      title: sceneData.title || `场景${actScenes.length + 1}`,
      description: sceneData.description || "",
      locationId: sceneData.locationId,
      characterIds: sceneData.characterIds || [],
      propIds: sceneData.propIds || [],
      timeOfDay: sceneData.timeOfDay || "",
      weather: sceneData.weather || "",
      mood: sceneData.mood || "",
      dialogue: sceneData.dialogue,
      notes: sceneData.notes || "",
    };

    scenes.push(scene);
    setLocalData(SCENES_KEY, scenes);
    return scene;
  },

  getByActId(actId: string): StoryScene[] {
    const scenes = getLocalData<StoryScene>(SCENES_KEY);
    return scenes
      .filter((s) => s.actId === actId)
      .sort((a, b) => a.index - b.index);
  },

  update(sceneId: string, updates: Partial<StoryScene>): StoryScene | null {
    const scenes = getLocalData<StoryScene>(SCENES_KEY);
    const index = scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) return null;

    scenes[index] = { ...scenes[index], ...updates };
    setLocalData(SCENES_KEY, scenes);
    return scenes[index];
  },

  delete(sceneId: string): boolean {
    const scenes = getLocalData<StoryScene>(SCENES_KEY);
    const filtered = scenes.filter((s) => s.id !== sceneId);
    if (filtered.length === scenes.length) return false;
    setLocalData(SCENES_KEY, filtered);
    return true;
  },
};

// Character operations
export const characterDb = {
  create(projectId: string, characterData: Partial<Character>): Character {
    const characters = getLocalData<Character>(CHARACTERS_KEY);
    const now = new Date().toISOString();

    const character: Character = {
      id: generateId(),
      projectId,
      name: characterData.name || "",
      role: characterData.role || "supporting",
      age: characterData.age || "",
      gender: characterData.gender || "",
      appearance: characterData.appearance || "",
      personality: characterData.personality || "",
      background: characterData.background || "",
      motivation: characterData.motivation || "",
      arc: characterData.arc || "",
      referenceImages: characterData.referenceImages || [],
      tags: characterData.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    characters.push(character);
    setLocalData(CHARACTERS_KEY, characters);
    return character;
  },

  getByProjectId(projectId: string): Character[] {
    const characters = getLocalData<Character>(CHARACTERS_KEY);
    return characters.filter((c) => c.projectId === projectId);
  },

  getById(characterId: string): Character | null {
    const characters = getLocalData<Character>(CHARACTERS_KEY);
    return characters.find((c) => c.id === characterId) || null;
  },

  update(characterId: string, updates: Partial<Character>): Character | null {
    const characters = getLocalData<Character>(CHARACTERS_KEY);
    const index = characters.findIndex((c) => c.id === characterId);
    if (index === -1) return null;

    characters[index] = {
      ...characters[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setLocalData(CHARACTERS_KEY, characters);
    return characters[index];
  },

  delete(characterId: string): boolean {
    const characters = getLocalData<Character>(CHARACTERS_KEY);
    const filtered = characters.filter((c) => c.id !== characterId);
    if (filtered.length === characters.length) return false;
    setLocalData(CHARACTERS_KEY, filtered);
    return true;
  },
};

// Location operations
export const locationDb = {
  create(projectId: string, locationData: Partial<Location>): Location {
    const locations = getLocalData<Location>(LOCATIONS_KEY);
    const now = new Date().toISOString();

    const location: Location = {
      id: generateId(),
      projectId,
      name: locationData.name || "",
      description: locationData.description || "",
      type: locationData.type || "interior",
      atmosphere: locationData.atmosphere || "",
      keyFeatures: locationData.keyFeatures || [],
      referenceImages: locationData.referenceImages || [],
      tags: locationData.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    locations.push(location);
    setLocalData(LOCATIONS_KEY, locations);
    return location;
  },

  getByProjectId(projectId: string): Location[] {
    const locations = getLocalData<Location>(LOCATIONS_KEY);
    return locations.filter((l) => l.projectId === projectId);
  },

  getById(locationId: string): Location | null {
    const locations = getLocalData<Location>(LOCATIONS_KEY);
    return locations.find((l) => l.id === locationId) || null;
  },

  update(locationId: string, updates: Partial<Location>): Location | null {
    const locations = getLocalData<Location>(LOCATIONS_KEY);
    const index = locations.findIndex((l) => l.id === locationId);
    if (index === -1) return null;

    locations[index] = {
      ...locations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setLocalData(LOCATIONS_KEY, locations);
    return locations[index];
  },

  delete(locationId: string): boolean {
    const locations = getLocalData<Location>(LOCATIONS_KEY);
    const filtered = locations.filter((l) => l.id !== locationId);
    if (filtered.length === locations.length) return false;
    setLocalData(LOCATIONS_KEY, filtered);
    return true;
  },
};

// Prop operations
export const propDb = {
  create(projectId: string, propData: Partial<Prop>): Prop {
    const props = getLocalData<Prop>(PROPS_KEY);
    const now = new Date().toISOString();

    const prop: Prop = {
      id: generateId(),
      projectId,
      name: propData.name || "",
      description: propData.description || "",
      importance: propData.importance || "supporting",
      referenceImages: propData.referenceImages || [],
      tags: propData.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    props.push(prop);
    setLocalData(PROPS_KEY, props);
    return prop;
  },

  getByProjectId(projectId: string): Prop[] {
    const props = getLocalData<Prop>(PROPS_KEY);
    return props.filter((p) => p.projectId === projectId);
  },

  getById(propId: string): Prop | null {
    const props = getLocalData<Prop>(PROPS_KEY);
    return props.find((p) => p.id === propId) || null;
  },

  update(propId: string, updates: Partial<Prop>): Prop | null {
    const props = getLocalData<Prop>(PROPS_KEY);
    const index = props.findIndex((p) => p.id === propId);
    if (index === -1) return null;

    props[index] = {
      ...props[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setLocalData(PROPS_KEY, props);
    return props[index];
  },

  delete(propId: string): boolean {
    const props = getLocalData<Prop>(PROPS_KEY);
    const filtered = props.filter((p) => p.id !== propId);
    if (filtered.length === props.length) return false;
    setLocalData(PROPS_KEY, filtered);
    return true;
  },
};
