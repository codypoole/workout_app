/* ============================================================
   Strength calc helpers — ported verbatim from seed.js so the
   client (and any future backend) agree on the math.
   ============================================================ */
import type { HistorySet } from '@/types';

export function epley1RM(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function setVolume(set: { weight?: number; reps?: number }): number {
  return (set.weight || 0) * (set.reps || 0);
}

export function sessionVolume(sets: Array<{ weight?: number; reps?: number }>): number {
  return sets.reduce((a, s) => a + setVolume(s), 0);
}

export function best1RMOfSession(sets: HistorySet[]): number {
  return sets.reduce((m, s) => Math.max(m, epley1RM(s.weight, s.reps)), 0);
}

export function bestSetOfSession(sets: HistorySet[]): HistorySet {
  return sets.reduce(
    (b, s) => (epley1RM(s.weight, s.reps) > epley1RM(b.weight || 0, b.reps || 0) ? s : b),
    { weight: 0, reps: 0 } as HistorySet,
  );
}
