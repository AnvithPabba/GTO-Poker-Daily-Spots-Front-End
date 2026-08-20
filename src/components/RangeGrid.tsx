import { useMemo, useState } from "react";
import type { SelectableCombo } from "@poker-trainer/contracts";
import { allRangeCells, enumerateCombosForCell } from "../domain/range.js";

type Props = { selectable: SelectableCombo[]; selected: string[]; blocked: Set<string>; onToggle: (combo: string) => void; max?: number; featuredCombo?: string };

export function RangeGrid({ selectable, selected, blocked, onToggle, max = 20, featuredCombo }: Props) {
  const [expandedCell, setExpandedCell] = useState<string | undefined>();
  const available = useMemo(() => new Set(selectable.map((entry) => entry.combo)), [selectable]);
  return <section aria-label="Hand range selector" className="range-panel"><div className="range-header"><h2>Select hands</h2><span>{selected.length}/{max}</span></div><p className="form-hint">Choose a cell, then select individual concrete hands. Board-blocked hands are hidden.</p><div className="range-grid">{allRangeCells().map((cell) => {
    const combos = enumerateCombosForCell(cell, available, blocked);
    const active = combos.some((combo) => selected.includes(combo));
    return <button type="button" className={`range-cell ${active ? "selected" : ""} ${combos.length === 0 ? "blocked" : ""}`} disabled={combos.length === 0} key={cell} aria-label={`${cell}, ${combos.length} selectable combinations`} aria-pressed={expandedCell === cell} onClick={() => setExpandedCell((current) => current === cell ? undefined : cell)}>{cell}</button>;
  })}</div>{expandedCell && (() => {
    const combos = enumerateCombosForCell(expandedCell, available, blocked);
    return <div className="range-details" role="region" aria-label={`${expandedCell} concrete combinations`}><h3>{expandedCell} hands</h3><div className="combo-options">{combos.map((combo) => {
      const isSelected = selected.includes(combo);
      const isFeatured = combo === featuredCombo;
      return <button type="button" className={`combo-button ${isSelected ? "selected" : ""}`} key={combo} aria-pressed={isSelected} disabled={isFeatured || (!isSelected && selected.length >= max)} onClick={() => onToggle(combo)}>{combo}{isFeatured ? " · featured" : ""}</button>;
    })}</div></div>;
  })()}<div className="selected-tray" aria-label="Selected hands">{selected.map((combo) => <button type="button" key={combo} disabled={combo === featuredCombo} onClick={() => onToggle(combo)}>{combo}{combo === featuredCombo ? " · featured" : " ×"}</button>)}</div></section>;
}
