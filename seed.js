/* ============================================================
   WORKOUT PWA — data layer (plain JS, global `DB`)
   ============================================================ */
(function () {
  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 8);

  /* -------- Exercise master library -------- */
  // type: 'weight' (load+reps) | 'timed' (duration) | 'bodyweight'
  const LIBRARY = [
    ex('bench-press', 'Barbell Bench Press', 'Chest', 'Barbell', 'weight', ['Chest','Triceps','Front Delts']),
    ex('incline-db-press', 'Incline Dumbbell Press', 'Chest', 'Dumbbell', 'weight', ['Upper Chest','Front Delts']),
    ex('push-up', 'Push-Up', 'Chest', 'Bodyweight', 'bodyweight', ['Chest','Triceps']),
    ex('back-squat', 'Barbell Back Squat', 'Legs', 'Barbell', 'weight', ['Quads','Glutes']),
    ex('rdl', 'Romanian Deadlift', 'Legs', 'Barbell', 'weight', ['Hamstrings','Glutes']),
    ex('leg-press', 'Leg Press', 'Legs', 'Machine', 'weight', ['Quads','Glutes']),
    ex('deadlift', 'Conventional Deadlift', 'Back', 'Barbell', 'weight', ['Back','Hamstrings','Glutes']),
    ex('pull-up', 'Pull-Up', 'Back', 'Bodyweight', 'bodyweight', ['Lats','Biceps']),
    ex('barbell-row', 'Barbell Row', 'Back', 'Barbell', 'weight', ['Lats','Mid Back']),
    ex('lat-pulldown', 'Lat Pulldown', 'Back', 'Cable', 'weight', ['Lats','Biceps']),
    ex('ohp', 'Overhead Press', 'Shoulders', 'Barbell', 'weight', ['Delts','Triceps']),
    ex('lateral-raise', 'Dumbbell Lateral Raise', 'Shoulders', 'Dumbbell', 'weight', ['Side Delts']),
    ex('db-curl', 'Dumbbell Curl', 'Arms', 'Dumbbell', 'weight', ['Biceps']),
    ex('tricep-pushdown', 'Triceps Pushdown', 'Arms', 'Cable', 'weight', ['Triceps']),
    ex('plank', 'Front Plank', 'Core', 'Bodyweight', 'timed', ['Core']),
    ex('hanging-leg-raise', 'Hanging Leg Raise', 'Core', 'Bodyweight', 'bodyweight', ['Lower Abs']),
    ex('cable-fly', 'Cable Fly', 'Chest', 'Cable', 'weight', ['Chest']),
    ex('hip-thrust', 'Barbell Hip Thrust', 'Legs', 'Barbell', 'weight', ['Glutes']),
    ex('face-pull', 'Face Pull', 'Shoulders', 'Cable', 'weight', ['Rear Delts']),
    ex('calf-raise', 'Standing Calf Raise', 'Legs', 'Machine', 'weight', ['Calves']),
  ];
  function ex(id, name, group, equipment, type, muscles) {
    return { id, name, group, equipment, type, muscles, custom: false,
      notes: type === 'timed' ? 'Hold position with braced core.' : 'Control the eccentric; full range of motion.' };
  }

  /* -------- Sample structured plan (the shape you'd paste from Claude) -------- */
  function setRow(weight, reps, rest) { return { weight, reps, restSec: rest }; }
  function timedRow(sec, rest) { return { durationSec: sec, restSec: rest }; }

  function pushDay() {
    return { id: uid('day'), name: 'Push', focus: 'Chest · Shoulders · Triceps', exercises: [
      { exerciseId: 'bench-press', sets: [setRow(135,8,120), setRow(155,6,120), setRow(155,6,150), setRow(135,8,120)] },
      { exerciseId: 'incline-db-press', sets: [setRow(50,10,90), setRow(55,8,90), setRow(55,8,90)] },
      { exerciseId: 'ohp', sets: [setRow(85,8,120), setRow(85,6,120), setRow(75,8,120)] },
      { exerciseId: 'lateral-raise', sets: [setRow(15,15,60), setRow(15,15,60), setRow(15,12,60)] },
      { exerciseId: 'tricep-pushdown', sets: [setRow(50,12,60), setRow(50,12,60), setRow(45,15,60)] },
      { exerciseId: 'plank', sets: [timedRow(60,45), timedRow(60,45), timedRow(45,45)] },
    ]};
  }
  function pullDay() {
    return { id: uid('day'), name: 'Pull', focus: 'Back · Biceps', exercises: [
      { exerciseId: 'deadlift', sets: [setRow(225,5,180), setRow(245,3,180), setRow(225,5,180)] },
      { exerciseId: 'pull-up', sets: [setRow(0,8,90), setRow(0,7,90), setRow(0,6,90)] },
      { exerciseId: 'barbell-row', sets: [setRow(135,10,90), setRow(135,10,90), setRow(155,8,90)] },
      { exerciseId: 'lat-pulldown', sets: [setRow(120,12,75), setRow(120,12,75), setRow(110,12,75)] },
      { exerciseId: 'db-curl', sets: [setRow(30,12,60), setRow(30,10,60), setRow(25,12,60)] },
      { exerciseId: 'face-pull', sets: [setRow(40,15,45), setRow(40,15,45)] },
    ]};
  }
  function legDay() {
    return { id: uid('day'), name: 'Legs', focus: 'Quads · Hamstrings · Glutes', exercises: [
      { exerciseId: 'back-squat', sets: [setRow(185,8,150), setRow(205,6,150), setRow(205,6,180), setRow(185,8,150)] },
      { exerciseId: 'rdl', sets: [setRow(155,10,120), setRow(175,8,120), setRow(175,8,120)] },
      { exerciseId: 'leg-press', sets: [setRow(360,12,90), setRow(360,12,90), setRow(360,10,90)] },
      { exerciseId: 'hip-thrust', sets: [setRow(225,12,90), setRow(225,12,90)] },
      { exerciseId: 'calf-raise', sets: [setRow(200,15,45), setRow(200,15,45), setRow(200,12,45)] },
    ]};
  }
  function restDay(name) { return { id: uid('day'), name, focus: 'Recovery', rest: true, exercises: [] }; }

  function buildWeek(n) {
    return { id: uid('wk'), name: 'Week ' + n,
      days: [ pushDay(), pullDay(), restDay('Mobility'), legDay(), pushDay(), restDay('Rest'), pullDay() ] };
  }

  const SAMPLE_PLAN = {
    id: uid('plan'),
    name: 'Upper / Lower Hypertrophy',
    goal: 'Hypertrophy',
    weeksCount: 6,
    startDate: '2026-06-01',
    weeks: [buildWeek(1), buildWeek(2), buildWeek(3)],
  };

  /* -------- A compact, documented schema example for the Import screen -------- */
  const SCHEMA_EXAMPLE = `{
  "name": "Upper / Lower Hypertrophy",
  "goal": "Hypertrophy",
  "weeks": [
    {
      "name": "Week 1",
      "days": [
        {
          "name": "Push",
          "focus": "Chest · Shoulders · Triceps",
          "exercises": [
            {
              "exerciseId": "bench-press",
              "sets": [
                { "weight": 135, "reps": 8, "restSec": 120 },
                { "weight": 155, "reps": 6, "restSec": 150 }
              ]
            },
            {
              "exerciseId": "plank",
              "sets": [
                { "durationSec": 60, "restSec": 45 }
              ]
            }
          ]
        },
        { "name": "Rest", "rest": true, "exercises": [] }
      ]
    }
  ]
}`;

  /* -------- Seed exercise history (for progress charts) -------- */
  function seedHistory() {
    const h = {};
    const today = new Date('2026-06-08');
    const add = (id, daysAgo, sets) => {
      const d = new Date(today); d.setDate(d.getDate() - daysAgo);
      (h[id] = h[id] || []).push({ date: d.toISOString().slice(0,10), sets });
    };
    // Bench press progressing over ~10 weeks
    const bench = [[125,8],[130,8],[130,7],[135,8],[135,6],[140,7],[140,6],[145,6],[150,5],[155,6]];
    bench.forEach((s,i) => add('bench-press', (bench.length-1-i)*7, [
      {weight:s[0]-20,reps:8},{weight:s[0],reps:s[1]},{weight:s[0],reps:s[1]-1},{weight:s[0]-20,reps:8}
    ]));
    const squat = [[155,8],[165,8],[175,6],[185,8],[185,6],[195,6],[205,6],[205,5],[215,5],[225,5]];
    squat.forEach((s,i) => add('back-squat', (squat.length-1-i)*7+2, [
      {weight:s[0]-30,reps:8},{weight:s[0],reps:s[1]},{weight:s[0],reps:s[1]}
    ]));
    const dl = [[205,5],[225,5],[245,4],[255,5],[265,4],[275,4],[285,3],[295,3]];
    dl.forEach((s,i) => add('deadlift', (dl.length-1-i)*9, [
      {weight:s[0]-40,reps:5},{weight:s[0],reps:s[1]}
    ]));
    const ohp = [[75,8],[80,7],[80,6],[85,7],[85,6],[90,5],[90,6]];
    ohp.forEach((s,i) => add('ohp', (ohp.length-1-i)*8, [
      {weight:s[0]-10,reps:8},{weight:s[0],reps:s[1]}
    ]));
    return h;
  }

  /* -------- Calc helpers -------- */
  function epley1RM(weight, reps) {
    if (!weight || !reps) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  }
  function setVolume(set) { return (set.weight || 0) * (set.reps || 0); }
  function sessionVolume(sets) { return sets.reduce((a,s)=> a + setVolume(s), 0); }
  function best1RMOfSession(sets) { return sets.reduce((m,s)=> Math.max(m, epley1RM(s.weight, s.reps)), 0); }
  function bestSetOfSession(sets) {
    return sets.reduce((b,s)=> epley1RM(s.weight,s.reps) > epley1RM(b.weight||0,b.reps||0) ? s : b, {weight:0,reps:0});
  }

  /* -------- Storage -------- */
  const KEY = 'workoutpwa.v1';
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function freshState() {
    return {
      library: LIBRARY.map(e => ({...e})),
      plan: SAMPLE_PLAN,
      history: seedHistory(),
      logs: {},          // key `${dayId}` -> { exIndex: { setIndex: {weight,reps,done} } }
      completedDays: {}, // dayId -> ISO date
      settings: { theme: 'midnight', type: 'athletic', nav: 'tabs', unit: 'lb' },
    };
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* -------- Build a copy/paste prompt for Claude (embeds the live library) -------- */
  function buildClaudePrompt(library) {
    const lines = library.map(e =>
      `  ${e.id.padEnd(20)} — ${e.name} (${e.group}, ${e.type})`
    ).join('\n');
    return `You are generating a structured strength-training plan as JSON for my workout app.
Output ONLY valid JSON — no markdown code fences, no commentary before or after.

It must match this exact schema:

{
  "name": "string",            // plan title
  "goal": "string",            // e.g. "Hypertrophy", "Strength", "Cut"
  "weeksCount": 0,             // total intended length in weeks
  "weeks": [
    {
      "name": "Week 1",
      "days": [
        {
          "name": "Push",      // day label
          "focus": "Chest · Shoulders · Triceps",  // short summary (optional)
          "rest": false,       // true = recovery day, then "exercises": []
          "exercises": [
            {
              "exerciseId": "bench-press",   // MUST be an id from the list below
              "sets": [
                { "weight": 135, "reps": 8, "restSec": 120 },
                { "weight": 155, "reps": 6, "restSec": 150 }
              ]
            },
            {
              "exerciseId": "plank",          // a TIMED exercise
              "sets": [
                { "durationSec": 60, "restSec": 45 }   // use durationSec, NOT weight/reps
              ]
            }
          ]
        },
        { "name": "Rest", "rest": true, "exercises": [] }
      ]
    }
  ]
}

RULES — follow exactly:
- "exerciseId" MUST be one of the ids in the list below. Never invent an id. If you need a movement that isn't listed, pick the closest available id.
- For exercises of type "timed", every set uses { "durationSec": <seconds>, "restSec": <seconds> } — never weight/reps.
- For type "bodyweight", set "weight": 0 (you may add weight for weighted variations).
- "restSec" is the rest taken AFTER that set, in seconds.
- Include recovery days as { "name": "Rest", "rest": true, "exercises": [] }.
- Progress load/reps sensibly across weeks.

AVAILABLE EXERCISES — use the id on the left:
${lines}

----------------------------------------------------------------
MY PLAN REQUIREMENTS (edit this part):
- Goal:
- Days per week & split (e.g. Push/Pull/Legs):
- Number of weeks:
- Experience level / available equipment:
- Target rep ranges or anything else:
`;
  }

  window.DB = {
    uid, LIBRARY, SAMPLE_PLAN, SCHEMA_EXAMPLE,
    epley1RM, setVolume, sessionVolume, best1RMOfSession, bestSetOfSession,
    load, save, freshState, buildWeek, buildClaudePrompt,
  };
})();
