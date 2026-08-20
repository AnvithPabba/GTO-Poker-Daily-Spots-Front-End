import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";

export function ArchivePage() {
  const { date } = useParams();
  const query = useQuery({ queryKey: ["archive", date ?? "all"], queryFn: () => api.archive() });
  if (query.isLoading) return <p className="loading" role="status">Loading archive…</p>;
  if (query.isError) return <section className="panel error"><h1>Archive unavailable</h1><button type="button" onClick={() => void query.refetch()}>Retry</button></section>;
  const data = query.data;
  if (!data) return <p className="loading" role="status">No archive response.</p>;
  const spots = data.spots.filter((spot) => !date || spot.publicationDate === date);
  return <section className="panel"><p className="eyebrow">Practice history</p><h1>{date ?? "Archive"}</h1>{spots.length === 0 ? <p>No published spots match this date.</p> : <ul className="spot-list">{spots.map((spot) => <li key={spot.spotVersionId}><Link to={`/challenge/${encodeURIComponent(spot.spotId)}`}><strong>{spot.publicationDate} · {spot.title}</strong><br /><small>{spot.completed ? "Completed" : "Not attempted"}</small></Link></li>)}</ul>}</section>;
}
