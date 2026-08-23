import { useEffect, useRef, useState } from "react";

type Preferences = { sound: boolean; animation: boolean; reducedMotion: boolean; theme: "dark" | "light" };
const defaults: Preferences = { sound: false, animation: true, reducedMotion: false, theme: "dark" };

function readPreferences(): Preferences {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem("poker-trainer:preferences") ?? "{}") }; } catch { return defaults; }
}

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [preferences, setPreferences] = useState(readPreferences);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    localStorage.setItem("poker-trainer:preferences", JSON.stringify(preferences));
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.reduceMotion = String(preferences.reducedMotion);
  }, [preferences]);
  useEffect(() => { if (open) window.requestAnimationFrame(() => dialog.current?.querySelector<HTMLElement>("button, input")?.focus()); }, [open]);
  if (!open) return null;
  const toggle = (key: "sound" | "animation" | "reducedMotion") => setPreferences((current) => ({ ...current, [key]: !current[key] }));
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" ref={dialog} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}><header className="modal-header"><h2 id="settings-title">Settings</h2><button className="icon-button" aria-label="Close settings" onClick={onClose}>×</button></header>
    <label className="setting-row"><span><strong>Sound</strong><small>Action cues; off by default</small></span><input type="checkbox" checked={preferences.sound} onChange={() => toggle("sound")} /></label>
    <label className="setting-row"><span><strong>Replay animation</strong><small>Animate action playback</small></span><input type="checkbox" checked={preferences.animation} onChange={() => toggle("animation")} /></label>
    <label className="setting-row"><span><strong>Reduce motion</strong><small>Skip movement while preserving state</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={() => toggle("reducedMotion")} /></label>
    <fieldset className="theme-choice"><legend>Theme</legend><label><input type="radio" name="theme" checked={preferences.theme === "dark"} onChange={() => setPreferences((current) => ({ ...current, theme: "dark" }))} /> Dark</label><label><input type="radio" name="theme" checked={preferences.theme === "light"} onChange={() => setPreferences((current) => ({ ...current, theme: "light" }))} /> Light</label></fieldset>
  </div></div>;
}
