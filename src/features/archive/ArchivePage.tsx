import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";

function iso(value: Date): string { return value.toISOString().slice(0, 10); }

function DateArchive({ date }: { date: string }) {
  const query = useQuery({ queryKey: ["daily-game", date], queryFn: () => api.dailyGame(date) });
  if (query.isLoading) return <p className="loading" role="status">Loading {date}…</p>;
  if (query.isError || !query.data) return <section className="panel error-state"><h1>No game for {date}</h1><p>This date has no published daily game.</p><Link to="/archive">Return to archive</Link></section>;
  return <section><Link className="back-link" to="/archive">← Archive calendar</Link><header className="page-heading"><div><p className="eyebrow">Archive game</p><h1>{date}</h1><p>{query.data.progress.completedSpots}/{query.data.progress.totalSpots} completed</p></div></header><ol className="daily-spot-list">{query.data.spots.map((spot) => <li key={spot.spotVersionId}><span className="spot-sequence">{spot.sequence}</span><div><p>{spot.street} · {spot.heroPosition}</p><h2>{spot.title}</h2></div><Link to={`/challenge/${encodeURIComponent(spot.spotId)}`}>{spot.completed ? "Practice" : "Play"} →</Link></li>)}</ol></section>;
}

export function ArchivePage() {
  const { date } = useParams();
  const [month, setMonth] = useState(() => new Date());
  const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const last = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0));
  const query = useQuery({ queryKey: ["archive", iso(first), iso(last)], queryFn: () => api.dailyGames(iso(first), iso(last)), enabled: !date });
  if (date) return <DateArchive date={date} />;
  if (query.isLoading) return <p className="loading" role="status">Loading archive…</p>;
  if (query.isError || !query.data) return <section className="panel error-state"><h1>Archive unavailable</h1><button type="button" onClick={() => void query.refetch()}>Retry</button></section>;
  const byDate = new Map(query.data.games.map((game) => [game.date, game]));
  const leading = (first.getUTCDay() + 6) % 7;
  const days = Array.from({ length: leading + last.getUTCDate() }, (_, index) => index < leading ? undefined : index - leading + 1);
  return <section className="archive-page"><header className="page-heading"><div><p className="eyebrow">Past daily games</p><h1>Archive</h1><p>Replay any published spot. Archive attempts are practice and do not change historical streaks.</p></div></header>
    <div className="calendar"><header><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}>←</button><h2>{month.toLocaleString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}</h2><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}>→</button></header><div className="calendar-grid">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <strong className="weekday" key={day}>{day}</strong>)}{days.map((day, index) => {
      if (!day) return <span className="calendar-empty" key={`empty-${index}`} />;
      const dateText = `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const game = byDate.get(dateText);
      return game ? <Link className={`calendar-day ${game.status === "completed" ? "calendar-day--complete" : ""}`} to={`/archive/${dateText}`} key={dateText}><strong>{day}</strong><span>{game.completedSpots}/{game.spotCount} spots</span><small>{game.officialScorePoints}/{game.maximumScorePoints}</small></Link> : <span className="calendar-day calendar-day--empty" key={dateText}><strong>{day}</strong><span>No game</span></span>;
    })}</div></div>
  </section>;
}
