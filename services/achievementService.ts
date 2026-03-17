import { supabase } from './supabaseClient';
import { Client } from '../types';

interface Achievement {
    id: string;
    code: string;
    title: string;
}

const MILESTONES = [
    { code: 'minus_5kg', type: 'weight_loss', threshold: 5 },
    { code: 'minus_10kg', type: 'weight_loss', threshold: 10 },
    { code: 'minus_15kg', type: 'weight_loss', threshold: 15 },
    { code: 'minus_20kg', type: 'weight_loss', threshold: 20 },
    { code: 'minus_25kg', type: 'weight_loss', threshold: 25 },
    { code: 'minus_30kg', type: 'weight_loss', threshold: 30 },
];

// Motivational messages for new achievement types
export const MOTIVATIONAL_MESSAGES: Record<string, string> = {
    'streak_7_diary': '¡Increíble constancia! Tu reflexión diaria es tu mejor herramienta',
    'streak_4_checkins': '¡Mes completado! Tu compromiso con el seguimiento es clave',
    'streak_14_wellness': '¡Dos semanas registrando tu bienestar! Esos datos ayudan mucho',
    'treatment_3_cycles': '¡Ya llevas 3 ciclos! Eres más fuerte de lo que crees',
    'treatment_6_cycles': '¡6 ciclos completados! Tu fortaleza es admirable',
    'treatment_final': '¡ÚLTIMA SESIÓN! Celebra este momento enorme',
    'hydration_7_days': '¡Una semana entera bien hidratada! Tu cuerpo lo agradece',
    'first_photo': '¡Primera foto guardada! Pronto podrás ver tu progreso',
    'minus_5kg': '¡-5kg! Gran inicio, sigue confiando en el proceso',
    'minus_10kg': '¡-10kg! Un logro increíble',
    'minus_15kg': '¡-15kg! Tu esfuerzo da resultados',
    'minus_20kg': '¡-20kg! Transformación total',
};

// Calculate consecutive days from date array
function consecutiveDays(dates: string[]): number {
    if (dates.length === 0) return 0;
    const sorted = [...new Set(dates)].sort().reverse();
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1] + 'T12:00:00');
        const curr = new Date(sorted[i] + 'T12:00:00');
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (Math.abs(diff - 1) < 0.5) streak++;
        else break;
    }
    return streak;
}

// Calculate consecutive weeks from timestamps
function consecutiveWeeks(timestamps: string[]): number {
    if (timestamps.length === 0) return 0;
    const weeks = [...new Set(timestamps.map(t => {
        const d = new Date(t);
        const monday = new Date(d);
        const day = monday.getDay();
        monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
        return monday.toISOString().split('T')[0];
    }))].sort().reverse();

    let streak = 1;
    for (let i = 1; i < weeks.length; i++) {
        const prev = new Date(weeks[i - 1] + 'T12:00:00');
        const curr = new Date(weeks[i] + 'T12:00:00');
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (Math.abs(diff - 7) < 2) streak++;
        else break;
    }
    return streak;
}

export const checkAndUnlockAchievements = async (client: Client) => {
    if (!client.id) return;

    try {
        // 1. Calculate weight metrics
        const startWeight = Number(client.initial_weight) || 0;
        const currentWeight = Number(client.current_weight) || 0;
        const lostWeight = startWeight > 0 && currentWeight > 0 ? startWeight - currentWeight : 0;

        // 2. Fetch all system achievements
        const { data: allAchievements } = await supabase
            .from('achievements')
            .select('id, code');

        if (!allAchievements) return;

        // 3. Fetch already unlocked achievements for this client
        const { data: unlocked } = await supabase
            .from('client_achievements')
            .select('achievement_id')
            .eq('client_id', client.id);

        const unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);

        const tryUnlock = (code: string, newUnlocks: any[]) => {
            const dbAch = allAchievements.find(a => a.code === code);
            if (dbAch && !unlockedIds.has(dbAch.id)) {
                newUnlocks.push({ client_id: client.id, achievement_id: dbAch.id, unlocked_at: new Date().toISOString() });
            }
        };

        const newUnlocks: any[] = [];

        // 4a. Weight milestones
        for (const milestone of MILESTONES) {
            if (milestone.type === 'weight_loss' && lostWeight >= milestone.threshold) {
                tryUnlock(milestone.code, newUnlocks);
            }
        }

        // 4b. Diary streak (wellness_logs with notes)
        const { data: diaryLogs } = await supabase
            .from('wellness_logs')
            .select('log_date')
            .eq('client_id', client.id)
            .not('notes', 'is', null)
            .order('log_date', { ascending: false })
            .limit(30);

        if (diaryLogs) {
            const diaryStreak = consecutiveDays(diaryLogs.map((d: any) => d.log_date));
            if (diaryStreak >= 7) tryUnlock('streak_7_diary', newUnlocks);
            if (diaryStreak >= 14) tryUnlock('streak_14_wellness', newUnlocks);
        }

        // 4c. Check-in streak
        const { data: checkins } = await supabase
            .from('weekly_checkins')
            .select('created_at')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (checkins) {
            const checkinStreak = consecutiveWeeks(checkins.map((c: any) => c.created_at));
            if (checkinStreak >= 4) tryUnlock('streak_4_checkins', newUnlocks);
        }

        // 4d. Treatment cycle milestones
        const { data: treatments } = await supabase
            .from('treatment_sessions')
            .select('cycle_number, total_cycles')
            .eq('client_id', client.id)
            .not('cycle_number', 'is', null)
            .order('session_date', { ascending: false })
            .limit(20);

        if (treatments && treatments.length > 0) {
            const maxCycle = Math.max(...treatments.map((t: any) => t.cycle_number || 0));
            if (maxCycle >= 3) tryUnlock('treatment_3_cycles', newUnlocks);
            if (maxCycle >= 6) tryUnlock('treatment_6_cycles', newUnlocks);
            // Final cycle
            const latest = treatments[0];
            if (latest.cycle_number && latest.total_cycles && latest.cycle_number >= latest.total_cycles) {
                tryUnlock('treatment_final', newUnlocks);
            }
        }

        // 4e. Hydration streak
        const { data: hydration } = await supabase
            .from('hydration_logs')
            .select('log_date, glasses, target_glasses')
            .eq('client_id', client.id)
            .order('log_date', { ascending: false })
            .limit(14);

        if (hydration) {
            const metTarget = hydration.filter((h: any) => h.glasses >= (h.target_glasses || 8));
            const hydrationStreak = consecutiveDays(metTarget.map((h: any) => h.log_date));
            if (hydrationStreak >= 7) tryUnlock('hydration_7_days', newUnlocks);
        }

        // 4f. First progress photo
        try {
            const { data: photoList } = await supabase.storage.from('client-materials').list(`progress-photos/${client.id}/`, { limit: 1 });
            if (photoList && photoList.length > 0) tryUnlock('first_photo', newUnlocks);
        } catch {}

        // 5. Insert new unlocks
        if (newUnlocks.length > 0) {
            const { error } = await supabase
                .from('client_achievements')
                .insert(newUnlocks);

            if (error) console.error('Error unlocking achievements:', error);
            else console.log(`[GAMIFICATION] Unlocked ${newUnlocks.length} achievements for client ${client.id}`);
        }

        return newUnlocks;
    } catch (error) {
        console.error('Error in achievement check:', error);
    }
};
