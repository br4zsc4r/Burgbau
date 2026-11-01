/** Richtig → +1. Falsch → Serie halbieren (abgerundet), nicht auf 0 setzen. */
export function updateStreak(streak: number, correct: boolean): number {
  return correct ? streak + 1 : Math.floor(streak / 2);
}
