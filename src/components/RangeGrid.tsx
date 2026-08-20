import { useMemo } from "react";
import type { SelectableCombo } from "@poker-trainer/contracts";
import { allRangeCells, enumerateCombosForCell } from "../domain/range.js";

type Props = { selectable: SelectableCombo[]; selected: string[]; blocked: Set<string>; onToggle: (combo: string) => void; max?: number };

export function RangeGrid({ selectable, selected, blocked, onToggle, max = 20 }: Props) {
  const available = useMemo(() => new Set(selectable.map((entry) => entry.combo)), [selectable]);
  return <section aria-label="Hand range selector" className="range-panel"><div className="range-header"><h2>Select hands</h2><span>{selected.length}/{max}</span></div><div className="range-grid">{allRangeCells().map((cell) => {
    const combos = enumerateCombosForCell(cell, available, blocked);
    const active = combos.some((combo) => selected.includes(combo));
    return <button type="button" className={`range-cell ${active ? "selected" : ""} ${combos.length === 0 ? "blocked" : ""}`} disabled={combos.length === 0} key={cell} aria-label={`${cell}, ${combos.length} selectable combinations`} onClick={() => combos.forEach((combo) => { if (selected.includes(combo) || selected.length < max) onToggle(combo); })}>{cell}</button>;
  })}</div><div className="selected-tray" aria-label="Selected hands">{selected.map((combo) => <button type="button" key={combo} onClick={() => onToggle(combo)}>{combo} ×</button>)}</div></section>;
}
