import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return result;
}

async function upsertWorkout(supabase, spec, exerciseIds) {
  const { data: existing, error: findError } = await supabase
    .from('training_workouts')
    .select('id,name')
    .eq('name', spec.name)
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;

  const payload = {
    name: spec.name,
    description: spec.description,
    goal: spec.goal,
    notes: spec.notes,
    updated_at: new Date().toISOString(),
  };

  let workoutId;
  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('training_workouts')
      .update(payload)
      .eq('id', existing.id);
    if (updateError) throw updateError;
    workoutId = existing.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('training_workouts')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select('id')
      .single();
    if (insertError) throw insertError;
    workoutId = inserted.id;
  }

  const { data: oldBlocks, error: oldBlocksError } = await supabase
    .from('training_workout_blocks')
    .select('id')
    .eq('workout_id', workoutId);
  if (oldBlocksError) throw oldBlocksError;

  if ((oldBlocks || []).length > 0) {
    const { error: deleteBlocksError } = await supabase
      .from('training_workout_blocks')
      .delete()
      .eq('workout_id', workoutId);
    if (deleteBlocksError) throw deleteBlocksError;
  }

  for (let i = 0; i < spec.blocks.length; i++) {
    const block = spec.blocks[i];
    const { data: savedBlock, error: blockError } = await supabase
      .from('training_workout_blocks')
      .insert({
        workout_id: workoutId,
        name: block.name,
        description: block.description,
        position: i,
      })
      .select('id')
      .single();

    if (blockError) throw blockError;

    if (block.exercises.length === 0) continue;

    const inserts = block.exercises.map((exercise, index) => {
      const exerciseId = exerciseIds[exercise.name];
      if (!exerciseId) {
        throw new Error(`No existe ejercicio en BBDD: ${exercise.name}`);
      }
      return {
        block_id: savedBlock.id,
        exercise_id: exerciseId,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes || null,
        position: index,
      };
    });

    const { error: insertExercisesError } = await supabase
      .from('training_workout_exercises')
      .insert(inserts);
    if (insertExercisesError) throw insertExercisesError;
  }

  return workoutId;
}

