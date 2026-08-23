import { useState } from "react";
import type { PublicSpot } from "@poker-trainer/contracts";
import { formatCardCode, formatAmount, presentActor, storyLine } from "../../domain/presentation.js";
import { StartingRangesModal } from "../../components/StartingRangesModal.js";

export function HandContext({ spot }: { spot: PublicSpot }) {
  const [rangesOpen, setRangesOpen] = useState(false);
  const board = spot.decision.board.map(formatCardCode).join(" ");
  const hero = presentActor(spot, spot.presentation.heroActor);
  const opponent = presentActor(spot, spot.presentation.heroActor === "ip" ? "oop" : "ip");
  return <section className="hand-context" aria-label="Hand context">
    <p className="hand-context__story">{storyLine(spot)}</p>
    <div className="hand-context__meta" aria-label="Current hand context"><span>Board <strong>{board || "—"}</strong></span><span>Pot <strong>{formatAmount(spot.decision.pot, spot.presentation.chipUnit) ?? "—"}</strong></span><span>Effective <strong>{formatAmount(Math.min(spot.decision.stacks.ip, spot.decision.stacks.oop), spot.presentation.chipUnit) ?? "—"}</strong></span><span><strong>{hero.label}</strong></span><span><strong>{opponent.label}</strong></span><span><strong>{presentActor(spot, spot.decision.actor).label} to act</strong></span></div>
    {spot.preflop.status === "known" && <button className="secondary-button range-trigger" type="button" onClick={() => setRangesOpen(true)}>View starting ranges</button>}
    {spot.preflop.status === "unknown" && <p className="context-note">Preflop start unavailable. No story was guessed.</p>}
    <StartingRangesModal open={rangesOpen} spot={spot} onClose={() => setRangesOpen(false)} />
  </section>;
}
