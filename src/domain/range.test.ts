import { describe, expect, it } from "vitest";
import { allRangeCells, comboCategory, enumerateCombosForCell, rangeCellLabel } from "./range.js";

describe("range grid", () => {
  it.each([["A", "A", "AA"], ["A", "K", "AKs"], ["K", "A", "AKo"]])("labels %s/%s as %s", (row, column, expected) => {
    expect(rangeCellLabel(row, column)).toBe(expected);
  });

  it("expands only API-selected combos and removes board blockers", () => {
    const selectable = new Set(["AhAs", "AcAd", "KhQh", "KhQs", "KsQh"]);
    expect(enumerateCombosForCell("AA", selectable, new Set(["Ah"]))).toEqual(["AcAd"]);
    expect(enumerateCombosForCell("KQs", selectable, new Set(["Kh"]))).toEqual([]);
    expect.soft(comboCategory("AhAs")).toBe("pair");
    expect.soft(comboCategory("KhQh")).toBe("suited");
    expect.soft(comboCategory("KhQs")).toBe("offsuit");
  });

  it("covers all 1,326 concrete hold'em combinations exactly once", () => {
    const all = new Set<string>();
    for (const cell of allRangeCells()) for (const combo of enumerateCombosForCell(cell, new Set(generateAllCombos()), new Set())) all.add(combo);
    expect(all.size).toBe(1326);
  });
});

function generateAllCombos(): string[] {
  const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  const suits = ["c", "d", "h", "s"];
  const cards = ranks.flatMap((rank) => suits.map((suit) => `${rank}${suit}`));
  const combos: string[] = [];
  for (let first = 0; first < cards.length; first += 1) for (let second = first + 1; second < cards.length; second += 1) combos.push(cards[first]! + cards[second]!);
  return combos;
}
