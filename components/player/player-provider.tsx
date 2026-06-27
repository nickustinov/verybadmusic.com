"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  initialPlayerState,
  playerReducer,
  type PlayerState,
  type PlayerTrack,
} from "@/lib/player/store";

const MEDIA_ERR: Record<number, string> = {
  1: "ABORTED",
  2: "NETWORK",
  3: "DECODE",
  4: "SRC_NOT_SUPPORTED",
};

/**
 * Owns the single <audio> element for the whole app so playback survives view
 * and route changes. All media coupling (AirPlay / Remote Playback) lives here;
 * UI components only read state and call the exposed methods. State is the single
 * source of truth and is pushed onto the element one-way; the element only
 * reports back time / duration / ended.
 */

type AirplayState = {
  available: boolean;
  active: boolean;
  show: () => void;
};

type PlayerContextValue = {
  state: PlayerState;
  current: PlayerTrack | null;
  playMix: (tracks: PlayerTrack[], index: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  airplay: AirplayState;
};

const PlayerContext = React.createContext<PlayerContextValue | null>(null);

interface AirplayAudio extends HTMLAudioElement {
  webkitShowPlaybackTargetPicker?: () => void;
  webkitCurrentPlaybackTargetIsWireless?: boolean;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(playerReducer, initialPlayerState);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const loadedSrc = React.useRef<string | null>(null);

  const [airplayAvailable, setAirplayAvailable] = React.useState(false);
  const [airplayActive, setAirplayActive] = React.useState(false);

  const current = state.index >= 0 ? state.queue[state.index] ?? null : null;
  const currentSrc = current?.src ?? null;
  const { isPlaying, volume, muted } = state;

  // Load a new source when the track changes; (re)start playback when asked.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSrc) return;
    if (loadedSrc.current !== currentSrc) {
      loadedSrc.current = currentSrc;
      console.info("[vbm player] loading src:", currentSrc);
      audio.src = currentSrc;
      audio.load();
    }
    if (isPlaying) {
      void audio
        .play()
        .then(() => console.info("[vbm player] play() started"))
        .catch((err) => {
          console.error("[vbm player] play() rejected:", err?.name, err?.message);
          toast.error(`play blocked: ${err?.name ?? "error"}`);
          dispatch({ type: "PAUSE" });
        });
    } else {
      audio.pause();
    }
  }, [currentSrc, isPlaying]);

  // Reflect volume / mute onto the element.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // Wire up AirPlay (Safari) and the Remote Playback API (Chrome → Cast).
  React.useEffect(() => {
    const audio = audioRef.current as AirplayAudio | null;
    if (!audio) return;

    // Opt the element into AirPlay (Safari reads this attribute).
    audio.setAttribute("x-webkit-airplay", "allow");

    const onWebkitAvailability = (event: Event) => {
      const availability = (event as unknown as { availability?: string })
        .availability;
      setAirplayAvailable(availability === "available");
    };
    const onWebkitWirelessChange = () => {
      setAirplayActive(Boolean(audio.webkitCurrentPlaybackTargetIsWireless));
    };

    audio.addEventListener(
      "webkitplaybacktargetavailabilitychanged",
      onWebkitAvailability as EventListener,
    );
    audio.addEventListener(
      "webkitcurrentplaybacktargetiswirelesschanged",
      onWebkitWirelessChange as EventListener,
    );

    let cancelled = false;
    const remote = audio.remote;
    const onConnect = () => setAirplayActive(true);
    const onDisconnect = () => setAirplayActive(false);
    if (remote) {
      void remote
        .watchAvailability((available) => {
          if (!cancelled) setAirplayAvailable(available);
        })
        .catch(() => {});
      remote.addEventListener("connect", onConnect);
      remote.addEventListener("disconnect", onDisconnect);
    }

    return () => {
      cancelled = true;
      audio.removeEventListener(
        "webkitplaybacktargetavailabilitychanged",
        onWebkitAvailability as EventListener,
      );
      audio.removeEventListener(
        "webkitcurrentplaybacktargetiswirelesschanged",
        onWebkitWirelessChange as EventListener,
      );
      remote?.removeEventListener("connect", onConnect);
      remote?.removeEventListener("disconnect", onDisconnect);
    };
  }, []);

  const showAirplay = React.useCallback(() => {
    const audio = audioRef.current as AirplayAudio | null;
    if (!audio) return;
    if (typeof audio.webkitShowPlaybackTargetPicker === "function") {
      audio.webkitShowPlaybackTargetPicker();
    } else if (audio.remote?.prompt) {
      void audio.remote.prompt().catch(() => {});
    }
  }, []);

  const value = React.useMemo<PlayerContextValue>(
    () => ({
      state,
      current,
      playMix: (tracks, index) => {
        dispatch({ type: "SET_QUEUE", queue: tracks, index });
        dispatch({ type: "PLAY_AT", index });
      },
      toggle: () => dispatch({ type: "TOGGLE" }),
      next: () => dispatch({ type: "NEXT" }),
      prev: () => dispatch({ type: "PREV" }),
      seek: (time) => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = time;
        dispatch({ type: "SET_TIME", time });
      },
      setVolume: (v) => dispatch({ type: "SET_VOLUME", volume: v }),
      toggleMute: () => dispatch({ type: "TOGGLE_MUTE" }),
      airplay: {
        available: airplayAvailable,
        active: airplayActive,
        show: showAirplay,
      },
    }),
    [state, current, airplayAvailable, airplayActive, showAirplay],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) =>
          console.info(
            "[vbm player] loadedmetadata · duration:",
            e.currentTarget.duration,
          )
        }
        onTimeUpdate={(e) =>
          dispatch({ type: "SET_TIME", time: e.currentTarget.currentTime })
        }
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) dispatch({ type: "SET_DURATION", duration: d });
        }}
        onEnded={() => dispatch({ type: "ENDED" })}
        onStalled={() => console.warn("[vbm player] stalled")}
        onError={(e) => {
          const el = e.currentTarget;
          const err = el.error;
          const code = err ? (MEDIA_ERR[err.code] ?? `code ${err.code}`) : "unknown";
          console.error("[vbm player] audio error", {
            code,
            message: err?.message,
            src: el.currentSrc || el.src,
            networkState: el.networkState,
            readyState: el.readyState,
          });
          toast.error(`playback error: ${code}`);
          dispatch({ type: "PAUSE" });
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = React.useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}
