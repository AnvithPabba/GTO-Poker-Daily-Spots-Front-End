import { cardAssets, asCardCode } from "../assets/card-assets.js";
import type { PublicSpot, TableState } from "@poker-trainer/contracts";

function Card({ value }: { value: string }) {
  const card = asCardCode(value);
  return <img className="playing-card" src={cardAssets.face(card)} alt={cardAssets.accessibleName(card)} />;
}

export function PokerTable({ spot, state }: { spot: PublicSpot; state: TableState }) {
  const hero = spot.presentation.heroActor;
  const opponent = hero === "ip" ? "oop" : "ip";
  return <section className="poker-table" aria-label="Poker table">
    <div className="table-seat table-seat--top"><strong>{spot.presentation.positions[opponent].toUpperCase()}</strong><span>{state.stacks[opponent].toFixed(1)} {spot.presentation.chipUnit}</span></div>
    <div className="table-center">
      <div className="board" aria-label={`Board: ${state.board.join(", ")}`}>{state.board.map((card) => <Card key={card} value={card} />)}</div>
      <p className="pot">Pot {state.pot.toFixed(1)} {spot.presentation.chipUnit}</p>
    </div>
    <div className="table-seat table-seat--bottom"><strong>{spot.presentation.positions[hero].toUpperCase()} · Hero</strong><span>{state.stacks[hero].toFixed(1)} {spot.presentation.chipUnit}</span></div>
    <p className="table-meta">{state.street} · {state.actor.toUpperCase()} to act</p>
  </section>;
}
