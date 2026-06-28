"use client";

import * as React from "react";

/**
 * Favourites live in localStorage (no account needed) as a JSON array of mix
 * ids. A custom event + the storage event keep every mounted component in sync,
 * read through useSyncExternalStore so it stays SSR-safe (empty on the server).
 */

const KEY = "vbm:favourites";
const EVENT = "vbm:favourites-change";

function readRaw(): string {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(KEY) ?? "[]";
}

function parse(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function toggleFavourite(id: string): void {
  const set = new Set(parse(readRaw()));
  if (set.has(id)) set.delete(id);
  else set.add(id);
  window.localStorage.setItem(KEY, JSON.stringify([...set]));
  window.dispatchEvent(new Event(EVENT));
}

/** Reactive set of favourited mix ids. */
export function useFavourites(): Set<string> {
  const subscribe = React.useCallback((onChange: () => void) => {
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const raw = React.useSyncExternalStore(subscribe, readRaw, () => "[]");
  return React.useMemo(() => new Set(parse(raw)), [raw]);
}
