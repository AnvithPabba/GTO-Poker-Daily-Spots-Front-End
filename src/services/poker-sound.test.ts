import { describe, expect, it } from "vitest";
import type { PublicHistoryEvent } from "@poker-trainer/contracts";
import { eventFrequencies, PokerSoundService } from "./poker-sound.js";

const events: PublicHistoryEvent[] = [
  { kind: "deal_hole", actor: "ip", cards: ["Ah", "As"] },
  { kind: "deal_board", street: "flop", cards: ["Qs", "Jh", "2h"] },
  { kind: "action", actor: "oop", actionId: "a0", actionType: "check", solverLabel: "CHECK" },
  { kind: "decision", actor: "ip" },
];

describe("PokerSoundService", () => {
  it("maps each replay event to a short distinct cue profile", () => {
    // Arrange / Act
    const profiles = events.map(eventFrequencies);

    // Assert
    expect.soft(profiles[0]).toHaveLength(2);
    expect.soft(profiles[1]).toHaveLength(3);
    expect.soft(profiles[2]).toEqual([280]);
    expect(profiles[3]).toEqual([660]);
  });

  it("is safe when a browser does not provide Web Audio", () => {
    // Arrange
    const service = new PokerSoundService();

    // Act / Assert
    expect(() => {
      service.enable();
      service.play(events[0]!);
      service.dispose();
    }).not.toThrow();
  });
});
