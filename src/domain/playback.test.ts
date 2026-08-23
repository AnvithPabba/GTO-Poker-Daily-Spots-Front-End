import { describe, expect, it } from "vitest";
import type { PublicHistoryEvent } from "@poker-trainer/contracts";
import { initialPlayback, reducePlayback, visibleHistory } from "./playback.js";

const history: PublicHistoryEvent[] = [
  { kind: "action", actor: "oop", actionType: "check", solverLabel: "CHECK" },
  { kind: "action", actor: "ip", actionType: "bet", solverLabel: "BET 25", amount: 25 },
];

describe("challenge playback reducer", () => {
  it("plays one history event at a time and then reaches answering", () => {
    let state = initialPlayback();
    state = reducePlayback(state, { type: "start" }, history);
    expect.soft(state.phase).toBe("history_playback");
    expect.soft(visibleHistory({ history } as never, state)).toHaveLength(1);
    state = reducePlayback(state, { type: "next" }, history);
    expect.soft(state.phase).toBe("answering");
    expect.soft(state.complete).toBe(true);
  });

  it("supports skip and deterministic replay", () => {
    const skipped = reducePlayback(initialPlayback(), { type: "skip" }, history);
    expect.soft(skipped).toEqual({ phase: "answering", eventIndex: 2, complete: true, paused: false, soundEnabled: false });
    expect.soft(reducePlayback(skipped, { type: "replay" }, history)).toEqual(initialPlayback());
  });

  it("allows an explicit next action while paused and preserves sound preference across replay", () => {
    let state = reducePlayback(initialPlayback(), { type: "start" }, history);
    state = reducePlayback(state, { type: "toggle_sound" }, history);
    state = reducePlayback(state, { type: "pause" }, history);
    const stepped = reducePlayback(state, { type: "next" }, history);
    expect.soft(stepped.phase).toBe("answering");
    expect.soft(stepped.paused).toBe(true);
    state = reducePlayback(state, { type: "resume" }, history);
    expect(reducePlayback(state, { type: "replay" }, history).soundEnabled).toBe(true);
  });
});
