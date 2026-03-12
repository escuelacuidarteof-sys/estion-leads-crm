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
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      out.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  out.push(current);
  return out;
}

function normalizeSpaces(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function toTitleMuscle(value) {
  const txt = normalizeSpaces(value).toLowerCase();
  if (!txt) return '';
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function splitNameAndMuscles(rawName) {
  const cleaned = normalizeSpaces(rawName);
  if (!cleaned) {
    return { name: '', muscleMain: 'General', muscleSecondary: [] };
  }

  let musclesPart = '';

  const separatorIdx = cleaned.lastIndexOf(' - ');
  if (separatorIdx >= 0) {
    musclesPart = cleaned.slice(separatorIdx + 3).trim();
    if (musclesPart.startsWith('(') && musclesPart.includes(')')) {
      musclesPart = musclesPart.slice(musclesPart.indexOf(')') + 1).trim();
    }
  }

  if (!musclesPart) {
    const withParen = cleaned.match(/\)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][^\n]+)$/);
    if (withParen && withParen[1].includes(',')) {
      musclesPart = withParen[1].trim();
    }
  }

  const muscles = musclesPart
    ? musclesPart.split(',').map(toTitleMuscle).filter(Boolean)
    : [];

  return {
    name: cleaned,
    muscleMain: muscles[0] || 'General',
    muscleSecondary: muscles.slice(1),
  };
}

function detectMediaType(url) {
  if (!url) return 'none';
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('vimeo.com')) return 'vimeo';
  return 'none';
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, '.env');
  const envLocalPath = path.join(projectRoot, '.env.local');

  const env = parseEnvFile(envPath);
  const envLocal = parseEnvFile(envLocalPath);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || envLocal.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const localKey = envLocal.VITE_SUPABASE_ANON_KEY || envLocal.VITE_SUPABASE_KEY || '';
  const envKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY || '';
  const keyCandidates = [
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    process.env.VITE_SUPABASE_ANON_KEY || '',
    process.env.VITE_SUPABASE_KEY || '',
    envKey,
    localKey,
  ].filter(Boolean);
  const supabaseKey = keyCandidates.find((k) => k.startsWith('sb_secret_')) || keyCandidates[0];

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan credenciales de Supabase en variables de entorno.');
  }

  const csvArg = process.argv[2] || '../ejercicios.csv';
  const csvPath = path.isAbsolute(csvArg) ? csvArg : path.resolve(projectRoot, csvArg);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`No se encontro el CSV: ${csvPath}`);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = raw.split(/\r?\n/).map(parseCsvLine);
  const dataRows = rows
    .slice(3)
    .filter((r) => r.length >= 4 && ((r[1] || '').trim() || (r[2] || '').trim() || (r[3] || '').trim()));

  const normalized = [];
  let missingVideoCount = 0;

  for (const row of dataRows) {
    const rawName = (row[1] || '').trim();
    const defaultVideo = (row[2] || '').trim();
    const coachVideo = (row[3] || '').trim();
    const mediaUrl = coachVideo || defaultVideo || '';
    if (!mediaUrl) missingVideoCount++;

    const parsed = splitNameAndMuscles(rawName);
    if (!parsed.name) continue;

    normalized.push({
      name: parsed.name,
      muscle_main: parsed.muscleMain,
      muscle_secondary: parsed.muscleSecondary,
      media_type: detectMediaType(mediaUrl),
      media_url: mediaUrl || null,
      instructions: null,
      equipment: [],
      tags: ['import_csv'],
      updated_at: new Date().toISOString(),
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const replaceImported = process.argv.includes('--replace-imported');
  if (replaceImported) {
    const { error: deleteError } = await supabase
      .from('training_exercises')
      .delete()
      .contains('tags', ['import_csv']);
    if (deleteError) throw deleteError;
  }

  const { data: existing, error: existingError } = await supabase
    .from('training_exercises')
    .select('id, name');

  if (existingError) throw existingError;

  const existingByName = new Map((existing || []).map((e) => [String(e.name || '').toLowerCase(), e.id]));

  const toInsert = [];
  const toUpdate = [];

  for (const item of normalized) {
    const key = item.name.toLowerCase();
    const existingId = existingByName.get(key);
    if (existingId) {
      toUpdate.push({ id: existingId, ...item });
    } else {
      toInsert.push({ ...item, created_at: new Date().toISOString() });
    }
  }

  const insertChunks = chunk(toInsert, 200);
  for (const c of insertChunks) {
    const { error } = await supabase.from('training_exercises').insert(c);
    if (error) throw error;
  }

  for (const item of toUpdate) {
    const { id, ...updates } = item;
    const { error } = await supabase.from('training_exercises').update(updates).eq('id', id);
    if (error) throw error;
  }

  console.log('Importacion completada');
  console.log(`CSV filas utiles: ${dataRows.length}`);
  console.log(`Ejercicios normalizados: ${normalized.length}`);
  console.log(`Insertados: ${toInsert.length}`);
  console.log(`Actualizados: ${toUpdate.length}`);
  console.log(`Sin video: ${missingVideoCount}`);
}

main().catch((err) => {
  console.error('Error en importacion:', err.message || err);
  process.exit(1);
});
