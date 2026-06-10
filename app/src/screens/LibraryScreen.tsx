/* ============ LIBRARY — browse / search / create / edit ============ */
import { useState } from 'react';
import type { AppState, Exercise, ExerciseType } from '@/types';
import { uid } from '@/lib/seed';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { GroupDot } from '@/components/GroupDot';

const GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio'];
const EQUIPMENT = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Other'];
const EX_TYPES: [ExerciseType, string][] = [
  ['weight', 'Weight × reps'],
  ['bodyweight', 'Bodyweight reps'],
  ['timed', 'Timed hold'],
];

export interface LibraryScreenProps {
  state: AppState;
  onSave: (ex: Exercise) => void;
  onDelete: (id: string) => void;
  onOpenExercise: (id: string) => void;
}

export function LibraryScreen({ state, onSave, onDelete, onOpenExercise }: LibraryScreenProps) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('All');
  const [edit, setEdit] = useState<Exercise | null>(null);

  const list = state.library.filter((e) => {
    if (group !== 'All' && e.group !== group) return false;
    if (
      q &&
      !(
        e.name.toLowerCase().includes(q.toLowerCase()) ||
        (e.muscles || []).join(' ').toLowerCase().includes(q.toLowerCase())
      )
    )
      return false;
    return true;
  });
  const byGroup: Record<string, Exercise[]> = {};
  list.forEach((e) => {
    (byGroup[e.group] = byGroup[e.group] || []).push(e);
  });

  return (
    <div className="screen screen-enter">
      <div style={{ padding: '8px 16px 8px' }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <div>
            <div className="eyebrow">Master library</div>
            <div className="h1">Exercises</div>
          </div>
          <button
            className="icon-btn"
            style={{ width: 44, height: 44, background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none' }}
            onClick={() => setEdit({ id: '', name: '', group: 'Chest', equipment: 'Barbell', type: 'weight', muscles: [], notes: '', custom: true })}
            aria-label="New exercise"
          >
            <Icon name="plus" size={22} />
          </button>
        </div>
        <div className="row gap8" style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}>
            <Icon name="search" size={18} />
          </span>
          <input className="field" style={{ paddingLeft: 42 }} placeholder="Search exercises or muscles…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="row gap8" style={{ overflowX: 'auto', paddingBottom: 2 }}>
          {GROUPS.map((g) => (
            <button
              key={g}
              className="chip"
              style={{ height: 32, padding: '0 13px', ...(g === group ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
              onClick={() => setGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll">
        <div style={{ padding: '4px 16px 20px' }}>
          {Object.keys(byGroup).length === 0 && (
            <div className="faint center" style={{ padding: 40, textAlign: 'center' }}>No exercises match.</div>
          )}
          {Object.entries(byGroup).map(([g, items]) => (
            <div key={g} style={{ marginBottom: 18 }}>
              <div className="row gap8" style={{ marginBottom: 8 }}>
                <GroupDot group={g} size={8} />
                <span className="eyebrow">{g}</span>
                <span className="mono faint" style={{ fontSize: 11 }}>{items.length}</span>
              </div>
              <div className="col gap8">
                {items.map((ex) => (
                  <div key={ex.id} className="card" style={{ padding: 12 }}>
                    <div className="row between">
                      <button
                        style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', flex: 1, minWidth: 0 }}
                        onClick={() => onOpenExercise(ex.id)}
                      >
                        <div className="title clamp1" style={{ fontSize: 15, color: 'var(--text)' }}>{ex.name}</div>
                        <div className="row gap6" style={{ marginTop: 3 }}>
                          {ex.custom && <span className="chip" style={{ padding: '1px 6px', fontSize: 9, flexShrink: 0 }}>Custom</span>}
                          <span className="label clamp1">{ex.equipment} · {ex.group}</span>
                        </div>
                      </button>
                      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => setEdit({ ...ex })} aria-label="Edit exercise">
                        <Icon name="edit" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit && edit.id ? 'Edit exercise' : 'New exercise'} full>
        {edit && (
          <ExerciseEditor
            key={edit.id || 'new'}
            ex={edit}
            onSave={(e) => { onSave(e); setEdit(null); }}
            onDelete={edit.id ? () => { onDelete(edit.id); setEdit(null); } : null}
          />
        )}
      </Sheet>
    </div>
  );
}

function ExerciseEditor({ ex, onSave, onDelete }: { ex: Exercise; onSave: (e: Exercise) => void; onDelete: (() => void) | null }) {
  const [name, setName] = useState(ex.name);
  const [group, setGroup] = useState(ex.group);
  const [equipment, setEquipment] = useState(ex.equipment);
  const [type, setType] = useState<ExerciseType>(ex.type);
  const [notes, setNotes] = useState(ex.notes || '');

  function save() {
    if (!name.trim()) return;
    onSave({
      id: ex.id || uid('ex'),
      name: name.trim(),
      group,
      equipment,
      type,
      muscles: ex.muscles || [],
      notes,
      custom: ex.id ? ex.custom : true,
    });
  }

  return (
    <div className="col gap16" style={{ paddingTop: 6 }}>
      <div className="col gap6">
        <span className="eyebrow">Name</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Incline Bench Press" autoFocus />
      </div>
      <div className="col gap6">
        <span className="eyebrow">Muscle group</span>
        <div className="row gap6 wrap">
          {GROUPS.slice(1).map((g) => (
            <button
              key={g}
              className="chip"
              style={{ height: 34, padding: '0 13px', ...(g === group ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
              onClick={() => setGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="col gap6">
        <span className="eyebrow">Equipment</span>
        <div className="row gap6 wrap">
          {EQUIPMENT.map((g) => (
            <button
              key={g}
              className="chip"
              style={{ height: 34, padding: '0 13px', ...(g === equipment ? { background: 'var(--surface-3)', color: 'var(--text)', borderColor: 'var(--line-2)' } : {}) }}
              onClick={() => setEquipment(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="col gap6">
        <span className="eyebrow">Tracking type</span>
        <div className="col gap6">
          {EX_TYPES.map(([val, lbl]) => (
            <button
              key={val}
              className="card-2"
              style={{ padding: '12px 14px', textAlign: 'left', cursor: 'pointer', borderColor: type === val ? 'var(--accent)' : 'var(--line)' }}
              onClick={() => setType(val)}
            >
              <div className="row between">
                <span className="title" style={{ fontSize: 14 }}>{lbl}</span>
                {type === val && (
                  <span className="accent">
                    <Icon name="check" size={16} />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="col gap6">
        <span className="eyebrow">Notes / cues</span>
        <textarea className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Form cues…" />
      </div>

      <button className="btn primary block lg" onClick={save}>
        <Icon name="check" size={18} /> Save exercise
      </button>
      {onDelete && (
        <button className="btn danger block" onClick={onDelete}>
          <Icon name="trash" size={16} /> Delete exercise
        </button>
      )}
    </div>
  );
}

/* ---- Swap / Add sheet (pick a replacement from library) ---- */
export interface SwapSheetProps {
  open: boolean;
  onClose: () => void;
  library: Exercise[];
  currentId: string | null;
  onPick: (id: string) => void;
  mode?: 'add' | 'swap';
}

export function SwapSheet({ open, onClose, library, currentId, onPick, mode }: SwapSheetProps) {
  const [q, setQ] = useState('');
  const isAdd = mode === 'add';
  const cur = library.find((e) => e.id === currentId);
  const list = library.filter((e) => {
    if (!isAdd && e.id === currentId) return false;
    if (q) return e.name.toLowerCase().includes(q.toLowerCase()) || (e.muscles || []).join(' ').toLowerCase().includes(q.toLowerCase());
    return true;
  });
  if (!isAdd) list.sort((a, b) => (a.group === (cur || ({} as Exercise)).group ? -1 : 0) - (b.group === (cur || ({} as Exercise)).group ? -1 : 0));

  return (
    <Sheet open={open} onClose={onClose} title={isAdd ? 'Add exercise' : 'Swap exercise'} full>
      {isAdd ? (
        <div className="label" style={{ marginBottom: 10 }}>Pick an exercise to add to today. It starts with 3 sets you can edit.</div>
      ) : (
        cur && (
          <div className="label" style={{ marginBottom: 10 }}>
            Replacing <span className="accent">{cur.name}</span>. Sets &amp; reps are kept.
          </div>
        )
      )}
      <div className="row" style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}>
          <Icon name="search" size={18} />
        </span>
        <input className="field" style={{ paddingLeft: 42 }} placeholder={isAdd ? 'Search exercises…' : 'Search replacement…'} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="col gap8">
        {list.map((ex) => (
          <button key={ex.id} className="card" style={{ padding: 12, textAlign: 'left', cursor: 'pointer' }} onClick={() => { onPick(ex.id); onClose(); }}>
            <div className="row between">
              <div className="row gap10" style={{ minWidth: 0, flex: 1 }}>
                <GroupDot group={ex.group} size={8} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="title clamp1" style={{ fontSize: 15 }}>{ex.name}</div>
                  <div className="label">{ex.group} · {ex.equipment}</div>
                </div>
              </div>
              {!isAdd && cur && ex.group === cur.group && (
                <span className="chip accent" style={{ padding: '2px 7px', flexShrink: 0 }}>Similar</span>
              )}
              {isAdd && (
                <span className="accent" style={{ flexShrink: 0 }}>
                  <Icon name="plus" size={18} />
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
