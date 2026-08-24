import { useState } from "react";
import type { PublicSpot } from "@poker-trainer/contracts";
import { storyLine } from "../../domain/presentation.js";
import { StartingRangesModal } from "../../components/StartingRangesModal.js";

export function HandContext({ spot }: { spot: PublicSpot }) {
  const [rangesOpen, setRangesOpen] = useState(false);
  return <section className="hand-context" aria-label="Hand context">
    <p className="hand-context__story">{storyLine(spot)}</p>
    {spot.preflop.status === "known" && <button className="secondary-button range-trigger" type="button" onClick={() => setRangesOpen(true)}>View starting ranges</button>}
    {spot.preflop.status === "unknown" && <p className="context-note">Preflop start unavailable. No story was guessed.</p>}
    <StartingRangesModal open={rangesOpen} spot={spot} onClose={() => setRangesOpen(false)} />
  </section>;
}
