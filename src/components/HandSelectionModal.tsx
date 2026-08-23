import { useEffect, useMemo, useRef, useState } from "react";
import type { LegalAction, PublicSpot, SelectableCombo } from "@poker-trainer/contracts";
import { equalAllocation, isValidAllocation } from "../domain/allocations.js";
import { enumerateCombosForCell, handClassForCombo } from "../domain/range.js";
import { formatHand, formatLegalActionLabel } from "../domain/presentation.js";
import { ActionAllocator } from "./ActionAllocator.js";
import { RangeMatrix } from "./RangeMatrix.js";

type Props = {
  open: boolean;
  selectable: SelectableCombo[];
  selected: string[];
  featuredCombo: string;
  blockedCards: Set<string>;
  actions: LegalAction[];
  allocations: Record<string, Record<string, number>>;
  editingCombo?: string;
  onClose: () => void;
  onSave: (combo: string, allocation: Record<string, number>) => void;
  chipUnit?: PublicSpot["presentation"]["chipUnit"];
};

export function HandSelectionModal(props: Props) {
  const { open, selectable, selected, featuredCombo, blockedCards, actions, allocations, editingCombo, onClose, onSave, chipUnit = "bb" } = props;
  const dialog = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const available = useMemo(() => new Set(selectable.map((item) => item.combo)), [selectable]);
  const availableClasses = useMemo(() => new Set(selectable.map((item) => handClassForCombo(item.combo))), [selectable]);
  const [handClass, setHandClass] = useState<string>();
  const [combo, setCombo] = useState<string>();
  const [draft, setDraft] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initialCombo = editingCombo;
    setCombo(initialCombo);
    setHandClass(initialCombo ? handClassForCombo(initialCombo) : undefined);
    setDraft(initialCombo ? (allocations[initialCombo] ?? equalAllocation(actions.map((action) => action.id))) : equalAllocation(actions.map((action) => action.id)));
    const frame = window.requestAnimationFrame(() => dialog.current?.querySelector<HTMLElement>("button:not([disabled]), input")?.focus());
    return () => { window.cancelAnimationFrame(frame); restoreFocus.current?.focus(); };
  }, [actions, allocations, editingCombo, open]);

  if (!open) return null;
  const combos = handClass ? enumerateCombosForCell(handClass, available, blockedCards) : [];
  const ids = actions.map((action) => action.id);
  function chooseCombo(next: string) {
    setCombo(next);
    setDraft(allocations[next] ?? equalAllocation(ids));
  }
  function keyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
    if (event.key !== "Tab" || !dialog.current) return;
    const elements = [...dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])")];
    if (!elements.length) return;
    const first = elements[0]!; const last = elements.at(-1)!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <div className="hand-modal" role="dialog" aria-modal="true" aria-labelledby="hand-modal-title" ref={dialog} onKeyDown={keyDown}>
      <header className="modal-header"><div><p className="eyebrow">Range drill</p><h2 id="hand-modal-title">{editingCombo ? `Edit ${formatHand(editingCombo)}` : "Add another hand"}</h2></div><button className="icon-button" type="button" aria-label="Close hand selector" onClick={onClose}>×</button></header>
      {!combo && <div className="modal-stage"><p><strong>1. Choose a hand class.</strong> Only hands available at this solver node are highlighted.</p>
        <RangeMatrix label="Available hand classes" stateFor={(cell) => selected.some((item) => handClassForCombo(item) === cell) ? "selected" : availableClasses.has(cell) ? "available" : "blocked"} disabledFor={(cell) => !availableClasses.has(cell)} onSelect={(cell) => setHandClass(cell)} />
        {handClass && <section className="suit-picker" aria-label={`${handClass} exact combinations`}><h3>2. Choose exact suits for {handClass}</h3><div>{combos.map((item) => {
          const alreadySelected = selected.includes(item);
          return <button key={item} className={alreadySelected ? "selected" : ""} type="button" disabled={(alreadySelected && item !== editingCombo) || item === featuredCombo} onClick={() => chooseCombo(item)}>{formatHand(item)}{item === featuredCombo ? " · featured" : alreadySelected ? " · saved" : ""}</button>;
        })}</div></section>}
      </div>}
      {combo && <div className="modal-stage"><button className="text-button" type="button" onClick={() => { if (!editingCombo) setCombo(undefined); }}>← {editingCombo ? "Editing saved hand" : "Choose a different hand"}</button>
        <div className="selected-combo-heading"><span className="hole-card-label">{formatHand(combo).split(" ")[0]}</span><span className="hole-card-label">{formatHand(combo).split(" ")[1]}</span><div><h3>{formatHand(combo)}</h3><p>Set a complete strategy for this exact hand.</p></div></div>
        <ActionAllocator actions={actions} labelFor={(action) => formatLegalActionLabel(action, chipUnit)} value={draft} onChange={setDraft} legend="Action frequencies" />
        <button className="primary-button full-width" type="button" disabled={!isValidAllocation(draft, ids)} onClick={() => onSave(combo, draft)}>Save {formatHand(combo)}</button>
      </div>}
    </div>
  </div>;
}
