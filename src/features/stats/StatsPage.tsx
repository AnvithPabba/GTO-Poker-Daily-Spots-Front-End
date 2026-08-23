import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";

type Breakdown = { key: string; label: string; sampleSize: number; averageScoreBasisPoints: number };
function BreakdownPanel({ title, entries }: { title: string; entries: Breakdown[] }) {
  if (!entries.length) return null;
  return <section className="breakdown-panel"><h2>{title}</h2><div>{entries.map((entry) => <article key={entry.key}><div><strong>{entry.label}</strong><small>{entry.sampleSize} official spots</small></div><b>{(entry.averageScoreBasisPoints / 100).toFixed(1)}%</b></article>)}</div></section>;
}

export function StatsPage() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: api.stats });
  const history = useQuery({ queryKey: ["attempt-history"], queryFn: () => api.attempts(10) });
  if (stats.isLoading || history.isLoading) return <p className="loading" role="status">Loading your statistics…</p>;
  if (stats.isError || !stats.data) return <section className="panel error-state"><h1>Statistics unavailable</h1><p>{stats.error instanceof Error ? stats.error.message : "Try again later."}</p><button onClick={() => void stats.refetch()}>Retry</button></section>;
  return <section className="stats-page"><header className="page-heading"><div><p className="eyebrow">Your progress</p><h1>Statistics</h1><p>Official first attempts drive these numbers. Practice attempts stay visible in history.</p></div></header>
    <div className="stat-grid"><article><span>🔥</span><strong>{stats.data.currentStreak}</strong><small>Current streak</small></article><article><span>🏆</span><strong>{stats.data.bestStreak}</strong><small>Best streak</small></article><article><span>✓</span><strong>{stats.data.dailyGamesCompleted}</strong><small>Daily games</small></article><article><span>♠</span><strong>{stats.data.spotsCompleted}</strong><small>Official spots</small></article><article><span>◎</span><strong>{(stats.data.averageScoreBasisPoints / 100).toFixed(1)}%</strong><small>Average similarity</small></article></div>
    <div className="breakdown-grid"><BreakdownPanel title="By preflop scenario" entries={stats.data.breakdowns.scenarios}/><BreakdownPanel title="By street" entries={stats.data.breakdowns.streets}/><BreakdownPanel title="By hero position" entries={stats.data.breakdowns.positions}/></div>
    {!stats.data.breakdowns.scenarios.length && !stats.data.breakdowns.streets.length && !stats.data.breakdowns.positions.length ? <p className="sample-note">Breakdowns appear after at least three official samples in a category.</p> : null}
    <section className="history-card"><div className="section-heading"><div><p className="eyebrow">Recent play</p><h2>Attempt history</h2></div></div>{!history.data?.attempts.length ? <p>No attempts yet. Your first daily spot will appear here.</p> : <ol>{history.data.attempts.map((attempt) => <li key={attempt.attemptId}><div><strong>{attempt.attemptKind === "official" ? "Official" : "Practice"}</strong><span>{new Date(attempt.createdAt).toLocaleString()}</span></div><b>{attempt.score.points}/1000</b><Link to={`/results/${attempt.attemptId}`}>View result</Link></li>)}</ol>}</section>
  </section>;
}
