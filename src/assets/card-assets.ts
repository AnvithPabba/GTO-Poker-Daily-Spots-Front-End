/**
 * Stable card-art contract for the browser application.
 *
 * UI components depend on CardAssetProvider rather than on a particular deck
 * or filename convention. To replace OpenDecks later, add another provider
 * implementation and inject it at the application boundary; the table and
 * challenge components do not need to change.
 */

export const CARD_RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
] as const;

export const CARD_SUITS = ["c", "d", "h", "s"] as const;

export type CardRank = (typeof CARD_RANKS)[number];
export type CardSuit = (typeof CARD_SUITS)[number];
export type CardCode = `${CardRank}${CardSuit}`;
export type CardBackVariant = "blue" | "red";

export interface CardAssetProvider {
  /** Return the browser URL for a face-up card. */
  face(card: CardCode): string;

  /** Return the browser URL for a card back. */
  back(variant?: CardBackVariant): string;

  /** Return a screen-reader label for a face-up card. */
  accessibleName(card: CardCode): string;
}

const CARD_CODE_PATTERN = /^[2-9TJQKA][cdhs]$/;
const RANK_NAMES: Record<CardRank, string> = {
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  T: "Ten",
  J: "Jack",
  Q: "Queen",
  K: "King",
  A: "Ace",
};
const SUIT_NAMES: Record<CardSuit, string> = {
  c: "clubs",
  d: "diamonds",
  h: "hearts",
  s: "spades",
};

/** Narrow a validated contract card string to the provider's card type. */
export function asCardCode(value: string): CardCode {
  if (!CARD_CODE_PATTERN.test(value)) {
    throw new Error(`Invalid card code: ${value}`);
  }
  return value as CardCode;
}

/**
 * OpenDecks provider using the normalized files in frontend/public/cards.
 *
 * The public paths are deliberately stable (`Ah.png`, `back-blue.png`). The
 * original OpenDecks filenames contain spaces and are an implementation
 * detail of the source repository; the normalization keeps UI code portable.
 */
export class OpenDecksCardAssetProvider implements CardAssetProvider {
  public constructor(
    private readonly basePath = "/cards",
    private readonly defaultBack: CardBackVariant = "blue",
  ) {}

  public face(card: CardCode): string {
    return `${this.basePath}/${card}.png`;
  }

  public back(variant = this.defaultBack): string {
    return `${this.basePath}/back-${variant}.png`;
  }

  public accessibleName(card: CardCode): string {
    const rank = card[0] as CardRank;
    const suit = card[1] as CardSuit;
    return `${RANK_NAMES[rank]} of ${SUIT_NAMES[suit]}`;
  }
}

/** The application-level dependency consumed by future PlayingCard components. */
export const cardAssets: CardAssetProvider = new OpenDecksCardAssetProvider();
