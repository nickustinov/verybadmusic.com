import { describe, expect, it } from "vitest";
import {
  initialPlayerState,
  playerReducer,
  type PlayerState,
  type PlayerTrack,
} from "./store";

const tracks: PlayerTrack[] = [
  { id: "a", title: "A", artist: "", coverUrl: "", src: "sa" },
  { id: "b", title: "B", artist: "", coverUrl: "", src: "sb" },
  { id: "c", title: "C", artist: "", coverUrl: "", src: "sc" },
];

function loaded(index = 0, over: Partial<PlayerState> = {}): PlayerState {
  return {
    ...initialPlayerState,
    queue: tracks,
    index,
    isPlaying: true,
    ...over,
  };
}

describe("playerReducer", () => {
  it("loads a queue without auto-playing", () => {
    const state = playerReducer(initialPlayerState, {
      type: "SET_QUEUE",
      queue: tracks,
      index: 1,
    });
    expect(state.queue).toHaveLength(3);
    expect(state.index).toBe(1);
    expect(state.isPlaying).toBe(false);
  });

  it("plays a specific index and resets time", () => {
    const state = playerReducer(loaded(0, { currentTime: 30 }), {
      type: "PLAY_AT",
      index: 2,
    });
    expect(state.index).toBe(2);
    expect(state.isPlaying).toBe(true);
    expect(state.currentTime).toBe(0);
  });

  it("ignores PLAY_AT for an out-of-range index", () => {
    const start = loaded(0);
    expect(playerReducer(start, { type: "PLAY_AT", index: 9 })).toBe(start);
  });

  it("toggles play/pause", () => {
    const playing = loaded(0, { isPlaying: true });
    const paused = playerReducer(playing, { type: "TOGGLE" });
    expect(paused.isPlaying).toBe(false);
    expect(playerReducer(paused, { type: "TOGGLE" }).isPlaying).toBe(true);
  });

  it("does not start playing on TOGGLE when nothing is loaded", () => {
    expect(playerReducer(initialPlayerState, { type: "TOGGLE" }).isPlaying).toBe(
      false,
    );
  });

  it("advances to the next track", () => {
    const state = playerReducer(loaded(0), { type: "NEXT" });
    expect(state.index).toBe(1);
    expect(state.isPlaying).toBe(true);
  });

  it("stays on the last track when NEXT runs out", () => {
    const state = playerReducer(loaded(2), { type: "NEXT" });
    expect(state.index).toBe(2);
  });

  it("restarts the current track on PREV after 3s", () => {
    const state = playerReducer(loaded(1, { currentTime: 8 }), { type: "PREV" });
    expect(state.index).toBe(1);
    expect(state.currentTime).toBe(0);
  });

  it("goes to the previous track on PREV near the start", () => {
    const state = playerReducer(loaded(1, { currentTime: 1 }), { type: "PREV" });
    expect(state.index).toBe(0);
  });

  it("clamps time and duration", () => {
    const withDuration = playerReducer(loaded(0), {
      type: "SET_DURATION",
      duration: 100,
    });
    const seeked = playerReducer(withDuration, { type: "SET_TIME", time: 250 });
    expect(seeked.currentTime).toBe(100);
    expect(playerReducer(withDuration, { type: "SET_TIME", time: -5 }).currentTime).toBe(0);
  });

  it("clamps volume and unmutes when raised", () => {
    const muted = loaded(0, { muted: true, volume: 0 });
    const state = playerReducer(muted, { type: "SET_VOLUME", volume: 0.5 });
    expect(state.volume).toBe(0.5);
    expect(state.muted).toBe(false);
    expect(playerReducer(loaded(0), { type: "SET_VOLUME", volume: 3 }).volume).toBe(1);
  });

  it("advances on ENDED, or stops at the end", () => {
    expect(playerReducer(loaded(0), { type: "ENDED" }).index).toBe(1);
    const end = playerReducer(loaded(2), { type: "ENDED" });
    expect(end.index).toBe(2);
    expect(end.isPlaying).toBe(false);
    expect(end.currentTime).toBe(0);
  });
});
