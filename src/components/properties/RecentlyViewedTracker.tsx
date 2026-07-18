"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "@/lib/recently-viewed";
import type { RecentlyViewedItem } from "@/types/user-activity";

/**
 * Invisible tracker rendered on a property detail page — records a compact
 * snapshot to localStorage so the buyer profile can show "Recently Viewed".
 */
export default function RecentlyViewedTracker(
  item: Omit<RecentlyViewedItem, "at">
) {
  useEffect(() => {
    pushRecentlyViewed(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);
  return null;
}
