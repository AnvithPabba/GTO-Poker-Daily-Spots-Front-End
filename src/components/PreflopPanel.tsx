import type { PublicSpot } from "@poker-trainer/contracts";
import { HandContext } from "../features/challenge/HandContext.js";

/** Compatibility wrapper. The challenge now renders one static hand context. */
export function PreflopPanel({ spot }: { spot: PublicSpot }) {
  return <HandContext spot={spot} />;
}
