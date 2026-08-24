import { useState } from "react";
import type { PublicSpot } from "@poker-trainer/contracts";
import { presentHandContext } from "../../domain/presentation.js";
import { StartingRangesModal } from "../../components/StartingRangesModal.js";

export function HandContext({ spot }: { spot: PublicSpot }) {
  const [rangesOpen, setRangesOpen] = useState(false);
  const context = presentHandContext(spot);
  return <section className="hand-context" aria-label="Hand context">
    <div className="hand-context__header">
      <h2>Hand history</h2>
      {spot.preflop.status === "known" && <button className="secondary-button range-trigger" type="button" onClick={() => setRangesOpen(true)}>View starting ranges</button>}
    </div>
    <ol className="street-history" aria-label={context.summary}>
      {context.streets.map((street) => <li className="street-history__row" key={street.street}>
        <div className="street-history__street"><strong>{street.label}</strong>{street.cards && <span>{street.cards}</span>}</div>
        <p>{street.actions.join(" → ")}</p>
      </li>)}
    </ol>
    {spot.preflop.status === "unknown" && <p className="context-note">Preflop details were not saved for this spot.</p>}
    <StartingRangesModal open={rangesOpen} spot={spot} onClose={() => setRangesOpen(false)} />
  </section>;
}
