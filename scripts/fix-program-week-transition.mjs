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

  const targetProgramId = '2623ab23-e738-492a-a930-b31770ba24fb';
  const assessmentTemplateId = '1ea08e13-cd3e-4073-adab-a2965c3d99bc';

  const workoutNames = [
    'CASA NIVEL 1 - Sesion A (Circuito)',
    'CASA NIVEL 1 - Sesion B (Circuito)',
    'CASA NIVEL 1 - Sesion C (Circuito)',
  ];

  const { data: homeWorkouts, error: workoutsError } = await supabase
    .from('training_workouts')
    .select('id,name')
    .in('name', workoutNames);
  if (workoutsError) throw workoutsError;

  const workoutByName = Object.fromEntries((homeWorkouts || []).map((w) => [w.name, w.id]));
  for (const workoutName of workoutNames) {
    if (!workoutByName[workoutName]) {
      throw new Error(`No existe workout requerido: ${workoutName}`);
    }
  }

  const { data: templateDays, error: templateDaysError } = await supabase
    .from('training_program_days')
    .select('id,week_number,day_number')
    .eq('program_id', assessmentTemplateId)
    .eq('week_number', 1);
  if (templateDaysError) throw templateDaysError;

  if (!templateDays || templateDays.length === 0) {
    throw new Error('No se encontraron dias en la plantilla de valoracion.');
  }

  const { data: templateActivities, error: templateActivitiesError } = await supabase
    .from('training_program_activities')
    .select('day_id,type,activity_id,title,description,position,color')
    .in('day_id', templateDays.map((d) => d.id));
  if (templateActivitiesError) throw templateActivitiesError;

  const templateDayById = Object.fromEntries(templateDays.map((d) => [d.id, d.day_number]));

  const { data: existingTargetDays, error: existingTargetDaysError } = await supabase
    .from('training_program_days')
    .select('id')
    .eq('program_id', targetProgramId);
  if (existingTargetDaysError) throw existingTargetDaysError;

  if ((existingTargetDays || []).length > 0) {
    const { error: deleteDaysError } = await supabase
      .from('training_program_days')
      .delete()
      .eq('program_id', targetProgramId);
    if (deleteDaysError) throw deleteDaysError;
  }

  const insertedDays = [];
  for (let week = 1; week <= 5; week++) {
    for (let dayNumber = 1; dayNumber <= 7; dayNumber++) {
      const { data: insertedDay, error: insertDayError } = await supabase
        .from('training_program_days')
        .insert({
          program_id: targetProgramId,
          week_number: week,
          day_number: dayNumber,
        })
        .select('id,week_number,day_number')
        .single();
      if (insertDayError) throw insertDayError;
      insertedDays.push(insertedDay);
    }
  }

  const targetDayMap = new Map(insertedDays.map((d) => [`${d.week_number}-${d.day_number}`, d.id]));

  const newActivities = [];

  for (const act of templateActivities || []) {
    const dayNumber = templateDayById[act.day_id];
    if (!dayNumber) continue;
    newActivities.push({
      day_id: targetDayMap.get(`1-${dayNumber}`),
      type: act.type,
      activity_id: act.activity_id,
      title: act.title,
      description: act.description,
      position: act.position || 0,
      color: act.color || '#6BA06B',
    });
  }

  for (let week = 2; week <= 5; week++) {
    newActivities.push({
      day_id: targetDayMap.get(`${week}-1`),
      type: 'workout',
      activity_id: workoutByName['CASA NIVEL 1 - Sesion A (Circuito)'],
      title: `Sesion A - Semana ${week - 1}`,
      description: 'Calentamiento + circuito principal + cardio final en casa.',
      position: 0,
      color: '#6BA06B',
    });
    newActivities.push({
      day_id: targetDayMap.get(`${week}-2`),
      type: 'walking',
      title: 'Opcional: Movilidad + Caminata suave',
      description: '20-30 min caminata suave (RPE 3-4) + 10 min movilidad global. Objetivo: recuperacion activa.',
      position: 0,
      color: '#CDE8CD',
    });
    newActivities.push({
      day_id: targetDayMap.get(`${week}-3`),
      type: 'workout',
      activity_id: workoutByName['CASA NIVEL 1 - Sesion B (Circuito)'],
      title: `Sesion B - Semana ${week - 1}`,
      description: 'Calentamiento + circuito principal + cardio final en casa.',
      position: 0,
      color: '#6BA06B',
    });
    newActivities.push({
      day_id: targetDayMap.get(`${week}-4`),
      type: 'custom',
      title: 'Opcional: Respiracion + Core suave',
      description: '10 min respiracion diafragmatica + 10-15 min core de baja carga y movilidad toracica.',
      position: 0,
      color: '#CDE8CD',
    });
    newActivities.push({
      day_id: targetDayMap.get(`${week}-5`),
      type: 'workout',
      activity_id: workoutByName['CASA NIVEL 1 - Sesion C (Circuito)'],
      title: `Sesion C - Semana ${week - 1}`,
      description: 'Calentamiento + circuito principal + cardio final en casa.',
      position: 0,
      color: '#6BA06B',
    });
    newActivities.push({
      day_id: targetDayMap.get(`${week}-6`),
      type: 'walking',
      title: 'Opcional: Paseo largo zona 2',
      description: '30-40 min caminata zona 2 (RPE 4-6), ritmo sostenible, sin disnea fuera de lo habitual.',
      position: 0,
      color: '#CDE8CD',
    });
    newActivities.push({
      day_id: targetDayMap.get(`${week}-7`),
      type: 'custom',
      title: 'Recuperacion: descanso activo',
      description: 'Descanso, hidratacion y estiramientos suaves 8-10 min si apetece.',
      position: 0,
      color: '#CDE8CD',
    });
  }

  const { error: insertActivitiesError } = await supabase
    .from('training_program_activities')
    .insert(newActivities);
  if (insertActivitiesError) throw insertActivitiesError;

  const { error: updateProgramError } = await supabase
    .from('training_programs')
    .update({
      name: 'PROGRAMA ONCO CASA - TRANSICION LUNES',
      description:
        'Semana 1 de valoracion oncologica y desde la semana 2 microciclo completo en casa (mancuernas y gomas) con 3 sesiones por semana.',
      weeks_count: 5,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetProgramId);
  if (updateProgramError) throw updateProgramError;

  const mondayStart = '2026-03-09';
  const { error: updateAssignmentsError } = await supabase
    .from('client_training_assignments')
    .update({ start_date: mondayStart })
    .eq('program_id', targetProgramId);
  if (updateAssignmentsError) throw updateAssignmentsError;

  const { count: activitiesCount, error: countActivitiesError } = await supabase
    .from('training_program_activities')
    .select('*', { count: 'exact', head: true })
    .in('day_id', insertedDays.map((d) => d.id));
  if (countActivitiesError) throw countActivitiesError;

  const { data: assignmentStarts, error: assignmentStartsError } = await supabase
    .from('client_training_assignments')
    .select('start_date')
    .eq('program_id', targetProgramId);
  if (assignmentStartsError) throw assignmentStartsError;

  const uniqueStartDates = [...new Set((assignmentStarts || []).map((a) => a.start_date))];

  console.log('Correccion aplicada.');
  console.log('program_id:', targetProgramId);
  console.log('days_created:', insertedDays.length);
  console.log('activities_created:', activitiesCount);
  console.log('start_dates:', uniqueStartDates);
}

main().catch((err) => {
  console.error('Error corrigiendo transicion:', err.message || err);
  process.exit(1);
});
