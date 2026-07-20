"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Client-side "compare" tray backed by localStorage. Compare is inherently an
 * ephemeral, per-device selection (no login needed), so localStorage is the
 * right store. All mounted instances stay in sync via a custom event (same tab)
 * and the native `storage` event (other tabs).
 */
export interface CompareItem {
  slug: string;
  title: string;
}

const KEY = "anl.compare";
const MAX = 3;
const EVENT = "anl-compare-change";

function read(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? (v as CompareItem[]).filter((i) => i?.slug) : [];
  } catch {
    return [];
  }
}

function write(items: CompareItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useCompare() {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback(
    (slug: string) => items.some((i) => i.slug === slug),
    [items]
  );

  /** Add/remove. Returns whether it was blocked because the tray is full. */
  const toggle = useCallback((item: CompareItem): { full: boolean } => {
    const cur = read();
    const exists = cur.some((i) => i.slug === item.slug);
    if (exists) {
      write(cur.filter((i) => i.slug !== item.slug));
      return { full: false };
    }
    if (cur.length >= MAX) return { full: true };
    write([...cur, item]);
    return { full: false };
  }, []);

  const remove = useCallback((slug: string) => {
    write(read().filter((i) => i.slug !== slug));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, has, toggle, remove, clear, max: MAX };
}
