import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ArchiveResponse } from "@poker-trainer/contracts";
import { api } from "../../api/client.js";

export function ArchivePage() {
  const { date } = useParams();
  const query = useQuery({ queryKey: ["archive", date ?? "all"], queryFn: () => api.archive() });
  const [pages, setPages] = useState<ArchiveResponse[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | undefined>();
  useEffect(() => { setPages([]); setLoadMoreError(undefined); }, [date]);
  if (query.isLoading) return <p className="loading" role="status">Loading archive…</p>;
  if (query.isError) return <section className="panel error"><h1>Archive unavailable</h1><button type="button" onClick={() => void query.refetch()}>Retry</button></section>;
  const data = query.data;
  if (!data) return <p className="loading" role="status">No archive response.</p>;
  const allPages = [data, ...pages];
  const spots = allPages.flatMap((page) => page.spots).filter((spot) => !date || spot.publicationDate === date);
  const nextCursor = allPages.at(-1)?.nextCursor;
  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true); setLoadMoreError(undefined);
    try { const page = await api.archive(nextCursor); setPages((current) => [...current, page]); }
    catch (error) { setLoadMoreError(error instanceof Error ? error.message : "Unable to load more archive spots."); }
    finally { setLoadingMore(false); }
  }
  return <section className="panel"><p className="eyebrow">Practice history</p><h1>{date ?? "Archive"}</h1>{spots.length === 0 ? <p>No published spots match this date.</p> : <ul className="spot-list">{spots.map((spot) => <li key={spot.spotVersionId}><Link to={`/challenge/${encodeURIComponent(spot.spotId)}`}><strong>{spot.publicationDate} · {spot.title}</strong><br /><small>{spot.completed ? "Completed" : "Not attempted"}</small></Link></li>)}</ul>}{loadMoreError && <p className="error" role="alert">{loadMoreError}</p>}{nextCursor && <button type="button" onClick={() => void loadMore()} disabled={loadingMore}>{loadingMore ? "Loading…" : "Load more"}</button>}</section>;
}
