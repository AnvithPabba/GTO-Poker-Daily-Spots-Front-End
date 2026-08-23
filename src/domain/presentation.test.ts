import { describe, expect, it } from "vitest";
import { publicSpotFixture } from "../test/fixtures.js";
import { effectiveStack, formatCardCode, formatLegalActionLabel, presentActor, storyLine } from "./presentation.js";

describe("presentation helpers", () => {
  it.each([
    ["As", "A♠"], ["Th", "T♥"], ["2d", "2♦"], ["9c", "9♣"],
  ])("formats card %s as %s", (card, expected) => {
    expect(formatCardCode(card)).toBe(expected);
  });

  it("maps hero and opponent independently of their positions", () => {
    expect(presentActor(publicSpotFixture, "ip").label).toBe("You · BTN · IP");
    expect(presentActor(publicSpotFixture, "oop").label).toBe("Opponent · BB · OOP");
  });

  it("keeps absolute solver amounts and appends the configured chip unit", () => {
    expect(formatLegalActionLabel(publicSpotFixture.legalActions[1]!, "bb")).toBe("Bet 25 bb");
    expect(formatLegalActionLabel(publicSpotFixture.legalActions[2]!, "currency")).toBe("Bet 75 chips");
    expect(formatLegalActionLabel(publicSpotFixture.legalActions[0]!, "bb")).toBe("Check");
  });

  it("derives effective stack and a story from structured data", () => {
    expect(effectiveStack(publicSpotFixture.decision)).toBe(100);
    expect(storyLine(publicSpotFixture)).toContain("2.5 bb");
    expect(storyLine(publicSpotFixture)).toContain("Q♠ J♥ 2♥");
    expect(storyLine(publicSpotFixture)).toContain("You · BTN · IP to act");
  });
});
