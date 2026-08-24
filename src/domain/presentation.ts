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

function actorSubject(spot: PublicSpot, actor: Actor): { subject: string; isHero: boolean } {
  const presented = presentActor(spot, actor);
  return {
    subject: presented.role === "You" ? "You" : `Opponent (${presented.position})`,
    isHero: presented.role === "You",
  };
}

function historyActionText(spot: PublicSpot, event: PublicHistoryEvent): string {
  if (event.kind === "action") {
    const { subject, isHero } = actorSubject(spot, event.actor);
    const amount = formatAmount(event.toAmount ?? event.amount, spot.presentation.chipUnit);
    if (event.actionType === "check") return `${subject} ${isHero ? "check" : "checks"}`;
    if (event.actionType === "call") return `${subject} ${isHero ? "call" : "calls"}${amount ? ` ${amount}` : ""}`;
    if (event.actionType === "bet") return `${subject} ${isHero ? "bet" : "bets"}${amount ? ` ${amount}` : ""}`;
    if (event.actionType === "raise") return `${subject} ${isHero ? "raise" : "raises"}${amount ? ` to ${amount}` : ""}`;
    return `${subject} ${isHero ? "fold" : "folds"}`;
  }
  if (event.kind === "deal_board") return `${event.street} · ${event.cards.map(formatCardCode).join(" ")}`;
  if (event.kind === "deal") return `Deal ${formatCardCode(event.card)}`;
  if (event.kind === "deal_hole") return `${presentActor(spot, event.actor).role} receives hole cards`;
  return `${presentActor(spot, event.actor).role} to act`;
}

export type StreetHistoryPresentation = {
  street: "preflop" | "flop" | "turn" | "river";
  label: string;
  cards: string;
  actions: string[];
};

export type HandContextPresentation = {
  streets: StreetHistoryPresentation[];
  summary: string;
};

const POSTFLOP_STREETS = ["flop", "turn", "river"] as const;

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function preflopActionText(spot: PublicSpot): string[] {
  if (spot.preflop.status !== "known") return ["Starting action unavailable"];
  return spot.preflop.actions.map((action) => {
    const { subject, isHero } = actorSubject(spot, action.actor);
    const actor = presentActor(spot, action.actor);
    const amount = formatAmount(action.amountBb, "bb");
    if (action.type === "call") return isHero ? `You call from the ${actor.position}` : `${subject} calls`;
    if (action.type === "open") return `${subject} ${isHero ? "open" : "opens"}${amount ? ` to ${amount}` : ""}`;
    if (action.type === "three_bet") return `${subject} ${isHero ? "3-bet" : "3-bets"}${amount ? ` to ${amount}` : ""}`;
    if (action.type === "four_bet") return `${subject} ${isHero ? "4-bet" : "4-bets"}${amount ? ` to ${amount}` : ""}`;
    if (action.type === "raise") return `${subject} ${isHero ? "raise" : "raises"}${amount ? ` to ${amount}` : ""}`;
    if (action.type === "check") return `${subject} ${isHero ? "check" : "checks"}`;
    return `${subject} ${isHero ? "fold" : "folds"}`;
  });
}

function cardsForStreet(spot: PublicSpot, street: "flop" | "turn" | "river"): string {
  const cards = street === "flop" ? spot.decision.board.slice(0, 3)
    : street === "turn" ? spot.decision.board.slice(3, 4)
      : spot.decision.board.slice(4, 5);
  return cards.map(formatCardCode).join(" ");
}

export function presentHandContext(spot: PublicSpot): HandContextPresentation {
  const actionGroups: Record<"flop" | "turn" | "river", string[]> = { flop: [], turn: [], river: [] };
  let currentStreet: "flop" | "turn" | "river" = "flop";

  for (const event of spot.history) {
    if (event.kind === "deal_board") {
      currentStreet = event.street;
      continue;
    }
    if (event.kind === "deal") {
      const boardIndex = spot.decision.board.indexOf(event.card);
      currentStreet = boardIndex === 4 ? "river" : boardIndex === 3 ? "turn" : currentStreet === "flop" ? "turn" : "river";
      continue;
    }
    if (event.kind === "action") actionGroups[currentStreet].push(historyActionText(spot, event));
  }

  const decisionStreetIndex = POSTFLOP_STREETS.indexOf(spot.decision.street);
  const streets: StreetHistoryPresentation[] = [{
    street: "preflop",
    label: "Preflop",
    cards: "",
    actions: preflopActionText(spot),
  }];
  for (const [index, street] of POSTFLOP_STREETS.entries()) {
    if (index > decisionStreetIndex) break;
    const actions = actionGroups[street];
    if (street === spot.decision.street && actions.length === 0) {
      const actor = presentActor(spot, spot.decision.actor);
      actions.push(actor.role === "You" ? "You act first" : `Opponent (${actor.position}) acts first`);
    }
    streets.push({ street, label: titleCase(street), cards: cardsForStreet(spot, street), actions });
  }

  const summary = streets.map((item) => {
    const cards = item.cards ? ` ${item.cards}` : "";
    const actions = item.actions.length > 0 ? item.actions.join(" → ") : "No action";
    return `${item.label}${cards}: ${actions}`;
  }).join(". ");
  return { streets, summary };
}

export function storyLine(spot: PublicSpot): string {
  return presentHandContext(spot).summary;
}

export function decisionLabel(spot: PublicSpot): string {
  return presentActor(spot, spot.decision.actor).role === "You" ? "Your Decision" : "Opponent Decision";
}

export function formatPercentageBasisPoints(value: number): string {
  const percentage = value / 100;
  return Number.isInteger(percentage) ? String(percentage) : percentage.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
