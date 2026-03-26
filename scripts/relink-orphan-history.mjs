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

function toUtcDateOnly(dateLike) {
  const d = new Date(dateLike);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function computeWeekDay(startDate, completedAt) {
  const start = toUtcDateOnly(startDate);
  const end = toUtcDateOnly(completedAt);
  const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000);
  if (diffDays < 0) {
    const weekday = end.getUTCDay();
    const dayNumber = weekday === 0 ? 7 : weekday;
    return { weekNumber: 1, dayNumber };
  }
  const weekNumber = Math.floor(diffDays / 7) + 1;
  const dayNumber = (diffDays % 7) + 1;
  return { weekNumber, dayNumber };
}

function pickActivityForLog(dayActivities, data) {
  if (!dayActivities || dayActivities.length === 0) return null;

  const byType = (type) => dayActivities.filter((a) => a.type === type).sort((a, b) => (a.position || 0) - (b.position || 0));
  const first = (...types) => {
    for (const t of types) {
      const options = byType(t);
      if (options.length > 0) return options[0];
    }
    return null;
  };

  const payload = data && typeof data === 'object' ? data : {};

  if (Object.prototype.hasOwnProperty.call(payload, 'steps')) return first('walking', 'custom', 'workout');
  if (payload.assessment_draft || payload.is_session_draft || payload.sets_draft) return first('workout', 'custom');
  if (Object.prototype.hasOwnProperty.call(payload, 'abdomen') || Object.prototype.hasOwnProperty.call(payload, 'arm') || Object.prototype.hasOwnProperty.call(payload, 'thigh')) {
    return first('metrics', 'custom', 'workout');
  }
  if (payload.front || payload.profile || payload.back) return first('photo', 'custom');
  if (payload.completed === true || payload._structured) return first('custom', 'workout', 'walking');

  return first('custom', 'walking', 'workout', 'metrics', 'photo', 'form');
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

  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials.');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: assignments, error: assignmentsError } = await supabase
    .from('client_training_assignments')
    .select('id,client_id,program_id,start_date,assigned_at')
    .order('assigned_at', { ascending: false });
  if (assignmentsError) throw assignmentsError;

  const latestAssignmentByClient = new Map();
  for (const assignment of assignments || []) {
    if (!latestAssignmentByClient.has(assignment.client_id)) {
      latestAssignmentByClient.set(assignment.client_id, assignment);
    }
  }

  const activeAssignments = [...latestAssignmentByClient.values()];
  const clientIds = activeAssignments.map((a) => a.client_id);
  const programIds = [...new Set(activeAssignments.map((a) => a.program_id))];

  const { data: programDays, error: daysError } = await supabase
    .from('training_program_days')
    .select('id,program_id,week_number,day_number');
  if (daysError) throw daysError;

  const dayByProgramWeekDay = new Map();
  const daySetByProgram = new Map();
  for (const day of programDays || []) {
    const k = `${day.program_id}:${day.week_number}:${day.day_number}`;
    dayByProgramWeekDay.set(k, day.id);
    if (!daySetByProgram.has(day.program_id)) daySetByProgram.set(day.program_id, new Set());
    daySetByProgram.get(day.program_id).add(day.id);
  }

  const allDayIds = (programDays || []).map((d) => d.id);
  const { data: activities, error: activitiesError } = allDayIds.length
    ? await supabase
        .from('training_program_activities')
        .select('id,day_id,type,position,title')
        .in('day_id', allDayIds)
    : { data: [], error: null };
  if (activitiesError) throw activitiesError;

  const dayToActivities = new Map();
  const activitySetByProgram = new Map();
  const dayToProgram = new Map((programDays || []).map((d) => [d.id, d.program_id]));

  for (const activity of activities || []) {
    if (!dayToActivities.has(activity.day_id)) dayToActivities.set(activity.day_id, []);
    dayToActivities.get(activity.day_id).push(activity);

    const programId = dayToProgram.get(activity.day_id);
    if (programId) {
      if (!activitySetByProgram.has(programId)) activitySetByProgram.set(programId, new Set());
      activitySetByProgram.get(programId).add(activity.id);
    }
  }

  const { data: dayLogs, error: dayLogsError } = clientIds.length
    ? await supabase
        .from('training_client_day_logs')
        .select('id,client_id,day_id,completed_at,notes,duration_minutes,effort_rating')
        .in('client_id', clientIds)
    : { data: [], error: null };
  if (dayLogsError) throw dayLogsError;

  const { data: activityLogs, error: activityLogsError } = clientIds.length
    ? await supabase
        .from('training_client_activity_logs')
        .select('id,client_id,activity_id,day_id,completed_at,data')
        .in('client_id', clientIds)
    : { data: [], error: null };
  if (activityLogsError) throw activityLogsError;

  const backupDir = path.join(projectRoot, 'scripts', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `history-relink-backup-${ts}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        created_at: new Date().toISOString(),
        active_assignments: activeAssignments,
        program_days: programDays,
        program_activities: activities,
        day_logs: dayLogs,
        activity_logs: activityLogs,
      },
      null,
      2
    )
  );

  let dayLogsRelinked = 0;
  let dayLogsSkipped = 0;
  let activityLogsRelinked = 0;
  let activityLogsSkipped = 0;
  let activityLogsMerged = 0;
  let dayLogsCreatedFromActivity = 0;

  for (const log of dayLogs || []) {
    const assignment = latestAssignmentByClient.get(log.client_id);
    if (!assignment) {
      dayLogsSkipped++;
      continue;
    }

    const validDays = daySetByProgram.get(assignment.program_id) || new Set();
    if (validDays.has(log.day_id)) continue;

    const wkDay = computeWeekDay(assignment.start_date, log.completed_at);
    if (!wkDay) {
      dayLogsSkipped++;
      continue;
    }

    const key = `${assignment.program_id}:${wkDay.weekNumber}:${wkDay.dayNumber}`;
    const fallbackKey = `${assignment.program_id}:1:${wkDay.dayNumber}`;
    const targetDayId = dayByProgramWeekDay.get(key) || dayByProgramWeekDay.get(fallbackKey);
    if (!targetDayId) {
      dayLogsSkipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('training_client_day_logs')
      .update({ day_id: targetDayId })
      .eq('id', log.id);
    if (updateError) throw updateError;

    dayLogsRelinked++;
  }

  const existingDayLogKey = new Set((dayLogs || []).map((l) => `${l.client_id}:${l.day_id}`));

  for (const log of activityLogs || []) {
    const assignment = latestAssignmentByClient.get(log.client_id);
    if (!assignment) {
      activityLogsSkipped++;
      continue;
    }

    const validDays = daySetByProgram.get(assignment.program_id) || new Set();
    const validActivities = activitySetByProgram.get(assignment.program_id) || new Set();
    const alreadyLinked = validDays.has(log.day_id) && validActivities.has(log.activity_id);
    if (alreadyLinked) continue;

    const wkDay = computeWeekDay(assignment.start_date, log.completed_at);
    if (!wkDay) {
      activityLogsSkipped++;
      continue;
    }

    const key = `${assignment.program_id}:${wkDay.weekNumber}:${wkDay.dayNumber}`;
    const fallbackKey = `${assignment.program_id}:1:${wkDay.dayNumber}`;
    const targetDayId = dayByProgramWeekDay.get(key) || dayByProgramWeekDay.get(fallbackKey);
    if (!targetDayId) {
      activityLogsSkipped++;
      continue;
    }

    const dayActivities = dayToActivities.get(targetDayId) || [];
    const targetActivity = pickActivityForLog(dayActivities, log.data);
    if (!targetActivity) {
      activityLogsSkipped++;
      continue;
    }

    const { data: duplicate, error: duplicateError } = await supabase
      .from('training_client_activity_logs')
      .select('id,completed_at,data')
      .eq('client_id', log.client_id)
      .eq('activity_id', targetActivity.id)
      .eq('day_id', targetDayId)
      .neq('id', log.id)
      .limit(1)
      .maybeSingle();
    if (duplicateError) throw duplicateError;

    if (duplicate?.id) {
      const currentDate = new Date(log.completed_at || 0).getTime();
      const duplicateDate = new Date(duplicate.completed_at || 0).getTime();
      const duplicateData = duplicate.data && typeof duplicate.data === 'object' ? duplicate.data : {};
      const currentData = log.data && typeof log.data === 'object' ? log.data : {};

      const shouldUpdateDuplicate =
        currentDate > duplicateDate || Object.keys(duplicateData).length === 0;

      if (shouldUpdateDuplicate) {
        const { error: keepUpdateError } = await supabase
          .from('training_client_activity_logs')
          .update({
            completed_at: log.completed_at,
            data: { ...duplicateData, ...currentData },
          })
          .eq('id', duplicate.id);
        if (keepUpdateError) throw keepUpdateError;
      }

      const { error: deleteCurrentError } = await supabase
        .from('training_client_activity_logs')
        .delete()
        .eq('id', log.id);
      if (deleteCurrentError) throw deleteCurrentError;

      activityLogsMerged++;
    } else {
      const { error: updateError } = await supabase
        .from('training_client_activity_logs')
        .update({ day_id: targetDayId, activity_id: targetActivity.id })
        .eq('id', log.id);
      if (updateError) throw updateError;

      activityLogsRelinked++;
    }

    const dk = `${log.client_id}:${targetDayId}`;
    if (!existingDayLogKey.has(dk)) {
      const { error: insertDayLogError } = await supabase.from('training_client_day_logs').insert({
        client_id: log.client_id,
        day_id: targetDayId,
        completed_at: log.completed_at,
        notes: 'Recuperado automaticamente desde registro de actividad',
      });
      if (!insertDayLogError) {
        existingDayLogKey.add(dk);
        dayLogsCreatedFromActivity++;
      }
    }
  }

  const { data: finalDayLogs, error: finalDayLogsError } = clientIds.length
    ? await supabase
        .from('training_client_day_logs')
        .select('client_id,day_id')
        .in('client_id', clientIds)
    : { data: [], error: null };
  if (finalDayLogsError) throw finalDayLogsError;

  const { data: finalActivityLogs, error: finalActivityLogsError } = clientIds.length
    ? await supabase
        .from('training_client_activity_logs')
        .select('client_id,activity_id,day_id')
        .in('client_id', clientIds)
    : { data: [], error: null };
  if (finalActivityLogsError) throw finalActivityLogsError;

  let remainingOrphanDay = 0;
  let remainingOrphanActivity = 0;
  const affectedClients = new Set();

  for (const log of finalDayLogs || []) {
    const assignment = latestAssignmentByClient.get(log.client_id);
    if (!assignment) continue;
    const validDays = daySetByProgram.get(assignment.program_id) || new Set();
    if (!validDays.has(log.day_id)) {
      remainingOrphanDay++;
      affectedClients.add(log.client_id);
    }
  }

  for (const log of finalActivityLogs || []) {
    const assignment = latestAssignmentByClient.get(log.client_id);
    if (!assignment) continue;
    const validDays = daySetByProgram.get(assignment.program_id) || new Set();
    const validActivities = activitySetByProgram.get(assignment.program_id) || new Set();
    if (!validDays.has(log.day_id) || !validActivities.has(log.activity_id)) {
      remainingOrphanActivity++;
      affectedClients.add(log.client_id);
    }
  }

  console.log('Relink completed.');
  console.log(JSON.stringify({
    activeClients: clientIds.length,
    programsInUse: programIds.length,
    backupPath,
    dayLogsRelinked,
    dayLogsSkipped,
    activityLogsRelinked,
    activityLogsSkipped,
    activityLogsMerged,
    dayLogsCreatedFromActivity,
    remainingOrphanDay,
    remainingOrphanActivity,
    remainingAffectedClients: affectedClients.size,
  }, null, 2));
}

main().catch((err) => {
  console.error('Relink failed:', err.message || err);
  process.exit(1);
});
