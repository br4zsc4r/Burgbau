import type { GameEvent } from '../logic/gameEvents';

/**
 * Leise Töne, im Browser erzeugt (Web Audio, keine Dateien, kein Netz).
 * Nur freundliche Klänge bei Erfolgen – bei Fehlern bleibt es still.
 */
export interface Sound {
  play: (event: GameEvent) => void;
}

/** Gesamtlautstärke: bewusst leise fürs Klassenzimmer. */
const VOLUME = 0.12;

interface Note {
  /** Frequenz in Hz */
  freq: number;
  /** Start in Sekunden ab jetzt */
  at: number;
  length: number;
  type?: OscillatorType;
  /** Lautstärke relativ (0–1) */
  level?: number;
  /** Tonhöhe gleitet bis hierhin (z. B. „Plopp“) */
  slideTo?: number;
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.51;
const G6 = 1567.98;

const SOUNDS: Record<GameEvent, readonly Note[]> = {
  correct: [
    { freq: E5, at: 0, length: 0.18 },
    { freq: G5, at: 0.09, length: 0.18 },
    { freq: C6, at: 0.18, length: 0.35 },
  ],
  almost: [{ freq: G5, at: 0, length: 0.2, level: 0.6 }],
  specialOffer: [
    { freq: C6, at: 0, length: 0.15, level: 0.5 },
    { freq: E6, at: 0.07, length: 0.15, level: 0.5 },
    { freq: G6, at: 0.14, length: 0.3, level: 0.5 },
  ],
  pickedUp: [{ freq: 880, at: 0, length: 0.08, level: 0.5, slideTo: 1200 }],
  placed: [{ freq: 300, at: 0, length: 0.16, type: 'triangle', slideTo: 120 }],
  finished: [
    { freq: C5, at: 0, length: 0.2, type: 'triangle' },
    { freq: E5, at: 0.18, length: 0.2, type: 'triangle' },
    { freq: G5, at: 0.36, length: 0.2, type: 'triangle' },
    { freq: C6, at: 0.54, length: 0.6, type: 'triangle' },
    { freq: G5, at: 0.54, length: 0.6, type: 'triangle', level: 0.5 },
  ],
};

export function createSound(enabled: boolean): Sound {
  let context: AudioContext | null = null;

  const audio = (): AudioContext | null => {
    if (!enabled || typeof AudioContext === 'undefined') return null;
    // Erst beim ersten Ton anlegen: Browser erlauben Audio nur nach einer Berührung.
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    return context;
  };

  return {
    play: (event) => {
      const ctx = audio();
      if (ctx === null) return;
      const now = ctx.currentTime;
      for (const note of SOUNDS[event]) {
        const start = now + note.at;
        const end = start + note.length;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.type ?? 'sine';
        osc.frequency.setValueAtTime(note.freq, start);
        if (note.slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(note.slideTo, end);
        // Weicher Einsatz und Ausklang, damit nichts knackt.
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(VOLUME * (note.level ?? 1), start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(end + 0.02);
      }
    },
  };
}
