import { describe, expect, it } from "vitest";
import { CARD_RANKS, CARD_SUITS, OpenDecksCardAssetProvider, asCardCode } from "./card-assets.js";

describe("OpenDecks card asset provider", () => {
  it("maps every one of the 52 cards to a stable asset URL and label", () => {
    const provider = new OpenDecksCardAssetProvider("/cards");
    const cards = CARD_RANKS.flatMap((rank) => CARD_SUITS.map((suit) => asCardCode(`${rank}${suit}`)));
    expect(cards).toHaveLength(52);
    expect(new Set(cards).size).toBe(52);
    for (const card of cards) {
      expect(provider.face(card)).toBe(`/cards/${card}.png`);
      expect(provider.accessibleName(card)).toMatch(/ of (clubs|diamonds|hearts|spades)$/);
    }
    expect(provider.back()).toBe("/cards/back-blue.png");
  });

  it.each(["ZZ", "Ahh", "1s", "A"])("rejects malformed card code %s", (value) => {
    expect(() => asCardCode(value)).toThrow("Invalid card code");
  });
});
