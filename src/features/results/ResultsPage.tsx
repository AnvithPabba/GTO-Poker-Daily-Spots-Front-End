import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import { RangeMatrix } from "../../components/RangeMatrix.js";
import { formatBasisPoints } from "../../domain/allocations.js";
import { handClassForCombo } from "../../domain/range.js";
import { formatHand, formatLegalActionLabel } from "../../domain/presentation.js";

export function ResultsPage() {
  const { attemptId = "" } = useParams();
  const query = useQuery({ queryKey: ["attempt", attemptId], queryFn: () => api.attempt(attemptId), enabled: Boolean(attemptId) });
  const spotQuery = useQuery({ queryKey: ["spot-for-result", query.data?.spotId], queryFn: () => api.spot(query.data!.spotId), enabled: Boolean(query.data?.spotId) });
  const [selectedClass, setSelectedClass] = useState<string>();
  const result = query.data;
  const byClass = useMemo(() => {
    const map = new Map<string, NonNullable<typeof result>["hands"]>();
    for (const hand of result?.hands ?? []) { const cell = handClassForCombo(hand.combo); map.set(cell, [...(map.get(cell) ?? []), hand]); }
    return map;
  }, [result]);
  if (query.isLoading) return <p className="loading" role="status">Loading your result…</p>;
  if (query.isError || !result) return <section className="panel error-state"><h1>Result unavailable</h1><p>{query.error instanceof Error ? query.error.message : "This attempt cannot be loaded."}</p><button type="button" onClick={() => void query.refetch()}>Retry</button></section>;
  const labels = new Map(spotQuery.data?.legalActions.map((action) => [action.id, formatLegalActionLabel(action, spotQuery.data.presentation.chipUnit)]) ?? []);
  const scorePercent = result.score.similarityBasisPoints / 100;
  const selectedHands = selectedClass ? byClass.get(selectedClass) ?? [] : result.hands;
  return <section className="results-page"><header className="result-hero"><div><span className={`attempt-badge attempt-badge--${result.attemptKind}`}>{result.attemptKind === "official" ? "Official result" : "Practice result"}</span><p className="eyebrow">Attempt scored</p><h1>{result.score.points}<small>/1000</small></h1><p>{scorePercent.toFixed(2)}% strategy similarity</p></div><div className="result-actions"><Link className="secondary-button" to={`/challenge/${encodeURIComponent(result.spotId)}`}>Practice again</Link>{result.progress.nextSpot ? <Link className="primary-button" to={`/challenge/${encodeURIComponent(result.progress.nextSpot.id)}`}>Next spot →</Link> : <Link className="primary-button" to="/daily">Daily summary</Link>}</div></header>
    <div className="results-layout"><section className="result-matrix-panel"><div className="section-heading"><div><p className="eyebrow">Range score</p><h2>Submitted hands</h2></div><span>{result.hands.length} hand{result.hands.length === 1 ? "" : "s"}</span></div><p>Only classes you submitted are colored. Select one to inspect exact suits.</p>
      <RangeMatrix label="Submitted hand results" stateFor={(cell) => byClass.has(cell) ? "scored" : "blocked"} disabledFor={(cell) => !byClass.has(cell)} onSelect={setSelectedClass} valueFor={(cell) => { const hands = byClass.get(cell); if (!hands?.length) return undefined; return `${Math.round(hands.reduce((sum, hand) => sum + hand.similarityBasisPoints, 0) / hands.length / 100)}%`; }} />
    </section><section className="result-detail-panel"><div className="section-heading"><div><p className="eyebrow">Action comparison</p><h2>{selectedClass ?? "All submitted hands"}</h2></div>{selectedClass && <button className="text-button" type="button" onClick={() => setSelectedClass(undefined)}>Show all</button>}</div>
      {selectedHands.map((hand) => <article className="result-hand-card" key={hand.combo}><div className="result-hand-heading"><div><strong>{formatHand(hand.combo)}</strong><span>{(hand.similarityBasisPoints / 100).toFixed(2)}% similar</span></div><small>GTO majority: {labels.get(hand.gtoMajorityActionId) ?? hand.gtoMajorityActionId}</small></div>
        <div className="action-comparisons">{hand.actions.map((action) => <div className="action-comparison" key={action.actionId}><div><strong>{labels.get(action.actionId) ?? action.actionId}</strong><span>{action.signedDifferenceBasisPoints > 0 ? "+" : ""}{formatBasisPoints(action.signedDifferenceBasisPoints)} from GTO</span></div><div className="comparison-bars"><label>Your answer <span>{formatBasisPoints(action.submittedBasisPoints)}</span><i style={{ width: `${action.submittedBasisPoints / 100}%` }} /></label><label>GTO <span>{formatBasisPoints(action.gtoBasisPoints)}</span><i className="gto-bar" style={{ width: `${action.gtoBasisPoints / 100}%` }} /></label></div></div>)}</div>
      </article>)}
    </section></div>
  </section>;
}
