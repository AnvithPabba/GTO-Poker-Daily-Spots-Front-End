import { useState } from "react";
import type { PublicSpot } from "@poker-trainer/contracts";
import { presentHandContext } from "../../domain/presentation.js";
import { StartingRangesModal } from "../../components/StartingRangesModal.js";

export function HandContext({ spot }: { spot: PublicSpot }) {
  const [rangesOpen, setRangesOpen] = useState(false);
  const context = presentHandContext(spot);
  return <section className="hand-context" aria-label="Hand context">
    <div className="hand-context__grid" aria-label={context.summary}>
      <div className="hand-context__item hand-context__item--line"><span>Hand so far</span><strong>{context.actionLine}</strong></div>
      <div className="hand-context__item"><span>{context.street}</span><strong>{context.board}</strong></div>
      <div className="hand-context__item"><span>Pot</span><strong>{context.pot}</strong></div>
      <div className="hand-context__item"><span>Effective</span><strong>{context.effectiveStack}</strong></div>
      <div className="hand-context__item hand-context__item--decision"><span>Decision</span><strong>{context.decision}</strong></div>
    </div>
    {spot.preflop.status === "known" && <button className="secondary-button range-trigger" type="button" onClick={() => setRangesOpen(true)}>View starting ranges</button>}
    {spot.preflop.status === "unknown" && <p className="context-note">Preflop start unavailable. No story was guessed.</p>}
    <StartingRangesModal open={rangesOpen} spot={spot} onClose={() => setRangesOpen(false)} />
  </section>;
}
