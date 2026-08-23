import type { LegalAction, PublicHistoryEvent, PublicSpot, TableState } from "@poker-trainer/contracts";

export type Actor = "ip" | "oop";

export type ActorPresentation = {
  actor: Actor;
  role: "You" | "Opponent";
  position: string;
  lane: "IP" | "OOP";
  label: string;
};

export function presentActor(spot: PublicSpot, actor: Actor): ActorPresentation {
  const isHero = spot.presentation.heroActor === actor;
  const lane = actor.toUpperCase() as "IP" | "OOP";
  const position = spot.presentation.positions[actor];
  return { actor, role: isHero ? "You" : "Opponent", position, lane, label: `${isHero ? "You" : "Opponent"} · ${position} · ${lane}` };
}

const SUIT_GLYPHS: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
const RANK_NAMES: Record<string, string> = { A: "Ace", K: "King", Q: "Queen", J: "Jack", T: "Ten" };

export function formatCardCode(card: string): string {
  const rank = card.slice(0, 1);
  const suit = card.slice(1, 2).toLowerCase();
  return `${rank}${SUIT_GLYPHS[suit] ?? suit}`;
}

export function readableCard(card: string): string {
  const rank = RANK_NAMES[card.slice(0, 1)] ?? card.slice(0, 1);
  const suitNames: Record<string, string> = { s: "spades", h: "hearts", d: "diamonds", c: "clubs" };
  return `${rank} of ${suitNames[card.slice(1, 2).toLowerCase()] ?? card.slice(1, 2)}`;
}

export function formatAmount(amount: number | undefined, unit: PublicSpot["presentation"]["chipUnit"]): string | undefined {
  if (amount === undefined) return undefined;
  return `${Number.isInteger(amount) ? amount : amount.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} ${unit === "bb" ? "bb" : "chips"}`;
}

export function effectiveStack(state: TableState): number {
  return Math.min(state.stacks.ip, state.stacks.oop);
}

export function formatLegalActionLabel(action: LegalAction, unit: PublicSpot["presentation"]["chipUnit"]): string {
  if (action.amount === undefined) return action.displayLabel;
  const formatted = formatAmount(action.amount, unit);
  if (!formatted) return action.displayLabel;
  // The API label is authoritative for the action name; only append the unit
  // to its numeric absolute amount. This keeps dynamic solver sizes intact.
  return /\b(?:bet|raise|call|all[- ]?in)\s+[-+]?\d+(?:\.\d+)?\b/i.test(action.displayLabel)
    ? action.displayLabel.replace(/([-+]?\d+(?:\.\d+)?)(?!.*\d)/, formatted)
    : `${action.displayLabel} · ${formatted}`;
}

function historyActionText(spot: PublicSpot, event: PublicHistoryEvent): string {
  if (event.kind === "action") {
    const actor = presentActor(spot, event.actor);
    return `${actor.role} (${actor.position}) ${event.solverLabel.toLowerCase()}`;
  }
  if (event.kind === "deal_board") return `${event.street} · ${event.cards.map(formatCardCode).join(" ")}`;
  if (event.kind === "deal") return `Deal ${formatCardCode(event.card)}`;
  if (event.kind === "deal_hole") return `${presentActor(spot, event.actor).role} receives hole cards`;
  return `${presentActor(spot, event.actor).role} to act`;
}

export function storyLine(spot: PublicSpot): string {
  const preflop = spot.preflop.status === "known"
    ? spot.preflop.actions.map((action) => `${presentActor(spot, action.actor).role} (${action.position}) ${action.label.replace(`${action.position} `, "").toLowerCase()}`).join(" → ")
    : spot.preflop.label;
  const board = spot.decision.board.map(formatCardCode).join(" ");
  const actor = presentActor(spot, spot.decision.actor);
  const amount = formatAmount(spot.decision.pot, spot.presentation.chipUnit);
  const stack = formatAmount(effectiveStack(spot.decision), spot.presentation.chipUnit);
  const postflop = spot.history.filter((event) => event.kind === "action").map((event) => historyActionText(spot, event)).join(" → ");
  return `${spot.decision.street.toUpperCase()} · ${preflop}${postflop ? ` · ${postflop}` : ""} · ${board} · Pot ${amount ?? "—"} · Effective ${stack ?? "—"} · ${actor.label} to act`;
}

export function decisionLabel(spot: PublicSpot): string {
  return `${spot.decision.street.toUpperCase()} · ${presentActor(spot, spot.decision.actor).role.toUpperCase()} ACTION`;
}
