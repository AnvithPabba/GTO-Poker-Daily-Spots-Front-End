import { cardAssets, asCardCode } from "../assets/card-assets.js";
import type { PublicSpot, TableState } from "@poker-trainer/contracts";
import { formatAmount, formatCardCode, formatHand, presentActor, turnLabel } from "../domain/presentation.js";

function Card({ value }: { value: string }) {
  const card = asCardCode(value);
  return <img className="playing-card" src={cardAssets.face(card)} alt={cardAssets.accessibleName(card)} />;
}

function CardBack() { return <img className="playing-card" src={cardAssets.back()} alt="Face-down playing card" />; }

export function PokerTable({ spot, state }: { spot: PublicSpot; state: TableState }) {
  const hero = spot.presentation.heroActor;
  const opponent = hero === "ip" ? "oop" : "ip";
  const heroCards = [spot.featuredCombo.slice(0, 2), spot.featuredCombo.slice(2, 4)];
  const Seat = ({ actor, isHero, placement }: { actor: "ip" | "oop"; isHero: boolean; placement: "top" | "bottom" }) => { const presented = presentActor(spot, actor); return <div className={`table-seat table-seat--${placement} ${state.actor === actor ? "table-seat--active" : ""}`}>
    <div className="seat-heading"><strong>{presented.seatLabel}</strong>{spot.presentation.dealerActor === actor && <span className="dealer-button" title="Dealer">D</span>}<small>{presented.laneDescription}</small></div>
    <span>{formatAmount(state.stacks[actor], spot.presentation.chipUnit)}</span>
    <div className="hole-cards" aria-label={isHero ? `Your hand: ${formatHand(spot.featuredCombo)}` : "Opponent hand hidden"}>{isHero ? heroCards.map((card) => <Card key={card} value={card} />) : <><CardBack /><CardBack /></>}</div>
    {isHero && <small>Your hand</small>}
  </div>; };
  return <section className="table-wrap"><div className="poker-table" aria-label="Poker table">
    <Seat actor={opponent} isHero={false} placement="top" />
    <div className="table-center">
      <div className="board" aria-label={`Board: ${state.board.map(formatCardCode).join(", ")}`}>{state.board.map((card) => <Card key={card} value={card} />)}</div>
      <p className="pot"><span>Pot</span><strong>{formatAmount(state.pot, spot.presentation.chipUnit)}</strong></p>
    </div>
    <Seat actor={hero} isHero placement="bottom" />
    <p className="table-meta"><strong>{turnLabel(spot, state.actor)}</strong></p>
  </div></section>;
}
