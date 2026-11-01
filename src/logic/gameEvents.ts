import { getPiece, rarityOf } from '../data/pieces';
import type { GameState } from '../types';

/**
 * Was gerade passiert ist – für Töne und kleine Animationen.
 * Falsche Antworten erzeugen bewusst kein Ereignis (keine Strafsounds).
 */
export type GameEvent =
  /** Antwort richtig */
  | 'correct'
  /** „Fast!“ – zweiter Versuch */
  | 'almost'
  /** Im Angebot ist ein seltenes Teil */
  | 'specialOffer'
  /** Teil aus dem Angebot oder dem Speicher in die Hand genommen */
  | 'pickedUp'
  /** Teil gesetzt oder angedockt */
  | 'placed'
  /** Burg fertig */
  | 'finished';

function placedCount(state: GameState): number {
  return state.grid.pieces.length + state.grid.attachments.length;
}

/** Ereignisse zwischen zwei Spielzuständen (vorher → nachher). */
export function gameEvents(previous: GameState | null, next: GameState): GameEvent[] {
  if (previous === null) return [];
  const events: GameEvent[] = [];
  const answered = previous.quiz.phase === 'answering' && next.quiz.phase === 'feedback';
  if (answered && next.quiz.lastResult?.status === 'correct') events.push('correct');
  if (previous.quiz.attempt === 1 && next.quiz.attempt === 2 && previous.quiz.wordId === next.quiz.wordId) {
    events.push('almost');
  }
  if (previous.step !== 'choosing' && next.step === 'choosing') {
    if (next.offers.some((id) => rarityOf(getPiece(id)) !== 'common')) events.push('specialOffer');
  }
  if (previous.pendingPiece === null && next.pendingPiece !== null) events.push('pickedUp');
  if (placedCount(next) > placedCount(previous)) events.push('placed');
  if (previous.step !== 'finished' && next.step === 'finished') events.push('finished');
  return events;
}
