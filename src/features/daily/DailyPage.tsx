import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";

export function DailyPage() {
  const query = useQuery({ queryKey: ["today"], queryFn: api.today });
  if (query.isLoading) return <p className="loading" role="status">Loading today’s spots…</p>;
  if (query.isError) return <section className="panel error"><h1>Today is unavailable</h1><p>{query.error instanceof Error ? query.error.message : "Try again later."}</p><button type="button" onClick={() => void query.refetch()}>Retry</button></section>;
  const data = query.data;
  if (!data) return <p className="loading" role="status">No daily response.</p>;
  return <section className="panel"><div className="page-heading"><div><p className="eyebrow">{data.publicationDate} · Pacific</p><h1>Today’s spots</h1></div>{data.isFallback && <p className="featured">Fallback from {data.fallbackFromDate}</p>}</div>{data.spots.length === 0 ? <p>No spots have been published yet.</p> : <ol className="spot-list">{data.spots.map((spot) => <li key={spot.spotVersionId}><Link to={`/challenge/${encodeURIComponent(spot.spotId)}`}><strong>Spot {spot.slotOrder} · {spot.title}</strong><br /><small>{spot.completed ? "Completed · practice again" : "Start challenge"}</small></Link></li>)}</ol>}</section>;
}
