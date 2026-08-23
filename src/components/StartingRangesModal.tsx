import { useEffect, useMemo, useRef } from "react";
import type { PublicSpot, PublicStartingRange } from "@poker-trainer/contracts";
import { presentActor } from "../domain/presentation.js";
import { RangeMatrix } from "./RangeMatrix.js";

function StartingRange({ title, range }: { title: string; range: PublicStartingRange }) {
  const weights = useMemo(() => new Map(range.cells.map((cell) => [cell.handClass, cell.inclusionBasisPoints])), [range]);
  return <section className="starting-range">
    <div className="starting-range__heading"><h3>{title}</h3><code>{range.presetId}</code></div>
    <p><strong>{range.label}</strong></p>
    <RangeMatrix
      label={title}
      stateFor={(cell) => { const value = weights.get(cell); return value === undefined ? "blocked" : value < 10_000 ? "partial" : "available"; }}
      disabledFor={() => true}
      valueFor={(cell) => { const value = weights.get(cell); return value === undefined ? undefined : value === 10_000 ? "100%" : `${(value / 100).toFixed(0)}%`; }}
    />
  </section>;
}

type Props = { open: boolean; spot: PublicSpot; onClose: () => void };

export function StartingRangesModal({ open, spot, onClose }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => dialog.current?.querySelector<HTMLElement>("button")?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      restoreFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
    if (event.key !== "Tab" || !dialog.current) return;
    const focusable = [...dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]), [tabindex='0']")];
    if (focusable.length === 0) return;
    if (focusable.length === 1) { event.preventDefault(); focusable[0]!.focus(); return; }
    const first = focusable[0]!; const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  return <div className="modal-backdrop starting-ranges-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="starting-range-modal" role="dialog" aria-modal="true" aria-labelledby="starting-ranges-title" ref={dialog} onKeyDown={onKeyDown}>
      <header className="modal-header"><div><p className="eyebrow">Preflop assumptions</p><h2 id="starting-ranges-title">Starting ranges</h2></div><button className="icon-button" type="button" aria-label="Close starting ranges" onClick={onClose}>×</button></header>
      {spot.preflop.status === "known" ? <>
        <p className="range-legend"><span className="legend-swatch legend-swatch--included" /> Included <span className="legend-swatch legend-swatch--partial" /> Partial <span className="legend-swatch legend-swatch--empty" /> Not in range</p>
        <div className="starting-ranges-modal__grid">
          <StartingRange title={`${presentActor(spot, spot.presentation.heroActor).label} starting range`} range={spot.preflop.rangeAssumptions[spot.presentation.heroActor]} />
          <StartingRange title={`${presentActor(spot, spot.presentation.heroActor === "ip" ? "oop" : "ip").label} starting range`} range={spot.preflop.rangeAssumptions[spot.presentation.heroActor === "ip" ? "oop" : "ip"]} />
        </div>
      </> : <p className="context-note">Preflop start unavailable. No range story was preserved.</p>}
    </div>
  </div>;
}
