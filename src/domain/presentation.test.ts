import { describe, expect, it } from "vitest";
import type { PublicSpot } from "@poker-trainer/contracts";
import { heroOopSpotFixture, publicSpotFixture } from "../test/fixtures.js";
import { decisionLabel, effectiveStack, formatCardCode, formatHand, formatLegalActionLabel, formatPosition, presentActor, presentHandContext, resolveSpotPlayers, storyLine } from "./presentation.js";

describe("presentation helpers", () => {
  it.each([
    ["As", "A♠"], ["Th", "T♥"], ["2d", "2♦"], ["9c", "9♣"],
  ])("formats card %s as %s", (card, expected) => {
    expect(formatCardCode(card)).toBe(expected);
  });

  it("maps hero and opponent independently of their positions", () => {
    expect(presentActor(publicSpotFixture, "ip").label).toBe("You · BTN · IP");
    expect(presentActor(publicSpotFixture, "oop").label).toBe("Opponent · BB · OOP");
    expect(presentActor(publicSpotFixture, "ip").seatLabel).toBe("You");
    expect(presentActor(publicSpotFixture, "oop").positionLabel).toBe("BB · OOP");
    expect(formatPosition(publicSpotFixture, "ip")).toBe("BTN · IP");
    const laneNamed = {
      ...publicSpotFixture,
      preflop: { status: "unknown", label: "Preflop start unavailable", summary: "Legacy context." } as const,
      presentation: { ...publicSpotFixture.presentation, positions: { ip: "IP", oop: "OOP" } },
    };
    expect(presentActor(laneNamed, "ip").label).toBe("You · IP");
    expect(formatPosition(laneNamed, "oop")).toBe("OOP");
  });

  it("derives BTN dealer, BB first actor, and hero roles from one position model", () => {
    const players = resolveSpotPlayers(heroOopSpotFixture);

    expect.soft(players.oop.position).toBe("BB");
    expect.soft(players.oop.label).toBe("You · BB · OOP");
    expect.soft(players.oop.isDealer).toBe(false);
    expect.soft(players.oop.actsFirstPostflop).toBe(true);
    expect.soft(players.ip.position).toBe("BTN");
    expect.soft(players.ip.label).toBe("Opponent · BTN · IP");
    expect.soft(players.ip.isDealer).toBe(true);
    expect.soft(players.ip.actsFirstPostflop).toBe(false);
    expect.soft(heroOopSpotFixture.decision.actor).toBe("oop");
  });

  it("formats concrete hands and decision labels for players", () => {
    expect(formatHand("AhAs")).toBe("A♥ A♠");
    expect(decisionLabel(publicSpotFixture)).toBe("Your Decision");
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
    expect(storyLine(publicSpotFixture)).toBe("Preflop: You open to 2.5 bb → Opponent (BB) calls. Flop Q♠ J♥ 2♥: Opponent (BB) checks");
    expect(storyLine(heroOopSpotFixture)).toBe("Preflop: Opponent (BTN) opens to 2.5 bb → You call from the BB. Flop Q♠ J♥ 2♥: You act first");
  });

  it("groups action history by street and conjugates hero actions correctly", () => {
    const riverSpot: PublicSpot = {
      ...publicSpotFixture,
      history: [
        { kind: "deal_hole", actor: "ip", cards: ["6s", "6h"] },
        { kind: "deal_board", street: "flop", cards: ["Qs", "Jh", "2h"] },
        { kind: "action", actor: "oop", actionId: "f0", actionType: "check", solverLabel: "CHECK" },
        { kind: "action", actor: "ip", actionId: "f1", actionType: "check", solverLabel: "CHECK" },
        { kind: "deal", card: "Kh", solverLabel: "Kh" },
        { kind: "action", actor: "oop", actionId: "t0", actionType: "bet", solverLabel: "BET 25", amount: 25 },
        { kind: "action", actor: "ip", actionId: "t1", actionType: "call", solverLabel: "CALL", amount: 25 },
        { kind: "deal", card: "Td", solverLabel: "Td" },
        { kind: "action", actor: "oop", actionId: "r0", actionType: "check", solverLabel: "CHECK" },
        { kind: "decision", actor: "ip" },
      ],
      decision: { board: ["Qs", "Jh", "2h", "Kh", "Td"], pot: 100, stacks: { ip: 75, oop: 75 }, street: "river", actor: "ip", allIn: { ip: false, oop: false } },
      featuredCombo: "6s6h",
    };

    const context = presentHandContext(riverSpot);

    expect.soft(context.streets.map(({ label, cards }) => [label, cards])).toEqual([
      ["Preflop", ""],
      ["Flop", "Q♠ J♥ 2♥"],
      ["Turn", "K♥"],
      ["River", "T♦"],
    ]);
    expect.soft(context.streets[1]?.actions).toEqual(["Opponent (BB) checks", "You check"]);
    expect.soft(context.streets[2]?.actions).toEqual(["Opponent (BB) bets 25 bb", "You call 25 bb"]);
    expect.soft(context.streets[3]?.actions).toEqual(["Opponent (BB) checks"]);
    expect.soft(context.summary).not.toMatch(/You checks|You calls|You bets|You raises/);
  });
});
