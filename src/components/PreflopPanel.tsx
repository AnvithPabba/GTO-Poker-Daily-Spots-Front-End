import { useMemo, useState } from "react";
import type { PublicSpot, PublicStartingRange } from "@poker-trainer/contracts";
import { RangeMatrix } from "./RangeMatrix.js";

function StartingRange({ title, range }: { title: string; range: PublicStartingRange }) {
  const weights = useMemo(() => new Map(range.cells.map((cell) => [cell.handClass, cell.inclusionBasisPoints])), [range]);
  return <section className="starting-range"><h3>{title}</h3><p><strong>{range.label}</strong><br /><small>Preset: <code>{range.presetId}</code>. Highlighted cells are the assumed preflop starting range. Partial cells show their inclusion frequency.</small></p>
    <RangeMatrix
      label={`${title} starting range`}
      stateFor={(cell) => weights.has(cell) ? "available" : "blocked"}
      disabledFor={() => true}
      valueFor={(cell) => { const value = weights.get(cell); return value === undefined ? undefined : value === 10_000 ? "100%" : `${(value / 100).toFixed(0)}%`; }}
    />
  </section>;
}

/** Compact preflop context used by the unified challenge action history. */
export function PreflopContext({ spot }: { spot: PublicSpot }) {
  const [showRanges, setShowRanges] = useState(false);
  const context = spot.preflop;
  return <div className="preflop-context">
    <p className="history-summary"><strong>{context.label}</strong> · {context.summary}</p>
    {context.status === "known" ? <>
      <button className="secondary-button" type="button" aria-expanded={showRanges} onClick={() => setShowRanges((value) => !value)}>{showRanges ? "Hide starting ranges" : "View starting-range assumptions"}</button>
      {showRanges && <div className="starting-ranges"><StartingRange title={`${spot.presentation.positions.ip} · IP`} range={context.rangeAssumptions.ip} /><StartingRange title={`${spot.presentation.positions.oop} · OOP`} range={context.rangeAssumptions.oop} /></div>}
    </> : <p className="context-note">Preflop context was not preserved. No story has been guessed.</p>}
  </div>;
}

/** Compatibility wrapper for callers that still want only the preflop panel. */
export function PreflopPanel({ spot }: { spot: PublicSpot }) {
  return <section className="preflop-panel" aria-labelledby="preflop-heading"><h2 id="preflop-heading" className="sr-only">Preflop context</h2><PreflopContext spot={spot} /></section>;
}
