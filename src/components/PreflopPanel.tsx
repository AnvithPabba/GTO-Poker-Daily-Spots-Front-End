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

export function PreflopPanel({ spot }: { spot: PublicSpot }) {
  const [showRanges, setShowRanges] = useState(false);
  const context = spot.preflop;
  return <section className="preflop-panel" aria-labelledby="preflop-heading">
    <div className="preflop-copy"><p className="eyebrow">How we got here</p><h2 id="preflop-heading">{context.label}</h2><p>{context.summary}</p></div>
    {context.status === "known" ? <>
      <ol className="preflop-actions" aria-label="Preflop actions">{context.actions.map((action) => <li key={action.sequence}><span>{action.sequence}</span><strong>{action.label}</strong>{action.amountBb !== undefined && <small>{action.amountBb} bb</small>}</li>)}</ol>
      <button className="secondary-button" type="button" aria-expanded={showRanges} onClick={() => setShowRanges((value) => !value)}>{showRanges ? "Hide starting ranges" : "View starting-range assumptions"}</button>
      {showRanges && <div className="starting-ranges"><StartingRange title={`${spot.presentation.positions.ip} · IP`} range={context.rangeAssumptions.ip} /><StartingRange title={`${spot.presentation.positions.oop} · OOP`} range={context.rangeAssumptions.oop} /></div>}
    </> : <p className="context-note">The original solve did not preserve a trustworthy preflop action sequence. No story has been guessed.</p>}
  </section>;
}
