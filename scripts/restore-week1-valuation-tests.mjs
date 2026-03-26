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

  const programId = '2623ab23-e738-492a-a930-b31770ba24fb';

  const valuationWorkoutNames = [
    'VALORACION INICIAL - D1 Test cardiovascular',
    'VALORACION INICIAL - D3 Movilidad articular',
    'VALORACION INICIAL - D5 Test de fuerza',
  ];

  const { data: valuationWorkouts, error: workoutsError } = await supabase
    .from('training_workouts')
    .select('id,name')
    .in('name', valuationWorkoutNames);
  if (workoutsError) throw workoutsError;

  const workoutByName = Object.fromEntries((valuationWorkouts || []).map((w) => [w.name, w.id]));
  for (const workoutName of valuationWorkoutNames) {
    if (!workoutByName[workoutName]) {
      throw new Error(`No se encontro workout de valoracion: ${workoutName}`);
    }
  }

  const { data: week1Days, error: week1DaysError } = await supabase
    .from('training_program_days')
    .select('id,day_number')
    .eq('program_id', programId)
    .eq('week_number', 1);
  if (week1DaysError) throw week1DaysError;

  const dayMap = Object.fromEntries((week1Days || []).map((d) => [d.day_number, d.id]));
  for (const required of [1, 3, 5]) {
    if (!dayMap[required]) {
      throw new Error(`No existe dia ${required} en semana 1 del programa`);
    }
  }

  const { error: deleteWorkoutActivitiesError } = await supabase
    .from('training_program_activities')
    .delete()
    .in('day_id', [dayMap[1], dayMap[3], dayMap[5]])
    .eq('type', 'workout');
  if (deleteWorkoutActivitiesError) throw deleteWorkoutActivitiesError;

  const inserts = [
    {
      day_id: dayMap[1],
      type: 'workout',
      activity_id: workoutByName['VALORACION INICIAL - D1 Test cardiovascular'],
      title: 'Test cardiovascular inicial',
      description: 'Valoracion inicial: respuesta cardiovascular y tolerancia al esfuerzo.',
      position: 0,
      color: '#6BA06B',
    },
    {
      day_id: dayMap[3],
      type: 'workout',
      activity_id: workoutByName['VALORACION INICIAL - D3 Movilidad articular'],
      title: 'Test movilidad articular',
      description: 'Valoracion inicial de movilidad y control de movimiento.',
      position: 0,
      color: '#6BA06B',
    },
    {
      day_id: dayMap[5],
      type: 'workout',
      activity_id: workoutByName['VALORACION INICIAL - D5 Test de fuerza'],
      title: 'Test de fuerza funcional',
      description: 'Valoracion inicial de fuerza funcional para ajustar nivel.',
      position: 0,
      color: '#6BA06B',
    },
  ];

  const { error: insertError } = await supabase.from('training_program_activities').insert(inserts);
  if (insertError) throw insertError;

  const { data: verify, error: verifyError } = await supabase
    .from('training_program_activities')
    .select('type,title,activity_id,day_id')
    .in('day_id', [dayMap[1], dayMap[3], dayMap[5]])
    .eq('type', 'workout');
  if (verifyError) throw verifyError;

  console.log('Tests de valoracion restaurados en semana 1.');
  console.log('week1_workout_activities:', verify);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
