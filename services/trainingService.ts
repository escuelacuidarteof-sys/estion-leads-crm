import { supabase } from './supabaseClient';
import {
    Exercise,
    Workout,
    WorkoutBlock,
    WorkoutExercise,
    TrainingProgram,
    ProgramDay,
    ProgramActivity,
    ClientTrainingAssignment,
    ClientDayLog,
    ClientExerciseLog,
    ClientActivityLog
} from '../types';

const ASSESSMENT_PREFIX = '__ASSESSMENT__:';
const toStartOfDay = (input: Date | string): Date => {
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
};

const formatDateYYYYMMDD = (input: Date): string => {
    const date = toStartOfDay(input);
    return date.toISOString().split('T')[0];
};

const calculateProgramEndDate = (startDate: string, weeksCount: number): string => {
    const end = toStartOfDay(startDate);
    end.setDate(end.getDate() + Math.max(1, weeksCount * 7) - 1);
    return formatDateYYYYMMDD(end);
};

const isDateWithinRange = (target: Date, startDate: string, endDate: string): boolean => {
    const t = toStartOfDay(target).getTime();
    const s = toStartOfDay(startDate).getTime();
    const e = toStartOfDay(endDate).getTime();
    return t >= s && t <= e;
};

const doDateRangesOverlap = (
    startA: string,
    endA: string,
    startB: string,
    endB: string
): boolean => {
    const aStart = toStartOfDay(startA).getTime();
    const aEnd = toStartOfDay(endA).getTime();
    const bStart = toStartOfDay(startB).getTime();
    const bEnd = toStartOfDay(endB).getTime();
    return aStart <= bEnd && bStart <= aEnd;
};

const parseAssessmentPayload = (raw?: string | null): Record<string, any> | undefined => {
    if (!raw || !raw.startsWith(ASSESSMENT_PREFIX)) return undefined;
    try {
        const parsed = JSON.parse(raw.slice(ASSESSMENT_PREFIX.length));
        if (parsed && typeof parsed === 'object') return parsed;
    } catch {
        // no-op
    }
    return undefined;
};

