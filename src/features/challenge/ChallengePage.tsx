import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateAttemptRequest } from "@poker-trainer/contracts";
import { api } from "../../api/client.js";
import { ActionAllocator } from "../../components/ActionAllocator.js";
import { HandSelectionModal } from "../../components/HandSelectionModal.js";
import { PokerTable } from "../../components/PokerTable.js";
import { equalAllocation, isValidAllocation } from "../../domain/allocations.js";
import { decisionLabel, formatLegalActionLabel } from "../../domain/presentation.js";
import { HandContext } from "./HandContext.js";

function freshIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChallengePage() {
  const { spotId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["spot", spotId], queryFn: () => api.spot(spotId), enabled: spotId.length > 0 });
  const [selected, setSelected] = useState<string[]>([]);
  const [allocationByCombo, setAllocationByCombo] = useState<Record<string, Record<string, number>>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const pendingSubmission = useRef<{ serialized: string; key: string } | undefined>(undefined);
  const spot = query.data;
  const actions = spot?.legalActions ?? [];
  const actionIds = useMemo(() => actions.map((action) => action.id), [actions]);

  if (query.isLoading) return <p className="loading" role="status">Loading challenge…</p>;
  if (query.isError || !spot) return <section className="panel error-state"><p className="eyebrow">Could not load spot</p><h1>Challenge unavailable</h1><p>{query.error instanceof Error ? query.error.message : "This spot could not be loaded."}</p><button className="secondary-button" type="button" onClick={() => void query.refetch()}>Try again</button></section>;

  const loadedSpot = spot;
  const featured = loadedSpot.featuredCombo;
  const allSelected = [featured, ...selected.filter((combo) => combo !== featured)];
  const blocked = new Set(loadedSpot.decision.board);
  function allocationFor(combo: string) { return allocationByCombo[combo] ?? equalAllocation(actionIds); }
  function updateAllocation(combo: string, next: Record<string, number>) { setAllocationByCombo((current) => ({ ...current, [combo]: next })); }
  function openAdd() { setEditingCombo(undefined); setModalOpen(true); }
  function edit(combo: string) { setEditingCombo(combo); setModalOpen(true); }
  function saveHand(combo: string, allocation: Record<string, number>) {
    if (combo !== featured && !selected.includes(combo)) setSelected((current) => current.length >= 19 ? current : [...current, combo]);
    updateAllocation(combo, allocation); setModalOpen(false); setEditingCombo(undefined);
  }
  function remove(combo: string) {
    if (combo === featured) return;
    setSelected((current) => current.filter((item) => item !== combo));
    setAllocationByCombo((current) => { const next = { ...current }; delete next[combo]; return next; });
  }
  async function submit() {
    if (!allSelected.every((combo) => isValidAllocation(allocationFor(combo), actionIds))) { setSubmitError("Every saved hand must total exactly 100%."); return; }
    const payload: CreateAttemptRequest = { spotVersionId: loadedSpot.spotVersionId, hands: allSelected.map((combo) => ({ combo, allocations: allocationFor(combo) })) };
    const serialized = JSON.stringify(payload);
    if (pendingSubmission.current?.serialized !== serialized) pendingSubmission.current = { serialized, key: freshIdempotencyKey() };
    setSubmitting(true); setSubmitError(undefined);
    try {
      const result = await api.submit(loadedSpot.spotId, payload, pendingSubmission.current!.key);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["today"] }), queryClient.invalidateQueries({ queryKey: ["stats"] })]);
      navigate(`/results/${encodeURIComponent(result.attemptId)}`, { state: { created: result } });
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "The answer could not be submitted."); setSubmitting(false); }
  }

  return <section className="challenge-page">
    <header className="challenge-heading"><div><h1>{decisionLabel(loadedSpot)}</h1></div><div className="featured-pill"><span>Your hand</span><strong>{featured}</strong></div></header>
    <HandContext spot={loadedSpot} />
    <div className="game-layout"><div className="game-column">
      <PokerTable spot={loadedSpot} state={loadedSpot.decision} />
    </div><aside className="answer-column" aria-labelledby="answer-heading">
      <div className="answer-header"><p className="eyebrow">Your strategy</p><h2 id="answer-heading">{featured}</h2><p>Set a percentage for each move.</p></div>
      <ActionAllocator actions={actions} labelFor={(action) => formatLegalActionLabel(action, loadedSpot.presentation.chipUnit)} value={allocationFor(featured)} onChange={(next) => updateAllocation(featured, next)} disabled={submitting} legend={`${featured} action percentages`} />
      <section className="saved-hands" aria-labelledby="saved-hands-heading"><div className="section-heading"><h3 id="saved-hands-heading">Extra hands</h3><span>{allSelected.length}/20</span></div><p>Optional extra hands.</p>
        <div className="saved-hand-list">{allSelected.map((combo) => <article className="saved-hand" key={combo}><div><strong>{combo}</strong><small>{combo === featured ? "Featured · required" : isValidAllocation(allocationFor(combo), actionIds) ? "Ready" : "Needs 100%"}</small></div><div><button type="button" onClick={() => edit(combo)}>Edit</button>{combo !== featured && <button type="button" onClick={() => remove(combo)}>Remove</button>}</div></article>)}</div>
        <button className="secondary-button full-width" type="button" onClick={openAdd} disabled={allSelected.length >= 20}>+ Add another hand</button>
      </section>
      {submitError && <p className="inline-error" role="alert">{submitError}</p>}
      <button className="submit-button" type="button" disabled={submitting || !allSelected.every((combo) => isValidAllocation(allocationFor(combo), actionIds))} onClick={() => void submit()}>{submitting ? "Scoring…" : `Submit ${allSelected.length === 1 ? "answer" : `${allSelected.length} hands`}`}</button>
      <p className="privacy-note">GTO is revealed after submission.</p>
    </aside></div>
    <HandSelectionModal open={modalOpen} selectable={loadedSpot.selectableCombos} selected={allSelected} featuredCombo={featured} blockedCards={blocked} actions={actions} allocations={allocationByCombo} chipUnit={loadedSpot.presentation.chipUnit} {...(editingCombo ? { editingCombo } : {})} onClose={() => { setModalOpen(false); setEditingCombo(undefined); }} onSave={saveHand} />
  </section>;
}
