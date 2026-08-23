import { useState } from "react";
import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client.js";
import { SettingsDialog } from "../components/SettingsDialog.js";
import { AccountPage } from "../features/account/AccountPage.js";
import { AdminPage } from "../features/admin/AdminPage.js";
import { ArchivePage } from "../features/archive/ArchivePage.js";
import { ChallengePage } from "../features/challenge/ChallengePage.js";
import { DailyPage } from "../features/daily/DailyPage.js";
import { ResultsPage } from "../features/results/ResultsPage.js";
import { StatsPage } from "../features/stats/StatsPage.js";

function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const local = isLocalBrowser();
  const admin = useQuery({ queryKey: ["admin-access"], queryFn: api.adminStatus, enabled: local, retry: false });
  return <div className="app-shell"><header className="site-header"><Link className="brand" to="/"><span className="brand-mark">♠</span><span>Poker Daily</span></Link><nav aria-label="Primary navigation"><NavLink to="/daily">Daily</NavLink><NavLink to="/archive">Archive</NavLink><NavLink to="/stats">Stats</NavLink><button className="nav-button" type="button" onClick={() => setSettingsOpen(true)}>Settings</button><NavLink to="/account">Account</NavLink>{local && admin.isSuccess && <NavLink to="/admin">Admin</NavLink>}</nav></header>
    <main className="content"><Routes><Route path="/" element={<LandingPage />} /><Route path="/daily" element={<DailyPage />} /><Route path="/challenge/:spotId" element={<ChallengeRoute />} /><Route path="/results/:attemptId" element={<ResultsPage />} /><Route path="/archive" element={<ArchivePage />} /><Route path="/archive/:date" element={<ArchivePage />} /><Route path="/stats" element={<StatsPage />} /><Route path="/account" element={<AccountPage />} /><Route path="/admin" element={<AdminRoute />} /><Route path="*" element={<NotFound />} /></Routes></main><footer className="site-footer"><span>Daily GTO decisions, scored against solver strategy.</span><Link to="/archive">Browse archive</Link></footer><SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} /></div>;
}

function isLocalBrowser(): boolean { return typeof location !== "undefined" && ["localhost", "127.0.0.1"].includes(location.hostname); }

function AdminRoute() {
  const local = isLocalBrowser();
  const admin = useQuery({ queryKey: ["admin-access"], queryFn: api.adminStatus, enabled: local, retry: false });
  if (!local || admin.isError || admin.data?.ok !== true) return <NotFound />;
  if (admin.isLoading) return <section className="panel"><p>Checking local admin access…</p></section>;
  return <AdminPage />;
}

function ChallengeRoute() { const { spotId = "" } = useParams(); return <ChallengePage key={spotId} />; }

function LandingPage() {
  const today = useQuery({ queryKey: ["today"], queryFn: api.today, retry: false });
  const stats = useQuery({ queryKey: ["stats"], queryFn: api.stats, retry: false });
  const next = today.data?.progress.nextSpot;
  return <section className="home-page"><div className="home-hero"><div><p className="eyebrow">One GTO decision every day.</p><h1>Build your strategy. Find the leak.</h1><p>Play a real poker spot, then compare your strategy with the solver.</p><Link className="primary-button" to={next ? `/challenge/${encodeURIComponent(next.id)}` : "/daily"}>{today.data?.progress.status === "in_progress" ? "Continue today" : "Play today"} →</Link></div><div className="today-card"><div className="section-heading"><div><p className="eyebrow">Today</p><h2>{today.data?.date ?? "Daily game"}</h2></div><span>{today.data ? `${today.data.progress.completedSpots}/${today.data.progress.totalSpots}` : "—"}</span></div><div className="progress-track"><i style={{ width: today.data?.progress.totalSpots ? `${today.data.progress.completedSpots / today.data.progress.totalSpots * 100}%` : "0%" }} /></div><p>{today.data ? `${today.data.progress.scorePoints} of ${today.data.progress.maximumScorePoints} points` : "Loading today’s progress…"}</p>{today.data?.fallback.active && <small>Showing the latest available game.</small>}</div></div>
    <section className="how-it-works"><p className="eyebrow">How it works</p><h2>A deliberate practice loop</h2><div><article><span>01</span><h3>Read the story</h3><p>See the exact preflop scenario, assumed ranges, board, stacks, and prior actions.</p></article><article><span>02</span><h3>Build a strategy</h3><p>Allocate percentages for the featured hand, then optionally drill up to 19 more.</p></article><article><span>03</span><h3>Compare with GTO</h3><p>Get a score, action-by-action deltas, and exact-combo range results.</p></article></div></section>
    <section className="home-performance"><div><p className="eyebrow">Recent performance</p><h2>{stats.data ? `${(stats.data.averageScoreBasisPoints / 100).toFixed(1)}% average` : "Start your first spot"}</h2><p>{stats.data ? `${stats.data.currentStreak} day streak · ${stats.data.spotsCompleted} official spots` : "Your official first attempts will build a durable progress history."}</p><Link to="/stats">Open statistics →</Link></div><div><p className="eyebrow">Practice library</p><h2>Missed a day?</h2><p>The archive shows availability, completion, and official scores without exposing solutions.</p><Link to="/archive">Browse archive →</Link></div></section>
  </section>;
}

function NotFound() { return <section className="panel"><h1>Page not found</h1><Link to="/">Return home</Link></section>; }
export default function App() { return <Layout />; }
