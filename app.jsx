/* ============ APP SHELL ============ */
const { createRoot } = ReactDOM;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "midnight",
  "type": "athletic",
  "nav": "tabs",
  "unit": "lb"
}/*EDITMODE-END*/;

const THEME_MAP = { midnight:'', ember:'ember', ice:'ice', violet:'violet', paper:'paper' };
const TYPE_MAP  = { athletic:'', technical:'technical', grotesk:'grotesk' };

const TABS = [
  { id:'today', label:'Today', icon:'today' },
  { id:'plan', label:'Plan', icon:'plan' },
  { id:'library', label:'Library', icon:'library' },
  { id:'progress', label:'Progress', icon:'progress' },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [state, setState] = useState(() => DB.load() || DB.freshState());
  const [tab, setTab] = useState('today');
  const [active, setActive] = useState({ week:0, day:0 }); // index of active day in plan
  const [focusIdx, setFocusIdx] = useState(0);
  const [restState, setRestState] = useState(null);
  const [swap, setSwap] = useState(null); // {ei}
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  // persist
  useEffect(() => { DB.save(state); }, [state]);

  // apply theme to phone element
  useEffect(() => {
    const phone = document.getElementById('phone');
    if (phone) { phone.setAttribute('data-theme', t.theme || 'midnight'); phone.setAttribute('data-type', t.type || 'athletic'); }
  }, [t.theme, t.type]);

  const exMap = useMemo(() => {
    const m = {}; state.library.forEach(e => m[e.id] = e); return m;
  }, [state.library]);

  const activeDay = state.plan.weeks[active.week] && state.plan.weeks[active.week].days[active.day];
  const activeWeek = state.plan.weeks[active.week];
  const unit = t.unit || 'lb';

  /* ---- mutations ---- */
  function logSet(dayId, ei, si, payload) {
    setState(s => {
      const logs = { ...s.logs };
      const day = { ...(logs[dayId] || {}) };
      const ex = { ...(day[ei] || {}) };
      if (payload === null) delete ex[si]; else ex[si] = payload;
      day[ei] = ex; logs[dayId] = day;
      return { ...s, logs };
    });
  }

  function completeDay(dayId) {
    setState(s => {
      // write history for each weight exercise with logged sets
      const history = JSON.parse(JSON.stringify(s.history));
      const day = activeDay;
      const date = new Date().toISOString().slice(0,10);
      day.exercises.forEach((item, ei) => {
        const meta = exMap[item.exerciseId];
        if (!meta || meta.type === 'timed') return;
        const sets = [];
        item.sets.forEach((_, si) => { const l = (s.logs[dayId]||{})[ei] && s.logs[dayId][ei][si]; if (l && l.done) sets.push({ weight:l.weight, reps:l.reps }); });
        if (sets.length) (history[item.exerciseId] = history[item.exerciseId] || []).push({ date, sets });
      });
      return { ...s, history, completedDays: { ...s.completedDays, [dayId]: date } };
    });
  }

  function uncompleteDay(dayId) {
    setState(s => {
      // remove the history rows that were written today for this day's exercises
      const history = JSON.parse(JSON.stringify(s.history));
      const date = s.completedDays[dayId];
      if (date) (activeDay.exercises||[]).forEach(item => {
        if (history[item.exerciseId]) {
          const arr = history[item.exerciseId];
          const i = arr.map(r=>r.date).lastIndexOf(date);
          if (i >= 0) arr.splice(i, 1);
        }
      });
      const cd = { ...s.completedDays }; delete cd[dayId];
      return { ...s, history, completedDays: cd };
    });
  }

  function addExerciseToDay(exId) {
    setState(s => {
      const plan = JSON.parse(JSON.stringify(s.plan));
      const meta = s.library.find(e=>e.id===exId) || {};
      const sets = meta.type === 'timed'
        ? [ {durationSec:30,restSec:45}, {durationSec:30,restSec:45}, {durationSec:30,restSec:45} ]
        : [ {weight:0,reps:8,restSec:90}, {weight:0,reps:8,restSec:90}, {weight:0,reps:8,restSec:90} ];
      plan.weeks[active.week].days[active.day].exercises.push({ exerciseId: exId, sets });
      return { ...s, plan };
    });
  }

  function removeExerciseFromDay(ei) {
    setState(s => {
      const plan = JSON.parse(JSON.stringify(s.plan));
      const dayObj = plan.weeks[active.week].days[active.day];
      dayObj.exercises.splice(ei, 1);
      // re-index this day's set logs around the removed exercise
      const dayId = dayObj.id;
      const oldLog = s.logs[dayId] || {};
      const newLog = {};
      Object.keys(oldLog).forEach(k => {
        const idx = +k;
        if (idx < ei) newLog[idx] = oldLog[idx];
        else if (idx > ei) newLog[idx-1] = oldLog[idx];
      });
      return { ...s, plan, logs: { ...s.logs, [dayId]: newLog } };
    });
    setFocusIdx(i => Math.max(0, Math.min(i, (activeDay.exercises.length - 2))));
  }

  function advanceDay() {
    let { week, day } = active;
    for (let guard=0; guard<60; guard++) {
      day++;
      if (day >= state.plan.weeks[week].days.length) { day = 0; week++; }
      if (week >= state.plan.weeks.length) { week = active.week; day = active.day; break; }
      if (!state.plan.weeks[week].days[day].rest) break;
    }
    setActive({ week, day }); setFocusIdx(0);
  }

  function swapExercise(ei, newId) {
    setState(s => {
      const plan = JSON.parse(JSON.stringify(s.plan));
      plan.weeks[active.week].days[active.day].exercises[ei].exerciseId = newId;
      return { ...s, plan };
    });
  }

  function saveExercise(ex) {
    setState(s => {
      const exists = s.library.some(e=>e.id===ex.id);
      const library = exists ? s.library.map(e=>e.id===ex.id?ex:e) : [...s.library, ex];
      return { ...s, library };
    });
  }
  function deleteExercise(id) {
    setState(s => ({ ...s, library: s.library.filter(e=>e.id!==id) }));
  }

  function importPlan(plan) {
    setState(s => ({ ...s, plan, logs:{}, completedDays:{} }));
    setActive({ week:0, day: plan.weeks[0].days.findIndex(d=>!d.rest) === -1 ? 0 : plan.weeks[0].days.findIndex(d=>!d.rest) });
    setFocusIdx(0); setTab('today');
  }

  const useDock = t.nav === 'dock';

  return (
    <>
      <div className="screen" style={{ paddingTop:0 }}>
        <div style={{ position:'absolute', inset:0, paddingBottom: useDock ? 0 : 0 }}>
          {tab==='today' && <TodayScreen state={state} weekName={activeWeek?activeWeek.name:''} day={activeDay} exMap={exMap}
            unit={unit} onLog={logSet} onCompleteDay={completeDay} onUncompleteDay={uncompleteDay} onAdvance={advanceDay}
            onSwap={(ei)=>setSwap({ei})} onAddExercise={()=>setAddOpen(true)} onDeleteExercise={removeExerciseFromDay}
            onOpenExercise={(id)=>setDetailId(id)}
            restState={restState} setRestState={setRestState} focusIdx={focusIdx} setFocusIdx={setFocusIdx} />}
          {tab==='plan' && <PlanScreen state={state} exMap={exMap} unit={unit}
            activeRef={active} onSetActive={(w,d)=>{ setActive({week:w,day:d}); setFocusIdx(0); setTab('today'); }}
            onImport={importPlan} />}
          {tab==='library' && <LibraryScreen state={state} onSave={saveExercise} onDelete={deleteExercise}
            onOpenExercise={(id)=>setDetailId(id)} />}
          {tab==='progress' && <ProgressScreen state={state} unit={unit} onOpenExercise={(id)=>setDetailId(id)} />}
        </div>
      </div>

      {/* nav */}
      <div className={'tabbar' + (useDock?' dock':'')} style={ useDock ? null : { position:'absolute', left:0, right:0, bottom:0 }}>
        {TABS.map(tb=>(
          <button key={tb.id} className={'tab' + (tab===tb.id?' active':'')} onClick={()=>setTab(tb.id)}>
            <span className="tab-ico"><Icon name={tb.icon} size={useDock?20:23} stroke={2}/></span>
            {!useDock && <span>{tb.label}</span>}
          </button>
        ))}
      </div>

      {/* overlays */}
      {swap!=null && (
        <SwapSheet open={true} onClose={()=>setSwap(null)} library={state.library}
          currentId={activeDay.exercises[swap.ei].exerciseId}
          onPick={(id)=>swapExercise(swap.ei, id)} />
      )}
      {addOpen && (
        <SwapSheet open={true} mode="add" onClose={()=>setAddOpen(false)} library={state.library}
          currentId={null} onPick={(id)=>addExerciseToDay(id)} />
      )}
      {detailId && (
        <ExerciseDetail state={state} exId={detailId} unit={unit}
          onClose={()=>setDetailId(null)} onEdit={(id)=>{ setDetailId(null); setTab('library'); }} />
      )}

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor label="Accent / mood" value={t.theme}
          options={[
            { value:'midnight', swatch:'#c8f135' },
            { value:'ember', swatch:'#ff6a3d' },
            { value:'ice', swatch:'#5aa2ff' },
            { value:'violet', swatch:'#b69bff' },
            { value:'paper', swatch:'#1c1b1f' },
          ].map(o=>o.swatch)}
          onChange={(v)=>{
            const order=['#c8f135','#ff6a3d','#5aa2ff','#b69bff','#1c1b1f'];
            const names=['midnight','ember','ice','violet','paper'];
            setTweak('theme', names[order.indexOf(v)] ?? 'midnight');
          }} />
        <TweakSelect label="Theme name" value={t.theme}
          options={['midnight','ember','ice','violet','paper']}
          onChange={(v)=>setTweak('theme', v)} />
        <TweakRadio label="Typeface" value={t.type}
          options={['athletic','technical','grotesk']}
          onChange={(v)=>setTweak('type', v)} />

        <TweakSection label="Navigation" />
        <TweakRadio label="Bottom nav" value={t.nav}
          options={['tabs','dock']}
          onChange={(v)=>setTweak('nav', v)} />

        <TweakSection label="Units" />
        <TweakRadio label="Weight unit" value={t.unit}
          options={['lb','kg']}
          onChange={(v)=>setTweak('unit', v)} />

        <TweakSection label="Data" />
        <TweakButton label="Reset demo data" onClick={()=>{
          const fresh = DB.freshState();
          setState(fresh); setActive({week:0,day:0}); setFocusIdx(0); setTab('today');
        }} />
      </TweaksPanel>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
if (window.__fitPhone) setTimeout(window.__fitPhone, 50);
