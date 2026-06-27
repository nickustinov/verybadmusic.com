"use client";

import * as React from "react";
import Link from "next/link";
import { Disc3 } from "lucide-react";

import { usePlayer } from "@/components/player/player-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Mix } from "@/lib/catalog/schema";
import { mixToTrack } from "@/lib/player/track";
import { slugify } from "@/lib/slug";

import { MixCard } from "./mix-card";
import { MixRow } from "./mix-row";
import { ViewSwitcher, type ViewMode } from "./view-switcher";

const STORAGE_KEY = "vbm:view";
const VIEW_EVENT = "vbm:view-change";

function readStoredView(): ViewMode {
  if (typeof window === "undefined") return "tiles";
  return window.localStorage.getItem(STORAGE_KEY) === "list" ? "list" : "tiles";
}

/** Read the persisted view from localStorage without tripping hydration. */
function useViewMode(): [ViewMode, (next: ViewMode) => void] {
  const subscribe = React.useCallback((onChange: () => void) => {
    window.addEventListener(VIEW_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(VIEW_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const view = React.useSyncExternalStore(
    subscribe,
    readStoredView,
    () => "tiles" as ViewMode,
  );

  const changeView = React.useCallback((next: ViewMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(VIEW_EVENT));
  }, []);

  return [view, changeView];
}

export function CatalogView({
  mixes,
  initialSlug,
}: {
  mixes: Mix[];
  initialSlug?: string;
}) {
  const { current, state, playMix, selectMix, toggle } = usePlayer();
  const [view, changeView] = useViewMode();

  const [tag, setTag] = React.useState<string | null>(null);

  // Preselect a shared mix once on mount (loaded paused; browsers block autoplay).
  const didPreselect = React.useRef(false);
  React.useEffect(() => {
    if (didPreselect.current || !initialSlug) return;
    didPreselect.current = true;
    const index = mixes.findIndex(
      (m) => slugify(m.title) === initialSlug || m.id === initialSlug,
    );
    if (index >= 0) selectMix(mixes.map(mixToTrack), index, { expand: true });
  }, [initialSlug, mixes, selectMix]);

  const allTags = React.useMemo(() => {
    const seen = new Set<string>();
    for (const mix of mixes) for (const t of mix.tags) seen.add(t);
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [mixes]);

  const visible = React.useMemo(
    () => (tag ? mixes.filter((m) => m.tags.includes(tag)) : mixes),
    [mixes, tag],
  );

  const tracks = React.useMemo(() => visible.map(mixToTrack), [visible]);

  const play = (index: number) => {
    if (current?.id === visible[index]?.id) {
      toggle();
      return;
    }
    playMix(tracks, index);
  };

  if (mixes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 border border-dashed py-20 text-center">
        <Disc3 className="size-10 text-muted-foreground" />
        <div>
          <p className="font-mono text-sm">no mixes yet.</p>
          <p className="font-mono text-xs text-muted-foreground">
            the crate is empty.
          </p>
        </div>
        <Link href="/vbm-admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
          go to admin
        </Link>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">
          {visible.length} mix{visible.length === 1 ? "" : "es"}
        </p>
        <ViewSwitcher value={view} onChange={changeView} />
      </div>

      {allTags.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button
            variant={tag === null ? "default" : "outline"}
            size="xs"
            className="lowercase"
            onClick={() => setTag(null)}
          >
            all
          </Button>
          {allTags.map((t) => (
            <Button
              key={t}
              variant={tag === t ? "default" : "outline"}
              size="xs"
              className="lowercase"
              onClick={() => setTag((prev) => (prev === t ? null : t))}
            >
              {t}
            </Button>
          ))}
        </div>
      ) : null}

      {view === "tiles" ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((mix, index) => (
            <MixCard
              key={mix.id}
              mix={mix}
              index={index}
              active={current?.id === mix.id}
              playing={state.isPlaying}
              onPlay={() => play(index)}
            />
          ))}
        </div>
      ) : (
        <div className="border-t">
          {visible.map((mix, index) => (
            <MixRow
              key={mix.id}
              mix={mix}
              index={index}
              active={current?.id === mix.id}
              playing={state.isPlaying}
              onPlay={() => play(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
