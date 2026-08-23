import type { PublicHistoryEvent } from "@poker-trainer/contracts";

type AudioContextConstructor = new () => AudioContext;
type AudioGlobals = typeof globalThis & { webkitAudioContext?: AudioContextConstructor };

/** Keep the cue mapping independent from the browser audio implementation. */
export function eventFrequencies(event: PublicHistoryEvent): number[] {
  if (event.kind === "deal_hole") return [420, 520];
  if (event.kind === "deal_board") return [390, 450, 520];
  if (event.kind === "deal") return [470];
  if (event.kind === "decision") return [660];
  return [280];
}

/**
 * Small, generated cues keep the browser bundle self-contained and avoid
 * autoplay/network failures from external audio files. A future recorded
 * asset provider can implement the same play/enable/dispose boundary.
 */
export class PokerSoundService {
  private context: AudioContext | undefined;

  enable(): void {
    const globals = globalThis as AudioGlobals;
    const Context = globals.AudioContext ?? globals.webkitAudioContext;
    if (!Context) return;
    if (!this.context) {
      try {
        this.context = new Context();
      } catch {
        return;
      }
    }
    void this.context.resume().catch(() => undefined);
    this.tone(560, 0.05, 0);
  }

  play(event: PublicHistoryEvent): void {
    if (!this.context) return;
    eventFrequencies(event).forEach((frequency, index) => this.tone(frequency, 0.07, index * 0.045));
  }

  dispose(): void {
    if (!this.context) return;
    void this.context.close().catch(() => undefined);
    this.context = undefined;
  }

  private tone(frequency: number, duration: number, delay: number): void {
    if (!this.context) return;
    const now = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.015);
  }
}

export function createPokerSoundService(): PokerSoundService { return new PokerSoundService(); }