async function main() {
  const projectRoot = process.cwd();
  const env = {
    ...parseEnvFile(path.join(projectRoot, '.env')),
    ...parseEnvFile(path.join(projectRoot, '.env.local')),
  };

  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan credenciales de Supabase en entorno.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: assignments, error: assignmentsError } = await supabase
    .from('client_training_assignments')
    .select('program_id')
    .not('program_id', 'is', null);
  if (assignmentsError) throw assignmentsError;
  if (!assignments || assignments.length === 0) {
    throw new Error('No hay clientes con programa asignado.');
  }

  const counts = new Map();
  for (const row of assignments) {
    const current = counts.get(row.program_id) || 0;
    counts.set(row.program_id, current + 1);
  }
  const targetProgramId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const requiredExercises = [
    'Bird dogs',
    'Side walks miniband en pies',
    'Rotación de hombro codo pegado',
    'Wall press',
    'Sentadilla goblet (dominante rodilla, mayor dorsiflexión)',
    'Floor press con mancuernas',
    'Remo unilateral con mancuerna 90º (sin retracción)',
    'Peso muerto rumano con mancuernas',
    'Press pallof',
    'Dead bug',
    'Zancadas estáticas con mancuernas (dominante rodilla)',
    'Press de hombros con mancuernas sentado (caja torácica plana)',
    'Band pull aparts con goma',
    'Puente de glúteo unilateral',
    'Plancha lateral',
    'Plancha frontal',
    'Step up frontal con mancuernas',
    'Aperturas con mancuernas + goma (15-20 kg)',
    'Remo con mancuernas 90º (sin retracción)',
    'Sentadilla búlgara con mancuernas (dominante rodilla)',
    'Facepull dominante de rotadores',
    'Caminata Zona 2',
  ];

  const { data: exercises, error: exercisesError } = await supabase
    .from('training_exercises')
    .select('id,name')
    .in('name', requiredExercises);
  if (exercisesError) throw exercisesError;

  const exerciseIds = Object.fromEntries((exercises || []).map((row) => [row.name, row.id]));
  const missing = requiredExercises.filter((name) => !exerciseIds[name]);
  if (missing.length > 0) {
    throw new Error(`Faltan ejercicios en BBDD: ${missing.join(', ')}`);
  }

  const commonNotes =
    'Formato circuito segun protocolo nivel 1: evitar fallo, priorizar tecnica y control de sintomas. ' +
    'Sem 1: 2 vueltas RPE 5-6. Sem 2: 3 vueltas RPE 6. Sem 3: 3 vueltas RPE 6-7. Sem 4: 2 vueltas RPE 5-6.';

  const workoutSpecs = [
    {
      key: 'A',
      name: 'CASA NIVEL 1 - Sesion A (Circuito)',
      description: 'Pierna + empuje + traccion + core. Entrenamiento en casa con mancuernas y gomas.',
      goal: 'Fuerza general con control de fatiga',
      notes: commonNotes,
      blocks: [
        {
          name: 'Calentamiento',
          description: '1-2 vueltas, movilidad y activacion progresiva.',
          exercises: [
            { name: 'Bird dogs', sets: 1, reps: '6-8/lado', rest_seconds: 20 },
            { name: 'Side walks miniband en pies', sets: 1, reps: '10-12/lado', rest_seconds: 20 },
            { name: 'Rotación de hombro codo pegado', sets: 1, reps: '10-12/lado', rest_seconds: 20 },
            { name: 'Wall press', sets: 1, reps: '8-10/lado', rest_seconds: 20 },
          ],
        },
        {
          name: 'Circuito Principal',
          description: 'Completar 2-3 vueltas. Descanso 20-40 s entre ejercicios y 90-120 s entre vueltas.',
          exercises: [
            { name: 'Sentadilla goblet (dominante rodilla, mayor dorsiflexión)', sets: 3, reps: '10-12', rest_seconds: 30 },
            { name: 'Floor press con mancuernas', sets: 3, reps: '10-12', rest_seconds: 30 },
            { name: 'Remo unilateral con mancuerna 90º (sin retracción)', sets: 3, reps: '10-12/lado', rest_seconds: 30 },
            { name: 'Peso muerto rumano con mancuernas', sets: 3, reps: '10-12', rest_seconds: 30 },
            { name: 'Press pallof', sets: 3, reps: '10-12/lado', rest_seconds: 30 },
            { name: 'Dead bug', sets: 3, reps: '6-10/lado', rest_seconds: 30 },
          ],
        },
        {
          name: 'Cardio Final + Vuelta a la calma',
          description: 'Caminar 10-15 min zona 2 y terminar con respiracion controlada 3-5 min.',
          exercises: [
            { name: 'Caminata Zona 2', sets: 1, reps: '10-15 min', rest_seconds: 0, notes: 'RPE 4-6, respiracion nasal si es posible.' },
          ],
        },
      ],
    },
    {
      key: 'B',
      name: 'CASA NIVEL 1 - Sesion B (Circuito)',
      description: 'Unilateral + hombro + estabilidad. Entrenamiento en casa con mancuernas y gomas.',
      goal: 'Fuerza funcional y control postural',
      notes: commonNotes,
      blocks: [
        {
          name: 'Calentamiento',
          description: '1-2 vueltas, movilidad y activacion progresiva.',
          exercises: [
            { name: 'Bird dogs', sets: 1, reps: '6-8/lado', rest_seconds: 20 },
            { name: 'Side walks miniband en pies', sets: 1, reps: '10-12/lado', rest_seconds: 20 },
            { name: 'Rotación de hombro codo pegado', sets: 1, reps: '10-12/lado', rest_seconds: 20 },
            { name: 'Wall press', sets: 1, reps: '8-10/lado', rest_seconds: 20 },
          ],
        },
        {
          name: 'Circuito Principal',
          description: 'Completar 2-3 vueltas. Descanso 20-40 s entre ejercicios y 90-120 s entre vueltas.',
          exercises: [
            { name: 'Zancadas estáticas con mancuernas (dominante rodilla)', sets: 3, reps: '8-10/lado', rest_seconds: 30 },
            { name: 'Press de hombros con mancuernas sentado (caja torácica plana)', sets: 3, reps: '10-12', rest_seconds: 30 },
            { name: 'Band pull aparts con goma', sets: 3, reps: '12-15', rest_seconds: 30 },
            { name: 'Puente de glúteo unilateral', sets: 3, reps: '10-12/lado', rest_seconds: 30 },
            { name: 'Plancha lateral', sets: 3, reps: '20-35 s/lado', rest_seconds: 30 },
            { name: 'Plancha frontal', sets: 3, reps: '20-35 s', rest_seconds: 30 },
          ],
        },
        {
          name: 'Cardio Final + Vuelta a la calma',
          description: 'Caminar 10-15 min zona 2 y terminar con respiracion controlada 3-5 min.',
          exercises: [
            { name: 'Caminata Zona 2', sets: 1, reps: '10-15 min', rest_seconds: 0, notes: 'RPE 4-6, ritmo sostenible.' },
          ],
        },
      ],
    },
    {
      key: 'C',
      name: 'CASA NIVEL 1 - Sesion C (Circuito)',
      description: 'Mixta full-body + gluteo + espalda. Entrenamiento en casa con mancuernas y gomas.',
      goal: 'Capacidad general y adherencia',
      notes: commonNotes,
      blocks: [
        {
          name: 'Calentamiento',
          description: '1-2 vueltas, movilidad y activacion progresiva.',
          exercises: [
            { name: 'Bird dogs', sets: 1, reps: '6-8/lado', rest_seconds: 20 },
            { name: 'Side walks miniband en pies', sets: 1, reps: '10-12/lado', rest_seconds: 20 },
            { name: 'Rotación de hombro codo pegado', sets: 1, reps: '10-12/lado', rest_seconds: 20 },
            { name: 'Wall press', sets: 1, reps: '8-10/lado', rest_seconds: 20 },
          ],
        },
        {
          name: 'Circuito Principal',
          description: 'Completar 2-3 vueltas. Descanso 20-40 s entre ejercicios y 90-120 s entre vueltas.',
          exercises: [
            { name: 'Step up frontal con mancuernas', sets: 3, reps: '8-10/lado', rest_seconds: 30 },
            { name: 'Aperturas con mancuernas + goma (15-20 kg)', sets: 3, reps: '10-12', rest_seconds: 30 },
            { name: 'Remo con mancuernas 90º (sin retracción)', sets: 3, reps: '10-12', rest_seconds: 30 },
            { name: 'Sentadilla búlgara con mancuernas (dominante rodilla)', sets: 3, reps: '8-10/lado', rest_seconds: 30 },
            { name: 'Facepull dominante de rotadores', sets: 3, reps: '12-15', rest_seconds: 30 },
            { name: 'Dead bug', sets: 3, reps: '6-10/lado', rest_seconds: 30 },
          ],
        },
        {
          name: 'Cardio Final + Vuelta a la calma',
          description: 'Caminar 10-15 min zona 2 y terminar con respiracion controlada 3-5 min.',
          exercises: [
            { name: 'Caminata Zona 2', sets: 1, reps: '10-15 min', rest_seconds: 0, notes: 'RPE 4-6, sin disnea fuera de lo habitual.' },
          ],
        },
      ],
    },
  ];

  const workoutIds = {};
  for (const spec of workoutSpecs) {
    workoutIds[spec.key] = await upsertWorkout(supabase, spec, exerciseIds);
  }

  const { error: updateProgramError } = await supabase
    .from('training_programs')
    .update({
      name: 'PROGRAMA CASA NIVEL 1 - 3 SESIONES/SEMANA',
      description:
        'Plan de 4 semanas en casa con mancuernas y gomas. Incluye calentamiento, circuito principal y cardio final por sesion.',
      weeks_count: 4,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetProgramId);
  if (updateProgramError) throw updateProgramError;

  const { data: existingDays, error: existingDaysError } = await supabase
    .from('training_program_days')
    .select('id,week_number,day_number')
    .eq('program_id', targetProgramId);
  if (existingDaysError) throw existingDaysError;

  const dayMap = new Map((existingDays || []).map((d) => [`${d.week_number}-${d.day_number}`, d.id]));

  for (let week = 1; week <= 4; week++) {
    for (const dayNumber of [1, 3, 5]) {
      const key = `${week}-${dayNumber}`;
      if (!dayMap.has(key)) {
        const { data: insertedDay, error: insertDayError } = await supabase
          .from('training_program_days')
          .insert({
            program_id: targetProgramId,
            week_number: week,
            day_number: dayNumber,
          })
          .select('id')
          .single();
        if (insertDayError) throw insertDayError;
        dayMap.set(key, insertedDay.id);
      }
    }
  }

  const allDayIds = [...new Set([...dayMap.values(), ...(existingDays || []).map((d) => d.id)])];

  if (allDayIds.length > 0) {
    const { error: deleteActivitiesError } = await supabase
      .from('training_program_activities')
      .delete()
      .in('day_id', allDayIds);
    if (deleteActivitiesError) throw deleteActivitiesError;
  }

  const activities = [];
  for (let week = 1; week <= 4; week++) {
    activities.push({
      day_id: dayMap.get(`${week}-1`),
      type: 'workout',
      activity_id: workoutIds.A,
      title: `Sesion A - Semana ${week}`,
      description: 'Calentamiento + circuito principal + cardio final en casa.',
      position: 0,
      color: '#6BA06B',
    });
    activities.push({
      day_id: dayMap.get(`${week}-3`),
      type: 'workout',
      activity_id: workoutIds.B,
      title: `Sesion B - Semana ${week}`,
      description: 'Calentamiento + circuito principal + cardio final en casa.',
      position: 0,
      color: '#6BA06B',
    });
    activities.push({
      day_id: dayMap.get(`${week}-5`),
      type: 'workout',
      activity_id: workoutIds.C,
      title: `Sesion C - Semana ${week}`,
      description: 'Calentamiento + circuito principal + cardio final en casa.',
      position: 0,
      color: '#6BA06B',
    });
  }

  const { error: insertActivitiesError } = await supabase
    .from('training_program_activities')
    .insert(activities);
  if (insertActivitiesError) throw insertActivitiesError;

  console.log('Programa actualizado correctamente.');
  console.log('program_id:', targetProgramId);
  console.log('asignaciones detectadas:', assignments.length);
  console.log('workouts:', workoutIds);
  console.log('dias con actividades creadas:', activities.length);
}

main().catch((err) => {
  console.error('Error actualizando programa:', err.message || err);
  process.exit(1);
});
