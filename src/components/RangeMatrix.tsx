import { RANGE_RANKS, allRangeCells } from "../domain/range.js";

type CellState = "available" | "selected" | "blocked" | "scored";
type Props = {
  label: string;
  stateFor: (handClass: string) => CellState;
  onSelect?: (handClass: string) => void;
  disabledFor?: (handClass: string) => boolean;
  valueFor?: (handClass: string) => string | undefined;
};

export function RangeMatrix({ label, stateFor, onSelect, disabledFor, valueFor }: Props) {
  return <div className="matrix-scroll"><div className="range-matrix" role="grid" aria-label={label}>
    <span className="matrix-corner" aria-hidden="true" />
    {RANGE_RANKS.map((rank) => <span className="matrix-heading" key={`column-${rank}`} aria-hidden="true">{rank}</span>)}
    {RANGE_RANKS.map((rank, row) => <div className="matrix-row" role="row" key={`row-${rank}`}>
      <span className="matrix-heading" aria-hidden="true">{rank}</span>
      {allRangeCells().slice(row * 13, row * 13 + 13).map((handClass) => {
        const disabled = disabledFor?.(handClass) ?? false;
        return <button
          className={`range-cell range-cell--${stateFor(handClass)}`}
          type="button"
          role="gridcell"
          key={handClass}
          disabled={disabled}
          aria-label={`${handClass}${valueFor?.(handClass) ? `, ${valueFor(handClass)}` : ""}`}
          onClick={() => onSelect?.(handClass)}
        ><span>{handClass}</span>{valueFor?.(handClass) && <small>{valueFor(handClass)}</small>}</button>;
      })}
    </div>)}
  </div></div>;
}
