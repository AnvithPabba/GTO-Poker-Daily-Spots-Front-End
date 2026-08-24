import type { LegalAction, PublicHistoryEvent, PublicSpot, TableState } from "@poker-trainer/contracts";

export type Actor = "ip" | "oop";

export type ActorPresentation = {
  actor: Actor;
  role: "You" | "Opponent";
  position: string;
  lane: "IP" | "OOP";
  seatLabel: string;
  positionLabel: string;
  label: string;
  isDealer: boolean;
  actsFirstPostflop: boolean;
};

function positionFromPreflop(spot: PublicSpot, actor: Actor): string | undefined {
  if (spot.preflop.status !== "known") return undefined;
  const positions = [...new Set(spot.preflop.actions.filter((action) => action.actor === actor).map((action) => action.position.trim()).filter(Boolean))];
  return positions.length === 1 ? positions[0] : undefined;
}

function resolvedPosition(spot: PublicSpot, actor: Actor): string {
  return positionFromPreflop(spot, actor) ?? spot.presentation.positions[actor];
}

/** Resolve role, position, lane, button, and action order from one spot model. */
export function resolveSpotPlayers(spot: PublicSpot): Record<Actor, ActorPresentation> {
  const positions = { ip: resolvedPosition(spot, "ip"), oop: resolvedPosition(spot, "oop") };
  const create = (actor: Actor): ActorPresentation => {
    const isHero = spot.presentation.heroActor === actor;
    const lane = actor.toUpperCase() as "IP" | "OOP";
    const position = positions[actor];
    const role = isHero ? "You" : "Opponent";
    const positionLabel = position.toUpperCase() === lane ? position : `${position} · ${lane}`;
    return {
      actor,
      role,
      position,
      lane,
      seatLabel: role,
      positionLabel,
      label: `${role} · ${positionLabel}`,
      isDealer: position.toUpperCase() === "BTN",
      actsFirstPostflop: actor === "oop",
    };
  };
  return { ip: create("ip"), oop: create("oop") };
}

export function presentActor(spot: PublicSpot, actor: Actor): ActorPresentation {
  return resolveSpotPlayers(spot)[actor];
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
    const subject = actor.role === "You" ? "You" : `Opponent (${actor.position})`;
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

export type HandContextPresentation = {
  actionLine: string;
  street: string;
  board: string;
  pot: string;
  effectiveStack: string;
  decision: string;
  summary: string;
};

export function presentHandContext(spot: PublicSpot): HandContextPresentation {
  const preflopParts = spot.preflop.status === "known"
    ? spot.preflop.actions.map((action) => {
      const actor = presentActor(spot, action.actor);
      const subject = actor.role === "You" ? "You" : `Opponent (${actor.position})`;
      const amount = formatAmount(action.amountBb, "bb");
      if (action.type === "call") return actor.role === "You" ? `You call from ${actor.position}` : `${subject} calls`;
      if (action.type === "open") return `${subject} ${actor.role === "You" ? "open" : "opens"}${amount ? ` to ${amount}` : ""}`;
      if (action.type === "three_bet") return `${subject} ${actor.role === "You" ? "3-bet" : "3-bets"}${amount ? ` to ${amount}` : ""}`;
      if (action.type === "four_bet") return `${subject} ${actor.role === "You" ? "4-bet" : "4-bets"}${amount ? ` to ${amount}` : ""}`;
      if (action.type === "raise") return `${subject} ${actor.role === "You" ? "raise" : "raises"}${amount ? ` to ${amount}` : ""}`;
      if (action.type === "check") return `${subject} ${actor.role === "You" ? "check" : "checks"}`;
      return `${subject} ${actor.role === "You" ? "fold" : "folds"}`;
    })
    : [spot.preflop.label];
  const board = spot.decision.board.map(formatCardCode).join(" ");
  const actor = presentActor(spot, spot.decision.actor);
  const amount = formatAmount(spot.decision.pot, spot.presentation.chipUnit);
  const stack = formatAmount(effectiveStack(spot.decision), spot.presentation.chipUnit);
  const postflopActions = spot.history.filter((event) => event.kind === "action");
  const postflop = postflopActions.map((event) => historyActionText(spot, event));
  const street = spot.decision.street.charAt(0).toUpperCase() + spot.decision.street.slice(1);
  const decision = postflopActions.length === 0
    ? actor.role === "You" ? "You act first" : `Opponent (${actor.position}) acts first`
    : actor.role === "You" ? "Your action" : `Opponent (${actor.position}) to act`;
  const actionLine = [...preflopParts, ...postflop].join(" → ");
  const summaryDecision = decision === "You act first" ? "You are first to act" : decision;
  return {
    actionLine,
    street,
    board: board || "—",
    pot: amount ?? "—",
    effectiveStack: stack ?? "—",
    decision,
    summary: `${actionLine}. ${street}: ${board || "—"}. Pot: ${amount ?? "—"}. Effective stack: ${stack ?? "—"}. ${summaryDecision}.`,
  };
}

export function storyLine(spot: PublicSpot): string {
  return presentHandContext(spot).summary;
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
