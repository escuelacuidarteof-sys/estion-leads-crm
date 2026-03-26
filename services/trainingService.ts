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
    ClientActivityLog,
    ClientProgramDay,
    ClientProgramActivity,
    ClientWorkout,
    ClientWorkoutBlock,
    ClientWorkoutExercise
} from '../types';

const ASSESSMENT_PREFIX = '__ASSESSMENT__:';
const toStartOfDay = (input: Date | string): Date => {
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
};

const formatDateYYYYMMDD = (input: Date | string): string => {
    // If already a YYYY-MM-DD string, return as-is (avoids timezone shift)
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const date = toStartOfDay(input);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

    async getClientAssignments(clientId: string, options?: { includeAll?: boolean }): Promise<ClientTrainingAssignment[]> {
        let query = supabase
            .from('client_training_assignments')
            .select('*')
            .eq('client_id', clientId)
            .order('start_date', { ascending: true })
            .order('assigned_at', { ascending: true });

        if (!options?.includeAll) {
            query = query.or('status.is.null,status.neq.cancelled');
        }

        const { data, error } = await query;

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

        const enriched = assignments.map((assignment: any) => {
            const weeksCount = programWeeksMap[assignment.program_id] || 1;
            return {
                ...assignment,
                end_date: calculateProgramEndDate(assignment.start_date, weeksCount)
            };
        });

        // Lazy chain check: auto-create next assignments for expired programs
        const today = formatDateYYYYMMDD(new Date());
        for (const a of enriched) {
            if (a.next_program_id && a.end_date && a.end_date < today && a.status !== 'completed') {
                try {
                    await this.checkAndChainAssignment(clientId, a);
                } catch {
                    // Silent — chaining is best-effort
                }
            }
        }

        return enriched;
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

    // --- CLIENT PROGRAM CUSTOMIZATION ---

    async materializeClientProgram(assignmentId: string): Promise<{ days: ClientProgramDay[]; workouts: ClientWorkout[] }> {
        // 1. Get the assignment to find program_id
        const { data: assignment, error: assignmentError } = await supabase
            .from('client_training_assignments')
            .select('*')
            .eq('id', assignmentId)
            .single();

        if (assignmentError || !assignment) throw assignmentError || new Error('Assignment not found');

        // 2. Load full program via existing getProgramById
        const program = await this.getProgramById(assignment.program_id);
        if (!program) throw new Error('Program not found');

        const materializedDays: ClientProgramDay[] = [];
        const materializedWorkouts: ClientWorkout[] = [];
        // Map from source workout_id -> new client_workout.id
        const workoutIdMap: Record<string, string> = {};

        // 3. For each day, insert into client_program_days
        for (const day of program.days) {
            const { data: savedDay, error: dayError } = await supabase
                .from('client_program_days')
                .insert({
                    assignment_id: assignmentId,
                    source_day_id: day.id,
                    week_number: day.week_number,
                    day_number: day.day_number,
                    is_rest_day: !day.activities || day.activities.length === 0
                })
                .select()
                .single();

            if (dayError) throw dayError;

            // 4. For each workout referenced by activities: deep-copy to client tables
            const savedActivities: ClientProgramActivity[] = [];

            for (const activity of (day.activities || [])) {
                let clientActivityId: string | undefined = activity.activity_id;

                if (activity.type === 'workout' && activity.activity_id) {
                    // Check if we already copied this workout
                    if (!workoutIdMap[activity.activity_id]) {
                        const sourceWorkout = await this.getWorkoutById(activity.activity_id);
                        if (sourceWorkout) {
                            // Insert client_workout
                            const { data: savedWorkout, error: wError } = await supabase
                                .from('client_workouts')
                                .insert({
                                    assignment_id: assignmentId,
                                    source_workout_id: sourceWorkout.id,
                                    name: sourceWorkout.name,
                                    description: sourceWorkout.description,
                                    goal: sourceWorkout.goal,
                                    notes: sourceWorkout.notes
                                })
                                .select()
                                .single();

                            if (wError) throw wError;

                            // Insert blocks and exercises
                            for (const block of (sourceWorkout.blocks || [])) {
                                const { data: savedBlock, error: bError } = await supabase
                                    .from('client_workout_blocks')
                                    .insert({
                                        client_workout_id: savedWorkout.id,
                                        name: block.name,
                                        description: block.description,
                                        position: block.position,
                                        structure_type: 'standard'
                                    })
                                    .select()
                                    .single();

                                if (bError) throw bError;

                                if (block.exercises && block.exercises.length > 0) {
                                    const exerciseInserts = block.exercises.map((ex: any) => ({
                                        block_id: savedBlock.id,
                                        exercise_id: ex.exercise_id || ex.exercise?.id,
                                        sets: ex.sets || 3,
                                        reps: ex.reps || '',
                                        rest_seconds: ex.rest_seconds || 0,
                                        notes: ex.notes,
                                        position: ex.position,
                                        superset_id: ex.superset_id || null,
                                        superset_rounds: ex.superset_rounds || null
                                    }));

                                    const { error: exError } = await supabase
                                        .from('client_workout_exercises')
                                        .insert(exerciseInserts);

                                    if (exError) throw exError;
                                }
                            }

                            workoutIdMap[activity.activity_id] = savedWorkout.id;
                            materializedWorkouts.push(savedWorkout);
                        }
                    }
                    clientActivityId = workoutIdMap[activity.activity_id];
                }

                // 5. Insert client_program_activities
                const { data: savedActivity, error: actError } = await supabase
                    .from('client_program_activities')
                    .insert({
                        client_day_id: savedDay.id,
                        source_activity_id: activity.id,
                        type: activity.type,
                        activity_id: clientActivityId,
                        title: activity.title,
                        description: activity.description,
                        position: activity.position,
                        color: activity.color,
                        config: activity.config || {}
                    })
                    .select()
                    .single();

                if (actError) throw actError;
                savedActivities.push(savedActivity);
            }

            materializedDays.push({ ...savedDay, activities: savedActivities });
        }

        // 6. Mark assignment as customized
        await supabase
            .from('client_training_assignments')
            .update({ is_customized: true })
            .eq('id', assignmentId);

        return { days: materializedDays, workouts: materializedWorkouts };
    },

    async getClientProgramData(assignmentId: string): Promise<TrainingProgram | null> {
        // 1. Query client_program_days for this assignment
        const { data: days, error: daysError } = await supabase
            .from('client_program_days')
            .select('*')
            .eq('assignment_id', assignmentId)
            .order('week_number', { ascending: true })
            .order('day_number', { ascending: true });

        if (daysError) throw daysError;
        if (!days || days.length === 0) return null;

        // 2. Get all day IDs and query activities
        const dayIds = days.map((d: any) => d.id);
        const { data: activities, error: actError } = await supabase
            .from('client_program_activities')
            .select('*')
            .in('client_day_id', dayIds)
            .order('position', { ascending: true });

        if (actError) throw actError;

        // 3. Get assignment info for program_id
        const { data: assignment } = await supabase
            .from('client_training_assignments')
            .select('program_id')
            .eq('id', assignmentId)
            .single();

        // 4. Get program metadata
        let programMeta: any = { id: assignmentId, name: 'Custom Program', weeks_count: 1 };
        if (assignment?.program_id) {
            const { data: prog } = await supabase
                .from('training_programs')
                .select('id, name, description, weeks_count, created_by, created_at, updated_at')
                .eq('id', assignment.program_id)
                .single();
            if (prog) programMeta = prog;
        }

        // 5. Assemble into TrainingProgram-compatible shape
        return {
            ...programMeta,
            days: days.map((day: any) => ({
                id: day.id,
                program_id: programMeta.id,
                week_number: day.week_number,
                day_number: day.day_number,
                activities: (activities || [])
                    .filter((a: any) => a.client_day_id === day.id)
                    .map((a: any) => ({
                        id: a.id,
                        day_id: day.id,
                        type: a.type,
                        activity_id: a.activity_id,
                        workout_id: a.type === 'workout' ? a.activity_id : undefined,
                        title: a.title,
                        description: a.description,
                        position: a.position,
                        color: a.color,
                        config: a.config
                    }))
            }))
        };
    },

    async getClientWorkoutById(clientWorkoutId: string): Promise<ClientWorkout | null> {
        // 1. Get client workout header
        const { data: workout, error } = await supabase
            .from('client_workouts')
            .select('*')
            .eq('id', clientWorkoutId)
            .single();

        if (error || !workout) return null;

        // 2. Get blocks
        const { data: blocks } = await supabase
            .from('client_workout_blocks')
            .select('*')
            .eq('client_workout_id', clientWorkoutId)
            .order('position', { ascending: true });

        if (!blocks || blocks.length === 0) {
            return { ...workout, blocks: [] };
        }

        // 3. Get all exercises for these blocks
        const blockIds = blocks.map((b: any) => b.id);
        const { data: workoutExercises } = await supabase
            .from('client_workout_exercises')
            .select('*')
            .in('block_id', blockIds)
            .order('position', { ascending: true });

        if (!workoutExercises || workoutExercises.length === 0) {
            return { ...workout, blocks: blocks.map((b: any) => ({ ...b, exercises: [] })) };
        }

        // 4. Get exercise details from shared library
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

    async saveClientWorkout(clientWorkout: Partial<ClientWorkout>): Promise<ClientWorkout> {
        const isNew = !clientWorkout.id || clientWorkout.id === '';

        const workoutData = {
            name: clientWorkout.name,
            description: clientWorkout.description,
            goal: clientWorkout.goal,
            notes: clientWorkout.notes
        };

        let savedWorkout: any;

        if (isNew) {
            const { data, error } = await supabase
                .from('client_workouts')
                .insert({
                    ...workoutData,
                    assignment_id: clientWorkout.assignment_id,
                    source_workout_id: clientWorkout.source_workout_id
                })
                .select()
                .single();
            if (error) throw error;
            savedWorkout = data;
        } else {
            const { data, error } = await supabase
                .from('client_workouts')
                .update(workoutData)
                .eq('id', clientWorkout.id)
                .select()
                .single();
            if (error) throw error;
            savedWorkout = data;
        }

        // Handle blocks and exercises (delete-and-reinsert)
        if (clientWorkout.blocks) {
            if (!isNew) {
                await supabase.from('client_workout_blocks').delete().eq('client_workout_id', savedWorkout.id);
            }

            for (let i = 0; i < clientWorkout.blocks.length; i++) {
                const block = clientWorkout.blocks[i];
                const { data: savedBlock, error: blockError } = await supabase
                    .from('client_workout_blocks')
                    .insert({
                        client_workout_id: savedWorkout.id,
                        name: block.name,
                        description: block.description,
                        position: i,
                        structure_type: block.structure_type || 'standard'
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
                        .from('client_workout_exercises')
                        .insert(exerciseInserts);

                    if (exError) throw exError;
                }
            }
        }

        return this.getClientWorkoutById(savedWorkout.id) as Promise<ClientWorkout>;
    },

    async moveClientActivity(activityId: string, toDayId: string, newPosition: number): Promise<void> {
        const { error } = await supabase
            .from('client_program_activities')
            .update({ client_day_id: toDayId, position: newPosition })
            .eq('id', activityId);

        if (error) throw error;
    },

    async addClientActivity(clientDayId: string, activity: Partial<ClientProgramActivity>): Promise<ClientProgramActivity> {
        const { data, error } = await supabase
            .from('client_program_activities')
            .insert({
                client_day_id: clientDayId,
                source_activity_id: activity.source_activity_id || null,
                type: activity.type || 'custom',
                activity_id: activity.activity_id || null,
                title: activity.title,
                description: activity.description,
                position: activity.position ?? 0,
                color: activity.color,
                config: activity.config || {}
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async ensureClientDay(assignmentId: string, weekNumber: number, dayNumber: number): Promise<string> {
        // Check if day already exists
        const { data: existing } = await supabase
            .from('client_program_days')
            .select('id')
            .eq('assignment_id', assignmentId)
            .eq('week_number', weekNumber)
            .eq('day_number', dayNumber)
            .maybeSingle();

        if (existing) return existing.id;

        // Create the day
        const { data, error } = await supabase
            .from('client_program_days')
            .insert({
                assignment_id: assignmentId,
                week_number: weekNumber,
                day_number: dayNumber,
                is_rest_day: false
            })
            .select()
            .single();

        if (error) throw error;
        return data.id;
    },

    async createClientWorkout(assignmentId: string, name: string): Promise<ClientWorkout> {
        const { data, error } = await supabase
            .from('client_workouts')
            .insert({
                assignment_id: assignmentId,
                name,
                description: ''
            })
            .select()
            .single();

        if (error) throw error;
        return { ...data, blocks: [] };
    },

    async removeClientActivity(activityId: string): Promise<void> {
        const { error } = await supabase
            .from('client_program_activities')
            .delete()
            .eq('id', activityId);

        if (error) throw error;
    },

    async resetClientCustomization(assignmentId: string): Promise<void> {
        // Delete all client_program_days (CASCADE should delete children activities)
        const { error: daysError } = await supabase
            .from('client_program_days')
            .delete()
            .eq('assignment_id', assignmentId);

        if (daysError) throw daysError;

        // Also delete client_workouts for this assignment
        const { error: workoutsError } = await supabase
            .from('client_workouts')
            .delete()
            .eq('assignment_id', assignmentId);

        if (workoutsError) throw workoutsError;

        // Mark assignment as not customized
        const { error: updateError } = await supabase
            .from('client_training_assignments')
            .update({ is_customized: false })
            .eq('id', assignmentId);

        if (updateError) throw updateError;
    },

    // --- ASSIGNMENT MANAGEMENT ---

    async updateAssignmentStartDate(assignmentId: string, newStartDate: string, clientId: string): Promise<ClientTrainingAssignment> {
        // Get current assignment to find program
        const { data: assignment, error: fetchError } = await supabase
            .from('client_training_assignments')
            .select('*')
            .eq('id', assignmentId)
            .single();

        if (fetchError || !assignment) throw fetchError || new Error('Asignación no encontrada');

        // Get program weeks_count to calculate new end_date
        const { data: program } = await supabase
            .from('training_programs')
            .select('weeks_count')
            .eq('id', assignment.program_id)
            .single();

        const weeksCount = Number(program?.weeks_count) || 1;
        const normalizedStart = formatDateYYYYMMDD(new Date(newStartDate));
        const newEndDate = calculateProgramEndDate(normalizedStart, weeksCount);

        // Check for conflicts
        const conflicts = await this.getAssignmentConflicts(clientId, normalizedStart, newEndDate, assignmentId);
        if (conflicts.length > 0) {
            const conflictError: any = new Error('La nueva fecha se solapa con otros programas asignados.');
            conflictError.code = 'TRAINING_OVERLAP';
            conflictError.conflicts = conflicts;
            throw conflictError;
        }

        const { data, error } = await supabase
            .from('client_training_assignments')
            .update({ start_date: normalizedStart })
            .eq('id', assignmentId)
            .select()
            .single();

        if (error) throw error;
        return { ...data, end_date: newEndDate };
    },

    async cancelClientAssignment(assignmentId: string): Promise<ClientTrainingAssignment> {
        const { data, error } = await supabase
            .from('client_training_assignments')
            .update({ status: 'cancelled' })
            .eq('id', assignmentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async setNextProgram(assignmentId: string, nextProgramId: string | null): Promise<void> {
        if (nextProgramId) {
            // Validate program exists
            const { data: program, error: progError } = await supabase
                .from('training_programs')
                .select('id')
                .eq('id', nextProgramId)
                .single();

            if (progError || !program) throw new Error('Programa siguiente no encontrado');
        }

        const { error } = await supabase
            .from('client_training_assignments')
            .update({ next_program_id: nextProgramId })
            .eq('id', assignmentId);

        if (error) throw error;
    },

    async checkAndChainAssignment(clientId: string, assignment: ClientTrainingAssignment): Promise<void> {
        if (!assignment.next_program_id || !assignment.end_date) return;
        if (assignment.status === 'completed') return;

        const today = formatDateYYYYMMDD(new Date());
        if (assignment.end_date >= today) return; // Not expired yet

        // Check if a chained assignment already exists
        const endDate = toStartOfDay(assignment.end_date);
        const nextStart = new Date(endDate);
        nextStart.setDate(nextStart.getDate() + 1);
        const nextStartStr = formatDateYYYYMMDD(nextStart);

        const { data: existing } = await supabase
            .from('client_training_assignments')
            .select('id')
            .eq('client_id', clientId)
            .eq('program_id', assignment.next_program_id)
            .eq('start_date', nextStartStr)
            .maybeSingle();

        if (existing) {
            // Already chained, just mark as completed
            await supabase
                .from('client_training_assignments')
                .update({ status: 'completed' })
                .eq('id', assignment.id);
            return;
        }

        // Create the chained assignment
        await this.assignProgramToClient(clientId, assignment.next_program_id, nextStartStr, 'system', { allowOverlap: true });

        // Mark original as completed
        await supabase
            .from('client_training_assignments')
            .update({ status: 'completed' })
            .eq('id', assignment.id);
    },

    // --- CLONE & TEMPLATE WORKOUTS ---

    async cloneTemplateToClientWorkout(templateWorkoutId: string, assignmentId: string): Promise<ClientWorkout> {
        const sourceWorkout = await this.getWorkoutById(templateWorkoutId);
        if (!sourceWorkout) throw new Error('Workout plantilla no encontrado');

        // Create client workout
        const { data: savedWorkout, error: wError } = await supabase
            .from('client_workouts')
            .insert({
                assignment_id: assignmentId,
                source_workout_id: sourceWorkout.id,
                name: sourceWorkout.name,
                description: sourceWorkout.description,
                goal: sourceWorkout.goal,
                notes: sourceWorkout.notes
            })
            .select()
            .single();

        if (wError) throw wError;

        // Copy blocks and exercises
        for (const block of (sourceWorkout.blocks || [])) {
            const { data: savedBlock, error: bError } = await supabase
                .from('client_workout_blocks')
                .insert({
                    client_workout_id: savedWorkout.id,
                    name: block.name,
                    description: block.description,
                    position: block.position,
                    structure_type: 'standard'
                })
                .select()
                .single();

            if (bError) throw bError;

            if (block.exercises && block.exercises.length > 0) {
                const exerciseInserts = block.exercises.map((ex: any) => ({
                    block_id: savedBlock.id,
                    exercise_id: ex.exercise_id || ex.exercise?.id,
                    sets: ex.sets || 3,
                    reps: ex.reps || '',
                    rest_seconds: ex.rest_seconds || 0,
                    notes: ex.notes,
                    position: ex.position,
                    superset_id: ex.superset_id || null,
                    superset_rounds: ex.superset_rounds || null
                }));

                const { error: exError } = await supabase
                    .from('client_workout_exercises')
                    .insert(exerciseInserts);

                if (exError) throw exError;
            }
        }

        return this.getClientWorkoutById(savedWorkout.id) as Promise<ClientWorkout>;
    },

    async saveClientWorkoutAsTemplate(clientWorkoutId: string, name: string, createdBy?: string): Promise<Workout> {
        const clientWorkout = await this.getClientWorkoutById(clientWorkoutId);
        if (!clientWorkout) throw new Error('Client workout no encontrado');

        // Create template workout
        const templateData: Partial<Workout> = {
            name,
            description: clientWorkout.description,
            goal: clientWorkout.goal,
            notes: clientWorkout.notes,
            blocks: (clientWorkout.blocks || []).map((block: any) => ({
                name: block.name,
                description: block.description,
                position: block.position,
                exercises: (block.exercises || []).map((ex: any) => ({
                    exercise_id: ex.exercise_id,
                    exercise: ex.exercise,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest_seconds: ex.rest_seconds,
                    notes: ex.notes,
                    position: ex.position,
                    superset_id: ex.superset_id,
                    superset_rounds: ex.superset_rounds
                }))
            }))
        };

        return this.saveWorkout(templateData);
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
