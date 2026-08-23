import type { LegalAction, PublicHistoryEvent, PublicSpot, TableState } from "@poker-trainer/contracts";

export type Actor = "ip" | "oop";

export type ActorPresentation = {
  actor: Actor;
  role: "You" | "Opponent";
  position: string;
  lane: "IP" | "OOP";
  seatLabel: string;
  laneDescription: "In position" | "Out of position";
  label: string;
};

export function presentActor(spot: PublicSpot, actor: Actor): ActorPresentation {
  const isHero = spot.presentation.heroActor === actor;
  const lane = actor.toUpperCase() as "IP" | "OOP";
  const position = spot.presentation.positions[actor];
  const role = isHero ? "You" : "Opponent";
  const positionLabel = position.toUpperCase() === lane ? position : `${position} · ${lane}`;
  return { actor, role, position, lane, seatLabel: `${role} · ${position}`, laneDescription: lane === "IP" ? "In position" : "Out of position", label: `${role} · ${positionLabel}` };
}

const SUIT_GLYPHS: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
const RANK_NAMES: Record<string, string> = { A: "Ace", K: "King", Q: "Queen", J: "Jack", T: "Ten" };

export function formatCardCode(card: string): string {
  const rank = card.slice(0, 1);
  const suit = card.slice(1, 2).toLowerCase();
  return `${rank}${SUIT_GLYPHS[suit] ?? suit}`;
}

export function formatHand(combo: string): string {
  if (combo.length === 4) return `${formatCardCode(combo.slice(0, 2))} ${formatCardCode(combo.slice(2, 4))}`;
  return combo.split(/\s+/).filter(Boolean).map(formatCardCode).join(" ");
}

export function formatPosition(spot: PublicSpot, actor: Actor): string {
  const presented = presentActor(spot, actor);
  return presented.position.toUpperCase() === presented.lane ? presented.position : `${presented.position} · ${presented.lane}`;
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
  if (action.isAllIn) return `All-in · ${formatted}`;
  const actionName = action.displayLabel;
  return /[-+]?\d+(?:\.\d+)?/.test(actionName)
    ? actionName.replace(/([-+]?\d+(?:\.\d+)?)(?!.*\d)/, formatted)
    : `${actionName} · ${formatted}`;
}

function historyActionText(spot: PublicSpot, event: PublicHistoryEvent): string {
  if (event.kind === "action") {
    const actor = presentActor(spot, event.actor);
    const subject = actor.role === "You" ? "You" : actor.position;
    const amount = formatAmount(event.toAmount ?? event.amount, spot.presentation.chipUnit);
    if (event.actionType === "check") return `${subject} checks`;
    if (event.actionType === "call") return `${subject} calls${amount ? ` ${amount}` : ""}`;
    if (event.actionType === "bet") return `${subject} bets${amount ? ` ${amount}` : ""}`;
    if (event.actionType === "raise") return `${subject} raises${amount ? ` to ${amount}` : ""}`;
    return `${subject} folds`;
  }
  if (event.kind === "deal_board") return `${event.street} · ${event.cards.map(formatCardCode).join(" ")}`;
  if (event.kind === "deal") return `Deal ${formatCardCode(event.card)}`;
  if (event.kind === "deal_hole") return `${presentActor(spot, event.actor).role} receives hole cards`;
  return `${presentActor(spot, event.actor).role} to act`;
}

export function storyLine(spot: PublicSpot): string {
  const preflop = spot.preflop.status === "known"
    ? spot.preflop.actions.map((action) => {
      const actor = presentActor(spot, action.actor);
      const label = action.label.replace(new RegExp(`^${action.position}\\s*`, "i"), "");
      if (action.type === "call") return `${actor.role === "You" ? "You call" : `${action.position} calls`}${actor.role === "You" ? ` from the ${action.position}` : ""}`;
      if (action.type === "open" || action.type === "raise" || action.type === "three_bet" || action.type === "four_bet") {
        const subject = actor.role === "You" ? "You" : action.position;
        const verb = label.toLowerCase().replace(/^opens?\b/, actor.role === "You" ? "open" : "opens");
        return `${subject} ${verb}`;
      }
      return `${actor.role === "You" ? "You" : action.position} ${label.toLowerCase()}`;
    })
      .join(". ") + "."
    : spot.preflop.label;
  const board = spot.decision.board.map(formatCardCode).join(" ");
  const actor = presentActor(spot, spot.decision.actor);
  const amount = formatAmount(spot.decision.pot, spot.presentation.chipUnit);
  const stack = formatAmount(effectiveStack(spot.decision), spot.presentation.chipUnit);
  const postflop = spot.history.filter((event) => event.kind === "action").map((event) => historyActionText(spot, event)).join(". ");
  const street = spot.decision.street.charAt(0).toUpperCase() + spot.decision.street.slice(1);
  const pieces = [preflop.replace(/\.$/, ""), postflop, `${street}: ${board || "—"}`, `Pot: ${amount ?? "—"}`, `Effective stack: ${stack ?? "—"}`].filter(Boolean);
  pieces.push(actor.role === "You" ? "You are first to act" : `${actor.position} acts first`);
  return `${pieces.join(". ")}.`;
}

export function decisionLabel(spot: PublicSpot): string {
  const street = spot.decision.street.charAt(0).toUpperCase() + spot.decision.street.slice(1);
  return `${street} · ${presentActor(spot, spot.decision.actor).role === "You" ? "Your Decision" : "Opponent Decision"}`;
}

export function turnLabel(spot: PublicSpot, actor: Actor = spot.decision.actor): string {
  const street = spot.decision.street.charAt(0).toUpperCase() + spot.decision.street.slice(1);
  return `${street} · ${presentActor(spot, actor).role === "You" ? "Your turn" : "Opponent turn"}`;
}

export function formatPercentageBasisPoints(value: number): string {
  const percentage = value / 100;
  return Number.isInteger(percentage) ? String(percentage) : percentage.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
