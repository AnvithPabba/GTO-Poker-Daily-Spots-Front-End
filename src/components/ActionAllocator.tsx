import { useMemo } from "react";
import type { LegalAction } from "@poker-trainer/contracts";
import { allocationTotal, BASIS_POINTS_TOTAL, equalAllocation, formatBasisPoints, isValidAllocation } from "../domain/allocations.js";

type Props = { actions: LegalAction[]; value: Record<string, number>; onChange: (next: Record<string, number>) => void; disabled?: boolean };

export function ActionAllocator({ actions, value, onChange, disabled = false }: Props) {
  const ids = useMemo(() => actions.map((action) => action.id), [actions]);
  const total = allocationTotal(value);
  function setValue(id: string, raw: string) {
    const percentage = Number(raw);
    if (!Number.isFinite(percentage)) return;
    const next = Math.max(0, Math.min(BASIS_POINTS_TOTAL, Math.round(percentage * 100)));
    onChange({ ...value, [id]: next });
  }
  return <fieldset className="allocator" disabled={disabled}>
    <legend>How often does each action happen?</legend>
    {actions.map((action) => <label className="allocation-row" key={action.id}>
      <span>{action.displayLabel}</span>
      <input aria-label={`${action.displayLabel} percentage`} type="number" min="0" max="100" step="0.01" value={((value[action.id] ?? 0) / 100).toFixed(2)} onChange={(event) => setValue(action.id, event.target.value)} />
      <span className="allocation-value">{formatBasisPoints(value[action.id] ?? 0)}</span>
    </label>)}
    <div className={`allocation-total ${total === 10_000 ? "is-valid" : "is-invalid"}`} role="status">Total: {formatBasisPoints(total)} {total === 10_000 ? "✓" : "(must equal 100%)"}</div>
    <div className="allocator-actions"><button type="button" onClick={() => onChange(equalAllocation(ids))}>Equalize</button><button type="button" onClick={() => onChange(Object.fromEntries(ids.map((id) => [id, 0])))}>Reset</button></div>
    {!isValidAllocation(value, ids) && <p className="form-hint">Enter every legal action and make the total exactly 100%.</p>}
  </fieldset>;
}
