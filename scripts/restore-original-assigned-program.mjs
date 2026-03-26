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

  const workoutNames = [
    'VALORACION INICIAL - D1 Test cardiovascular',
    'VALORACION INICIAL - D3 Movilidad articular',
    'VALORACION INICIAL - D5 Test de fuerza',
  ];

  const { data: workouts, error: workoutsError } = await supabase
    .from('training_workouts')
    .select('id,name')
    .in('name', workoutNames);
  if (workoutsError) throw workoutsError;

  const workoutByName = Object.fromEntries((workouts || []).map((w) => [w.name, w.id]));
  for (const name of workoutNames) {
    if (!workoutByName[name]) throw new Error(`No se encontro workout: ${name}`);
  }

  const { error: deleteDaysError } = await supabase
    .from('training_program_days')
    .delete()
    .eq('program_id', programId);
  if (deleteDaysError) throw deleteDaysError;

  const dayMap = {};
  for (let day = 1; day <= 7; day++) {
    const { data: insertedDay, error: insertDayError } = await supabase
      .from('training_program_days')
      .insert({
        program_id: programId,
        week_number: 1,
        day_number: day,
      })
      .select('id')
      .single();
    if (insertDayError) throw insertDayError;
    dayMap[day] = insertedDay.id;
  }

  const activities = [
    {
      day_id: dayMap[1],
      type: 'workout',
      activity_id: workoutByName['VALORACION INICIAL - D1 Test cardiovascular'],
      title: 'Test cardiovascular inicial',
      description: 'Valoracion inicial cardiovascular.',
      position: 0,
      color: '#6BA06B',
    },
    {
      day_id: dayMap[1],
      type: 'walking',
      title: 'Caminata Zona 2',
      description: 'Registrar caminata/pasos del dia.',
      position: 1,
      color: '#CDE8CD',
    },
    {
      day_id: dayMap[2],
      type: 'walking',
      title: 'Caminata Zona 2',
      description: 'Registrar caminata/pasos del dia.',
      position: 0,
      color: '#CDE8CD',
    },
    {
      day_id: dayMap[3],
      type: 'workout',
      activity_id: workoutByName['VALORACION INICIAL - D3 Movilidad articular'],
      title: 'Test movilidad articular',
      description: 'Valoracion inicial de movilidad.',
      position: 0,
      color: '#6BA06B',
    },
    {
      day_id: dayMap[3],
      type: 'walking',
      title: 'Caminata Zona 2',
      description: 'Registrar caminata/pasos del dia.',
      position: 1,
      color: '#CDE8CD',
    },
    {
      day_id: dayMap[4],
      type: 'walking',
      title: 'Caminata Zona 2',
      description: 'Registrar caminata/pasos del dia.',
      position: 0,
      color: '#CDE8CD',
    },
    {
      day_id: dayMap[5],
      type: 'workout',
      activity_id: workoutByName['VALORACION INICIAL - D5 Test de fuerza'],
      title: 'Test de fuerza funcional',
      description: 'Valoracion inicial de fuerza funcional.',
      position: 0,
      color: '#6BA06B',
    },
    {
      day_id: dayMap[5],
      type: 'walking',
      title: 'Caminata Zona 2',
      description: 'Registrar caminata/pasos del dia.',
      position: 1,
      color: '#CDE8CD',
    },
    {
      day_id: dayMap[6],
      type: 'walking',
      title: 'Caminata Zona 2',
      description: 'Registrar caminata/pasos del dia.',
      position: 0,
      color: '#CDE8CD',
    },
    {
      day_id: dayMap[7],
      type: 'walking',
      title: 'Caminata Zona 2',
      description: 'Registrar caminata/pasos del dia.',
      position: 0,
      color: '#CDE8CD',
    },
    {
      day_id: dayMap[7],
      type: 'custom',
      title: 'Clasificacion inicial nivel 0-3',
      description: 'Registrar sintomas y nivel de inicio para planificacion.',
      position: 1,
      color: '#6BA06B',
    },
  ];

  const { error: insertActivitiesError } = await supabase
    .from('training_program_activities')
    .insert(activities);
  if (insertActivitiesError) throw insertActivitiesError;

  const { error: updateProgramError } = await supabase
    .from('training_programs')
    .update({
      name: 'VALORACION INICIAL - SEMANA 1',
      description: 'Programa de valoracion inicial con test funcionales y caminata zona 2.',
      weeks_count: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', programId);
  if (updateProgramError) throw updateProgramError;

  const { error: assignmentError } = await supabase
    .from('client_training_assignments')
    .update({ start_date: '2026-03-08' })
    .eq('program_id', programId);
  if (assignmentError) throw assignmentError;

  const { count, error: countError } = await supabase
    .from('training_program_activities')
    .select('*', { count: 'exact', head: true })
    .in('day_id', Object.values(dayMap));
  if (countError) throw countError;

  console.log('Programa restaurado (mejor esfuerzo).');
  console.log('program_id:', programId);
  console.log('days:', Object.keys(dayMap).length);
  console.log('activities:', count);
}

main().catch((err) => {
  console.error('Error restaurando programa:', err.message || err);
  process.exit(1);
});
