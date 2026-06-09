/* ============================================================
   Plan validation + normalization for the JSON import flow.
   Mirrors the client validator from screens-plan.jsx, and is
   intentionally pure so the same logic can run server-side.
   ============================================================ */
import type { Plan, RawPlanInput, PlanDay } from '@/types';
import { uid } from './seed';

export interface ValidationResult {
  error: string | null;
  warn: string | null;
  parsed: {
    obj: RawPlanInput;
    weeks: number;
    days: number;
    exCount: number;
    setCount: number;
  } | null;
}

export function validatePlanJson(raw: string, validIds: Set<string>): ValidationResult {
  let obj: RawPlanInput;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    return { error: 'Invalid JSON — ' + (e as Error).message, warn: null, parsed: null };
  }
  if (!obj.name) return { error: 'Missing "name" (plan title).', warn: null, parsed: null };
  if (!Array.isArray(obj.weeks) || !obj.weeks.length)
    return { error: 'Missing "weeks" array.', warn: null, parsed: null };

  let exCount = 0;
  let setCount = 0;
  const unknown = new Set<string>();
  for (const w of obj.weeks) {
    if (!Array.isArray(w.days))
      return { error: `Week "${w.name || '?'}" has no "days" array.`, warn: null, parsed: null };
    for (const d of w.days) {
      if (!d.rest && !Array.isArray(d.exercises))
        return { error: `Day "${d.name || '?'}" missing "exercises".`, warn: null, parsed: null };
      (d.exercises || []).forEach((e) => {
        exCount++;
        setCount += (e.sets || []).length;
        if (!validIds.has(e.exerciseId)) unknown.add(e.exerciseId);
      });
    }
  }

  let warn: string | null = null;
  if (unknown.size) {
    warn = `${unknown.size} unknown exercise id${unknown.size > 1 ? 's' : ''}: ${[...unknown]
      .slice(0, 4)
      .join(', ')}${unknown.size > 4 ? '…' : ''}. These will import but show their raw id until you add them to the library.`;
  }

  return {
    error: null,
    warn,
    parsed: {
      obj,
      weeks: obj.weeks.length,
      days: obj.weeks.reduce((a, w) => a + w.days.length, 0),
      exCount,
      setCount,
    },
  };
}

/** Build a fully-formed Plan (with ids) from validated raw input. */
export function normalizePlan(obj: RawPlanInput): Plan {
  return {
    id: uid('plan'),
    name: obj.name,
    goal: obj.goal || 'Custom',
    weeksCount: obj.weeksCount || obj.weeks.length,
    startDate: obj.startDate || new Date().toISOString().slice(0, 10),
    weeks: obj.weeks.map((w) => ({
      id: uid('wk'),
      name: w.name || 'Week',
      days: w.days.map((d) => ({
        id: uid('day'),
        name: d.name || 'Day',
        focus: d.focus || '',
        rest: !!d.rest,
        exercises: (d.exercises || []).map((e) => ({
          exerciseId: e.exerciseId,
          sets: (e.sets || []).map((s) =>
            s.durationSec != null
              ? { durationSec: s.durationSec, restSec: s.restSec || 60 }
              : { weight: s.weight || 0, reps: s.reps || 0, restSec: s.restSec || 90 },
          ),
        })),
      })),
    })),
  };
}

/** Strip a Plan back down to the importable raw shape (for "Use sample plan"). */
export function stripPlan(plan: Plan): RawPlanInput {
  return {
    name: plan.name,
    goal: plan.goal,
    weeksCount: plan.weeksCount,
    startDate: plan.startDate,
    weeks: plan.weeks.map((w) => ({
      name: w.name,
      days: w.days.map((d: PlanDay) => ({
        name: d.name,
        focus: d.focus,
        rest: d.rest || undefined,
        exercises: d.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets })),
      })),
    })),
  };
}
