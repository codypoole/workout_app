/* ============ PLAN — weeks/days + JSON import ============ */
import { useMemo, useState } from 'react';
import type { AppState, Exercise, Plan } from '@/types';
import { buildClaudePrompt, makeSamplePlan } from '@/lib/seed';
import { normalizePlan, stripPlan, validatePlanJson, type ValidationResult } from '@/lib/plan';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { GroupDot } from '@/components/GroupDot';

type ExMap = Record<string, Exercise>;

export interface PlanScreenProps {
  state: AppState;
  exMap: ExMap;
  activeRef: { week: number; day: number };
  onSetActive: (week: number, day: number) => void;
  onImport: (plan: Plan) => void;
}

export function PlanScreen({ state, exMap, activeRef, onSetActive, onImport }: PlanScreenProps) {
  const plan = state.plan;
  const [wk, setWk] = useState(activeRef ? activeRef.week : 0);
  const [showImport, setShowImport] = useState(false);
  const week = plan.weeks[wk];

  return (
    <div className="screen screen-enter">
      <div style={{ padding: '8px 16px 10px' }}>
        <div className="row between">
          <div>
            <div className="eyebrow">Active plan</div>
            <div className="h1" style={{ maxWidth: 240 }}>{plan.name}</div>
          </div>
          <button
            className="icon-btn"
            style={{ width: 44, height: 44, borderColor: 'var(--accent)', color: 'var(--accent)' }}
            onClick={() => setShowImport(true)}
            aria-label="Import plan"
          >
            <Icon name="upload" size={20} />
          </button>
        </div>
        <div className="row gap8 wrap" style={{ marginTop: 10 }}>
          <span className="chip accent">{plan.goal}</span>
          <span className="chip">{plan.weeks.length} of {plan.weeksCount} weeks built</span>
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

      <Sheet open={showImport} onClose={() => setShowImport(false)} title="Import plan" full>
        <ImportFlow library={state.library} onImport={(p) => { onImport(p); setShowImport(false); }} />
      </Sheet>
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
