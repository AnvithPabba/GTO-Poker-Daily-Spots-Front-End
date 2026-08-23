export type ComboCategory = "pair" | "suited" | "offsuit";

export const RANGE_RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
const suits = ["c", "d", "h", "s"] as const;

export function comboCategory(combo: string): ComboCategory {
  if (combo[0] === combo[2]) return "pair";
  return combo[1] === combo[3] ? "suited" : "offsuit";
}

export function rangeCellLabel(row: string, column: string): string {
  if (row === column) return `${row}${column}`;
  const rowIndex = RANGE_RANKS.indexOf(row as typeof RANGE_RANKS[number]);
  const columnIndex = RANGE_RANKS.indexOf(column as typeof RANGE_RANKS[number]);
  return rowIndex < columnIndex ? `${row}${column}s` : `${column}${row}o`;
}

export function enumerateCombosForCell(cell: string, selectable: Set<string>, blocked: Set<string>): string[] {
  const rankA = cell[0];
  const rankB = cell[1];
  const suited = cell.endsWith("s");
  const offsuit = cell.endsWith("o");
  const candidates: string[] = [];
  if (rankA === rankB) {
    for (let first = 0; first < suits.length; first += 1) for (let second = first + 1; second < suits.length; second += 1) candidates.push(`${rankA}${suits[first]}${rankB}${suits[second]}`);
  } else if (suited) {
    for (const suit of suits) candidates.push(`${rankA}${suit}${rankB}${suit}`);
  } else if (offsuit) {
    for (const first of suits) for (const second of suits) if (first !== second) candidates.push(`${rankA}${first}${rankB}${second}`);
  }
  return candidates.filter((combo) => selectable.has(combo) && ![combo.slice(0, 2), combo.slice(2, 4)].some((card) => blocked.has(card)));
}

export function allRangeCells(): string[] { return RANGE_RANKS.flatMap((row) => RANGE_RANKS.map((column) => rangeCellLabel(row, column))); }

export function handClassForCombo(combo: string): string {
  const first = combo[0]!;
  const second = combo[2]!;
  if (first === second) return `${first}${second}`;
  const firstIndex = RANGE_RANKS.indexOf(first as typeof RANGE_RANKS[number]);
  const secondIndex = RANGE_RANKS.indexOf(second as typeof RANGE_RANKS[number]);
  const high = firstIndex < secondIndex ? first : second;
  const low = firstIndex < secondIndex ? second : first;
  return `${high}${low}${combo[1] === combo[3] ? "s" : "o"}`;
}
