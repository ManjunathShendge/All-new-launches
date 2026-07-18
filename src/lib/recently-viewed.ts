import type { RecentlyViewedItem } from "@/types/user-activity";

// Client-only "Recently Viewed" store. Keeps a compact snapshot per property in
// localStorage (no server table needed) — most-recent first, de-duplicated.
const KEY = "anl_recently_viewed";
const MAX = 12;

export function readRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as RecentlyViewedItem[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(item: Omit<RecentlyViewedItem, "at">): void {
  if (typeof window === "undefined") return;
  try {
    const next = [
      { ...item, at: Date.now() },
      ...readRecentlyViewed().filter((i) => i.id !== item.id),
    ].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / disabled — ignore */
  }
}
