import { useEffect, useMemo, useReducer, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { AttemptRequest, PublicHistoryEvent } from "@poker-trainer/contracts";
import { api } from "../../api/client.js";
import { ActionAllocator } from "../../components/ActionAllocator.js";
import { PokerTable } from "../../components/PokerTable.js";
import { RangeGrid } from "../../components/RangeGrid.js";
import { ResultsPanel } from "../../components/ResultsPanel.js";
import { equalAllocation, isValidAllocation } from "../../domain/allocations.js";
import { initialPlayback, reducePlayback, visibleHistory } from "../../domain/playback.js";

function historyLabel(event: PublicHistoryEvent): string { return event.kind === "deal" ? `Deal ${event.card}` : `${event.actor.toUpperCase()} ${event.solverLabel}`; }

export function ChallengePage() {
  const { spotId = "" } = useParams();
  const query = useQuery({ queryKey: ["spot", spotId], queryFn: () => api.spot(spotId), enabled: spotId.length > 0 });
  const playbackKey = `poker-trainer:playback:${spotId}`;
  const [playback, dispatch] = useReducer((state: ReturnType<typeof initialPlayback>, action: Parameters<typeof reducePlayback>[1]) => reducePlayback(state, action, query.data?.history ?? []), undefined, () => {
    if (typeof window === "undefined") return initialPlayback();
    try {
      const saved = window.localStorage.getItem(playbackKey);
      if (!saved) return initialPlayback();
      const parsed = JSON.parse(saved) as ReturnType<typeof initialPlayback>;
      return typeof parsed.eventIndex === "number" && typeof parsed.phase === "string" ? { ...initialPlayback(), ...parsed } : initialPlayback();
    } catch { return initialPlayback(); }
  });
  useEffect(() => { try { window.localStorage.setItem(playbackKey, JSON.stringify(playback)); } catch { /* storage is optional */ } }, [playback, playbackKey]);
  const [selected, setSelected] = useState<string[]>([]);
  const [allocationByCombo, setAllocationByCombo] = useState<Record<string, Record<string, number>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.submit>> | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const spot = query.data;
  const actions = spot?.legalActions ?? [];
  const ids = useMemo(() => actions.map((action) => action.id), [actions]);
  const blocked = useMemo(() => new Set(spot?.decision.board ?? []), [spot?.decision.board]);
  if (query.isLoading) return <p className="loading" role="status">Loading challenge…</p>;
  if (query.isError || !spot) return <section className="panel error"><h1>Challenge unavailable</h1><p>{query.error instanceof Error ? query.error.message : "This spot could not be loaded."}</p><button type="button" onClick={() => void query.refetch()}>Retry</button></section>;
  const loadedSpot = spot;
  const featuredCombo = loadedSpot.featuredCombo;

  function toggleCombo(combo: string) {
    if (combo === featuredCombo) return;
    setSelected((current) => current.includes(combo) ? current.filter((value) => value !== combo) : current.length >= 20 ? current : [...current, combo]);
    setAllocationByCombo((current) => current[combo] ? current : { ...current, [combo]: equalAllocation(ids) });
  }
  function allocationFor(combo: string) { return allocationByCombo[combo] ?? equalAllocation(ids); }
  async function submit() {
    const combos = [featuredCombo, ...selected.filter((combo) => combo !== featuredCombo)];
    if (combos.some((combo) => !isValidAllocation(allocationFor(combo), ids))) { setSubmitError("Every selected hand must total exactly 100%."); return; }
    const payload: AttemptRequest = { spotVersionId: loadedSpot.spotVersionId, idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, hands: combos.map((combo) => ({ combo, allocations: allocationFor(combo) })) };
    setSubmitError(undefined); setSubmitted(true);
    try { setResult(await api.submit(loadedSpot.spotId, payload)); } catch (error) { setSubmitted(false); setSubmitError(error instanceof Error ? error.message : "Submission failed"); }
  }
  if (result) return <ResultsPanel result={result} onRetry={() => { setResult(undefined); setSubmitted(false); dispatch({ type: "replay" }); }} />;
  const visible = visibleHistory(spot, playback);
  const answering = playback.phase === "answering";
  return <section><div className="page-heading"><div><p className="eyebrow">{spot.presentation.positions[spot.presentation.heroActor]} · {spot.decision.street}</p><h1>What is your strategy?</h1></div><span className="featured">Featured: {featuredCombo}</span></div><div className="challenge-layout"><div><PokerTable spot={spot} state={answering ? spot.decision : spot.initialState} /><section className="panel"><h2>Hand history</h2><ol className="history">{visible.map((event, index) => <li key={`${index}-${event.kind}`}>{historyLabel(event)}</li>)}{!visible.length && <li>Preflop setup</li>}</ol><div className="challenge-controls">{playback.phase === "introduction" && <button type="button" onClick={() => dispatch({ type: "start" })}>Start replay</button>}{playback.phase !== "introduction" && !answering && !playback.paused && <button type="button" onClick={() => dispatch({ type: "pause" })}>Pause</button>}{playback.paused && <button type="button" onClick={() => dispatch({ type: "resume" })}>Resume</button>}{playback.phase !== "introduction" && !answering && <button type="button" onClick={() => dispatch({ type: "next" })}>Next action</button>}{!answering && <button type="button" onClick={() => dispatch({ type: "skip" })}>Skip to decision</button>}{answering && <button type="button" onClick={() => dispatch({ type: "replay" })}>Replay history</button>}<button type="button" aria-pressed={playback.soundEnabled} onClick={() => dispatch({ type: "toggle_sound" })}>{playback.soundEnabled ? "Sound on" : "Sound off"}</button></div></section></div><div><section className="panel"><h2>Your answer</h2><p>Start with <strong className="featured">{featuredCombo}</strong>. Add up to 19 more hands for a range drill.</p><ActionAllocator actions={actions} value={allocationFor(featuredCombo)} onChange={(next) => setAllocationByCombo((current) => ({ ...current, [featuredCombo]: next }))} disabled={!answering || submitted} />{selected.map((combo) => <ActionAllocator key={combo} actions={actions} value={allocationFor(combo)} onChange={(next) => setAllocationByCombo((current) => ({ ...current, [combo]: next }))} disabled={!answering || submitted} />)}{answering && <button className="primary-button" type="button" disabled={submitted} onClick={() => void submit()}>Submit answer</button>}{submitError && <p className="error" role="alert">{submitError}</p>}</section><RangeGrid featuredCombo={featuredCombo} selectable={spot.selectableCombos} selected={[featuredCombo, ...selected]} blocked={blocked} onToggle={toggleCombo} /></div></div></section>;
}
