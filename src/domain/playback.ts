import type { PublicHistoryEvent, PublicSpot } from "@poker-trainer/contracts";

export type PlaybackPhase = "introduction" | "history_playback" | "answering";
export type PlaybackState = { phase: PlaybackPhase; eventIndex: number; complete: boolean; paused: boolean; soundEnabled: boolean };
export type PlaybackAction = { type: "start" | "next" | "skip" | "replay" | "pause" | "resume" | "toggle_sound" };

export function initialPlayback(): PlaybackState { return { phase: "introduction", eventIndex: 0, complete: false, paused: false, soundEnabled: false }; }

export function reducePlayback(state: PlaybackState, action: PlaybackAction, history: PublicHistoryEvent[]): PlaybackState {
  if (action.type === "replay") return { ...initialPlayback(), soundEnabled: state.soundEnabled };
  if (action.type === "pause") return { ...state, paused: true };
  if (action.type === "resume") return { ...state, paused: false };
  if (action.type === "toggle_sound") return { ...state, soundEnabled: !state.soundEnabled };
  if (action.type === "start") return history.length === 0 ? { ...state, phase: "answering", eventIndex: 0, complete: true, paused: false } : { ...state, phase: "history_playback", eventIndex: 1, complete: history.length === 1, paused: false };
  if (action.type === "skip") return { ...state, phase: "answering", eventIndex: history.length, complete: true, paused: false };
  if (state.paused) return state;
  if (state.phase === "introduction") return history.length === 0 ? { ...state, phase: "answering", eventIndex: 0, complete: true } : { ...state, phase: "history_playback", eventIndex: 1, complete: history.length <= 1 };
  if (state.phase === "history_playback" && state.eventIndex < history.length) {
    const nextIndex = state.eventIndex + 1;
    return nextIndex >= history.length ? { ...state, phase: "answering", eventIndex: nextIndex, complete: true } : { ...state, eventIndex: nextIndex };
  }
  return { ...state, phase: "answering", eventIndex: history.length, complete: true };
}

export function visibleHistory(spot: PublicSpot, state: PlaybackState): PublicHistoryEvent[] { return spot.history.slice(0, state.eventIndex); }
