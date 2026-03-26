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

  const { data: days, error: daysError } = await supabase
    .from('training_program_days')
    .select('id,week_number,day_number')
    .eq('program_id', programId);
  if (daysError) throw daysError;

  const dayMap = new Map((days || []).map((d) => [`${d.week_number}-${d.day_number}`, d.id]));

  for (let week = 1; week <= 4; week++) {
    for (const dayNumber of [2, 4, 6, 7]) {
      const key = `${week}-${dayNumber}`;
      if (!dayMap.has(key)) {
        const { data: insertedDay, error: insertDayError } = await supabase
          .from('training_program_days')
          .insert({ program_id: programId, week_number: week, day_number: dayNumber })
          .select('id')
          .single();
        if (insertDayError) throw insertDayError;
        dayMap.set(key, insertedDay.id);
      }
    }
  }

  const optionalDayIds = [];
  for (let week = 1; week <= 4; week++) {
    for (const dayNumber of [2, 4, 6, 7]) {
      optionalDayIds.push(dayMap.get(`${week}-${dayNumber}`));
    }
  }

  const { error: deleteError } = await supabase
    .from('training_program_activities')
    .delete()
    .in('day_id', optionalDayIds)
    .or('type.eq.custom,title.ilike.Opcional:%,title.ilike.Recuperacion:%');
  if (deleteError) throw deleteError;

  const inserts = [];
  for (let week = 1; week <= 4; week++) {
    inserts.push({
      day_id: dayMap.get(`${week}-2`),
      type: 'custom',
      title: 'Opcional: Movilidad + Caminata suave',
      description: '20-30 min caminata suave (RPE 3-4) + 10 min movilidad global. Objetivo: recuperacion activa.',
      position: 0,
      color: '#CDE8CD',
    });
    inserts.push({
      day_id: dayMap.get(`${week}-4`),
      type: 'custom',
      title: 'Opcional: Respiracion + Core suave',
      description: '10 min respiracion diafragmatica + 10-15 min core de baja carga y movilidad toracica.',
      position: 0,
      color: '#CDE8CD',
    });
    inserts.push({
      day_id: dayMap.get(`${week}-6`),
      type: 'custom',
      title: 'Opcional: Paseo largo zona 2',
      description: '30-40 min caminata zona 2 (RPE 4-6), ritmo sostenible, sin disnea fuera de lo habitual.',
      position: 0,
      color: '#CDE8CD',
    });
    inserts.push({
      day_id: dayMap.get(`${week}-7`),
      type: 'custom',
      title: 'Recuperacion: descanso activo',
      description: 'Descanso, hidratacion y estiramientos suaves 8-10 min si apetece.',
      position: 0,
      color: '#CDE8CD',
    });
  }

  const { error: insertError } = await supabase.from('training_program_activities').insert(inserts);
  if (insertError) throw insertError;

  const caminataUrl = 'https://www.youtube.com/@proetejercicioterapeutico5675/search?query=caminata';
  const { error: walkError } = await supabase
    .from('training_exercises')
    .update({ media_type: 'youtube', media_url: caminataUrl, updated_at: new Date().toISOString() })
    .eq('name', 'Caminata Zona 2');
  if (walkError) throw walkError;

  const { count, error: countError } = await supabase
    .from('training_program_activities')
    .select('*', { count: 'exact', head: true })
    .in('day_id', optionalDayIds);
  if (countError) throw countError;

  const { data: walkingExercise, error: walkingError } = await supabase
    .from('training_exercises')
    .select('name, media_type, media_url')
    .eq('name', 'Caminata Zona 2')
    .single();
  if (walkingError) throw walkingError;

  console.log('optional_days_activities_total:', count);
  console.log('caminata_zona_2:', walkingExercise);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
