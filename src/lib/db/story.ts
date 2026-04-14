/**
 * Story database operations
 * Re-exports from data-store.ts which uses file-based persistence (data/*.json)
 * Previously used localStorage which caused data loss on page refresh
 */

export {
  storyStore as storyDb,
  actStore as actDb,
  storySceneStore as storySceneDb,
  characterStore as characterDb,
  locationStore as locationDb,
  propStore as propDb,
} from "@/lib/data-store";
