/* ============================================================
   Domain types — the single source of truth for the data model.
   Mirrors the shape documented in the handoff README.
   ============================================================ */

export type ExerciseType = 'weight' | 'bodyweight' | 'timed';

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Full Body'
  | 'Cardio';

export interface Exercise {
  id: string;
  name: string;
  group: string;
  equipment: string;
  type: ExerciseType;
  muscles: string[];
  notes: string;
  custom: boolean;
}

/** A planned set. Weight/reps sets and timed sets are unioned. */
export interface WeightSet {
  weight: number;
  reps: number;
  restSec: number;
}
export interface TimedSet {
  durationSec: number;
  restSec: number;
}
export type PlannedSet = WeightSet | TimedSet;

export function isTimedSet(s: PlannedSet): s is TimedSet {
  return (s as TimedSet).durationSec != null;
}

export interface PlanExercise {
  exerciseId: string;
  sets: PlannedSet[];
}

export interface PlanDay {
  id: string;
  name: string;
  focus: string;
  rest?: boolean;
  exercises: PlanExercise[];
}

export interface PlanWeek {
  id: string;
  name: string;
  days: PlanDay[];
}

export interface Plan {
  id: string;
  name: string;
  goal: string;
  weeksCount: number;
  startDate: string;
  weeks: PlanWeek[];
}

/** A logged set value (what the user actually performed). */
export type LoggedSet =
  | { weight: number; reps: number; done: boolean }
  | { durationSec: number; done: boolean };

/** logs[dayId][exerciseIndex][setIndex] = LoggedSet */
export type LogMap = Record<
  string,
  Record<number, Record<number, LoggedSet>>
>;

/** A recorded session for an exercise (written on workout finish). */
export interface HistorySet {
  weight: number;
  reps: number;
}
export interface Session {
  date: string; // YYYY-MM-DD
  sets: HistorySet[];
}
export type HistoryMap = Record<string, Session[]>;

export type ThemeName = 'midnight' | 'ember' | 'ice' | 'violet' | 'paper';
export type TypeName = 'athletic' | 'technical' | 'grotesk';
export type NavName = 'tabs' | 'dock';
export type UnitName = 'lb' | 'kg';

export interface Settings {
  theme: ThemeName;
  type: TypeName;
  nav: NavName;
  unit: UnitName;
}

export interface AppState {
  library: Exercise[];
  plan: Plan;
  plans?: Plan[];          // all saved plans (including the active one)
  activePlanId?: string;   // id of the currently active plan
  favorites?: string[];    // exercise IDs tracked in progress
  history: HistoryMap;
  logs: LogMap;
  completedDays: Record<string, string>; // dayId -> ISO date
  settings: Settings;
}

/** The raw plan shape accepted by the JSON importer (pre-normalization). */
export interface RawPlanInput {
  name: string;
  goal?: string;
  weeksCount?: number;
  startDate?: string;
  weeks: Array<{
    name?: string;
    days: Array<{
      name?: string;
      focus?: string;
      rest?: boolean;
      exercises?: Array<{
        exerciseId: string;
        sets?: Array<Partial<WeightSet> & Partial<TimedSet>>;
      }>;
    }>;
  }>;
}
