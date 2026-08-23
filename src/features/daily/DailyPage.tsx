import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "../../api/client.js";

export function DailyPage() {
  const query = useQuery({ queryKey: ["today"], queryFn: api.today });
  if (query.isLoading) return <p className="loading" role="status">Loading today’s game…</p>;
  if (query.isError || !query.data) {
    const empty = query.error instanceof ApiError && query.error.code === "SPOT_NOT_AVAILABLE";
    return <section className="panel error-state"><p className="eyebrow">Daily game</p><h1>{empty ? "No published spots yet" : "Today is unavailable"}</h1><p>{empty ? "A daily game will appear here after a real Solver spot is imported, approved, scheduled, and published." : query.error instanceof Error ? query.error.message : "Try again later."}</p>{!empty && <button className="secondary-button" type="button" onClick={() => void query.refetch()}>Try again</button>}</section>;
  }
  const game = query.data;
  return <section className="daily-page"><header className="page-heading"><div><p className="eyebrow">{game.date} · Pacific</p><h1>Today’s game</h1><p>{game.progress.completedSpots} of {game.progress.totalSpots} spots complete · {game.progress.scorePoints}/{game.progress.maximumScorePoints} points</p></div><div className="progress-ring" aria-label={`${game.progress.completedSpots} of ${game.progress.totalSpots} complete`}><strong>{game.progress.completedSpots}</strong><span>/{game.progress.totalSpots}</span></div></header>
    {game.fallback.active && <aside className="fallback-banner" role="status"><strong>Latest available game</strong><span>{game.fallback.reason}</span></aside>}
    <ol className="daily-spot-list">{game.spots.map((spot) => <li className={spot.completed ? "spot-complete" : ""} key={spot.spotVersionId}><span className="spot-sequence">{spot.sequence}</span><div><p>{spot.street} · You {spot.heroPosition}</p><h2>{spot.title}</h2><small>{spot.completed ? `${spot.officialScorePoints ?? 0}/1000 official points` : "Not attempted"}</small></div><Link to={`/challenge/${encodeURIComponent(spot.spotId)}`}>{spot.completed ? "Practice" : game.progress.nextSpot?.id === spot.spotId ? "Continue" : "Play"} →</Link></li>)}</ol>
    {game.progress.status === "completed" && <section className="completion-card"><p className="eyebrow">Daily complete</p><h2>{game.progress.scorePoints} points</h2><p>Your official answers are saved. Practice attempts will not replace them.</p><Link className="secondary-button" to="/stats">View statistics</Link></section>}
  </section>;
}
