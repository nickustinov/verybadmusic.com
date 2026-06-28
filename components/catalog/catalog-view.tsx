"use client";

import * as React from "react";
import Link from "next/link";
import { Dice5, Disc3, Heart } from "lucide-react";

import { recordPlayAction } from "@/app/actions";
import { usePlayer } from "@/components/player/player-provider";
import { useFavourites } from "@/components/use-favourites";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Mix } from "@/lib/catalog/schema";
import { mixToTrack } from "@/lib/player/track";
import { slugify } from "@/lib/slug";

import { MixCard } from "./mix-card";
import { MixRow } from "./mix-row";
import { SortSelect, type SortMode } from "./sort-select";
import { ViewSwitcher, type ViewMode } from "./view-switcher";

/** Reorder the (already added-order) mixes for the chosen sort. */
function sortMixes(mixes: Mix[], mode: SortMode): Mix[] {
  if (mode === "added") return mixes;
  if (mode === "plays") {
    return [...mixes].sort((a, b) => b.plays - a.plays);
  }
  // Newest release first; mixes without a release date sink to the bottom.
  return [...mixes].sort((a, b) => {
    if (!a.releasedAt) return b.releasedAt ? 1 : 0;
    if (!b.releasedAt) return -1;
    return b.releasedAt.localeCompare(a.releasedAt);
  });
}

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
  const [sort, setSort] = React.useState<SortMode>("added");
  const [favsOnly, setFavsOnly] = React.useState(false);

  const favs = useFavourites();
  const favCount = React.useMemo(
    () => mixes.reduce((n, m) => n + (favs.has(m.id) ? 1 : 0), 0),
    [mixes, favs],
  );
  // Drop the favourites filter once nothing is favourited anymore.
  React.useEffect(() => {
    if (favsOnly && favCount === 0) setFavsOnly(false);
  }, [favsOnly, favCount]);

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

  const visible = React.useMemo(() => {
    let list = favsOnly ? mixes.filter((m) => favs.has(m.id)) : mixes;
    if (tag) list = list.filter((m) => m.tags.includes(tag));
    return sortMixes(list, sort);
  }, [mixes, tag, sort, favsOnly, favs]);

  const tracks = React.useMemo(() => visible.map(mixToTrack), [visible]);

  const play = (index: number) => {
    if (current?.id === visible[index]?.id) {
      toggle();
      return;
    }
    playMix(tracks, index);
    void recordPlayAction(visible[index].id);
  };

  // Play a random mix from the whole catalog, ignoring filter/sort.
  const shuffle = () => {
    const index = Math.floor(Math.random() * mixes.length);
    playMix(mixes.map(mixToTrack), index);
    void recordPlayAction(mixes[index].id);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-mono lowercase"
            onClick={shuffle}
          >
            <Dice5 />
            random
          </Button>
          <SortSelect value={sort} onChange={setSort} />
          <ViewSwitcher value={view} onChange={changeView} />
        </div>
      </div>

      {allTags.length > 0 || favCount > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {allTags.length > 0 ? (
            <Button
              variant={tag === null ? "default" : "outline"}
              size="xs"
              className="lowercase"
              onClick={() => setTag(null)}
            >
              all
            </Button>
          ) : null}
          {favCount > 0 ? (
            <Button
              variant={favsOnly ? "default" : "outline"}
              size="xs"
              className="lowercase"
              onClick={() => setFavsOnly((v) => !v)}
            >
              <Heart className="size-3 fill-red-500 text-red-500" />
              favourites
            </Button>
          ) : null}
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
        <div className="vbm-grid grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
