/**
 * Pure player state machine. Holds the queue and transport state; the actual
 * <audio> element is driven from these values by the PlayerProvider. Keeping the
 * logic pure makes the transport behaviour unit-testable.
 */

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  src: string;
  description?: string;
};

export type PlayerState = {
  queue: PlayerTrack[];
  index: number; // -1 when nothing is loaded
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0..1
  muted: boolean;
};

export const initialPlayerState: PlayerState = {
  queue: [],
  index: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
};

export type PlayerAction =
  | { type: "SET_QUEUE"; queue: PlayerTrack[]; index?: number }
  | { type: "PLAY_AT"; index: number }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TOGGLE" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SET_TIME"; time: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "ENDED" };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const inRange = (state: PlayerState, index: number) =>
  index >= 0 && index < state.queue.length;

export function playerReducer(
  state: PlayerState,
  action: PlayerAction,
): PlayerState {
  switch (action.type) {
    case "SET_QUEUE": {
      const index = action.index ?? -1;
      return {
        ...state,
        queue: action.queue,
        index: index < action.queue.length ? index : -1,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      };
    }

    case "PLAY_AT": {
      if (!inRange(state, action.index)) return state;
      return {
        ...state,
        index: action.index,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    }

    case "PLAY":
      return state.index < 0 ? state : { ...state, isPlaying: true };

    case "PAUSE":
      return { ...state, isPlaying: false };

    case "TOGGLE":
      return state.index < 0 ? state : { ...state, isPlaying: !state.isPlaying };

    case "NEXT": {
      const next = state.index + 1;
      if (!inRange(state, next)) return state;
      return { ...state, index: next, isPlaying: true, currentTime: 0, duration: 0 };
    }

    case "PREV": {
      // Restart the current track unless we are near its very start.
      if (state.currentTime > 3 || state.index <= 0) {
        return { ...state, currentTime: 0 };
      }
      return {
        ...state,
        index: state.index - 1,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    }

    case "SET_TIME": {
      const max = state.duration > 0 ? state.duration : Number.POSITIVE_INFINITY;
      return { ...state, currentTime: clamp(action.time, 0, max) };
    }

    case "SET_DURATION":
      return { ...state, duration: Math.max(0, action.duration) };

    case "SET_VOLUME": {
      const volume = clamp(action.volume, 0, 1);
      return { ...state, volume, muted: volume === 0 ? state.muted : false };
    }

    case "TOGGLE_MUTE":
      return { ...state, muted: !state.muted };

    case "ENDED": {
      const next = state.index + 1;
      if (inRange(state, next)) {
        return { ...state, index: next, currentTime: 0, duration: 0, isPlaying: true };
      }
      return { ...state, isPlaying: false, currentTime: 0 };
    }

    default:
      return state;
  }
}
