/* ============ PLAN — weeks/days + JSON import + multi-plan management ============ */
import { useMemo, useState } from 'react';
import type { AppState, Exercise, Plan } from '@/types';
import { buildClaudePrompt, makeSamplePlan, uid } from '@/lib/seed';
import { normalizePlan, stripPlan, validatePlanJson, type ValidationResult } from '@/lib/plan';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { GroupDot } from '@/components/GroupDot';
import { ConfirmModal } from '@/components/ConfirmModal';

type ExMap = Record<string, Exercise>;

export interface PlanScreenProps {
  state: AppState;
  exMap: ExMap;
  activeRef: { week: number; day: number };
  onSetActive: (week: number, day: number) => void;
  onImport: (plan: Plan) => void;
  onActivatePlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
}

export function PlanScreen({ state, exMap, activeRef, onSetActive, onImport, onActivatePlan, onDeletePlan }: PlanScreenProps) {
  const plan = state.plan;
  const plans = state.plans || [plan];
  const [wk, setWk] = useState(activeRef ? activeRef.week : 0);
  const [showImport, setShowImport] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const week = plan.weeks[wk];
  const pendingPlan = confirmDelete ? plans.find((p) => p.id === confirmDelete) : null;

  return (
    <div className="screen screen-enter">
      <div style={{ padding: '8px 16px 10px' }}>
        <div className="row between">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow">Active plan</div>
            <div className="h1" style={{ maxWidth: 240 }}>{plan.name}</div>
          </div>
          <div className="row gap8">
            <button
              className="icon-btn"
              style={{ width: 44, height: 44, borderColor: 'var(--line-2)' }}
              onClick={() => setShowPlans(true)}
              aria-label="Manage plans"
            >
              <Icon name="plan" size={20} />
            </button>
            <button
              className="icon-btn"
              style={{ width: 44, height: 44, background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none' }}
              onClick={() => setShowBuilder(true)}
              aria-label="Create plan"
            >
              <Icon name="plus" size={22} />
            </button>
          </div>
        </div>
        <div className="row gap8 wrap" style={{ marginTop: 10 }}>
          <span className="chip accent">{plan.goal}</span>
          <span className="chip">{plan.weeks.length} of {plan.weeksCount} weeks built</span>
          {plans.length > 1 && <span className="chip">{plans.length} plans saved</span>}
        </div>
      </div>

      <div className="row gap8" style={{ padding: '4px 16px 12px', overflowX: 'auto' }}>
        {plan.weeks.map((w, i) => (
          <button
            key={w.id}
            className="chip"
            style={{ height: 34, padding: '0 14px', ...(i === wk ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
            onClick={() => setWk(i)}
          >
            {w.name}
          </button>
        ))}
      </div>

      <div className="scroll">
        <div className="col gap10" style={{ padding: '0 16px 20px' }}>
          {week.days.map((day, di) => {
            const isActive = activeRef && activeRef.week === wk && activeRef.day === di;
            const completed = !!state.completedDays[day.id];
            return (
              <div key={day.id} className="card" style={{ padding: 14, borderColor: isActive ? 'var(--accent)' : 'var(--line)' }}>
                <div className="row between">
                  <div className="row gap10">
                    <div className="mono faint" style={{ width: 24, fontSize: 12 }}>D{di + 1}</div>
                    <div>
                      <div className="row gap8">
                        <span className="title">{day.name}</span>
                        {completed && (
                          <span className="accent">
                            <Icon name="check" size={15} />
                          </span>
                        )}
                        {isActive && <span className="chip accent" style={{ padding: '2px 7px' }}>Active</span>}
                      </div>
                      <div className="label">{day.rest ? 'Recovery day' : `${day.exercises.length} exercises · ${day.focus}`}</div>
                    </div>
                  </div>
                  {!day.rest && !isActive && (
                    <button className="btn ghost" style={{ height: 36, fontSize: 12, padding: '0 12px' }} onClick={() => onSetActive(wk, di)}>
                      Start
                    </button>
                  )}
                </div>
                {!day.rest && (
                  <div className="row gap6 wrap" style={{ marginTop: 12, paddingLeft: 34 }}>
                    {day.exercises.slice(0, 6).map((ex, ei) => (
                      <span key={ei} className="row gap6" style={{ fontSize: 12 }}>
                        <GroupDot group={(exMap[ex.exerciseId] || ({} as Exercise)).group} size={6} />
                        <span className="dim" style={{ whiteSpace: 'nowrap' }}>{(exMap[ex.exerciseId] || ({} as Exercise)).name || ex.exerciseId}</span>
                        {ei < Math.min(5, day.exercises.length - 1) && <span className="faint">·</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Sheet open={showBuilder} onClose={() => setShowBuilder(false)} title="New plan" full>
        <PlanBuilder
          library={state.library}
          onImport={(p) => { onImport(p); setShowBuilder(false); }}
        />
      </Sheet>

      <Sheet open={showImport} onClose={() => setShowImport(false)} title="Import plan" full>
        <ImportFlow library={state.library} onImport={(p) => { onImport(p); setShowImport(false); }} />
      </Sheet>

      <Sheet open={showPlans} onClose={() => setShowPlans(false)} title="My Plans" full>
        <div className="col gap10" style={{ paddingTop: 6 }}>
          {plans.map((p) => {
            const isActivePlan = p.id === (state.activePlanId || plan.id);
            const totalDays = p.weeks.reduce((sum, w) => sum + w.days.length, 0);
            const totalExercises = p.weeks.reduce((sum, w) => sum + w.days.reduce((s, d) => s + d.exercises.length, 0), 0);
            return (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: 14,
                  borderColor: isActivePlan ? 'var(--accent)' : 'var(--line)',
                }}
              >
                <div className="row between" style={{ marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row gap8">
                      <span className="title clamp1" style={{ fontSize: 15 }}>{p.name}</span>
                      {isActivePlan && <span className="chip accent" style={{ padding: '2px 7px', fontSize: 10 }}>Active</span>}
                    </div>
                    <div className="label" style={{ marginTop: 2 }}>
                      {p.goal} · {p.weeks.length} weeks · {totalDays} days · {totalExercises} exercises
                    </div>
                  </div>
                </div>
                <div className="row gap8" style={{ marginTop: 8 }}>
                  {!isActivePlan && (
                    <button
                      className="btn primary grow"
                      style={{ height: 38, fontSize: 13 }}
                      onClick={() => { onActivatePlan(p.id); setShowPlans(false); }}
                    >
                      <Icon name="check" size={16} /> Activate
                    </button>
                  )}
                  {plans.length > 1 && (
                    <button
                      className="btn ghost"
                      style={{ height: 38, fontSize: 13, color: 'var(--danger)', borderColor: 'color-mix(in oklch, var(--danger) 30%, transparent)' }}
                      onClick={() => setConfirmDelete(p.id)}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Sheet>

      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete plan?"
        message={pendingPlan ? `"${pendingPlan.name}" will be permanently deleted. This cannot be undone.` : 'This plan will be deleted.'}
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete) {
            onDeletePlan(confirmDelete);
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

/* ---- JSON import flow ---- */
function ImportFlow({ library, onImport }: { library: Exercise[]; onImport: (plan: Plan) => void }) {
  const [tab, setTab] = useState<'generate' | 'paste'>('generate');
  const [text, setText] = useState('');
  const [result, setResult] = useState<ValidationResult>({ error: null, warn: null, parsed: null });
  const [copied, setCopied] = useState(false);

  const validIds = useMemo(() => new Set((library || []).map((e) => e.id)), [library]);
  const prompt = useMemo(() => buildClaudePrompt(library || []), [library]);

  function copyPrompt() {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(prompt).then(done).catch(() => fallbackCopy(prompt, done));
    } else fallbackCopy(prompt, done);
  }
  function fallbackCopy(str: string, cb: () => void) {
    const ta = document.createElement('textarea');
    ta.value = str;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      cb();
    } catch {
      /* ignore */
    } finally {
      document.body.removeChild(ta);
    }
  }

  function validate(raw: string) {
    setResult(raw.trim() ? validatePlanJson(raw, validIds) : { error: null, warn: null, parsed: null });
  }

  function buildAndImport() {
    if (!result.parsed) return;
    onImport(normalizePlan(result.parsed.obj));
  }

  return (
    <div className="col gap14" style={{ paddingTop: 6 }}>
      <div className="pill-toggle">
        <button className={tab === 'generate' ? 'on' : ''} onClick={() => setTab('generate')}>1 · Generate</button>
        <button className={tab === 'paste' ? 'on' : ''} onClick={() => setTab('paste')}>2 · Paste JSON</button>
      </div>

      {tab === 'generate' ? (
        <>
          <div className="card-2" style={{ padding: 14 }}>
            <div className="row gap8" style={{ marginBottom: 8 }}>
              <span className="accent">
                <Icon name="copy" size={16} />
              </span>
              <span className="title" style={{ fontSize: 14 }}>Prompt for Claude</span>
            </div>
            <div className="label" style={{ lineHeight: 1.5 }}>
              Copy this, paste it into Claude, then fill in the <span className="accent">My plan requirements</span> section at the bottom. It already lists your{' '}
              <span className="mono accent">{(library || []).length}</span> library exercise ids and the <span className="mono accent"> durationSec</span> rule so Claude always returns valid JSON.
            </div>
          </div>

          <div className="card-2" style={{ padding: 0, overflow: 'hidden' }}>
            <pre
              className="mono"
              style={{ margin: 0, padding: '12px 14px', fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-dim)', maxHeight: 210, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {prompt}
            </pre>
          </div>

          <button className="btn primary block lg" onClick={copyPrompt}>
            <Icon name={copied ? 'check' : 'copy'} size={18} /> {copied ? 'Copied to clipboard' : 'Copy Claude prompt'}
          </button>
          <button className="btn ghost block" style={{ height: 44, fontSize: 14 }} onClick={() => setTab('paste')}>
            I have the JSON → paste it <Icon name="chevron" size={16} />
          </button>
        </>
      ) : (
        <>
          <textarea
            className="field mono"
            rows={8}
            placeholder="Paste the JSON Claude gave you here…"
            value={text}
            onChange={(e) => { setText(e.target.value); validate(e.target.value); }}
            style={{ fontSize: 12, minHeight: 150 }}
          />

          <div className="row gap8">
            <button
              className="btn ghost grow"
              style={{ height: 42, fontSize: 13 }}
              onClick={() => {
                const s = JSON.stringify(stripPlan(makeSamplePlan()), null, 2);
                setText(s);
                validate(s);
              }}
            >
              <Icon name="copy" size={15} /> Use sample plan
            </button>
            <button
              className="btn ghost grow"
              style={{ height: 42, fontSize: 13 }}
              onClick={() => { setText(''); setResult({ error: null, warn: null, parsed: null }); }}
            >
              Clear
            </button>
          </div>

          {result.error && (
            <div className="card-2" style={{ padding: 12, borderColor: 'color-mix(in oklch,var(--danger) 40%,transparent)' }}>
              <div className="row gap8">
                <span style={{ color: 'var(--danger)' }}>
                  <Icon name="x" size={15} />
                </span>
                <span style={{ color: 'var(--danger)', fontSize: 13 }}>{result.error}</span>
              </div>
            </div>
          )}
          {result.warn && (
            <div className="card-2" style={{ padding: 12, borderColor: 'color-mix(in oklch, #e9b949 45%, transparent)' }}>
              <div className="row gap8">
                <span style={{ color: '#e9b949' }}>
                  <Icon name="info" size={15} />
                </span>
                <span style={{ color: '#e9b949', fontSize: 12.5, lineHeight: 1.45 }}>{result.warn}</span>
              </div>
            </div>
          )}
          {result.parsed && (
            <div className="card-2" style={{ padding: 14, borderColor: 'color-mix(in oklch,var(--accent) 40%,transparent)' }}>
              <div className="row gap8" style={{ marginBottom: 10 }}>
                <span className="accent">
                  <Icon name="check" size={16} />
                </span>
                <span className="title clamp1" style={{ fontSize: 14, flex: 1 }}>{result.parsed.obj.name}</span>
              </div>
              <div className="row gap16">
                <Stat n={result.parsed.weeks} l="weeks" />
                <Stat n={result.parsed.days} l="days" />
                <Stat n={result.parsed.exCount} l="exercises" />
                <Stat n={result.parsed.setCount} l="sets" />
              </div>
            </div>
          )}

          <button className="btn primary block lg" disabled={!result.parsed} onClick={buildAndImport}>
            <Icon name="upload" size={18} /> Import &amp; activate plan
          </button>
        </>
      )}
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="col">
      <div className="numbig" style={{ fontSize: 22 }}>{n}</div>
      <div className="label" style={{ fontSize: 11 }}>{l}</div>
    </div>
  );
}

/* ---- Plan builder (create from scratch) ---- */
const GOALS = ['Hypertrophy', 'Strength', 'Endurance', 'Cut', 'Powerlifting', 'General Fitness', 'Custom'];

interface BuilderDay {
  name: string;
  focus: string;
  rest: boolean;
  exercises: { exerciseId: string; sets: number; reps: number }[];
}
interface BuilderWeek {
  name: string;
  days: BuilderDay[];
}

function emptyDay(name = 'Day'): BuilderDay {
  return { name, focus: '', rest: false, exercises: [] };
}
function restDay(): BuilderDay {
  return { name: 'Rest', focus: 'Recovery', rest: true, exercises: [] };
}

function PlanBuilder({ library, onImport }: { library: Exercise[]; onImport: (plan: Plan) => void }) {
  const [step, setStep] = useState<'info' | 'days' | 'exercises'>('info');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Hypertrophy');
  const [customGoal, setCustomGoal] = useState('');
  const [weeksCount, setWeeksCount] = useState(4);
  const [weeks, setWeeks] = useState<BuilderWeek[]>([{ name: 'Week 1', days: [emptyDay('Day 1')] }]);
  const [editWeek, setEditWeek] = useState(0);
  const [editDay, setEditDay] = useState<number | null>(null);
  const [showExPicker, setShowExPicker] = useState(false);
  const [showImportJson, setShowImportJson] = useState(false);

  const finalGoal = goal === 'Custom' ? customGoal || 'Custom' : goal;

  function addWeek() {
    setWeeks((w) => [...w, { name: `Week ${w.length + 1}`, days: [emptyDay('Day 1')] }]);
    setEditWeek(weeks.length);
  }

  function duplicateWeek(wi: number) {
    const src = weeks[wi];
    const copy: BuilderWeek = {
      name: `Week ${weeks.length + 1}`,
      days: src.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) })),
    };
    setWeeks((w) => [...w, copy]);
    setEditWeek(weeks.length);
  }

  function removeWeek(wi: number) {
    if (weeks.length <= 1) return;
    setWeeks((w) => w.filter((_, i) => i !== wi));
    if (editWeek >= weeks.length - 1) setEditWeek(Math.max(0, weeks.length - 2));
  }

  function addDay(wi: number) {
    setWeeks((w) => w.map((wk, i) =>
      i === wi ? { ...wk, days: [...wk.days, emptyDay(`Day ${wk.days.length + 1}`)] } : wk
    ));
  }

  function addRestDay(wi: number) {
    setWeeks((w) => w.map((wk, i) =>
      i === wi ? { ...wk, days: [...wk.days, restDay()] } : wk
    ));
  }

  function removeDay(wi: number, di: number) {
    setWeeks((w) => w.map((wk, i) =>
      i === wi ? { ...wk, days: wk.days.filter((_, j) => j !== di) } : wk
    ));
    setEditDay(null);
  }

  function updateDay(wi: number, di: number, patch: Partial<BuilderDay>) {
    setWeeks((w) => w.map((wk, i) =>
      i === wi ? { ...wk, days: wk.days.map((d, j) => j === di ? { ...d, ...patch } : d) } : wk
    ));
  }

  function addExercise(wi: number, di: number, exId: string) {
    setWeeks((w) => w.map((wk, i) =>
      i === wi ? {
        ...wk,
        days: wk.days.map((d, j) =>
          j === di ? { ...d, exercises: [...d.exercises, { exerciseId: exId, sets: 3, reps: 10 }] } : d
        ),
      } : wk
    ));
  }

  function removeExercise(wi: number, di: number, ei: number) {
    setWeeks((w) => w.map((wk, i) =>
      i === wi ? {
        ...wk,
        days: wk.days.map((d, j) =>
          j === di ? { ...d, exercises: d.exercises.filter((_, k) => k !== ei) } : d
        ),
      } : wk
    ));
  }

  function updateExercise(wi: number, di: number, ei: number, patch: Partial<BuilderDay['exercises'][0]>) {
    setWeeks((w) => w.map((wk, i) =>
      i === wi ? {
        ...wk,
        days: wk.days.map((d, j) =>
          j === di ? { ...d, exercises: d.exercises.map((e, k) => k === ei ? { ...e, ...patch } : e) } : d
        ),
      } : wk
    ));
  }

  function buildPlan(): Plan {
    return {
      id: uid('plan'),
      name: name || 'My Plan',
      goal: finalGoal,
      weeksCount,
      startDate: new Date().toISOString().slice(0, 10),
      weeks: weeks.map((w) => ({
        id: uid('wk'),
        name: w.name,
        days: w.days.map((d) => ({
          id: uid('day'),
          name: d.name,
          focus: d.focus,
          rest: d.rest,
          exercises: d.rest ? [] : d.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            sets: Array.from({ length: e.sets }, () => ({ weight: 0, reps: e.reps, restSec: 90 })),
          })),
        })),
      })),
    };
  }

  const totalDays = weeks.reduce((a, w) => a + w.days.length, 0);
  const totalExercises = weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + d.exercises.length, 0), 0);
  const canFinish = name.trim() && totalDays > 0;

  if (step === 'info') {
    return (
      <div className="col gap16" style={{ paddingTop: 6 }}>
        <div className="col gap6">
          <span className="eyebrow">Plan name</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push Pull Legs" autoFocus />
        </div>
        <div className="col gap6">
          <span className="eyebrow">Goal</span>
          <div className="row gap6 wrap">
            {GOALS.map((g) => (
              <button
                key={g}
                className="chip"
                style={{ height: 34, padding: '0 13px', ...(g === goal ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
                onClick={() => setGoal(g)}
              >
                {g}
              </button>
            ))}
          </div>
          {goal === 'Custom' && (
            <input className="field" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} placeholder="Your goal…" style={{ marginTop: 4 }} />
          )}
        </div>
        <div className="col gap6">
          <span className="eyebrow">Total weeks planned</span>
          <div className="row gap8">
            {[4, 6, 8, 12].map((n) => (
              <button
                key={n}
                className="chip"
                style={{ height: 34, padding: '0 14px', ...(n === weeksCount ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
                onClick={() => setWeeksCount(n)}
              >
                {n}
              </button>
            ))}
            <input
              className="field mono"
              type="number"
              min={1}
              max={52}
              value={weeksCount}
              onChange={(e) => setWeeksCount(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: 56, height: 34, textAlign: 'center', padding: '0 6px' }}
            />
          </div>
        </div>

        <button className="btn primary block lg" disabled={!name.trim()} onClick={() => setStep('days')}>
          Next: Build schedule <Icon name="chevron" size={16} />
        </button>

        <div className="divide" />
        <button className="btn ghost block" style={{ height: 44, fontSize: 13 }} onClick={() => setShowImportJson(true)}>
          <Icon name="upload" size={16} /> Import JSON instead
        </button>

        <Sheet open={showImportJson} onClose={() => setShowImportJson(false)} title="Import plan" full>
          <ImportFlow library={library} onImport={onImport} />
        </Sheet>
      </div>
    );
  }

  const currentWeek = weeks[editWeek];

  return (
    <div className="col gap12" style={{ paddingTop: 6 }}>
      {/* Plan summary bar */}
      <div className="card-2" style={{ padding: '10px 14px' }}>
        <div className="row between">
          <div>
            <div className="title" style={{ fontSize: 14 }}>{name || 'My Plan'}</div>
            <div className="label">{finalGoal} · {weeks.length} week{weeks.length !== 1 ? 's' : ''} · {totalDays} days · {totalExercises} exercises</div>
          </div>
          <button className="btn ghost" style={{ height: 32, fontSize: 12, padding: '0 10px' }} onClick={() => setStep('info')}>
            <Icon name="edit" size={14} />
          </button>
        </div>
      </div>

      {/* Week tabs */}
      <div className="row gap8" style={{ overflowX: 'auto' }}>
        {weeks.map((w, i) => (
          <button
            key={i}
            className="chip"
            style={{ height: 32, padding: '0 12px', whiteSpace: 'nowrap', ...(i === editWeek ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
            onClick={() => { setEditWeek(i); setEditDay(null); }}
          >
            {w.name}
          </button>
        ))}
        <button className="chip" style={{ height: 32, padding: '0 10px' }} onClick={addWeek}>
          <Icon name="plus" size={14} />
        </button>
      </div>

      {/* Week actions */}
      <div className="row gap8">
        <button className="btn ghost grow" style={{ height: 34, fontSize: 12 }} onClick={() => duplicateWeek(editWeek)}>
          <Icon name="copy" size={14} /> Duplicate week
        </button>
        {weeks.length > 1 && (
          <button className="btn ghost" style={{ height: 34, fontSize: 12, color: 'var(--danger)' }} onClick={() => removeWeek(editWeek)}>
            <Icon name="trash" size={14} />
          </button>
        )}
      </div>

      {/* Days in this week */}
      <div className="col gap8">
        {currentWeek.days.map((day, di) => {
          const isEditing = editDay === di;
          const exMeta = (id: string) => library.find((e) => e.id === id);
          return (
            <div key={di} className="card" style={{ padding: 12, borderColor: isEditing ? 'var(--accent)' : 'var(--line)' }}>
              <div className="row between" style={{ marginBottom: isEditing ? 10 : 0 }}>
                <button
                  className="row gap8"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', flex: 1, minWidth: 0, textAlign: 'left', padding: 0, color: 'inherit' }}
                  onClick={() => setEditDay(isEditing ? null : di)}
                >
                  <div className="mono faint" style={{ width: 20, fontSize: 11, flexShrink: 0 }}>D{di + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="title" style={{ fontSize: 14 }}>{day.name}</div>
                    <div className="label">{day.rest ? 'Rest day' : `${day.exercises.length} exercises${day.focus ? ` · ${day.focus}` : ''}`}</div>
                  </div>
                </button>
                <div className="row gap6">
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditDay(isEditing ? null : di)}>
                    <Icon name={isEditing ? 'chevdown' : 'chevron'} size={14} />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="col gap10">
                  {!day.rest && (
                    <>
                      <div className="row gap8">
                        <input
                          className="field"
                          value={day.name}
                          onChange={(e) => updateDay(editWeek, di, { name: e.target.value })}
                          placeholder="Day name"
                          style={{ flex: 1, height: 36 }}
                        />
                        <input
                          className="field"
                          value={day.focus}
                          onChange={(e) => updateDay(editWeek, di, { focus: e.target.value })}
                          placeholder="Focus (e.g. Chest · Shoulders)"
                          style={{ flex: 1, height: 36 }}
                        />
                      </div>

                      {/* Exercise list */}
                      {day.exercises.map((ex, ei) => {
                        const meta = exMeta(ex.exerciseId);
                        return (
                          <div key={ei} className="card-2 row between" style={{ padding: '8px 10px' }}>
                            <div className="row gap8" style={{ flex: 1, minWidth: 0 }}>
                              <GroupDot group={meta?.group || ''} size={6} />
                              <div style={{ minWidth: 0 }}>
                                <div className="title clamp1" style={{ fontSize: 13 }}>{meta?.name || ex.exerciseId}</div>
                                <div className="row gap6" style={{ marginTop: 2 }}>
                                  <div className="row gap4">
                                    <span className="label" style={{ fontSize: 11 }}>Sets:</span>
                                    <input
                                      className="field mono"
                                      type="number"
                                      min={1}
                                      max={10}
                                      value={ex.sets}
                                      onChange={(e) => updateExercise(editWeek, di, ei, { sets: Math.max(1, parseInt(e.target.value) || 1) })}
                                      style={{ width: 38, height: 24, fontSize: 12, padding: '0 4px', textAlign: 'center' }}
                                    />
                                  </div>
                                  <div className="row gap4">
                                    <span className="label" style={{ fontSize: 11 }}>Reps:</span>
                                    <input
                                      className="field mono"
                                      type="number"
                                      min={1}
                                      max={100}
                                      value={ex.reps}
                                      onChange={(e) => updateExercise(editWeek, di, ei, { reps: Math.max(1, parseInt(e.target.value) || 1) })}
                                      style={{ width: 38, height: 24, fontSize: 12, padding: '0 4px', textAlign: 'center' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--danger)', flexShrink: 0 }} onClick={() => removeExercise(editWeek, di, ei)}>
                              <Icon name="x" size={14} />
                            </button>
                          </div>
                        );
                      })}

                      <button className="btn ghost block" style={{ height: 36, fontSize: 12 }} onClick={() => { setEditDay(di); setShowExPicker(true); }}>
                        <Icon name="plus" size={14} /> Add exercise
                      </button>
                    </>
                  )}

                  <button
                    className="btn ghost"
                    style={{ height: 32, fontSize: 11, color: 'var(--danger)', alignSelf: 'flex-start' }}
                    onClick={() => removeDay(editWeek, di)}
                  >
                    <Icon name="trash" size={13} /> Remove day
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="row gap8">
          <button className="btn ghost grow" style={{ height: 38, fontSize: 13 }} onClick={() => addDay(editWeek)}>
            <Icon name="plus" size={15} /> Add day
          </button>
          <button className="btn ghost grow" style={{ height: 38, fontSize: 13 }} onClick={() => addRestDay(editWeek)}>
            <Icon name="plus" size={15} /> Rest day
          </button>
        </div>
      </div>

      <button className="btn primary block lg" disabled={!canFinish} onClick={() => onImport(buildPlan())}>
        <Icon name="check" size={18} /> Create plan ({totalExercises} exercises)
      </button>

      {showExPicker && editDay !== null && (
        <Sheet open onClose={() => setShowExPicker(false)} title="Add exercise" full>
          <ExercisePicker
            library={library}
            onPick={(id) => { addExercise(editWeek, editDay, id); setShowExPicker(false); }}
          />
        </Sheet>
      )}
    </div>
  );
}

/* ---- Minimal exercise picker for the plan builder ---- */
function ExercisePicker({ library, onPick }: { library: Exercise[]; onPick: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const groups = [...new Set(library.map((e) => e.group))];
  const filtered = library.filter((e) => {
    if (group && e.group !== group) return false;
    if (q) return e.name.toLowerCase().includes(q.toLowerCase());
    return true;
  });

  return (
    <div className="col gap10" style={{ paddingTop: 4 }}>
      <div className="row" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}>
          <Icon name="search" size={18} />
        </span>
        <input className="field" style={{ paddingLeft: 42 }} placeholder="Search exercises…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </div>
      <div className="row gap6 wrap">
        <button
          className="chip"
          style={{ height: 28, padding: '0 10px', ...(group === null ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
          onClick={() => setGroup(null)}
        >
          All
        </button>
        {groups.map((g) => (
          <button
            key={g}
            className="chip"
            style={{ height: 28, padding: '0 10px', ...(group === g ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
            onClick={() => setGroup(g === group ? null : g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="col gap6">
        {filtered.map((e) => (
          <button
            key={e.id}
            className="card-2 row between"
            style={{ padding: '10px 12px', cursor: 'pointer', border: 'none', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', textAlign: 'left', width: '100%', color: 'inherit' }}
            onClick={() => onPick(e.id)}
          >
            <div className="row gap8" style={{ minWidth: 0, flex: 1 }}>
              <GroupDot group={e.group} size={6} />
              <div style={{ minWidth: 0 }}>
                <div className="title clamp1" style={{ fontSize: 13 }}>{e.name}</div>
                <div className="label" style={{ fontSize: 11 }}>{e.group} · {e.equipment}</div>
              </div>
            </div>
            <span className="accent" style={{ flexShrink: 0 }}><Icon name="plus" size={16} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
