export type ComboCategory = "pair" | "suited" | "offsuit";

const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
const suits = ["c", "d", "h", "s"] as const;

export function comboCategory(combo: string): ComboCategory {
  if (combo[0] === combo[2]) return "pair";
  return combo[1] === combo[3] ? "suited" : "offsuit";
}

export function rangeCellLabel(row: string, column: string): string {
  if (row === column) return `${row}${column}`;
  const rowIndex = ranks.indexOf(row as typeof ranks[number]);
  const columnIndex = ranks.indexOf(column as typeof ranks[number]);
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

export function allRangeCells(): string[] { return ranks.flatMap((row) => ranks.map((column) => rangeCellLabel(row, column))); }
