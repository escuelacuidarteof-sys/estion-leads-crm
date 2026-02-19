import { supabase } from './supabaseClient';
import {
    Exercise,
    Workout,
    WorkoutBlock,
    WorkoutExercise,
    TrainingProgram,
    ProgramDay,
    ProgramActivity
} from '../types';

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

    // --- WORKOUTS ---
    async getWorkouts(): Promise<Workout[]> {
        const { data, error } = await supabase
            .from('training_workouts')
            .select(`
                *,
                training_workout_blocks (
                    *,
                    training_workout_exercises (
                        *,
                        exercise:training_exercises(*)
                    )
                )
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Map data to match Workout type (specifically the exercises field in blocks)
        return (data || []).map(workout => ({
            ...workout,
            blocks: (workout.training_workout_blocks || []).map((block: any) => ({
                ...block,
                exercises: (block.training_workout_exercises || []).map((we: any) => ({
                    ...we,
                    exercise: we.exercise
                })).sort((a: any, b: any) => a.position - b.position)
            })).sort((a: any, b: any) => a.position - b.position)
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
                    const exerciseInserts = block.exercises.map((we, index) => ({
                        block_id: savedBlock.id,
                        exercise_id: we.exercise_id || we.exercise?.id,
                        sets: we.sets,
                        reps: we.reps,
                        rest_seconds: we.rest_seconds,
                        notes: we.notes,
                        position: index
                    }));

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
        const { data, error } = await supabase
            .from('training_workouts')
            .select(`
                *,
                training_workout_blocks (
                    *,
                    training_workout_exercises (
                        *,
                        exercise:training_exercises(*)
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            ...data,
            blocks: (data.training_workout_blocks || []).map((block: any) => ({
                ...block,
                exercises: (block.training_workout_exercises || []).map((we: any) => ({
                    ...we,
                    exercise: we.exercise
                })).sort((a: any, b: any) => a.position - b.position)
            })).sort((a: any, b: any) => a.position - b.position)
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
                        color: act.color
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
    }
};

export default trainingService;
