import { Link, Route, Routes } from "react-router-dom";
import { DailyPage } from "../features/daily/DailyPage.js";
import { ChallengePage } from "../features/challenge/ChallengePage.js";
import { ArchivePage } from "../features/archive/ArchivePage.js";
import { AdminPage } from "../features/admin/AdminPage.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">Poker Daily Trainer</Link>
        <nav aria-label="Primary navigation">
          <Link to="/daily">Today</Link>
          <Link to="/archive">Archive</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>
      <main className="content"><Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/challenge/:spotId" element={<ChallengePage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/archive/:date" element={<ArchivePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes></main>
    </div>
  );
}

function LandingPage() {
  return <section className="hero-panel">
    <p className="eyebrow">GTO practice, one decision at a time</p>
    <h1>Build a better poker instinct.</h1>
    <p>Replay the hand, allocate your strategy, and compare your answer after you commit.</p>
    <Link className="primary-button" to="/daily">Play today</Link>
  </section>;
}

function NotFound() {
  return <section className="panel"><h1>Page not found</h1><Link to="/">Return home</Link></section>;
}

export default function App() { return <QueryClientProvider client={queryClient}><Layout /></QueryClientProvider>; }
