import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client.js";

export function AdminPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-jobs"], queryFn: api.adminJobs });
  const calendar = useQuery({ queryKey: ["admin-calendar"], queryFn: api.adminCalendar });
  const coverage = useQuery({ queryKey: ["admin-coverage"], queryFn: api.adminCoverage });
  if (query.isLoading) return <p className="loading" role="status">Loading local queue…</p>;
  if (query.isError) return <section className="panel error"><h1>Admin is local-only</h1><p>{query.error instanceof Error ? query.error.message : "The local API is unavailable."}</p></section>;
  async function mutate(operation: () => Promise<unknown>) { await operation(); await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); }
  return <section className="admin-grid"><section className="panel"><p className="eyebrow">Loopback only</p><h1>Solver queue</h1><p>These controls are intentionally not exposed to public users.</p><ul className="spot-list">{query.data?.map((job) => <li key={job.id}><span><strong>{job.id}</strong><br /><small>{job.status} · attempts {job.attemptCount}/{job.maxAttempts}</small></span><span className="admin-actions"><button type="button" onClick={() => void mutate(() => api.adminRetryJob(job.id))}>Retry</button><button type="button" onClick={() => void mutate(() => api.adminHoldJob(job.id))}>Hold</button><button type="button" onClick={() => { if (window.confirm("Cancel this job?")) void mutate(() => api.adminCancelJob(job.id)); }}>Cancel</button></span></li>)}</ul>{query.data?.length === 0 && <p>No queued jobs.</p>}</section><section className="panel"><p className="eyebrow">Pacific publication slots</p><h2>Calendar</h2>{coverage.data?.belowThree && <p className="error" role="alert">Warning: only {coverage.data.coverage} approved/scheduled spots remain (target {coverage.data.target}).</p>}{calendar.isLoading ? <p>Loading calendar…</p> : calendar.isError ? <p className="error">Calendar unavailable.</p> : <ul className="spot-list">{calendar.data?.map((slot) => <li key={slot.id}><strong>{slot.publicationDate.slice(0, 10)} · slot {slot.slotOrder}</strong><br /><small>{slot.status} · {slot.spotVersionId}</small></li>)}</ul>}{calendar.data?.length === 0 && <p>No scheduled slots in this window.</p>}</section></section>;
}
