import {
  publicSpotSchema,
  type LegalAction,
  type PublicSpot,
} from "@poker-trainer/contracts";

export {
  asCardCode,
  CARD_RANKS,
  CARD_SUITS,
  cardAssets,
  OpenDecksCardAssetProvider,
} from "./assets/card-assets.js";
export type {
  CardAssetProvider,
  CardBackVariant,
  CardCode,
  CardRank,
  CardSuit,
} from "./assets/card-assets.js";

export function parseChallenge(payload: unknown): PublicSpot {
  return publicSpotSchema.parse(payload);
}

export function actionLabels(spot: PublicSpot): string[] {
  return spot.legalActions.map((action: LegalAction) => action.displayLabel);
}
