import { cardAssets, asCardCode } from "../assets/card-assets.js";
import type { PublicSpot, TableState } from "@poker-trainer/contracts";

function Card({ value }: { value: string }) {
  const card = asCardCode(value);
  return <img className="playing-card" src={cardAssets.face(card)} alt={cardAssets.accessibleName(card)} />;
}

function CardBack() { return <img className="playing-card" src={cardAssets.back()} alt="Face-down playing card" />; }

export function PokerTable({ spot, state }: { spot: PublicSpot; state: TableState }) {
  const hero = spot.presentation.heroActor;
  const opponent = hero === "ip" ? "oop" : "ip";
  const heroCards = [spot.featuredCombo.slice(0, 2), spot.featuredCombo.slice(2, 4)];
  const unit = spot.presentation.chipUnit === "bb" ? "bb" : "chips";
  const Seat = ({ actor, isHero, placement }: { actor: "ip" | "oop"; isHero: boolean; placement: "top" | "bottom" }) => <div className={`table-seat table-seat--${placement} ${state.actor === actor ? "table-seat--active" : ""}`}>
    <div className="seat-heading"><strong>{spot.presentation.positions[actor]}</strong>{spot.presentation.dealerActor === actor && <span className="dealer-button" title="Dealer">D</span>}</div>
    <span>{state.stacks[actor].toFixed(1)} {unit}</span>
    <div className="hole-cards" aria-label={isHero ? `Hero hand: ${heroCards.join(" ")}` : "Opponent hand hidden"}>{isHero ? heroCards.map((card) => <Card key={card} value={card} />) : <><CardBack /><CardBack /></>}</div>
    {isHero && <small>Hero</small>}
  </div>;
  return <section className="table-wrap"><div className="poker-table" aria-label="Poker table">
    <Seat actor={opponent} isHero={false} placement="top" />
    <div className="table-center">
      <div className="board" aria-label={`Board: ${state.board.join(", ")}`}>{state.board.map((card) => <Card key={card} value={card} />)}</div>
      <p className="pot"><span>Pot</span><strong>{state.pot.toFixed(1)} {unit}</strong></p>
    </div>
    <Seat actor={hero} isHero placement="bottom" />
    <p className="table-meta"><span>{state.street}</span><strong>{spot.presentation.positions[state.actor]} to act</strong></p>
  </div></section>;
}
