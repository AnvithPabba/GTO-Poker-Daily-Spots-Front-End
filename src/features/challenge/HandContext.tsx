import { useState } from "react";
import type { PublicSpot } from "@poker-trainer/contracts";
import { formatAmount, formatPosition, storyLine } from "../../domain/presentation.js";
import { StartingRangesModal } from "../../components/StartingRangesModal.js";

export function HandContext({ spot }: { spot: PublicSpot }) {
  const [rangesOpen, setRangesOpen] = useState(false);
  const heroActor = spot.presentation.heroActor;
  const opponentActor = heroActor === "ip" ? "oop" : "ip";
  return <section className="hand-context" aria-label="Hand context">
    <p className="hand-context__story">{storyLine(spot)}</p>
    <div className="hand-context__meta" aria-label="Current hand context"><span>Pot <strong>{formatAmount(spot.decision.pot, spot.presentation.chipUnit) ?? "—"}</strong></span><span>Effective stack <strong>{formatAmount(Math.min(spot.decision.stacks.ip, spot.decision.stacks.oop), spot.presentation.chipUnit) ?? "—"}</strong></span><span>You: <strong>{formatPosition(spot, heroActor)}</strong></span><span>Opponent: <strong>{formatPosition(spot, opponentActor)}</strong></span></div>
    {spot.preflop.status === "known" && <button className="secondary-button range-trigger" type="button" onClick={() => setRangesOpen(true)}>View starting ranges</button>}
    {spot.preflop.status === "unknown" && <p className="context-note">Preflop start unavailable. No story was guessed.</p>}
    <StartingRangesModal open={rangesOpen} spot={spot} onClose={() => setRangesOpen(false)} />
  </section>;
}
