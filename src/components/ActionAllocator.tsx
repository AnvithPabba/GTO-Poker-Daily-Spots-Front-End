import { useEffect, useMemo, useRef, useState } from "react";
import type { LegalAction } from "@poker-trainer/contracts";
import { allocationTotal, BASIS_POINTS_TOTAL, equalAllocation, formatBasisPoints, isValidAllocation } from "../domain/allocations.js";

type Props = {
  actions: LegalAction[];
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  disabled?: boolean;
  legend?: string;
};

function displayValue(value: number): string { return (value / 100).toFixed(2); }

export function ActionAllocator({ actions, value, onChange, disabled = false, legend = "How often does each action happen?" }: Props) {
  const ids = useMemo(() => actions.map((action) => action.id), [actions]);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(ids.map((id) => [id, displayValue(value[id] ?? 0)])));
  const focused = useRef<string | undefined>(undefined);
  const total = allocationTotal(value);

  useEffect(() => {
    setDrafts((current) => Object.fromEntries(ids.map((id) => [id, focused.current === id ? (current[id] ?? "") : displayValue(value[id] ?? 0)])));
  }, [ids, value]);

  function edit(id: string, raw: string) {
    setDrafts((current) => ({ ...current, [id]: raw }));
    if (raw.trim() === "") return;
    const percentage = Number(raw);
    if (!Number.isFinite(percentage)) return;
    const basisPoints = Math.max(0, Math.min(BASIS_POINTS_TOTAL, Math.round(percentage * 100)));
    onChange({ ...value, [id]: basisPoints });
  }

  function commit(id: string) {
    focused.current = undefined;
    const raw = drafts[id] ?? "";
    const percentage = raw.trim() === "" ? 0 : Number(raw);
    const basisPoints = Number.isFinite(percentage) ? Math.max(0, Math.min(BASIS_POINTS_TOTAL, Math.round(percentage * 100))) : (value[id] ?? 0);
    onChange({ ...value, [id]: basisPoints });
    setDrafts((current) => ({ ...current, [id]: displayValue(basisPoints) }));
  }

  function replace(next: Record<string, number>) {
    setDrafts(Object.fromEntries(ids.map((id) => [id, displayValue(next[id] ?? 0)])));
    onChange(next);
  }

  return <fieldset className="allocator" disabled={disabled}>
    <legend>{legend}</legend>
    {actions.map((action) => <label className="allocation-row" key={action.id}>
      <span>{action.displayLabel}</span>
      <span className="percentage-input">
        <input
          aria-label={`${action.displayLabel} percentage`}
          inputMode="decimal"
          type="text"
          value={drafts[action.id] ?? ""}
          onFocus={() => { focused.current = action.id; }}
          onChange={(event) => edit(action.id, event.target.value)}
          onBlur={() => commit(action.id)}
        />
        <span aria-hidden="true">%</span>
      </span>
    </label>)}
    <div className={`allocation-total ${total === BASIS_POINTS_TOTAL ? "is-valid" : "is-invalid"}`} role="status">
      Total: {formatBasisPoints(total)} {total === BASIS_POINTS_TOTAL ? "✓" : "— needs 100%"}
    </div>
    <div className="allocator-actions">
      <button type="button" onClick={() => replace(equalAllocation(ids))}>Equalize</button>
      <button type="button" onClick={() => replace(Object.fromEntries(ids.map((id) => [id, 0])))}>Reset</button>
    </div>
    {!isValidAllocation(value, ids) && <p className="form-hint">Every legal action is required and the total must be exactly 100%.</p>}
  </fieldset>;
}
