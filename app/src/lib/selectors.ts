/* ============================================================
   Pure selectors over AppState — ported from the prototype's
   per-screen helpers (getLog/exDone/dayProgress/exerciseStats).
   ============================================================ */
import type { AppState, Exercise, HistoryMap, LoggedSet, PlanDay, PlanExercise } from '@/types';
import { best1RMOfSession, sessionVolume } from './calc';

export function getLog(state: AppState, dayId: string, ei: number, si: number): LoggedSet | null {
  return ((state.logs[dayId] || {})[ei] || {})[si] || null;
}

function logDone(l: LoggedSet | null): boolean {
  return !!l && (l as { done?: boolean }).done === true;
}

export function exDone(state: AppState, dayId: string, ei: number, ex: PlanExercise): boolean {
  const sets = ex.sets || [];
  if (!sets.length) return false;
  return sets.every((_, si) => logDone(getLog(state, dayId, ei, si)));
}

export interface DayProgress {
  total: number;
  done: number;
  ratio: number;
}

export function dayProgress(state: AppState, dayId: string, day: PlanDay): DayProgress {
  let total = 0;
  let done = 0;
  day.exercises.forEach((ex, ei) =>
    ex.sets.forEach((_, si) => {
      total++;
      if (logDone(getLog(state, dayId, ei, si))) done++;
    }),
  );
  return { total, done, ratio: total ? done / total : 0 };
}

export interface ExerciseStats {
  sessions: { date: string; sets: { weight: number; reps: number }[] }[];
  series1RM: { date: string; value: number }[];
  seriesVol: { date: string; value: number }[];
  best1RM: number;
  bestVol: number;
  heaviest: { weight: number; reps: number };
  delta: number;
  cur1RM: number;
}

export function exerciseStats(history: HistoryMap, exId: string): ExerciseStats {
  const sessions = (history[exId] || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  const series1RM = sessions.map((s) => ({ date: s.date, value: best1RMOfSession(s.sets) }));
  const seriesVol = sessions.map((s) => ({ date: s.date, value: sessionVolume(s.sets) }));
  const best1RM = series1RM.reduce((m, p) => Math.max(m, p.value), 0);
  const bestVol = seriesVol.reduce((m, p) => Math.max(m, p.value), 0);
  let heaviest = { weight: 0, reps: 0 };
  sessions.forEach((s) =>
    s.sets.forEach((set) => {
      if ((set.weight || 0) > heaviest.weight) heaviest = set;
    }),
  );
  const first1RM = series1RM[0] ? series1RM[0].value : 0;
  const cur1RM = series1RM.length ? series1RM[series1RM.length - 1].value : 0;
  const delta = cur1RM - first1RM;
  return { sessions, series1RM, seriesVol, best1RM, bestVol, heaviest, delta, cur1RM };
}

/** A fast lookup map id -> Exercise. */
export function buildExMap(library: Exercise[]): Record<string, Exercise> {
  const m: Record<string, Exercise> = {};
  library.forEach((e) => (m[e.id] = e));
  return m;
}
