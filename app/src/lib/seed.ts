/* ============================================================
   Data layer — default library, sample plan, seeded demo
   history, fresh state, and the Claude prompt builder.
   Ported from seed.js.
   ============================================================ */
import type {
  AppState,
  Exercise,
  HistoryMap,
  Plan,
  PlanDay,
  PlanWeek,
  TimedSet,
  WeightSet,
} from '@/types';

export const uid = (p: string): string =>
  p + '_' + Math.random().toString(36).slice(2, 8);

/* -------- Exercise master library (187 exercises) -------- */
export const LIBRARY: Exercise[] = [
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', group: 'Chest', equipment: 'Barbell', type: 'weight', muscles: ['Pectoralis Major', 'Anterior Deltoid', 'Triceps'], notes: 'Flat bench. Bar to mid-chest, drive feet, keep shoulder blades retracted.', custom: false },
  { id: 'incline-barbell-bench-press', name: 'Incline Barbell Bench Press', group: 'Chest', equipment: 'Barbell', type: 'weight', muscles: ['Upper Pectoralis', 'Anterior Deltoid', 'Triceps'], notes: '30-45 degree bench. Emphasizes the upper chest.', custom: false },
  { id: 'decline-barbell-bench-press', name: 'Decline Barbell Bench Press', group: 'Chest', equipment: 'Barbell', type: 'weight', muscles: ['Lower Pectoralis', 'Triceps'], notes: 'Decline bench. Targets the lower pec fibers.', custom: false },
  { id: 'barbell-floor-press', name: 'Barbell Floor Press', group: 'Chest', equipment: 'Barbell', type: 'weight', muscles: ['Pectoralis Major', 'Triceps'], notes: 'Pressing from the floor limits range, reducing shoulder strain.', custom: false },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', group: 'Chest', equipment: 'Dumbbell', type: 'weight', muscles: ['Pectoralis Major', 'Anterior Deltoid', 'Triceps'], notes: 'Greater range of motion and independent arm work vs barbell.', custom: false },
  { id: 'incline-dumbbell-bench-press', name: 'Incline Dumbbell Bench Press', group: 'Chest', equipment: 'Dumbbell', type: 'weight', muscles: ['Upper Pectoralis', 'Anterior Deltoid', 'Triceps'], notes: 'Incline angle biases the clavicular head of the pec.', custom: false },
  { id: 'decline-dumbbell-bench-press', name: 'Decline Dumbbell Bench Press', group: 'Chest', equipment: 'Dumbbell', type: 'weight', muscles: ['Lower Pectoralis', 'Triceps'], notes: 'Decline angle for lower chest emphasis.', custom: false },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', group: 'Chest', equipment: 'Dumbbell', type: 'weight', muscles: ['Pectoralis Major'], notes: 'Slight elbow bend, wide arc. Stretch and squeeze the chest.', custom: false },
  { id: 'incline-dumbbell-fly', name: 'Incline Dumbbell Fly', group: 'Chest', equipment: 'Dumbbell', type: 'weight', muscles: ['Upper Pectoralis'], notes: 'Fly motion on an incline to bias the upper chest.', custom: false },
  { id: 'dumbbell-pullover', name: 'Dumbbell Pullover', group: 'Chest', equipment: 'Dumbbell', type: 'weight', muscles: ['Pectoralis Major', 'Lats', 'Serratus Anterior'], notes: 'Lie across a bench, arc the weight overhead. Hits chest and lats.', custom: false },
  { id: 'machine-chest-press', name: 'Machine Chest Press', group: 'Chest', equipment: 'Machine', type: 'weight', muscles: ['Pectoralis Major', 'Triceps', 'Anterior Deltoid'], notes: 'Seated press; fixed path makes it beginner-friendly.', custom: false },
  { id: 'incline-machine-chest-press', name: 'Incline Machine Chest Press', group: 'Chest', equipment: 'Machine', type: 'weight', muscles: ['Upper Pectoralis', 'Anterior Deltoid', 'Triceps'], notes: 'Machine press angled for upper chest.', custom: false },
  { id: 'pec-deck-fly', name: 'Pec Deck Fly', group: 'Chest', equipment: 'Machine', type: 'weight', muscles: ['Pectoralis Major'], notes: 'Seated machine fly. Keep a constant elbow angle and squeeze.', custom: false },
  { id: 'hammer-strength-chest-press', name: 'Hammer Strength Chest Press', group: 'Chest', equipment: 'Machine', type: 'weight', muscles: ['Pectoralis Major', 'Triceps', 'Anterior Deltoid'], notes: 'Plate-loaded converging press for a strong contraction.', custom: false },
  { id: 'cable-crossover', name: 'Cable Crossover', group: 'Chest', equipment: 'Cable', type: 'weight', muscles: ['Pectoralis Major'], notes: 'High pulleys, cross hands at the bottom for peak contraction.', custom: false },
  { id: 'low-cable-fly', name: 'Low Cable Fly', group: 'Chest', equipment: 'Cable', type: 'weight', muscles: ['Upper Pectoralis'], notes: 'Pulleys set low, drive upward to target the upper chest.', custom: false },
  { id: 'high-cable-fly', name: 'High Cable Fly', group: 'Chest', equipment: 'Cable', type: 'weight', muscles: ['Lower Pectoralis'], notes: 'Pulleys set high, drive downward to target the lower chest.', custom: false },
  { id: 'smith-machine-bench-press', name: 'Smith Machine Bench Press', group: 'Chest', equipment: 'Smith Machine', type: 'weight', muscles: ['Pectoralis Major', 'Triceps', 'Anterior Deltoid'], notes: 'Fixed bar path; good for controlled pressing.', custom: false },
  { id: 'smith-machine-incline-press', name: 'Smith Machine Incline Press', group: 'Chest', equipment: 'Smith Machine', type: 'weight', muscles: ['Upper Pectoralis', 'Anterior Deltoid', 'Triceps'], notes: 'Incline press with a guided bar path.', custom: false },
  { id: 'push-up', name: 'Push-Up', group: 'Chest', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Pectoralis Major', 'Triceps', 'Core'], notes: 'Body in a straight line, chest to floor, full lockout.', custom: false },
  { id: 'incline-push-up', name: 'Incline Push-Up', group: 'Chest', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lower Pectoralis', 'Triceps'], notes: 'Hands elevated; easier variation, lower-chest bias.', custom: false },
  { id: 'decline-push-up', name: 'Decline Push-Up', group: 'Chest', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Upper Pectoralis', 'Anterior Deltoid', 'Triceps'], notes: 'Feet elevated; harder variation, upper-chest bias.', custom: false },
  { id: 'wide-grip-push-up', name: 'Wide-Grip Push-Up', group: 'Chest', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Pectoralis Major'], notes: 'Wider hand placement increases chest stretch.', custom: false },
  { id: 'chest-dip', name: 'Chest Dip', group: 'Chest', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lower Pectoralis', 'Triceps'], notes: 'Lean torso forward to bias the chest over the triceps.', custom: false },
  { id: 'barbell-bent-over-row', name: 'Barbell Bent-Over Row', group: 'Back', equipment: 'Barbell', type: 'weight', muscles: ['Lats', 'Rhomboids', 'Trapezius', 'Rear Deltoid'], notes: 'Hinge to ~45 degrees, pull to the lower ribs, neutral spine.', custom: false },
  { id: 'pendlay-row', name: 'Pendlay Row', group: 'Back', equipment: 'Barbell', type: 'weight', muscles: ['Lats', 'Rhomboids', 'Trapezius'], notes: 'Bar resets on the floor each rep; explosive horizontal pull.', custom: false },
  { id: 't-bar-row', name: 'T-Bar Row', group: 'Back', equipment: 'Barbell', type: 'weight', muscles: ['Lats', 'Rhomboids', 'Trapezius'], notes: 'Landmine or T-bar handle; thick mid-back loading.', custom: false },
  { id: 'barbell-shrug', name: 'Barbell Shrug', group: 'Back', equipment: 'Barbell', type: 'weight', muscles: ['Trapezius'], notes: 'Shrug straight up; avoid rolling the shoulders.', custom: false },
  { id: 'rack-pull', name: 'Rack Pull', group: 'Back', equipment: 'Barbell', type: 'weight', muscles: ['Trapezius', 'Lats', 'Glutes', 'Erector Spinae'], notes: 'Partial pull from pins at knee height; heavy back loading.', custom: false },
  { id: 'conventional-deadlift', name: 'Conventional Deadlift', group: 'Back', equipment: 'Barbell', type: 'weight', muscles: ['Erector Spinae', 'Glutes', 'Hamstrings', 'Trapezius', 'Lats'], notes: 'Hip hinge, neutral spine, bar travels close to the legs.', custom: false },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', group: 'Back', equipment: 'Barbell', type: 'weight', muscles: ['Hamstrings', 'Glutes', 'Erector Spinae'], notes: 'Soft knees, push hips back, slight stretch in the hamstrings.', custom: false },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', group: 'Back', equipment: 'Barbell', type: 'weight', muscles: ['Glutes', 'Adductors', 'Quads', 'Erector Spinae', 'Trapezius'], notes: 'Wide stance, hands inside the knees, more upright torso.', custom: false },
  { id: 'deficit-deadlift', name: 'Deficit Deadlift', group: 'Back', equipment: 'Barbell', type: 'weight', muscles: ['Erector Spinae', 'Glutes', 'Hamstrings', 'Trapezius'], notes: 'Stand on a plate for added range; builds pulling strength.', custom: false },
  { id: 'one-arm-dumbbell-row', name: 'One-Arm Dumbbell Row', group: 'Back', equipment: 'Dumbbell', type: 'weight', muscles: ['Lats', 'Rhomboids', 'Rear Deltoid'], notes: 'Support on a bench, pull to the hip, control the stretch.', custom: false },
  { id: 'chest-supported-dumbbell-row', name: 'Chest-Supported Dumbbell Row', group: 'Back', equipment: 'Dumbbell', type: 'weight', muscles: ['Lats', 'Rhomboids', 'Trapezius', 'Rear Deltoid'], notes: 'Incline bench removes lower-back involvement; strict pulling.', custom: false },
  { id: 'dumbbell-shrug', name: 'Dumbbell Shrug', group: 'Back', equipment: 'Dumbbell', type: 'weight', muscles: ['Trapezius'], notes: 'Heavy shrug with a full pause at the top.', custom: false },
  { id: 'lat-pulldown', name: 'Lat Pulldown', group: 'Back', equipment: 'Machine', type: 'weight', muscles: ['Lats', 'Biceps', 'Rhomboids'], notes: 'Pull to the upper chest, drive elbows down and back.', custom: false },
  { id: 'wide-grip-lat-pulldown', name: 'Wide-Grip Lat Pulldown', group: 'Back', equipment: 'Machine', type: 'weight', muscles: ['Lats', 'Teres Major'], notes: 'Wider grip biases lat width.', custom: false },
  { id: 'close-grip-lat-pulldown', name: 'Close-Grip Lat Pulldown', group: 'Back', equipment: 'Machine', type: 'weight', muscles: ['Lats', 'Biceps'], notes: 'Neutral or close grip; more bicep and lower-lat involvement.', custom: false },
  { id: 'seated-cable-row', name: 'Seated Cable Row', group: 'Back', equipment: 'Cable', type: 'weight', muscles: ['Lats', 'Rhomboids', 'Trapezius', 'Biceps'], notes: 'Pull to the navel, squeeze the shoulder blades, avoid leaning.', custom: false },
  { id: 'single-arm-cable-row', name: 'Single-Arm Cable Row', group: 'Back', equipment: 'Cable', type: 'weight', muscles: ['Lats', 'Rhomboids', 'Rear Deltoid'], notes: 'Unilateral row for balanced mid-back development.', custom: false },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Pulldown', group: 'Back', equipment: 'Cable', type: 'weight', muscles: ['Lats'], notes: 'Keep arms nearly straight; isolates the lats.', custom: false },
  { id: 'hammer-strength-row', name: 'Hammer Strength Row', group: 'Back', equipment: 'Machine', type: 'weight', muscles: ['Lats', 'Rhomboids', 'Trapezius'], notes: 'Plate-loaded row with a fixed, chest-supported path.', custom: false },
  { id: 'machine-lat-pulldown', name: 'Machine Lat Pulldown', group: 'Back', equipment: 'Machine', type: 'weight', muscles: ['Lats', 'Biceps'], notes: 'Plate-loaded or selectorized vertical pull.', custom: false },
  { id: 'pull-up', name: 'Pull-Up', group: 'Back', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lats', 'Biceps', 'Rhomboids'], notes: 'Pronated grip, full hang to chin over the bar.', custom: false },
  { id: 'chin-up', name: 'Chin-Up', group: 'Back', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lats', 'Biceps'], notes: 'Supinated grip; more bicep involvement than a pull-up.', custom: false },
  { id: 'neutral-grip-pull-up', name: 'Neutral-Grip Pull-Up', group: 'Back', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lats', 'Biceps', 'Brachialis'], notes: 'Palms facing; joint-friendly vertical pull.', custom: false },
  { id: 'assisted-pull-up', name: 'Assisted Pull-Up', group: 'Back', equipment: 'Machine', type: 'weight', muscles: ['Lats', 'Biceps'], notes: 'Counterweighted machine to build toward bodyweight pull-ups.', custom: false },
  { id: 'inverted-row', name: 'Inverted Row', group: 'Back', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lats', 'Rhomboids', 'Rear Deltoid'], notes: 'Bar in a rack, body straight, pull chest to the bar.', custom: false },
  { id: 'barbell-back-squat', name: 'Barbell Back Squat', group: 'Legs', equipment: 'Barbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'], notes: 'Bar on traps, break at hips and knees, depth to parallel or below.', custom: false },
  { id: 'barbell-front-squat', name: 'Barbell Front Squat', group: 'Legs', equipment: 'Barbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Core'], notes: 'Bar racked on the front delts; upright torso, quad emphasis.', custom: false },
  { id: 'box-squat', name: 'Box Squat', group: 'Legs', equipment: 'Barbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Hamstrings'], notes: 'Sit back to a box; controls depth and builds the posterior chain.', custom: false },
  { id: 'pause-squat', name: 'Pause Squat', group: 'Legs', equipment: 'Barbell', type: 'weight', muscles: ['Quadriceps', 'Glutes'], notes: 'Pause in the hole to build strength out of the bottom.', custom: false },
  { id: 'barbell-lunge', name: 'Barbell Lunge', group: 'Legs', equipment: 'Barbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Hamstrings'], notes: 'Step forward, drop the back knee, drive through the front heel.', custom: false },
  { id: 'barbell-hip-thrust', name: 'Barbell Hip Thrust', group: 'Legs', equipment: 'Barbell', type: 'weight', muscles: ['Glutes', 'Hamstrings'], notes: 'Shoulders on a bench, drive hips up, full glute squeeze at the top.', custom: false },
  { id: 'barbell-glute-bridge', name: 'Barbell Glute Bridge', group: 'Legs', equipment: 'Barbell', type: 'weight', muscles: ['Glutes', 'Hamstrings'], notes: 'Floor-based hip extension; full lockout at the top.', custom: false },
  { id: 'good-morning', name: 'Good Morning', group: 'Legs', equipment: 'Barbell', type: 'weight', muscles: ['Hamstrings', 'Glutes', 'Erector Spinae'], notes: 'Bar on back, hinge at the hips with soft knees.', custom: false },
  { id: 'goblet-squat', name: 'Goblet Squat', group: 'Legs', equipment: 'Dumbbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Core'], notes: 'Hold a dumbbell at the chest; great for upright squat patterning.', custom: false },
  { id: 'dumbbell-lunge', name: 'Dumbbell Lunge', group: 'Legs', equipment: 'Dumbbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Hamstrings'], notes: 'Hold dumbbells at the sides; step and lunge.', custom: false },
  { id: 'dumbbell-walking-lunge', name: 'Dumbbell Walking Lunge', group: 'Legs', equipment: 'Dumbbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Hamstrings'], notes: 'Walk forward alternating legs under load.', custom: false },
  { id: 'dumbbell-bulgarian-split-squat', name: 'Dumbbell Bulgarian Split Squat', group: 'Legs', equipment: 'Dumbbell', type: 'weight', muscles: ['Quadriceps', 'Glutes'], notes: 'Rear foot elevated; deep single-leg loading.', custom: false },
  { id: 'dumbbell-step-up', name: 'Dumbbell Step-Up', group: 'Legs', equipment: 'Dumbbell', type: 'weight', muscles: ['Quadriceps', 'Glutes'], notes: 'Step onto a box driving through the lead heel.', custom: false },
  { id: 'dumbbell-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', group: 'Legs', equipment: 'Dumbbell', type: 'weight', muscles: ['Hamstrings', 'Glutes'], notes: 'Hinge with dumbbells; controlled hamstring stretch.', custom: false },
  { id: 'leg-press', name: 'Leg Press', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Hamstrings'], notes: 'Feet on the platform, controlled depth, avoid locking the knees.', custom: false },
  { id: 'hack-squat', name: 'Hack Squat', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Quadriceps', 'Glutes'], notes: 'Back against the pad; strong quad-focused squat pattern.', custom: false },
  { id: 'pendulum-squat', name: 'Pendulum Squat', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Quadriceps', 'Glutes'], notes: 'Arc-path machine squat with constant tension.', custom: false },
  { id: 'belt-squat', name: 'Belt Squat', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Quadriceps', 'Glutes'], notes: 'Load hangs from the hips; spares the spine.', custom: false },
  { id: 'leg-extension', name: 'Leg Extension', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Quadriceps'], notes: 'Seated knee extension; isolates the quads.', custom: false },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Hamstrings'], notes: 'Curl the pad to the glutes; keep hips down.', custom: false },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Hamstrings'], notes: 'Seated hamstring curl; strong stretch under load.', custom: false },
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Gastrocnemius'], notes: 'Full stretch at the bottom, full plantarflexion at the top.', custom: false },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Soleus'], notes: 'Bent-knee position biases the soleus.', custom: false },
  { id: 'hip-abduction-machine', name: 'Hip Abduction Machine', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Gluteus Medius', 'Glutes'], notes: 'Press the legs outward; targets the outer glutes.', custom: false },
  { id: 'hip-adduction-machine', name: 'Hip Adduction Machine', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Adductors'], notes: 'Squeeze the legs inward; targets the inner thigh.', custom: false },
  { id: 'glute-kickback-machine', name: 'Glute Kickback Machine', group: 'Legs', equipment: 'Machine', type: 'weight', muscles: ['Glutes', 'Hamstrings'], notes: 'Drive one leg back; isolates the glutes.', custom: false },
  { id: 'smith-machine-squat', name: 'Smith Machine Squat', group: 'Legs', equipment: 'Smith Machine', type: 'weight', muscles: ['Quadriceps', 'Glutes'], notes: 'Guided bar path; allows a more forward foot position.', custom: false },
  { id: 'smith-machine-lunge', name: 'Smith Machine Lunge', group: 'Legs', equipment: 'Smith Machine', type: 'weight', muscles: ['Quadriceps', 'Glutes'], notes: 'Split stance with a fixed bar path for stability.', custom: false },
  { id: 'smith-machine-calf-raise', name: 'Smith Machine Calf Raise', group: 'Legs', equipment: 'Smith Machine', type: 'weight', muscles: ['Gastrocnemius'], notes: 'Calf raises with the bar across the shoulders.', custom: false },
  { id: 'bodyweight-squat', name: 'Bodyweight Squat', group: 'Legs', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Quadriceps', 'Glutes'], notes: 'Sit back and down to depth; arms forward for balance.', custom: false },
  { id: 'walking-lunge', name: 'Walking Lunge', group: 'Legs', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Quadriceps', 'Glutes', 'Hamstrings'], notes: 'Alternating forward lunges across the floor.', custom: false },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', group: 'Legs', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Quadriceps', 'Glutes'], notes: 'Rear foot elevated single-leg squat.', custom: false },
  { id: 'pistol-squat', name: 'Pistol Squat', group: 'Legs', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Quadriceps', 'Glutes', 'Core'], notes: 'Single-leg squat to full depth; advanced balance and strength.', custom: false },
  { id: 'bodyweight-step-up', name: 'Bodyweight Step-Up', group: 'Legs', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Quadriceps', 'Glutes'], notes: 'Step onto a box; control the descent.', custom: false },
  { id: 'glute-bridge', name: 'Glute Bridge', group: 'Legs', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Glutes', 'Hamstrings'], notes: 'Floor hip extension; squeeze at the top.', custom: false },
  { id: 'nordic-hamstring-curl', name: 'Nordic Hamstring Curl', group: 'Legs', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Hamstrings'], notes: 'Anchor the feet, lower the torso under control; eccentric focus.', custom: false },
  { id: 'bodyweight-calf-raise', name: 'Bodyweight Calf Raise', group: 'Legs', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Gastrocnemius'], notes: 'Rise onto the toes; add a deficit on a step for range.', custom: false },
  { id: 'standing-overhead-press', name: 'Standing Overhead Press', group: 'Shoulders', equipment: 'Barbell', type: 'weight', muscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps'], notes: 'Press from the front delts to lockout; brace the core.', custom: false },
  { id: 'seated-barbell-shoulder-press', name: 'Seated Barbell Shoulder Press', group: 'Shoulders', equipment: 'Barbell', type: 'weight', muscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps'], notes: 'Seated strict press; minimizes leg drive.', custom: false },
  { id: 'push-press', name: 'Push Press', group: 'Shoulders', equipment: 'Barbell', type: 'weight', muscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps'], notes: 'Use a slight leg dip to drive the bar overhead.', custom: false },
  { id: 'barbell-upright-row', name: 'Barbell Upright Row', group: 'Shoulders', equipment: 'Barbell', type: 'weight', muscles: ['Lateral Deltoid', 'Trapezius'], notes: 'Pull to chest height; keep elbows above the wrists.', custom: false },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', group: 'Shoulders', equipment: 'Dumbbell', type: 'weight', muscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps'], notes: 'Press overhead with independent arm control.', custom: false },
  { id: 'arnold-press', name: 'Arnold Press', group: 'Shoulders', equipment: 'Dumbbell', type: 'weight', muscles: ['Anterior Deltoid', 'Lateral Deltoid'], notes: 'Rotate from a front-facing grip to overhead; full delt sweep.', custom: false },
  { id: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', group: 'Shoulders', equipment: 'Dumbbell', type: 'weight', muscles: ['Lateral Deltoid'], notes: 'Raise to shoulder height with a slight lean; lead with the elbows.', custom: false },
  { id: 'dumbbell-front-raise', name: 'Dumbbell Front Raise', group: 'Shoulders', equipment: 'Dumbbell', type: 'weight', muscles: ['Anterior Deltoid'], notes: 'Raise to eye level; avoid swinging.', custom: false },
  { id: 'bent-over-reverse-fly', name: 'Bent-Over Reverse Fly', group: 'Shoulders', equipment: 'Dumbbell', type: 'weight', muscles: ['Rear Deltoid', 'Rhomboids'], notes: 'Hinge forward, raise the dumbbells wide; squeeze the rear delts.', custom: false },
  { id: 'dumbbell-upright-row', name: 'Dumbbell Upright Row', group: 'Shoulders', equipment: 'Dumbbell', type: 'weight', muscles: ['Lateral Deltoid', 'Trapezius'], notes: 'Pull dumbbells up the body; elbows lead.', custom: false },
  { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', group: 'Shoulders', equipment: 'Machine', type: 'weight', muscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps'], notes: 'Seated press with a fixed path.', custom: false },
  { id: 'lateral-raise-machine', name: 'Lateral Raise Machine', group: 'Shoulders', equipment: 'Machine', type: 'weight', muscles: ['Lateral Deltoid'], notes: 'Pads on the upper arms; constant tension on the side delts.', custom: false },
  { id: 'reverse-pec-deck', name: 'Reverse Pec Deck', group: 'Shoulders', equipment: 'Machine', type: 'weight', muscles: ['Rear Deltoid', 'Rhomboids'], notes: 'Reverse fly machine; isolates the rear delts.', custom: false },
  { id: 'smith-machine-shoulder-press', name: 'Smith Machine Shoulder Press', group: 'Shoulders', equipment: 'Smith Machine', type: 'weight', muscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps'], notes: 'Guided overhead press for controlled pressing.', custom: false },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', group: 'Shoulders', equipment: 'Cable', type: 'weight', muscles: ['Lateral Deltoid'], notes: 'Low pulley behind the body; constant tension through the range.', custom: false },
  { id: 'cable-front-raise', name: 'Cable Front Raise', group: 'Shoulders', equipment: 'Cable', type: 'weight', muscles: ['Anterior Deltoid'], notes: 'Low pulley to the front; steady tension.', custom: false },
  { id: 'cable-face-pull', name: 'Cable Face Pull', group: 'Shoulders', equipment: 'Cable', type: 'weight', muscles: ['Rear Deltoid', 'Trapezius', 'Rhomboids'], notes: 'Rope to the face, elbows high; great for shoulder health.', custom: false },
  { id: 'cable-reverse-fly', name: 'Cable Reverse Fly', group: 'Shoulders', equipment: 'Cable', type: 'weight', muscles: ['Rear Deltoid'], notes: 'Cross-body cables, pull wide; isolates the rear delts.', custom: false },
  { id: 'cable-upright-row', name: 'Cable Upright Row', group: 'Shoulders', equipment: 'Cable', type: 'weight', muscles: ['Lateral Deltoid', 'Trapezius'], notes: 'Low pulley pulled to chest height with constant tension.', custom: false },
  { id: 'pike-push-up', name: 'Pike Push-Up', group: 'Shoulders', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Anterior Deltoid', 'Triceps'], notes: 'Hips high, head toward the floor; vertical pressing pattern.', custom: false },
  { id: 'handstand-push-up', name: 'Handstand Push-Up', group: 'Shoulders', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Anterior Deltoid', 'Triceps', 'Trapezius'], notes: 'Inverted against a wall; advanced overhead strength.', custom: false },
  { id: 'barbell-curl', name: 'Barbell Curl', group: 'Arms', equipment: 'Barbell', type: 'weight', muscles: ['Biceps'], notes: 'Elbows pinned, curl without swinging; full squeeze.', custom: false },
  { id: 'ez-bar-curl', name: 'EZ-Bar Curl', group: 'Arms', equipment: 'EZ Bar', type: 'weight', muscles: ['Biceps', 'Brachialis'], notes: 'Angled grip is easier on the wrists than a straight bar.', custom: false },
  { id: 'preacher-curl', name: 'Preacher Curl', group: 'Arms', equipment: 'EZ Bar', type: 'weight', muscles: ['Biceps'], notes: 'Arms on the preacher pad; strict, no momentum.', custom: false },
  { id: 'reverse-curl', name: 'Reverse Curl', group: 'Arms', equipment: 'EZ Bar', type: 'weight', muscles: ['Brachialis', 'Forearms', 'Biceps'], notes: 'Pronated grip; builds the brachialis and forearms.', custom: false },
  { id: 'drag-curl', name: 'Drag Curl', group: 'Arms', equipment: 'Barbell', type: 'weight', muscles: ['Biceps'], notes: 'Drag the bar up the torso, elbows back; peak contraction.', custom: false },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Biceps'], notes: 'Curl with optional supination; alternate or together.', custom: false },
  { id: 'hammer-curl', name: 'Hammer Curl', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Brachialis', 'Biceps', 'Forearms'], notes: 'Neutral grip throughout; builds arm thickness.', custom: false },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Biceps'], notes: 'Lie back on an incline; stretches the long head of the bicep.', custom: false },
  { id: 'concentration-curl', name: 'Concentration Curl', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Biceps'], notes: 'Elbow braced on the inner thigh; strict isolation.', custom: false },
  { id: 'zottman-curl', name: 'Zottman Curl', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Biceps', 'Brachialis', 'Forearms'], notes: 'Curl up supinated, rotate, lower pronated.', custom: false },
  { id: 'cable-curl', name: 'Cable Curl', group: 'Arms', equipment: 'Cable', type: 'weight', muscles: ['Biceps'], notes: 'Low pulley with a straight or EZ bar; constant tension.', custom: false },
  { id: 'cable-rope-hammer-curl', name: 'Cable Rope Hammer Curl', group: 'Arms', equipment: 'Cable', type: 'weight', muscles: ['Brachialis', 'Biceps', 'Forearms'], notes: 'Neutral rope grip; thickness-focused with steady tension.', custom: false },
  { id: 'machine-preacher-curl', name: 'Machine Preacher Curl', group: 'Arms', equipment: 'Machine', type: 'weight', muscles: ['Biceps'], notes: 'Plate-loaded or selectorized preacher curl.', custom: false },
  { id: 'bicep-curl-machine', name: 'Bicep Curl Machine', group: 'Arms', equipment: 'Machine', type: 'weight', muscles: ['Biceps'], notes: 'Seated machine curl with a fixed arm path.', custom: false },
  { id: 'close-grip-bench-press', name: 'Close-Grip Bench Press', group: 'Arms', equipment: 'Barbell', type: 'weight', muscles: ['Triceps', 'Pectoralis Major', 'Anterior Deltoid'], notes: 'Shoulder-width grip; triceps-dominant pressing.', custom: false },
  { id: 'skull-crusher', name: 'Skull Crusher', group: 'Arms', equipment: 'EZ Bar', type: 'weight', muscles: ['Triceps'], notes: 'Lying extension; lower the bar to the forehead or behind the head.', custom: false },
  { id: 'jm-press', name: 'JM Press', group: 'Arms', equipment: 'Barbell', type: 'weight', muscles: ['Triceps'], notes: 'Hybrid of a close-grip press and a skull crusher.', custom: false },
  { id: 'overhead-dumbbell-extension', name: 'Overhead Dumbbell Extension', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Triceps'], notes: 'One or two hands overhead; stretches the long head.', custom: false },
  { id: 'dumbbell-kickback', name: 'Dumbbell Kickback', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Triceps'], notes: 'Hinge forward, extend the arm fully behind the body.', custom: false },
  { id: 'tate-press', name: 'Tate Press', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Triceps'], notes: 'Elbows flared, dumbbells lowered to the chest; inner-tricep focus.', custom: false },
  { id: 'tricep-rope-pushdown', name: 'Tricep Rope Pushdown', group: 'Arms', equipment: 'Cable', type: 'weight', muscles: ['Triceps'], notes: 'Rope at a high pulley; spread the rope at the bottom.', custom: false },
  { id: 'tricep-bar-pushdown', name: 'Tricep Bar Pushdown', group: 'Arms', equipment: 'Cable', type: 'weight', muscles: ['Triceps'], notes: 'Straight or V-bar pushdown; elbows pinned.', custom: false },
  { id: 'overhead-cable-extension', name: 'Overhead Cable Extension', group: 'Arms', equipment: 'Cable', type: 'weight', muscles: ['Triceps'], notes: 'Rope overhead facing away; long-head stretch.', custom: false },
  { id: 'single-arm-cable-pushdown', name: 'Single-Arm Cable Pushdown', group: 'Arms', equipment: 'Cable', type: 'weight', muscles: ['Triceps'], notes: 'Unilateral pushdown for balanced development.', custom: false },
  { id: 'tricep-extension-machine', name: 'Tricep Extension Machine', group: 'Arms', equipment: 'Machine', type: 'weight', muscles: ['Triceps'], notes: 'Seated machine extension with a fixed path.', custom: false },
  { id: 'bench-triceps-dip', name: 'Bench Triceps Dip', group: 'Arms', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Triceps'], notes: 'Hands on a bench, lower the hips, press back up.', custom: false },
  { id: 'diamond-push-up', name: 'Diamond Push-Up', group: 'Arms', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Triceps', 'Pectoralis Major'], notes: 'Hands close in a diamond shape; triceps emphasis.', custom: false },
  { id: 'parallel-bar-dip', name: 'Parallel Bar Dip', group: 'Arms', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Triceps', 'Lower Pectoralis'], notes: 'Upright torso biases the triceps; lean forward for chest.', custom: false },
  { id: 'wrist-curl', name: 'Wrist Curl', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Forearms'], notes: 'Forearms on the thighs; curl the wrists up.', custom: false },
  { id: 'reverse-wrist-curl', name: 'Reverse Wrist Curl', group: 'Arms', equipment: 'Dumbbell', type: 'weight', muscles: ['Forearms'], notes: 'Palms-down wrist extension; targets the extensors.', custom: false },
  { id: 'wrist-roller', name: 'Wrist Roller', group: 'Arms', equipment: 'Other', type: 'weight', muscles: ['Forearms'], notes: 'Roll the weight up on a cord; brutal forearm pump.', custom: false },
  { id: 'plank', name: 'Plank', group: 'Core', equipment: 'Bodyweight', type: 'timed', muscles: ['Rectus Abdominis', 'Transverse Abdominis', 'Core'], notes: 'Forearms down, body in a straight line; brace and hold.', custom: false },
  { id: 'side-plank', name: 'Side Plank', group: 'Core', equipment: 'Bodyweight', type: 'timed', muscles: ['Obliques', 'Core'], notes: 'Stack the hips, hold a straight line on one forearm.', custom: false },
  { id: 'hollow-hold', name: 'Hollow Hold', group: 'Core', equipment: 'Bodyweight', type: 'timed', muscles: ['Rectus Abdominis', 'Core'], notes: 'Lower back pressed down, arms and legs extended; hold.', custom: false },
  { id: 'weighted-plank', name: 'Weighted Plank', group: 'Core', equipment: 'Plate', type: 'timed', muscles: ['Rectus Abdominis', 'Transverse Abdominis'], notes: 'Plank with a plate on the back for added load.', custom: false },
  { id: 'crunch', name: 'Crunch', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Rectus Abdominis'], notes: 'Curl the ribcage toward the pelvis; short range.', custom: false },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Rectus Abdominis', 'Obliques'], notes: 'Alternate elbow to opposite knee; controlled rotation.', custom: false },
  { id: 'sit-up', name: 'Sit-Up', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Rectus Abdominis', 'Hip Flexors'], notes: 'Full trunk flexion from the floor.', custom: false },
  { id: 'reverse-crunch', name: 'Reverse Crunch', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lower Rectus Abdominis'], notes: 'Curl the knees toward the chest, lifting the hips.', custom: false },
  { id: 'lying-leg-raise', name: 'Lying Leg Raise', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lower Rectus Abdominis', 'Hip Flexors'], notes: 'Lift straight legs from the floor; keep the lower back flat.', custom: false },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lower Rectus Abdominis', 'Hip Flexors'], notes: 'Hang from a bar, raise straight legs to horizontal.', custom: false },
  { id: 'hanging-knee-raise', name: 'Hanging Knee Raise', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Lower Rectus Abdominis', 'Hip Flexors'], notes: 'Hang and drive the knees up; easier than straight-leg.', custom: false },
  { id: 'toes-to-bar', name: 'Toes-to-Bar', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Rectus Abdominis', 'Hip Flexors', 'Lats'], notes: 'Hang and bring the toes to the bar; advanced.', custom: false },
  { id: 'v-up', name: 'V-Up', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Rectus Abdominis', 'Hip Flexors'], notes: 'Simultaneously raise the torso and legs to a V.', custom: false },
  { id: 'dead-bug', name: 'Dead Bug', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Transverse Abdominis', 'Core'], notes: 'Opposite arm and leg extend while bracing the trunk.', custom: false },
  { id: 'flutter-kicks', name: 'Flutter Kicks', group: 'Core', equipment: 'Bodyweight', type: 'timed', muscles: ['Lower Rectus Abdominis', 'Hip Flexors'], notes: 'Small alternating leg kicks; keep the lower back down.', custom: false },
  { id: 'mountain-climbers', name: 'Mountain Climbers', group: 'Core', equipment: 'Bodyweight', type: 'timed', muscles: ['Rectus Abdominis', 'Hip Flexors', 'Core'], notes: 'Drive the knees alternately from a plank position.', custom: false },
  { id: 'russian-twist', name: 'Russian Twist', group: 'Core', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Obliques', 'Rectus Abdominis'], notes: 'Rotate side to side; add a plate or ball for load.', custom: false },
  { id: 'cable-crunch', name: 'Cable Crunch', group: 'Core', equipment: 'Cable', type: 'weight', muscles: ['Rectus Abdominis'], notes: 'Kneel at a high pulley; crunch the ribcage down.', custom: false },
  { id: 'cable-woodchopper', name: 'Cable Woodchopper', group: 'Core', equipment: 'Cable', type: 'weight', muscles: ['Obliques', 'Core'], notes: 'Diagonal pull across the body; rotational power.', custom: false },
  { id: 'pallof-press', name: 'Pallof Press', group: 'Core', equipment: 'Cable', type: 'weight', muscles: ['Obliques', 'Transverse Abdominis'], notes: 'Press a cable straight out and resist rotation; anti-rotation.', custom: false },
  { id: 'ab-crunch-machine', name: 'Ab Crunch Machine', group: 'Core', equipment: 'Machine', type: 'weight', muscles: ['Rectus Abdominis'], notes: 'Loaded crunch with a fixed path.', custom: false },
  { id: "captain-s-chair-leg-raise", name: "Captain's Chair Leg Raise", group: 'Core', equipment: 'Machine', type: 'bodyweight', muscles: ['Lower Rectus Abdominis', 'Hip Flexors'], notes: 'Forearms on the pads, raise the legs; supports the back.', custom: false },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', group: 'Core', equipment: 'Other', type: 'bodyweight', muscles: ['Rectus Abdominis', 'Transverse Abdominis', 'Lats'], notes: 'Roll out under control; keep the spine neutral.', custom: false },
  { id: 'power-clean', name: 'Power Clean', group: 'Full Body', equipment: 'Barbell', type: 'weight', muscles: ['Glutes', 'Hamstrings', 'Trapezius', 'Quadriceps', 'Core'], notes: 'Explosive triple extension; catch the bar on the front delts.', custom: false },
  { id: 'clean-and-jerk', name: 'Clean and Jerk', group: 'Full Body', equipment: 'Barbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Shoulders', 'Trapezius', 'Core'], notes: 'Olympic lift: clean to the shoulders, then jerk overhead.', custom: false },
  { id: 'snatch', name: 'Snatch', group: 'Full Body', equipment: 'Barbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Shoulders', 'Trapezius', 'Core'], notes: 'Olympic lift: floor to overhead in one explosive motion.', custom: false },
  { id: 'hang-clean', name: 'Hang Clean', group: 'Full Body', equipment: 'Barbell', type: 'weight', muscles: ['Glutes', 'Hamstrings', 'Trapezius', 'Quadriceps'], notes: 'Clean starting from the hang; emphasizes the second pull.', custom: false },
  { id: 'barbell-thruster', name: 'Barbell Thruster', group: 'Full Body', equipment: 'Barbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Shoulders', 'Triceps'], notes: 'Front squat into an overhead press in one fluid motion.', custom: false },
  { id: 'dumbbell-thruster', name: 'Dumbbell Thruster', group: 'Full Body', equipment: 'Dumbbell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Shoulders', 'Triceps'], notes: 'Squat-to-press with dumbbells; full-body conditioning.', custom: false },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', group: 'Full Body', equipment: 'Kettlebell', type: 'weight', muscles: ['Glutes', 'Hamstrings', 'Core', 'Shoulders'], notes: 'Hip-hinge driven swing to chest or eye height.', custom: false },
  { id: 'kettlebell-goblet-squat', name: 'Kettlebell Goblet Squat', group: 'Full Body', equipment: 'Kettlebell', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Core'], notes: 'Hold the bell at the chest; upright squat.', custom: false },
  { id: 'turkish-get-up', name: 'Turkish Get-Up', group: 'Full Body', equipment: 'Kettlebell', type: 'weight', muscles: ['Shoulders', 'Core', 'Glutes', 'Quadriceps'], notes: 'Floor-to-stand sequence under load; total-body control.', custom: false },
  { id: "farmer-s-carry", name: "Farmer's Carry", group: 'Full Body', equipment: 'Dumbbell', type: 'weight', muscles: ['Forearms', 'Trapezius', 'Core', 'Glutes'], notes: 'Walk while holding heavy dumbbells or handles; grip and core.', custom: false },
  { id: 'sled-push', name: 'Sled Push', group: 'Full Body', equipment: 'Machine', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Calves', 'Core'], notes: 'Drive a loaded sled forward; conditioning and leg drive.', custom: false },
  { id: 'sled-pull', name: 'Sled Pull', group: 'Full Body', equipment: 'Machine', type: 'weight', muscles: ['Back', 'Hamstrings', 'Glutes', 'Core'], notes: 'Pull a loaded sled toward you; posterior-chain conditioning.', custom: false },
  { id: 'battle-ropes', name: 'Battle Ropes', group: 'Full Body', equipment: 'Other', type: 'timed', muscles: ['Shoulders', 'Arms', 'Core'], notes: 'Alternating or double waves; high-intensity conditioning.', custom: false },
  { id: 'box-jump', name: 'Box Jump', group: 'Full Body', equipment: 'Bodyweight', type: 'bodyweight', muscles: ['Quadriceps', 'Glutes', 'Calves'], notes: 'Explosive jump onto a box; step down to protect the knees.', custom: false },
  { id: 'burpee', name: 'Burpee', group: 'Full Body', equipment: 'Bodyweight', type: 'timed', muscles: ['Quadriceps', 'Chest', 'Core', 'Shoulders'], notes: 'Squat, kick to plank, push-up, jump up; full-body conditioning.', custom: false },
  { id: 'wall-ball', name: 'Wall Ball', group: 'Full Body', equipment: 'Other', type: 'weight', muscles: ['Quadriceps', 'Glutes', 'Shoulders'], notes: 'Squat and throw a medicine ball to a target on the wall.', custom: false },
  { id: 'medicine-ball-slam', name: 'Medicine Ball Slam', group: 'Full Body', equipment: 'Other', type: 'weight', muscles: ['Core', 'Lats', 'Shoulders'], notes: 'Overhead slam to the floor; explosive power.', custom: false },
  { id: 'treadmill-run', name: 'Treadmill Run', group: 'Cardio', equipment: 'Machine', type: 'timed', muscles: ['Cardiovascular'], notes: 'Steady-state or intervals; adjust speed and incline.', custom: false },
  { id: 'treadmill-incline-walk', name: 'Treadmill Incline Walk', group: 'Cardio', equipment: 'Machine', type: 'timed', muscles: ['Cardiovascular', 'Glutes', 'Calves'], notes: 'High incline at a walking pace; low-impact conditioning.', custom: false },
  { id: 'stationary-bike', name: 'Stationary Bike', group: 'Cardio', equipment: 'Machine', type: 'timed', muscles: ['Cardiovascular', 'Quadriceps'], notes: 'Upright or recumbent; low-impact steady-state cardio.', custom: false },
  { id: 'elliptical', name: 'Elliptical', group: 'Cardio', equipment: 'Machine', type: 'timed', muscles: ['Cardiovascular'], notes: 'Low-impact full-body cardio with adjustable resistance.', custom: false },
  { id: 'stair-climber', name: 'Stair Climber', group: 'Cardio', equipment: 'Machine', type: 'timed', muscles: ['Cardiovascular', 'Glutes', 'Quadriceps'], notes: 'Continuous stepping; strong lower-body conditioning.', custom: false },
  { id: 'rowing-machine', name: 'Rowing Machine', group: 'Cardio', equipment: 'Machine', type: 'timed', muscles: ['Cardiovascular', 'Back', 'Legs'], notes: 'Drive with the legs, then pull; full-body cardio.', custom: false },
  { id: 'assault-bike', name: 'Assault Bike', group: 'Cardio', equipment: 'Machine', type: 'timed', muscles: ['Cardiovascular', 'Legs', 'Arms'], notes: 'Fan bike with arms and legs; brutal intervals.', custom: false },
  { id: 'skierg', name: 'SkiErg', group: 'Cardio', equipment: 'Machine', type: 'timed', muscles: ['Cardiovascular', 'Lats', 'Core'], notes: 'Double-pole motion; upper-body-driven cardio.', custom: false },
  { id: 'jump-rope', name: 'Jump Rope', group: 'Cardio', equipment: 'Other', type: 'timed', muscles: ['Cardiovascular', 'Calves'], notes: 'Continuous skipping; coordination and conditioning.', custom: false },
];

/* -------- Sample structured plan (uses new exercise IDs) -------- */
function setRow(weight: number, reps: number, rest: number): WeightSet {
  return { weight, reps, restSec: rest };
}
function timedRow(sec: number, rest: number): TimedSet {
  return { durationSec: sec, restSec: rest };
}

function pushDay(): PlanDay {
  return {
    id: uid('day'),
    name: 'Push',
    focus: 'Chest · Shoulders · Triceps',
    exercises: [
      { exerciseId: 'barbell-bench-press', sets: [setRow(135, 8, 120), setRow(155, 6, 120), setRow(155, 6, 150), setRow(135, 8, 120)] },
      { exerciseId: 'incline-dumbbell-bench-press', sets: [setRow(50, 10, 90), setRow(55, 8, 90), setRow(55, 8, 90)] },
      { exerciseId: 'standing-overhead-press', sets: [setRow(85, 8, 120), setRow(85, 6, 120), setRow(75, 8, 120)] },
      { exerciseId: 'dumbbell-lateral-raise', sets: [setRow(15, 15, 60), setRow(15, 15, 60), setRow(15, 12, 60)] },
      { exerciseId: 'tricep-rope-pushdown', sets: [setRow(50, 12, 60), setRow(50, 12, 60), setRow(45, 15, 60)] },
      { exerciseId: 'plank', sets: [timedRow(60, 45), timedRow(60, 45), timedRow(45, 45)] },
    ],
  };
}
function pullDay(): PlanDay {
  return {
    id: uid('day'),
    name: 'Pull',
    focus: 'Back · Biceps',
    exercises: [
      { exerciseId: 'conventional-deadlift', sets: [setRow(225, 5, 180), setRow(245, 3, 180), setRow(225, 5, 180)] },
      { exerciseId: 'pull-up', sets: [setRow(0, 8, 90), setRow(0, 7, 90), setRow(0, 6, 90)] },
      { exerciseId: 'barbell-bent-over-row', sets: [setRow(135, 10, 90), setRow(135, 10, 90), setRow(155, 8, 90)] },
      { exerciseId: 'lat-pulldown', sets: [setRow(120, 12, 75), setRow(120, 12, 75), setRow(110, 12, 75)] },
      { exerciseId: 'dumbbell-curl', sets: [setRow(30, 12, 60), setRow(30, 10, 60), setRow(25, 12, 60)] },
      { exerciseId: 'cable-face-pull', sets: [setRow(40, 15, 45), setRow(40, 15, 45)] },
    ],
  };
}
function legDay(): PlanDay {
  return {
    id: uid('day'),
    name: 'Legs',
    focus: 'Quads · Hamstrings · Glutes',
    exercises: [
      { exerciseId: 'barbell-back-squat', sets: [setRow(185, 8, 150), setRow(205, 6, 150), setRow(205, 6, 180), setRow(185, 8, 150)] },
      { exerciseId: 'romanian-deadlift', sets: [setRow(155, 10, 120), setRow(175, 8, 120), setRow(175, 8, 120)] },
      { exerciseId: 'leg-press', sets: [setRow(360, 12, 90), setRow(360, 12, 90), setRow(360, 10, 90)] },
      { exerciseId: 'barbell-hip-thrust', sets: [setRow(225, 12, 90), setRow(225, 12, 90)] },
      { exerciseId: 'standing-calf-raise', sets: [setRow(200, 15, 45), setRow(200, 15, 45), setRow(200, 12, 45)] },
    ],
  };
}
function restDay(name: string): PlanDay {
  return { id: uid('day'), name, focus: 'Recovery', rest: true, exercises: [] };
}

export function buildWeek(n: number): PlanWeek {
  return {
    id: uid('wk'),
    name: 'Week ' + n,
    days: [pushDay(), pullDay(), restDay('Mobility'), legDay(), pushDay(), restDay('Rest'), pullDay()],
  };
}

export function makeSamplePlan(): Plan {
  return {
    id: uid('plan'),
    name: 'Upper / Lower Hypertrophy',
    goal: 'Hypertrophy',
    weeksCount: 6,
    startDate: '2026-06-01',
    weeks: [buildWeek(1), buildWeek(2), buildWeek(3)],
  };
}

/* -------- A compact, documented schema example for the Import screen -------- */
export const SCHEMA_EXAMPLE = `{
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
              "exerciseId": "barbell-bench-press",
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
function seedHistory(): HistoryMap {
  const h: HistoryMap = {};
  const today = new Date('2026-06-08');
  const add = (id: string, daysAgo: number, sets: { weight: number; reps: number }[]) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    (h[id] = h[id] || []).push({ date: d.toISOString().slice(0, 10), sets });
  };
  const bench: [number, number][] = [[125, 8], [130, 8], [130, 7], [135, 8], [135, 6], [140, 7], [140, 6], [145, 6], [150, 5], [155, 6]];
  bench.forEach((s, i) =>
    add('barbell-bench-press', (bench.length - 1 - i) * 7, [
      { weight: s[0] - 20, reps: 8 },
      { weight: s[0], reps: s[1] },
      { weight: s[0], reps: s[1] - 1 },
      { weight: s[0] - 20, reps: 8 },
    ]),
  );
  const squat: [number, number][] = [[155, 8], [165, 8], [175, 6], [185, 8], [185, 6], [195, 6], [205, 6], [205, 5], [215, 5], [225, 5]];
  squat.forEach((s, i) =>
    add('barbell-back-squat', (squat.length - 1 - i) * 7 + 2, [
      { weight: s[0] - 30, reps: 8 },
      { weight: s[0], reps: s[1] },
      { weight: s[0], reps: s[1] },
    ]),
  );
  const dl: [number, number][] = [[205, 5], [225, 5], [245, 4], [255, 5], [265, 4], [275, 4], [285, 3], [295, 3]];
  dl.forEach((s, i) =>
    add('conventional-deadlift', (dl.length - 1 - i) * 9, [
      { weight: s[0] - 40, reps: 5 },
      { weight: s[0], reps: s[1] },
    ]),
  );
  const ohp: [number, number][] = [[75, 8], [80, 7], [80, 6], [85, 7], [85, 6], [90, 5], [90, 6]];
  ohp.forEach((s, i) =>
    add('standing-overhead-press', (ohp.length - 1 - i) * 8, [
      { weight: s[0] - 10, reps: 8 },
      { weight: s[0], reps: s[1] },
    ]),
  );
  return h;
}

/* -------- Fresh state -------- */
export function freshState(): AppState {
  const plan = makeSamplePlan();
  return {
    library: LIBRARY.map((e) => ({ ...e })),
    plan,
    plans: [plan],
    activePlanId: plan.id,
    history: seedHistory(),
    logs: {},
    completedDays: {},
    settings: { theme: 'midnight', type: 'athletic', nav: 'tabs', unit: 'lb' },
  };
}

/* -------- Build a copy/paste prompt for Claude (embeds the live library) -------- */
export function buildClaudePrompt(library: Exercise[]): string {
  const lines = library
    .map((e) => `  ${e.id.padEnd(20)} — ${e.name} (${e.group}, ${e.type})`)
    .join('\n');
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
              "exerciseId": "barbell-bench-press",   // MUST be an id from the list below
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
