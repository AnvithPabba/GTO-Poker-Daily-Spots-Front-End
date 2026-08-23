import type { PublicHistoryEvent, PublicSpot } from "@poker-trainer/contracts";
import { useEffect, useMemo, useRef } from "react";
import { PreflopContext } from "../../components/PreflopPanel.js";
import type { PlaybackAction, PlaybackState } from "../../domain/playback.js";
import { createPokerSoundService } from "../../services/poker-sound.js";

function historyLabel(event: PublicHistoryEvent, positions: { ip: string; oop: string }): string {
  if (event.kind === "deal") return `Deal ${event.card}`;
  if (event.kind === "deal_board") return `Deal ${event.street}: ${event.cards.join(" ")}`;
  if (event.kind === "deal_hole") return `${positions[event.actor]} receives hole cards`;
  if (event.kind === "decision") return `Decision · ${positions[event.actor]} to act`;
  return `${positions[event.actor]} ${event.solverLabel}`;
}

type ActionHistoryProps = {
  spot: PublicSpot;
  playback: PlaybackState;
  onPlayback: (action: PlaybackAction) => void;
};

/**
 * Presents the entire hand story in one place. Preflop actions are static
 * context; public history events are the only rows controlled by playback.
 */
export function ActionHistory({ spot, playback, onPlayback }: ActionHistoryProps) {
  const replayedCount = Math.min(playback.eventIndex, spot.history.length);
  const preflopActions = spot.preflop.status === "known" ? spot.preflop.actions : [];
  const answering = playback.phase === "answering";
  const soundService = useMemo(() => createPokerSoundService(), []);
  const previousReplayedCount = useRef(replayedCount);

  useEffect(() => () => soundService.dispose(), [soundService]);
  useEffect(() => {
    if (playback.soundEnabled && replayedCount > previousReplayedCount.current) {
      spot.history.slice(previousReplayedCount.current, replayedCount).forEach((event) => soundService.play(event));
    }
    previousReplayedCount.current = replayedCount;
  }, [playback.soundEnabled, replayedCount, soundService, spot.history]);

  function toggleSound() {
    if (!playback.soundEnabled) soundService.enable();
    onPlayback({ type: "toggle_sound" });
  }

  return <section className="history-panel" aria-labelledby="history-heading">
    <div className="section-heading">
      <h2 id="history-heading">Action history</h2>
      <span aria-label={`${replayedCount} of ${spot.history.length} replay events complete`}>{replayedCount}/{spot.history.length} replayed</span>
    </div>
    <PreflopContext spot={spot} />
    <ol className="history" aria-label="Hand action history">
      {preflopActions.map((action, index) => <li className="history-context" key={`preflop-${action.sequence}`}>
        <span>{index + 1}</span>
        <strong>{action.label}</strong>
        {action.amountBb !== undefined && <small>{action.amountBb} bb</small>}
      </li>)}
      {spot.history.map((event, index) => {
        const isVisible = index < replayedCount;
        return <li className={isVisible ? "history-visible" : "history-future"} key={`${index}-${event.kind}`}>
          <span>{preflopActions.length + index + 1}</span>
          {isVisible ? <span>{historyLabel(event, spot.presentation.positions)}</span> : <span className="history-locked">Locked until replay</span>}
        </li>;
      })}
    </ol>
    <div className="challenge-controls" aria-label="History controls">
      {playback.phase === "introduction" && <button className="primary-button" type="button" onClick={() => onPlayback({ type: "start" })}>Play</button>}
      {playback.phase === "history_playback" && <button type="button" onClick={() => onPlayback({ type: playback.paused ? "resume" : "pause" })}>{playback.paused ? "Resume" : "Pause"}</button>}
      {playback.phase !== "introduction" && !answering && <button type="button" onClick={() => onPlayback({ type: "next" })}>Next action</button>}
      {playback.phase !== "introduction" && <button type="button" onClick={() => onPlayback({ type: "replay" })}>Replay</button>}
      {!answering && <button type="button" onClick={() => onPlayback({ type: "skip" })}>Skip</button>}
      <button type="button" aria-pressed={playback.soundEnabled} onClick={toggleSound}>{playback.soundEnabled ? "Sound on" : "Sound off"}</button>
    </div>
  </section>;
}
