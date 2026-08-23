import { describe, expect, it } from "vitest";
import { publicSpotFixture } from "../test/fixtures.js";
import { decisionLabel, effectiveStack, formatCardCode, formatHand, formatLegalActionLabel, formatPosition, presentActor, storyLine, turnLabel } from "./presentation.js";

describe("presentation helpers", () => {
  it.each([
    ["As", "A♠"], ["Th", "T♥"], ["2d", "2♦"], ["9c", "9♣"],
  ])("formats card %s as %s", (card, expected) => {
    expect(formatCardCode(card)).toBe(expected);
  });

  it("maps hero and opponent independently of their positions", () => {
    expect(presentActor(publicSpotFixture, "ip").label).toBe("You · BTN · IP");
    expect(presentActor(publicSpotFixture, "oop").label).toBe("Opponent · BB · OOP");
    expect(presentActor(publicSpotFixture, "ip").seatLabel).toBe("You · BTN");
    expect(presentActor(publicSpotFixture, "oop").laneDescription).toBe("Out of position");
    expect(formatPosition(publicSpotFixture, "ip")).toBe("BTN · IP");
    const laneNamed = { ...publicSpotFixture, presentation: { ...publicSpotFixture.presentation, positions: { ip: "IP", oop: "OOP" } } };
    expect(presentActor(laneNamed, "ip").label).toBe("You · IP");
    expect(formatPosition(laneNamed, "oop")).toBe("OOP");
  });

  it("formats concrete hands and decision labels for players", () => {
    expect(formatHand("AhAs")).toBe("A♥ A♠");
    expect(decisionLabel(publicSpotFixture)).toBe("Flop · Your Decision");
    expect(turnLabel(publicSpotFixture)).toBe("Flop · Your turn");
  });

  it("keeps absolute solver amounts and appends the configured chip unit", () => {
    expect(formatLegalActionLabel(publicSpotFixture.legalActions[1]!, "bb")).toBe("Bet 25 bb");
    expect(formatLegalActionLabel(publicSpotFixture.legalActions[2]!, "currency")).toBe("Bet 75 chips");
    expect(formatLegalActionLabel(publicSpotFixture.legalActions[0]!, "bb")).toBe("Check");
    expect(formatLegalActionLabel({ id: "jam", type: "raise", amount: 100, toAmount: 100, isAllIn: true, displayLabel: "Bet 100" }, "bb")).toBe("All-in · 100 bb");
    expect(formatLegalActionLabel({ id: "raise", type: "raise", amount: 70, toAmount: 70, isAllIn: false, displayLabel: "Raise to 70" }, "bb")).toBe("Raise to 70 bb");
  });

  it("derives effective stack and a story from structured data", () => {
    expect(effectiveStack(publicSpotFixture.decision)).toBe(100);
    expect(storyLine(publicSpotFixture)).toContain("2.5 bb");
    expect(storyLine(publicSpotFixture)).toContain("Q♠ J♥ 2♥");
    expect(storyLine(publicSpotFixture)).toBe("You open to 2.5 bb. BB calls. BB checks. Flop: Q♠ J♥ 2♥. Pot: 50 bb. Effective stack: 100 bb. You are first to act.");
  });
});
