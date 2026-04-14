/**
 * Storyboard database operations
 * Re-exports from data-store.ts which uses file-based persistence (data/*.json)
 * Previously used localStorage which caused data loss on page refresh
 */

export {
  storyboardStore as storyboardDb,
  shotStore as shotDb,
} from "@/lib/data-store";