export const trainingService = {
    // --- EXERCISES ---
    async getExercises(): Promise<Exercise[]> {
        const { data, error } = await supabase
            .from('training_exercises')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createExercise(exercise: Partial<Exercise>): Promise<Exercise> {
        const { data, error } = await supabase
            .from('training_exercises')
            .insert({
                ...exercise,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise> {
        const { data, error } = await supabase
            .from('training_exercises')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteExercise(id: string): Promise<void> {
        const { error } = await supabase
            .from('training_exercises')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async findOrCreateExercise(name: string): Promise<Exercise> {
        // Try to find existing first
        const { data: existing, error: findError } = await supabase
            .from('training_exercises')
            .select('*')
            .ilike('name', name)
            .limit(1)
            .maybeSingle();

        if (existing) return existing;

        // Create new if not found
        return this.createExercise({
            name,
            equipment: ['Gimnasio'],
            muscle_main: 'Varios'
        });
    },

    // --- WORKOUTS ---
    async getWorkouts(): Promise<Workout[]> {
        const { data: workouts, error } = await supabase
            .from('training_workouts')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        if (!workouts || workouts.length === 0) return [];

        // Get all blocks for these workouts
        const workoutIds = workouts.map((w: any) => w.id);
        const { data: allBlocks } = await supabase
            .from('training_workout_blocks')
            .select('*')
            .in('workout_id', workoutIds)
            .order('position', { ascending: true });

        if (!allBlocks || allBlocks.length === 0) {
            return workouts.map((w: any) => ({ ...w, blocks: [] }));
        }

        // Get all exercises for these blocks
        const allBlockIds = allBlocks.map((b: any) => b.id);
        const { data: allWorkoutExercises } = await supabase
            .from('training_workout_exercises')
            .select('*')
            .in('block_id', allBlockIds)
            .order('position', { ascending: true });

        // Get exercise details
        const exerciseIds = [...new Set(
            (allWorkoutExercises || []).map((we: any) => we.exercise_id).filter(Boolean)
        )];
        const { data: exercises } = exerciseIds.length > 0
            ? await supabase.from('training_exercises').select('*').in('id', exerciseIds)
            : { data: [] };

        const exerciseMap: Record<string, any> = Object.fromEntries(
            (exercises || []).map((e: any) => [e.id, e])
        );

        return workouts.map((workout: any) => ({
            ...workout,
            blocks: (allBlocks || [])
                .filter((b: any) => b.workout_id === workout.id)
                .map((block: any) => ({
                    ...block,
                    exercises: (allWorkoutExercises || [])
                        .filter((we: any) => we.block_id === block.id)
                        .map((we: any) => ({ ...we, exercise: exerciseMap[we.exercise_id] || null }))
                }))
        }));
    },

    async saveWorkout(workout: Partial<Workout>): Promise<Workout> {
        const isNew = !workout.id || workout.id === '';

        // 1. Save main workout info
        const workoutData = {
            name: workout.name,
            description: workout.description,
            goal: workout.goal,
            notes: workout.notes,
            updated_at: new Date().toISOString()
        };

        let savedWorkout: any;

        if (isNew) {
            const { data, error } = await supabase
                .from('training_workouts')
                .insert({ ...workoutData, created_at: new Date().toISOString() })
                .select()
                .single();
            if (error) throw error;
            savedWorkout = data;
        } else {
            const { data, error } = await supabase
                .from('training_workouts')
                .update(workoutData)
                .eq('id', workout.id)
                .select()
                .single();
            if (error) throw error;
            savedWorkout = data;
        }

        // 2. Handle Blocks and Exercises
        if (workout.blocks) {
            // Delete existing blocks to simplify (or update smartly, but delete/re-insert is safer for templates)
            if (!isNew) {
                await supabase.from('training_workout_blocks').delete().eq('workout_id', savedWorkout.id);
            }

            for (let i = 0; i < workout.blocks.length; i++) {
                const block = workout.blocks[i];
                const { data: savedBlock, error: blockError } = await supabase
                    .from('training_workout_blocks')
                    .insert({
                        workout_id: savedWorkout.id,
                        name: block.name,
                        description: block.description,
                        position: i
                    })
                    .select()
                    .single();

                if (blockError) throw blockError;

                if (block.exercises && block.exercises.length > 0) {
                    const exerciseInserts = block.exercises.map((we, index) => {
                        const sRounds = we.superset_rounds || we.sets || 3;
                        return {
                            block_id: savedBlock.id,
                            exercise_id: we.exercise_id || we.exercise?.id,
                            sets: we.superset_id ? sRounds : (we.sets || 3),
                            reps: we.reps,
                            rest_seconds: we.rest_seconds,
                            notes: we.notes,
                            superset_id: we.superset_id || null,
                            superset_rounds: we.superset_id ? sRounds : null,
                            position: index
                        };
                    });

                    const { error: exError } = await supabase
                        .from('training_workout_exercises')
                        .insert(exerciseInserts);

                    if (exError) throw exError;
                }
            }
        }

        return this.getWorkoutById(savedWorkout.id) as Promise<Workout>;
    },

    async getWorkoutById(id: string): Promise<Workout | null> {
        // 1. Get workout header
        const { data: workout, error } = await supabase
            .from('training_workouts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !workout) return null;

        // 2. Get blocks (explicit query, no FK join dependency)
        const { data: blocks } = await supabase
            .from('training_workout_blocks')
            .select('*')
            .eq('workout_id', id)
            .order('position', { ascending: true });

        if (!blocks || blocks.length === 0) {
            return { ...workout, blocks: [] };
        }

        // 3. Get all workout exercises for these blocks
        const blockIds = blocks.map((b: any) => b.id);
        const { data: workoutExercises } = await supabase
            .from('training_workout_exercises')
            .select('*')
            .in('block_id', blockIds)
            .order('position', { ascending: true });

        if (!workoutExercises || workoutExercises.length === 0) {
            return { ...workout, blocks: blocks.map((b: any) => ({ ...b, exercises: [] })) };
        }

        // 4. Get exercise details
        const exerciseIds = [...new Set(
            workoutExercises.map((we: any) => we.exercise_id).filter(Boolean)
        )];
        const { data: exercises } = exerciseIds.length > 0
            ? await supabase.from('training_exercises').select('*').in('id', exerciseIds)
            : { data: [] };

        const exerciseMap: Record<string, any> = Object.fromEntries(
            (exercises || []).map((e: any) => [e.id, e])
        );

        return {
            ...workout,
            blocks: blocks.map((block: any) => ({
                ...block,
                exercises: workoutExercises
                    .filter((we: any) => we.block_id === block.id)
                    .map((we: any) => ({ ...we, exercise: exerciseMap[we.exercise_id] || null }))
            }))
        };
    },

    async deleteWorkout(id: string): Promise<void> {
        const { error } = await supabase
            .from('training_workouts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- PROGRAMS ---
    async getPrograms(): Promise<TrainingProgram[]> {
        const { data, error } = await supabase
            .from('training_programs')
            .select(`
                *,
                training_program_days (
                    *,
                    training_program_activities (*)
                )
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(program => ({
            ...program,
            days: (program.training_program_days || []).map((day: any) => ({
                ...day,
                activities: (day.training_program_activities || []).sort((a: any, b: any) => a.position - b.position)
            }))
        }));
    },

    async saveProgram(program: Partial<TrainingProgram>): Promise<TrainingProgram> {
        const isNew = !program.id || program.id === '';

        const programData = {
            name: program.name,
            description: program.description,
            weeks_count: program.weeks_count,
            updated_at: new Date().toISOString()
        };

        let savedProgram: any;

        if (isNew) {
            const { data, error } = await supabase
                .from('training_programs')
                .insert({ ...programData, created_at: new Date().toISOString() })
                .select()
                .single();
            if (error) throw error;
            savedProgram = data;
        } else {
            const { data, error } = await supabase
                .from('training_programs')
                .update(programData)
                .eq('id', program.id)
                .select()
                .single();
            if (error) throw error;
            savedProgram = data;
        }

        // Handle Days and Activities
        if (program.days) {
            if (!isNew) {
                await supabase.from('training_program_days').delete().eq('program_id', savedProgram.id);
            }

            for (const day of program.days) {
                const { data: savedDay, error: dayError } = await supabase
                    .from('training_program_days')
                    .insert({
                        program_id: savedProgram.id,
                        week_number: day.week_number,
                        day_number: day.day_number
                    })
                    .select()
                    .single();

                if (dayError) throw dayError;

                if (day.activities && day.activities.length > 0) {
                    const activityInserts = day.activities.map((act, index) => ({
                        day_id: savedDay.id,
                        type: act.type,
                        activity_id: act.activity_id,
                        title: act.title,
                        description: act.description,
                        position: index,
                        color: act.color,
                        config: act.config || {}
                    }));

                    await supabase.from('training_program_activities').insert(activityInserts);
                }
            }
        }

        return this.getProgramById(savedProgram.id) as Promise<TrainingProgram>;
    },

    async getProgramById(id: string): Promise<TrainingProgram | null> {
        const { data, error } = await supabase
            .from('training_programs')
            .select(`
                *,
                training_program_days (
                    *,
                    training_program_activities (*)
                )
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            ...data,
            days: (data.training_program_days || []).map((day: any) => ({
                ...day,
                activities: (day.training_program_activities || []).sort((a: any, b: any) => a.position - b.position)
            }))
        };
    },

    async addProgramDay(programId: string, day: Partial<ProgramDay>): Promise<ProgramDay> {
        const { data: savedDay, error: dayError } = await supabase
            .from('training_program_days')
            .insert({
                program_id: programId,
                week_number: day.week_number,
                day_number: day.day_number
            })
            .select()
            .single();

        if (dayError) throw dayError;

        if (day.activities && day.activities.length > 0) {
            const activityInserts = day.activities.map((act, index) => ({
                day_id: savedDay.id,
                type: act.type,
                activity_id: act.activity_id,
                title: act.title,
                description: act.description,
                position: index,
                color: act.color
            }));

            const { error: actError } = await supabase.from('training_program_activities').insert(activityInserts);
            if (actError) throw actError;
        }

        return savedDay;
    },

    async deleteProgram(id: string): Promise<void> {
        const { error } = await supabase
            .from('training_programs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getClientAssignments(clientId: string): Promise<ClientTrainingAssignment[]> {
        const { data, error } = await supabase
            .from('client_training_assignments')
            .select('*')
            .eq('client_id', clientId)
            .order('start_date', { ascending: true })
            .order('assigned_at', { ascending: true });

        if (error) throw error;
        const assignments = data || [];
        if (assignments.length === 0) return [];

        const programIds = [...new Set(assignments.map((a: any) => a.program_id).filter(Boolean))];
        const { data: programs, error: programsError } = programIds.length > 0
            ? await supabase
                .from('training_programs')
                .select('id, weeks_count')
                .in('id', programIds)
            : { data: [], error: null };

        if (programsError) throw programsError;

        const programWeeksMap: Record<string, number> = Object.fromEntries(
            (programs || []).map((p: any) => [p.id, Number(p.weeks_count) || 1])
        );

        return assignments.map((assignment: any) => {
            const weeksCount = programWeeksMap[assignment.program_id] || 1;
            return {
                ...assignment,
                end_date: calculateProgramEndDate(assignment.start_date, weeksCount)
            };
        });
    },

    async getClientAssignmentForDate(clientId: string, dateInput: Date | string = new Date()): Promise<ClientTrainingAssignment | null> {
        const assignments = await this.getClientAssignments(clientId);
        if (assignments.length === 0) return null;

        const targetDate = toStartOfDay(dateInput);

        const activeAssignments = assignments
            .filter((assignment) => assignment.end_date && isDateWithinRange(targetDate, assignment.start_date, assignment.end_date))
            .sort((a, b) => {
                const startDiff = toStartOfDay(b.start_date).getTime() - toStartOfDay(a.start_date).getTime();
                if (startDiff !== 0) return startDiff;
                return new Date(b.assigned_at || 0).getTime() - new Date(a.assigned_at || 0).getTime();
            });

        return activeAssignments[0] || null;
    },

    async getClientAssignment(clientId: string): Promise<ClientTrainingAssignment | null> {
        return this.getClientAssignmentForDate(clientId, new Date());
    },

    async getAssignmentConflicts(
        clientId: string,
        startDate: string,
        endDate: string,
        excludeAssignmentId?: string
    ): Promise<ClientTrainingAssignment[]> {
        const assignments = await this.getClientAssignments(clientId);

        return assignments.filter((assignment) => {
            if (excludeAssignmentId && assignment.id === excludeAssignmentId) return false;
            if (!assignment.end_date) return false;
            return doDateRangesOverlap(startDate, endDate, assignment.start_date, assignment.end_date);
        });
    },

    async assignProgramToClient(
        clientId: string,
        programId: string,
        startDate: string,
        assignedBy: string,
        options?: { allowOverlap?: boolean }
    ): Promise<ClientTrainingAssignment> {
        const { data: programData, error: programError } = await supabase
            .from('training_programs')
            .select('id, weeks_count')
            .eq('id', programId)
            .single();

        if (programError || !programData) throw programError || new Error('Programa no encontrado');

        const normalizedStartDate = formatDateYYYYMMDD(new Date(startDate));
        const calculatedEndDate = calculateProgramEndDate(normalizedStartDate, Number(programData.weeks_count) || 1);

        const conflicts = await this.getAssignmentConflicts(clientId, normalizedStartDate, calculatedEndDate);
        if (conflicts.length > 0 && !options?.allowOverlap) {
            const overlapError: any = new Error('El rango de fechas se solapa con otros programas del cliente.');
            overlapError.code = 'TRAINING_OVERLAP';
            overlapError.conflicts = conflicts;
            overlapError.requestedRange = { start_date: normalizedStartDate, end_date: calculatedEndDate };
            throw overlapError;
        }

        const { data, error } = await supabase
            .from('client_training_assignments')
            .insert({
                client_id: clientId,
                program_id: programId,
                start_date: normalizedStartDate,
                assigned_by: assignedBy,
                assigned_at: new Date().toISOString()
            })
            .select('*')
            .single();

        if (error) throw error;
        return {
            ...data,
            end_date: calculatedEndDate
        };
    },

    async removeClientAssignment(clientId: string, assignmentId?: string): Promise<void> {
        let query = supabase
            .from('client_training_assignments')
            .delete()
            .eq('client_id', clientId);

        if (assignmentId) {
            query = query.eq('id', assignmentId);
        }

        const { error } = await query;

        if (error) throw error;
    },

    // --- CLIENT LOGS ---
    async saveClientDayLog(log: Omit<ClientDayLog, 'id'>, exercises: Omit<ClientExerciseLog, 'id' | 'log_id'>[]): Promise<void> {
        // 1. Save Header
        const headerPayload = {
            client_id: log.client_id,
            day_id: log.day_id,
            completed_at: log.completed_at || new Date().toISOString(),
            effort_rating: log.effort_rating,
            notes: log.notes,
            duration_minutes: log.duration_minutes,
            pre_fatigue: log.pre_fatigue,
            pre_rpe_type: log.pre_rpe_type,
            pre_oxygen: log.pre_oxygen,
            pre_pulse: log.pre_pulse,
            pre_bp_systolic: log.pre_bp_systolic,
            pre_bp_diastolic: log.pre_bp_diastolic,
            safety_exclusion_data: log.safety_exclusion_data,
            safety_sequelae_data: log.safety_sequelae_data
        };

        let savedLog: { id: string } | null = null;

        const { data: upsertedLog, error: upsertLogError } = await supabase
            .from('training_client_day_logs')
            .upsert(headerPayload, { onConflict: 'client_id,day_id' })
            .select('id')
            .single();

        if (!upsertLogError && upsertedLog) {
            savedLog = upsertedLog;
        } else if (isMissingConflictTarget(upsertLogError)) {
            const { data: existingLog, error: existingLogError } = await supabase
                .from('training_client_day_logs')
                .select('id')
                .eq('client_id', log.client_id)
                .eq('day_id', log.day_id)
                .maybeSingle();

            if (existingLogError) throw existingLogError;

            if (existingLog?.id) {
                const { data: updatedLog, error: updateLogError } = await supabase
                    .from('training_client_day_logs')
                    .update(headerPayload)
                    .eq('id', existingLog.id)
                    .select('id')
                    .single();

                if (updateLogError || !updatedLog) throw updateLogError || new Error('Error updating log header');
                savedLog = updatedLog;
            } else {
                const { data: insertedLog, error: insertLogError } = await supabase
                    .from('training_client_day_logs')
                    .insert(headerPayload)
                    .select('id')
                    .single();

                if (insertLogError || !insertedLog) throw insertLogError || new Error('Error inserting log header');
                savedLog = insertedLog;
            }
        } else {
            throw upsertLogError || new Error('Error saving log header');
        }

        if (!savedLog?.id) throw new Error('Error saving log header');

        // 2. Save Exercises
        if (exercises.length > 0) {
            const exercisesToUpsert = exercises.map(ex => ({
                log_id: savedLog.id,
                workout_exercise_id: ex.workout_exercise_id,
                sets_completed: ex.sets_completed,
                reps_completed: ex.reps_completed,
                weight_used: ex.weight_used,
                is_completed: ex.is_completed
            }));

            const { error: exercisesError } = await supabase
                .from('training_client_exercise_logs')
                .upsert(exercisesToUpsert, { onConflict: 'log_id,workout_exercise_id' });

            if (exercisesError) {
                if (!isMissingConflictTarget(exercisesError)) throw exercisesError;

                const { error: deleteError } = await supabase
                    .from('training_client_exercise_logs')
                    .delete()
                    .eq('log_id', savedLog.id);

                if (deleteError) throw deleteError;

                const { error: insertError } = await supabase
                    .from('training_client_exercise_logs')
                    .insert(exercisesToUpsert);

                if (insertError) throw insertError;
            }
        }
    },

    async getClientDayLog(clientId: string, dayId: string): Promise<ClientDayLog | null> {
        const { data: log, error } = await supabase
            .from('training_client_day_logs')
            .select('*')
            .eq('client_id', clientId)
            .eq('day_id', dayId)
            .single();

        if (error || !log) return null;

        const { data: exercises } = await supabase
            .from('training_client_exercise_logs')
            .select('*')
            .eq('log_id', log.id);

        return {
            ...log,
            exercises: exercises || []
        };
    },

    // --- CLIENT ACTIVITY LOGS ---
    async saveClientActivityLog(log: Omit<ClientActivityLog, 'id' | 'created_at'>): Promise<void> {
        const { error } = await supabase
            .from('training_client_activity_logs')
            .upsert({
                client_id: log.client_id,
                activity_id: log.activity_id,
                day_id: log.day_id,
                completed_at: log.completed_at || new Date().toISOString(),
                data: log.data
            }, { onConflict: 'client_id,activity_id,day_id' });

        if (error) throw error;
    },

    async getClientActivityLogs(clientId: string, dayId: string): Promise<ClientActivityLog[]> {
        const { data, error } = await supabase
            .from('training_client_activity_logs')
            .select('*')
            .eq('client_id', clientId)
            .eq('day_id', dayId);

        if (error) throw error;
        return data || [];
    },

    async getClientAllDayLogs(clientId: string): Promise<(ClientDayLog & {
        day_name?: string;
        week_number?: number;
        exerciseDetails?: { name: string; sets_completed?: number; reps_completed?: string; weight_used?: string; is_completed: boolean; assessment_data?: Record<string, any> }[];
        activityDetails?: { title: string; type: string; data: Record<string, any> }[];
    })[]> {
        const { data: logs, error } = await supabase
            .from('training_client_day_logs')
            .select('*')
            .eq('client_id', clientId)
            .order('completed_at', { ascending: false });

        if (error) throw error;
        const safeLogs = logs || [];

        // Get exercise logs for all day logs
        const logIds = safeLogs.map(l => l.id);
        const { data: exerciseLogs } = logIds.length > 0
            ? await supabase
                .from('training_client_exercise_logs')
                .select('*')
                .in('log_id', logIds)
            : { data: [] };

        // Get day info for names
        const dayIds = [...new Set(safeLogs.map(l => l.day_id))];
        const { data: days } = dayIds.length > 0
            ? await supabase
                .from('training_program_days')
                .select('id, name, week_number')
                .in('id', dayIds)
            : { data: [] };

        // Get workout exercise IDs to resolve exercise names
        const weIds = [...new Set((exerciseLogs || []).map(el => el.workout_exercise_id))];
        let exerciseNames: Record<string, string> = {};
        if (weIds.length > 0) {
            const { data: wExercises } = await supabase
                .from('training_workout_exercises')
                .select('id, exercise_id')
                .in('id', weIds);

            if (wExercises && wExercises.length > 0) {
                const exIds = [...new Set(wExercises.map(we => we.exercise_id))];
                const { data: exercises } = await supabase
                    .from('training_exercises')
                    .select('id, name')
                    .in('id', exIds);

                const exNameMap: Record<string, string> = {};
                (exercises || []).forEach(ex => { exNameMap[ex.id] = ex.name; });
                wExercises.forEach(we => { exerciseNames[we.id] = exNameMap[we.exercise_id] || 'Ejercicio'; });
            }
        }

        // Get activity logs (custom/walking/metrics/photo/form) linked to the same days
        const { data: activityLogs } = await supabase
            .from('training_client_activity_logs')
            .select('id, activity_id, day_id, data, completed_at')
            .eq('client_id', clientId)
            .order('completed_at', { ascending: false });

        // Resolve activity metadata (title, type)
        const activityIds = [...new Set((activityLogs || []).map(a => a.activity_id))];
        let activityMeta: Record<string, { title?: string; type?: string }> = {};
        if (activityIds.length > 0) {
            const { data: activities } = await supabase
                .from('training_program_activities')
                .select('id, title, type')
                .in('id', activityIds);

            activityMeta = Object.fromEntries((activities || []).map((a: any) => [a.id, { title: a.title, type: a.type }]));
        }

        const dayMap: Record<string, { name: string; week_number: number }> = {};
        (days || []).forEach(d => { dayMap[d.id] = { name: d.name, week_number: d.week_number }; });

        const dayIdsWithStructuredLog = new Set(dayIds);

        const structuredLogs = safeLogs.map(log => {
            const logExercises = (exerciseLogs || []).filter(el => el.log_id === log.id);
            const logActivities = (activityLogs || [])
                .filter((a: any) => a.day_id === log.day_id)
                .map((a: any) => ({
                    title: activityMeta[a.activity_id]?.title || 'Actividad',
                    type: activityMeta[a.activity_id]?.type || 'custom',
                    data: a.data || {}
                }));

            return {
                ...log,
                day_name: dayMap[log.day_id]?.name,
                week_number: dayMap[log.day_id]?.week_number,
                exercises: logExercises,
                activityDetails: logActivities,
                exerciseDetails: logExercises.map(el => ({
                    assessment_data: parseAssessmentPayload(el.reps_completed),
                    name: exerciseNames[el.workout_exercise_id] || 'Ejercicio',
                    sets_completed: el.sets_completed,
                    reps_completed: parseAssessmentPayload(el.reps_completed) ? undefined : el.reps_completed,
                    weight_used: el.weight_used,
                    is_completed: el.is_completed
                }))
            };
        });

        // Include orphan activity logs (activity completed without day workout log),
        // so clients do not lose visible history if the program structure changed.
        const orphanActivityEntries = (activityLogs || [])
            .filter((a: any) => !dayIdsWithStructuredLog.has(a.day_id))
            .map((a: any) => ({
                id: `activity-${a.id}`,
                client_id: clientId,
                day_id: a.day_id,
                completed_at: a.completed_at,
                exercises: [],
                day_name: activityMeta[a.activity_id]?.title || 'Actividad completada',
                activityDetails: [{
                    title: activityMeta[a.activity_id]?.title || 'Actividad',
                    type: activityMeta[a.activity_id]?.type || 'custom',
                    data: a.data || {}
                }],
                exerciseDetails: []
            }));

        return [...structuredLogs, ...orphanActivityEntries]
            .sort((a: any, b: any) => {
                const ta = new Date(a.completed_at || 0).getTime();
                const tb = new Date(b.completed_at || 0).getTime();
                return tb - ta;
            });
    }
};

const isMissingConflictTarget = (error: any): boolean => {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === '42P10' || message.includes('there is no unique or exclusion constraint matching the on conflict specification');
};

export default trainingService;
