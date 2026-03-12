import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle, Clock, Save, ArrowLeft, Dumbbell, Calendar, Info, Target, Zap, Activity, Trophy, Flame, Timer } from 'lucide-react';
import { Workout, WorkoutBlock, WorkoutExercise, ClientDayLog, ClientExerciseLog } from '../../types';
import { trainingService } from '../../services/trainingService';

const ASSESSMENT_PREFIX = '__ASSESSMENT__:';

type AssessmentFieldType = 'number' | 'text' | 'textarea' | 'select';
type AssessmentField = {
    key: string;
    label: string;
    helpText?: string;
    type?: AssessmentFieldType;
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    options?: { label: string; value: string }[];
};
type AssessmentTemplate = {
    introText?: string;
    fields: AssessmentField[];
    requiredForFinish?: boolean;
};

type SessionGuide = {
    title: string;
    intro: string;
    checklist: string[];
};

const getSessionGuide = (workoutName?: string): SessionGuide => {
    const n = normalizeExerciseName(workoutName);

    if (n.includes('cardio') || n.includes('cardiovascular')) {
        return {
            title: 'Valoración cardiovascular',
            intro: 'Hoy vamos a medir cómo responde tu cuerpo al esfuerzo. Haz cada test con calma y buena técnica.',
            checklist: [
                'Mira el video antes de empezar cada ejercicio.',
                'Al terminar cada test, completa sus casillas de resultado.',
                'Usa números simples: segundos, repeticiones o pulsaciones por minuto.',
                'Si notas mareo, dolor fuerte o malestar, para y escribe lo que ocurrió en observaciones.'
            ]
        };
    }

    if (n.includes('movilidad')) {
        return {
            title: 'Valoración de movilidad articular',
            intro: 'Hoy evaluamos movilidad y control de movimiento, no fuerza máxima. Prioriza calidad y sin dolor.',
            checklist: [
                'Haz cada movimiento despacio y con control.',
                'Completa las casillas de cada test al terminar.',
                'Si un movimiento molesta, para en el rango cómodo.',
                'En observaciones puedes indicar en qué lado notaste más limitación.'
            ]
        };
    }

    if (n.includes('fuerza')) {
        return {
            title: 'Valoración de fuerza funcional',
            intro: 'Hoy medimos fuerza y control en ejercicios básicos. No buscamos agotarte, buscamos datos útiles.',
            checklist: [
                'Revisa el video y coloca bien el cuerpo antes de empezar.',
                'Anota el resultado de cada test en sus casillas.',
                'Si pierdes técnica, descansa y repite con control.',
                'En observaciones escribe cualquier dificultad o dolor.'
            ]
        };
    }

    return {
        title: 'Sesión de valoración',
        intro: 'Completa cada ejercicio y registra los datos para que tu coach pueda adaptar tu plan.',
        checklist: [
            'Mira el video de cada ejercicio.',
            'Rellena las casillas de resultados con calma.',
            'Prioriza técnica y seguridad por encima de la intensidad.'
        ]
    };
};

const normalizeExerciseName = (name?: string) =>
    (name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const getAssessmentTemplate = (exerciseName?: string): AssessmentTemplate | null => {
    const n = normalizeExerciseName(exerciseName);

    if (n.includes('6mwt') || (n.includes('marcha') && n.includes('6 minutos'))) {
        return {
            introText: 'Escribe los datos al terminar la caminata de 6 minutos.',
            fields: [
                { key: 'distance_m', label: '¿Cuántos metros caminaste?', helpText: 'Escribe la distancia total en metros.', type: 'number', required: true, min: 0, placeholder: 'Ej: 420' },
                { key: 'borg_0_10', label: '¿Cómo de intenso fue? (0-10)', helpText: '0 = muy fácil, 10 = máximo esfuerzo.', type: 'number', required: true, min: 0, max: 10, placeholder: 'Ej: 6' },
                { key: 'symptoms', label: 'Síntomas durante o después (opcional)', helpText: 'Ejemplo: mareo, falta de aire, dolor.', type: 'textarea', placeholder: 'Escribe aquí si notaste algo importante' }
            ],
            requiredForFinish: true
        };
    }

    if (n.includes('timed up and go') || n.includes('(tug)')) {
        return {
            introText: 'Anota el tiempo que tardaste en completar el recorrido.',
            fields: [{ key: 'time_sec', label: 'Tiempo total (segundos)', helpText: 'Desde que te levantas hasta que vuelves a sentarte.', type: 'number', required: true, min: 0, placeholder: 'Ej: 9.8' }],
            requiredForFinish: true
        };
    }

    if (n.includes('ruffier')) {
        return {
            introText: 'Necesitamos 3 pulsos para calcular tu índice de Ruffier.',
            fields: [
                { key: 'p0', label: 'Pulso en reposo (P0)', helpText: 'Antes de empezar, en pulsaciones por minuto.', type: 'number', required: true, min: 0, placeholder: 'Ej: 72' },
                { key: 'p1', label: 'Pulso justo al terminar (P1)', helpText: 'Nada más acabar las sentadillas.', type: 'number', required: true, min: 0, placeholder: 'Ej: 128' },
                { key: 'p2', label: 'Pulso al minuto de recuperación (P2)', helpText: 'Tras 1 minuto de descanso.', type: 'number', required: true, min: 0, placeholder: 'Ej: 94' },
                { key: 'index', label: 'Índice Ruffier', helpText: 'Si no lo calculas, tu coach lo revisa después.', type: 'number', required: true, placeholder: 'Ej: 9.4' },
                { key: 'notes', label: 'Observaciones (opcional)', type: 'textarea', placeholder: 'Cómo te sentiste durante el test' }
            ],
            requiredForFinish: true
        };
    }

    if (n.includes('sppb')) {
        return {
            introText: 'Anota la puntuación final del test SPPB.',
            fields: [{ key: 'score', label: 'Puntuación SPPB', helpText: 'Escribe el resultado final obtenido.', type: 'number', required: true, min: 0, placeholder: 'Ej: 10' }],
            requiredForFinish: true
        };
    }

    if ((n.includes('dorsiflexion') && n.includes('tobillo')) || (n.includes('movilidad') && n.includes('tobillo'))) {
        return {
            introText: 'Compara ambas piernas para ver si hay diferencias.',
            fields: [
                { key: 'left_cm', label: 'Pierna izquierda (cm)', helpText: 'Distancia dedo-pared en la pierna izquierda.', type: 'number', required: true, min: 0, placeholder: 'Ej: 8' },
                { key: 'right_cm', label: 'Pierna derecha (cm)', helpText: 'Distancia dedo-pared en la pierna derecha.', type: 'number', required: true, min: 0, placeholder: 'Ej: 7' },
                { key: 'pain_0_10', label: 'Dolor durante el test (0-10)', type: 'number', min: 0, max: 10, placeholder: 'Ej: 2' }
            ],
            requiredForFinish: true
        };
    }

    if (n.includes('movilidad') && n.includes('hombro') && n.includes('pared')) {
        return {
            introText: 'Valora cómo se mueve el hombro y si aparece molestia.',
            fields: [
                {
                    key: 'quality',
                    label: 'Calidad del movimiento',
                    helpText: 'Elige la opción que mejor describa cómo te moviste.',
                    type: 'select',
                    required: true,
                    options: [
                        { label: 'Buena', value: 'buena' },
                        { label: 'Aceptable', value: 'aceptable' },
                        { label: 'Limitada', value: 'limitada' }
                    ]
                },
                { key: 'pain_0_10', label: 'Dolor durante el movimiento (0-10)', type: 'number', min: 0, max: 10, placeholder: 'Ej: 1' }
            ],
            requiredForFinish: true
        };
    }

    if (n.includes('movilidad') && n.includes('hombro') && n.includes('pica')) {
        return {
            introText: 'Queremos valorar la movilidad de hombro con el movimiento de pica.',
            fields: [
                {
                    key: 'quality',
                    label: 'Calidad del movimiento',
                    helpText: 'Elige la opción que mejor describa cómo te moviste.',
                    type: 'select',
                    required: true,
                    options: [
                        { label: 'Buena', value: 'buena' },
                        { label: 'Aceptable', value: 'aceptable' },
                        { label: 'Limitada', value: 'limitada' }
                    ]
                },
                { key: 'pain_0_10', label: 'Dolor durante el movimiento (0-10)', type: 'number', min: 0, max: 10, placeholder: 'Ej: 2' }
            ],
            requiredForFinish: true
        };
    }

    if (n.includes('hombro-espalda')) {
        return {
            introText: 'Marca cómo te sentiste en la movilidad hombro-espalda.',
            fields: [
                {
                    key: 'quality',
                    label: 'Calidad del movimiento',
                    type: 'select',
                    required: true,
                    options: [
                        { label: 'Buena', value: 'buena' },
                        { label: 'Aceptable', value: 'aceptable' },
                        { label: 'Limitada', value: 'limitada' }
                    ]
                },
                {
                    key: 'limited_side',
                    label: '¿Dónde notaste más limitación?',
                    type: 'select',
                    options: [
                        { label: 'Sin diferencia', value: 'sin_diferencia' },
                        { label: 'Lado izquierdo', value: 'izquierdo' },
                        { label: 'Lado derecho', value: 'derecho' }
                    ]
                },
                { key: 'pain_0_10', label: 'Dolor durante el movimiento (0-10)', type: 'number', min: 0, max: 10, placeholder: 'Ej: 1' }
            ],
            requiredForFinish: true
        };
    }

    if (n.includes('y-balance')) {
        return {
            introText: 'Este resultado es opcional en esta sesión.',
            fields: [{ key: 'result_note', label: 'Resultado (opcional)', helpText: 'Puedes escribir alcance y observaciones.', type: 'text', placeholder: 'Ej: mejor alcance pierna derecha' }],
            requiredForFinish: false
        };
    }

    if (n.includes('5xsts') || (n.includes('sentarse') && n.includes('5 veces'))) {
        return {
            introText: 'Anota el tiempo total en segundos.',
            fields: [{ key: 'time_sec', label: 'Tiempo total (segundos)', helpText: 'De la primera a la quinta repetición.', type: 'number', required: true, min: 0, placeholder: 'Ej: 13.2' }],
            requiredForFinish: true
        };
    }

    if (n.includes('tumbarse') && n.includes('levantarse')) {
        return {
            introText: 'Queremos saber tiempo y apoyos que usaste para levantarte.',
            fields: [
                { key: 'time_sec', label: 'Tiempo total (segundos)', type: 'number', required: true, min: 0, placeholder: 'Ej: 7.5' },
                { key: 'supports', label: '¿Qué apoyos usaste? (opcional)', type: 'text', placeholder: 'Ej: mano en la silla' }
            ],
            requiredForFinish: true
        };
    }

    if (n.includes('levantarse con una pierna')) {
        return {
            introText: 'Anota cuántas repeticiones completas pudiste hacer por cada pierna.',
            fields: [
                { key: 'left_reps', label: 'Repeticiones válidas pierna izquierda', type: 'number', required: true, min: 0, placeholder: 'Ej: 2' },
                { key: 'right_reps', label: 'Repeticiones válidas pierna derecha', type: 'number', required: true, min: 0, placeholder: 'Ej: 3' },
                {
                    key: 'balance_quality',
                    label: 'Estabilidad durante el ejercicio',
                    type: 'select',
                    required: true,
                    options: [
                        { label: 'Buena', value: 'buena' },
                        { label: 'Con inestabilidad leve', value: 'leve' },
                        { label: 'Con inestabilidad marcada', value: 'marcada' }
                    ]
                }
            ],
            requiredForFinish: true
        };
    }

    if (n.includes('flexiones en pared')) {
        return {
            introText: 'Anota cuántas repeticiones completas hiciste con buena técnica.',
            fields: [{ key: 'reps', label: 'Repeticiones completas', type: 'number', required: true, min: 0, placeholder: 'Ej: 5' }],
            requiredForFinish: true
        };
    }

    return null;
};

interface ActiveWorkoutSessionProps {
    workout: Workout;
    clientId: string;
    dayId: string;
    activityId?: string;
    onClose: () => void;
    onComplete: () => void;
}

// Helper to group exercises by superset_id
function groupWorkoutBlocks(blocks: WorkoutBlock[]) {
    return blocks.map(block => {
        const exercises = block.exercises || [];
        const groups: { type: 'single' | 'superset', id: string, items: typeof exercises }[] = [];

        exercises.forEach(ex => {
            if (ex.superset_id) {
                const existingGroup = groups.find(g => g.type === 'superset' && g.id === ex.superset_id);
                if (existingGroup) {
                    existingGroup.items.push(ex);
                } else {
                    groups.push({ type: 'superset', id: ex.superset_id, items: [ex] });
                }
            } else {
                groups.push({ type: 'single', id: ex.id, items: [ex] });
            }
        });

        return {
            ...block,
            groups
        };
    });
}

export function ActiveWorkoutSession({ workout, clientId, dayId, activityId, onClose, onComplete }: ActiveWorkoutSessionProps) {
    const [showSafetyPass, setShowSafetyPass] = useState(false);
    const [safetyPassData, setSafetyPassData] = useState({
        exclusion: {
            fever: false,
            malaise: false,
            blood_test: false,
            bp_uncontrolled: false
        },
        preWorkout: {
            fatigue: 5,
            rpe_type: 'verde',
            oxygen: '',
            pulse: '',
            bp_systolic: '',
            bp_diastolic: ''
        },
        sequelae: {
            tingling: false,
            tightness: false,
            bone_pain: false
        }
    });

    const [isStarted, setIsStarted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [effortRating, setEffortRating] = useState<number>(0);
    const [sessionNotes, setSessionNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [completedSets, setCompletedSets] = useState<Record<string, { weight: number | null, reps: number | null, completed: boolean }[]>>({});
    const [assessmentResults, setAssessmentResults] = useState<Record<string, { values: Record<string, any>; completed: boolean }>>({});
    const [assessmentErrors, setAssessmentErrors] = useState<Record<string, Record<string, string>>>({});
    // Track current round for each superset (keyed by superset_id)
    const [supersetRound, setSupersetRound] = useState<Record<string, number>>({});

    const groupedBlocks = groupWorkoutBlocks(workout.blocks || []);
    const sessionGuide = getSessionGuide(workout.name);

    const normalizeAssessmentValues = (rawValues: Record<string, any>) => {
        const normalized: Record<string, any> = {};
        Object.entries(rawValues || {}).forEach(([key, raw]) => {
            if (raw === '' || raw === undefined || raw === null) return;
            if (typeof raw === 'string' && /^-?\d+(\.\d+)?$/.test(raw.trim())) {
                normalized[key] = Number(raw);
            } else {
                normalized[key] = raw;
            }
        });
        return normalized;
    };

    useEffect(() => {
        if (!clientId || !dayId || !activityId) return;

        let mounted = true;

        const loadAssessmentDraft = async () => {
            try {
                const logs = await trainingService.getClientActivityLogs(clientId, dayId);
                const workoutLog = logs.find((l) => l.activity_id === activityId);
                const draft = workoutLog?.data?.assessment_draft;

                if (!mounted || !draft || typeof draft !== 'object') return;

                const nextAssessmentResults: Record<string, { values: Record<string, any>; completed: boolean }> = {};
                const nextCompletedSets: Record<string, { weight: number | null; reps: number | null; completed: boolean }[]> = {};

                Object.entries(draft).forEach(([exerciseId, values]) => {
                    nextAssessmentResults[exerciseId] = {
                        values: (values as Record<string, any>) || {},
                        completed: true,
                    };
                    nextCompletedSets[exerciseId] = [{ weight: null, reps: null, completed: true }];
                });

                if (Object.keys(nextAssessmentResults).length > 0) {
                    setAssessmentResults((prev) => ({ ...prev, ...nextAssessmentResults }));
                    setCompletedSets((prev) => ({ ...prev, ...nextCompletedSets }));
                }
            } catch (err) {
                console.error('Error loading assessment draft:', err);
            }
        };

        loadAssessmentDraft();
        return () => {
            mounted = false;
        };
    }, [clientId, dayId, activityId]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isStarted && !isPaused) {
            interval = setInterval(() => {
                setSecondsElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isStarted, isPaused]);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        setIsStarted(true);
        setIsPaused(false);
    };

    const handlePauseResume = () => {
        setIsPaused(!isPaused);
    };

    const handleSetUpdate = (exerciseId: string, setIndex: number, field: 'weight' | 'reps' | 'completed', value: any) => {
        setCompletedSets(prev => {
            const currentSets = prev[exerciseId] || [];
            const newSets = [...currentSets];
            if (!newSets[setIndex]) {
                newSets[setIndex] = { weight: null, reps: null, completed: false };
            }
            newSets[setIndex] = { ...newSets[setIndex], [field]: value };
            return { ...prev, [exerciseId]: newSets };
        });
    };

    const handleAssessmentFieldChange = (exerciseId: string, fieldKey: string, value: any) => {
        setAssessmentResults(prev => {
            const current = prev[exerciseId] || { values: {}, completed: false };
            return {
                ...prev,
                [exerciseId]: {
                    ...current,
                    completed: false,
                    values: {
                        ...current.values,
                        [fieldKey]: value
                    }
                }
            };
        });

        setAssessmentErrors(prev => {
            if (!prev[exerciseId]?.[fieldKey]) return prev;
            return {
                ...prev,
                [exerciseId]: {
                    ...prev[exerciseId],
                    [fieldKey]: ''
                }
            };
        });
    };

    const validateAssessment = (exerciseId: string, template: AssessmentTemplate): boolean => {
        const values = assessmentResults[exerciseId]?.values || {};
        const nextErrors: Record<string, string> = {};

        template.fields.forEach((field) => {
            if (!field.required) return;
            const value = values[field.key];
            const empty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
            if (empty) {
                nextErrors[field.key] = 'Campo obligatorio';
            }
        });

        setAssessmentErrors(prev => ({ ...prev, [exerciseId]: nextErrors }));
        return Object.keys(nextErrors).length === 0;
    };

    const handleAssessmentComplete = async (exercise: WorkoutExercise, template: AssessmentTemplate) => {
        const isValid = validateAssessment(exercise.id, template);
        if (!isValid) return;

        const normalizedValues = normalizeAssessmentValues(assessmentResults[exercise.id]?.values || {});

        setAssessmentResults(prev => ({
            ...prev,
            [exercise.id]: {
                values: normalizedValues,
                completed: true
            }
        }));

        setCompletedSets(prev => ({
            ...prev,
            [exercise.id]: [{ weight: null, reps: null, completed: true }]
        }));

        if (clientId && dayId && activityId) {
            try {
                const dayLogs = await trainingService.getClientActivityLogs(clientId, dayId);
                const workoutLog = dayLogs.find((l) => l.activity_id === activityId);
                const previousData = workoutLog?.data || {};
                const previousDraft = (previousData.assessment_draft && typeof previousData.assessment_draft === 'object')
                    ? previousData.assessment_draft
                    : {};

                await trainingService.saveClientActivityLog({
                    client_id: clientId,
                    activity_id: activityId,
                    day_id: dayId,
                    completed_at: new Date().toISOString(),
                    data: {
                        ...previousData,
                        assessment_draft: {
                            ...previousDraft,
                            [exercise.id]: normalizedValues,
                        },
                        draft_saved_at: new Date().toISOString(),
                    },
                });
            } catch (err) {
                console.error('Error saving assessment draft:', err);
            }
        }
    };

    const handleFinish = async () => {
        if (!clientId) return;

        try {
            setSaving(true);

            const workoutExercises = (workout.blocks || []).flatMap(block => block.exercises || []);

            const requiredAssessmentExercises = workoutExercises
                .map(we => ({ we, template: getAssessmentTemplate(we.exercise?.name) }))
                .filter((item): item is { we: WorkoutExercise; template: AssessmentTemplate } => !!item.template)
                .filter(item => item.template.requiredForFinish !== false);

            const missingAssessments = requiredAssessmentExercises.filter(item => !assessmentResults[item.we.id]?.completed);
            if (missingAssessments.length > 0) {
                setSaving(false);
                alert(`Faltan resultados por registrar en: ${missingAssessments.map(m => m.we.exercise?.name || 'Test').join(', ')}`);
                return;
            }

            const exerciseLogs: Omit<ClientExerciseLog, 'id' | 'created_at'>[] = [];
            const assessmentExerciseIds = new Set(
                workoutExercises
                    .filter((we) => !!getAssessmentTemplate(we.exercise?.name))
                    .map((we) => we.id)
            );

            Object.entries(completedSets).forEach(([exerciseId, setsData]) => {
                if (assessmentExerciseIds.has(exerciseId)) return;

                const completedSetsCount = setsData.filter(s => s.completed).length;
                if (completedSetsCount === 0) return;

                // Aggregate weight and reps from individual sets
                const weights = setsData.filter(s => s.completed && s.weight != null).map(s => String(s.weight));
                const reps = setsData.filter(s => s.completed && s.reps != null).map(s => String(s.reps));

                exerciseLogs.push({
                    log_id: '', // Set by the service
                    workout_exercise_id: exerciseId,
                    sets_completed: completedSetsCount,
                    reps_completed: reps.join(',') || undefined,
                    weight_used: weights.join(',') || undefined,
                    is_completed: true,
                });
            });

            Object.entries(assessmentResults).forEach(([exerciseId, result]) => {
                if (!result.completed) return;
                const normalized = normalizeAssessmentValues(result.values || {});

                exerciseLogs.push({
                    log_id: '',
                    workout_exercise_id: exerciseId,
                    sets_completed: 1,
                    reps_completed: `${ASSESSMENT_PREFIX}${JSON.stringify(normalized)}`,
                    weight_used: undefined,
                    is_completed: true
                });
            });

            const dayLogData: Omit<ClientDayLog, 'id' | 'created_at'> = {
                client_id: clientId,
                day_id: dayId,
                completed_at: new Date().toISOString(),
                duration_minutes: Math.ceil(secondsElapsed / 60),
                effort_rating: effortRating > 0 ? effortRating : undefined,
                notes: sessionNotes,
                // Add safety pass data
                pre_fatigue: safetyPassData.preWorkout.fatigue,
                pre_rpe_type: safetyPassData.preWorkout.rpe_type,
                pre_oxygen: safetyPassData.preWorkout.oxygen,
                pre_pulse: safetyPassData.preWorkout.pulse,
                pre_bp_systolic: safetyPassData.preWorkout.bp_systolic,
                pre_bp_diastolic: safetyPassData.preWorkout.bp_diastolic,
                safety_exclusion_data: safetyPassData.exclusion,
                safety_sequelae_data: safetyPassData.sequelae
            };

            await trainingService.saveClientDayLog(dayLogData, exerciseLogs);

            setShowSummary(true);
        } catch (error) {
            console.error("Error saving workout log:", error);
            alert("Hubo un error al guardar tu entrenamiento. Por favor, intenta de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    // Compute summary stats
    const summaryStats = () => {
        let totalSetsCompleted = 0;
        let totalWeight = 0;
        let exercisesWorked = 0;
        Object.entries(completedSets).forEach(([_, setsData]) => {
            const done = setsData.filter(s => s.completed);
            if (done.length > 0) exercisesWorked++;
            totalSetsCompleted += done.length;
            done.forEach(s => {
                if (s.weight && s.reps) totalWeight += s.weight * s.reps;
            });
        });
        const allExercises = (workout.blocks || []).reduce((sum, b) => sum + (b.exercises?.length || 0), 0);
        return { totalSetsCompleted, totalWeight, exercisesWorked, allExercises };
    };

    if (showSummary) {
        const stats = summaryStats();
        return (
            <div className="fixed inset-0 bg-slate-50 flex flex-col z-[100] animate-in fade-in">
                <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                        <Trophy className="w-10 h-10 text-brand-green" />
                    </div>

                    <h2 className="text-2xl font-black text-brand-dark mb-1 text-center">
                        Entrenamiento completado
                    </h2>
                    <p className="text-slate-400 text-sm mb-8 text-center">{workout.name}</p>

                    <div className="grid grid-cols-2 gap-3 w-full mb-8">
                        <div className="bg-white rounded-2xl border border-brand-mint/40 p-4 text-center">
                            <Timer className="w-5 h-5 text-brand-green mx-auto mb-1" />
                            <p className="text-xl font-black text-brand-dark">{formatTime(secondsElapsed)}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Duración</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-brand-mint/40 p-4 text-center">
                            <Dumbbell className="w-5 h-5 text-brand-green mx-auto mb-1" />
                            <p className="text-xl font-black text-brand-dark">{stats.exercisesWorked}/{stats.allExercises}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Ejercicios</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-brand-mint/40 p-4 text-center">
                            <CheckCircle className="w-5 h-5 text-brand-green mx-auto mb-1" />
                            <p className="text-xl font-black text-brand-dark">{stats.totalSetsCompleted}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Series</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-brand-mint/40 p-4 text-center">
                            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                            <p className="text-xl font-black text-brand-dark">{stats.totalWeight > 0 ? `${Math.round(stats.totalWeight)}` : '—'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Kg totales</p>
                        </div>
                    </div>

                    {effortRating > 0 && (
                        <div className="bg-white rounded-2xl border border-brand-mint/40 p-4 w-full mb-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${effortRating <= 3 ? 'bg-green-500' : effortRating <= 6 ? 'bg-yellow-500' : effortRating <= 8 ? 'bg-orange-500' : 'bg-red-500'}`}>
                                {effortRating}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-brand-dark">Esfuerzo percibido (RPE)</p>
                                <p className="text-xs text-slate-400">{effortRating <= 3 ? 'Fácil' : effortRating <= 6 ? 'Moderado' : effortRating <= 8 ? 'Intenso' : 'Máximo esfuerzo'}</p>
                            </div>
                        </div>
                    )}

                    {sessionNotes && (
                        <div className="bg-white rounded-2xl border border-brand-mint/40 p-4 w-full mb-8">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Notas</p>
                            <p className="text-sm text-brand-dark">{sessionNotes}</p>
                        </div>
                    )}

                    <button
                        onClick={() => onComplete()}
                        className="w-full py-4 bg-brand-green text-white rounded-2xl font-black shadow-lg shadow-brand-green/30 hover:bg-emerald-600 active:scale-[0.98] transition-all text-lg"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        );
    }

    if (showSafetyPass) {
        return (
            <SafetyPassModal
                data={safetyPassData}
                onUpdate={setSafetyPassData}
                onCancel={() => setShowSafetyPass(false)}
                onConfirm={() => {
                    setShowSafetyPass(false);
                    handleStart();
                }}
            />
        );
    }

    if (!isStarted) {
        return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300 p-4">
                <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 flex flex-col items-center p-8 text-center border border-white/20">
                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mb-6">
                        <Dumbbell className="w-10 h-10 text-brand-green" />
                    </div>
                    <h2 className="text-2xl font-black text-brand-dark mb-2 tracking-tight">{workout.name}</h2>
                    <p className="text-slate-500 mb-8 whitespace-pre-line">{workout.description || '¿Listo para empezar tu entrenamiento de hoy?'}</p>

                    <div className="w-full text-left bg-sky-50 border border-sky-100 rounded-2xl p-4 mb-6">
                        <p className="text-xs font-black uppercase tracking-wider text-sky-700 mb-1">{sessionGuide.title}</p>
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">{sessionGuide.intro}</p>
                        <ul className="space-y-1.5">
                            {sessionGuide.checklist.map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                                    <span className="text-sky-600 font-black">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-4 w-full">
                        <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button onClick={() => setShowSafetyPass(true)} className="flex-[2] py-3 rounded-2xl font-bold text-white bg-brand-green hover:bg-brand-green/90 shadow-lg shadow-brand-mint/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            <Play className="w-5 h-5 fill-current" />
                            Empezar Ahora
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[100] animate-in fade-in">
            {/* Top Bar - Header & Timer */}
            <div className="bg-white border-b border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-bold text-brand-dark text-base sm:text-lg leading-tight truncate max-w-[150px] sm:max-w-xs">{workout.name}</h2>
                        <div className="flex items-center gap-1.5 text-brand-green font-mono text-sm sm:text-base font-bold bg-brand-mint/20 px-2 py-0.5 rounded-md inline-flex mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(secondsElapsed)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePauseResume}
                        className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-all shadow-sm ${isPaused ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                    </button>
                    <button
                        onClick={handleFinish}
                        className="h-10 sm:h-12 px-4 sm:px-6 bg-brand-green text-white rounded-full font-bold shadow-md shadow-brand-mint/40 flex items-center gap-2 hover:bg-brand-green/90 active:scale-95 transition-all text-sm sm:text-base"
                    >
                        <Square className="w-4 h-4 fill-current hidden sm:block" />
                        Finalizar
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-6 pb-32">
                <div className="mb-5 bg-sky-50 border border-sky-100 rounded-2xl p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-sky-700 mb-1">{sessionGuide.title}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{sessionGuide.intro}</p>
                </div>

                {isPaused && (
                    <div className="mb-6 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 text-orange-800">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex justify-center items-center shrink-0">
                            <Pause className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <p className="font-bold">Entrenamiento en pausa</p>
                            <p className="text-sm opacity-80">El temporizador está detenido. Toca el botón play para reanudar.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6 sm:space-y-8">
                    {groupedBlocks.map((block) => (
                        <div key={block.id} className="space-y-4">
                            {block.name && (
                                <h3 className="font-black text-brand-dark/80 uppercase tracking-widest text-xs sm:text-sm pl-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-brand-green" />
                                    {block.name}
                                </h3>
                            )}

                            <div className="space-y-4">
                                {block.groups.map((group, groupIdx) => {
                                    if (group.type === 'superset') {
                                        const totalRounds = group.items[0]?.superset_rounds || group.items[0]?.sets || 3;
                                        const currentRound = supersetRound[group.id] || 0;
                                        const roundComplete = group.items.every(we => {
                                            const setLog = (completedSets[we.id] || [])[currentRound];
                                            return setLog?.completed;
                                        });
                                        const allRoundsComplete = Array.from({ length: totalRounds }).every((_, ri) =>
                                            group.items.every(we => (completedSets[we.id] || [])[ri]?.completed)
                                        );
                                        const completedRoundsCount = Array.from({ length: totalRounds }).filter((_, ri) =>
                                            group.items.every(we => (completedSets[we.id] || [])[ri]?.completed)
                                        ).length;

                                        return (
                                            <div key={`super-${group.id}`} className="bg-white rounded-3xl border border-brand-mint/40 p-1 shadow-sm overflow-hidden relative">
                                                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-brand-gold rounded-l-3xl"></div>
                                                <div className="px-4 py-3 bg-brand-gold/5 flex flex-wrap items-center justify-between border-b border-brand-mint/20 ml-2 rounded-tr-2xl gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-brand-gold fill-brand-gold" />
                                                        <span className="font-bold text-brand-dark text-sm uppercase tracking-wide">Superserie</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-brand-gold/80 px-2 py-1 bg-white rounded-full border border-brand-gold/20 shadow-sm">
                                                        Ronda {currentRound + 1}/{totalRounds} {allRoundsComplete && '✓'}
                                                    </span>
                                                </div>

                                                {/* Round navigation dots */}
                                                <div className="flex items-center justify-center gap-2 px-4 py-2 ml-2">
                                                    {Array.from({ length: totalRounds }).map((_, ri) => {
                                                        const thisRoundDone = group.items.every(we => (completedSets[we.id] || [])[ri]?.completed);
                                                        return (
                                                            <button
                                                                key={ri}
                                                                onClick={() => setSupersetRound(prev => ({ ...prev, [group.id]: ri }))}
                                                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${ri === currentRound
                                                                    ? 'bg-brand-gold text-white shadow-md scale-110'
                                                                    : thisRoundDone
                                                                        ? 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                                                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                                    }`}
                                                            >
                                                                {ri + 1}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Exercises for current round */}
                                                <div className="pl-2 pt-1 pb-2">
                                                    <div className="space-y-3">
                                                        {group.items.map((we, idx) => {
                                                            const setLog = (completedSets[we.id] || [])[currentRound] || { weight: null, reps: null, completed: false };
                                                            const isDone = !!setLog.completed;
                                                            return (
                                                                <div key={we.id} className={`${idx !== group.items.length - 1 ? 'border-b border-slate-100 pb-3' : ''} px-2`}>
                                                                    <SupersetExerciseRoundEntry
                                                                        exercise={we}
                                                                        roundIndex={currentRound}
                                                                        setLog={setLog}
                                                                        isDone={isDone}
                                                                        onSetUpdate={(field, val) => handleSetUpdate(we.id, currentRound, field, val)}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Next round / complete button */}
                                                <div className="px-4 pb-3 ml-2">
                                                    {roundComplete && currentRound < totalRounds - 1 ? (
                                                        <button
                                                            onClick={() => setSupersetRound(prev => ({ ...prev, [group.id]: currentRound + 1 }))}
                                                            className="w-full py-2.5 bg-brand-gold text-white font-bold rounded-xl shadow-md hover:bg-brand-gold/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                                        >
                                                            Siguiente ronda →
                                                        </button>
                                                    ) : allRoundsComplete ? (
                                                        <div className="w-full py-2.5 bg-brand-green/10 text-brand-green font-bold rounded-xl text-center flex items-center justify-center gap-2">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Superserie completada ({completedRoundsCount}/{totalRounds})
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={group.items[0].id} className="bg-white rounded-3xl border border-brand-mint/40 shadow-sm overflow-hidden p-2">
                                                <div className="p-2 sm:p-4">
                                                    {(() => {
                                                        const exercise = group.items[0];
                                                        const assessmentTemplate = getAssessmentTemplate(exercise.exercise?.name);
                                                        const assessmentState = assessmentResults[exercise.id] || { values: {}, completed: false };
                                                        const fieldErrors = assessmentErrors[exercise.id] || {};

                                                        return (
                                                    <ExerciseEntry
                                                        exercise={exercise}
                                                        completedSets={completedSets[exercise.id] || []}
                                                        onSetUpdate={(setIdx, field, val) => handleSetUpdate(exercise.id, setIdx, field, val)}
                                                        assessmentTemplate={assessmentTemplate}
                                                        assessmentState={assessmentState}
                                                        assessmentErrors={fieldErrors}
                                                        onAssessmentFieldChange={(fieldKey, value) => handleAssessmentFieldChange(exercise.id, fieldKey, value)}
                                                        onAssessmentComplete={() => {
                                                            if (assessmentTemplate) void handleAssessmentComplete(exercise, assessmentTemplate);
                                                        }}
                                                    />
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="pt-6 mt-6 border-t border-slate-200 pb-6">
                        <h3 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-brand-green" />
                            Resumen de sesión
                        </h3>
                        <div className="space-y-5">
                            <div className="bg-white p-5 rounded-3xl border border-brand-mint/40 shadow-sm">
                                <label className="block text-sm font-bold text-brand-dark mb-3">¿Qué tan duro fue? (RPE)</label>
                                <div className="flex justify-between items-center gap-1 sm:gap-2">
                                    {[...Array(10)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setEffortRating(i + 1)}
                                            className={`flex-1 aspect-square rounded-xl flex items-center justify-center font-bold text-sm sm:text-base transition-all ${effortRating === i + 1
                                                ? (i < 3 ? 'bg-green-500 text-white shadow-md scale-110 z-10' : i < 6 ? 'bg-yellow-500 text-white shadow-md scale-110 z-10' : i < 8 ? 'bg-orange-500 text-white shadow-md scale-110 z-10' : 'bg-red-500 text-white shadow-md scale-110 z-10')
                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] sm:text-xs font-medium text-slate-400 mt-2 px-1">
                                    <span>Muy fácil</span>
                                    <span>Moderado</span>
                                    <span>Máximo esfuerzo</span>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-brand-mint/40 shadow-sm">
                                <label className="block text-sm font-bold text-brand-dark mb-2">Notas sobre el entrenamiento</label>
                                <textarea
                                    value={sessionNotes}
                                    onChange={(e) => setSessionNotes(e.target.value)}
                                    placeholder="¿Cómo te sentiste? ¿Algún dolor? ¿Rompiste algún récord?"
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {saving && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-brand-mint border-t-brand-green rounded-full animate-spin"></div>
                    <p className="mt-4 font-bold text-brand-dark">Guardando entrenamiento...</p>
                </div>
            )}
        </div>
    );
}

// --- SAFETY PASS MODAL COMPONENT ---

function SafetyPassModal({ data, onUpdate, onCancel, onConfirm }: {
    data: any,
    onUpdate: (d: any) => void,
    onCancel: () => void,
    onConfirm: () => void
}) {
    const [step, setStep] = useState(1);

    const hasExclusion = Object.values(data.exclusion).some(v => v === true);

    const handleExclusionChange = (field: string, checked: boolean) => {
        onUpdate({
            ...data,
            exclusion: { ...data.exclusion, [field]: checked }
        });
    };

    const handlePreWorkoutChange = (field: string, value: any) => {
        onUpdate({
            ...data,
            preWorkout: { ...data.preWorkout, [field]: value }
        });
    };

    const handleSequelaeChange = (field: string, checked: boolean) => {
        onUpdate({
            ...data,
            sequelae: { ...data.sequelae, [field]: checked }
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-50 z-[110] flex flex-col animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-black text-brand-dark flex items-center gap-2">
                            <Activity className="w-5 h-5 text-brand-green" />
                            Pase de Seguridad
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paso {step} de 3</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${step === i ? 'bg-brand-green' : step > i ? 'bg-brand-mint' : 'bg-slate-100'}`} />
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-md mx-auto">

                    {/* STEP 1: Exclusion (Semáforo) */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6">
                                <h3 className="text-xl font-black text-red-900 mb-2 flex items-center gap-2">
                                    <Flame className="w-6 h-6 text-red-500" /> El Semáforo de Seguridad
                                </h3>
                                <p className="text-sm text-red-700/80 mb-6 leading-relaxed">
                                    Si marcas un <b>"SÍ"</b> en cualquiera de estos puntos, hoy <b>NO debes entrenar</b>. Es por tu seguridad clínica.
                                </p>

                                <div className="space-y-4">
                                    <ExclusionCheck
                                        label="¿Tienes fiebre? (Más de 38°C)"
                                        checked={data.exclusion.fever}
                                        onChange={(c) => handleExclusionChange('fever', c)}
                                    />
                                    <ExclusionCheck
                                        label="¿Sientes un malestar agudo inusual? (Náuseas, mareos o escalofríos)"
                                        checked={data.exclusion.malaise}
                                        onChange={(c) => handleExclusionChange('malaise', c)}
                                    />
                                    <ExclusionCheck
                                        label="¿Analítica en las últimas 24h?"
                                        checked={data.exclusion.blood_test}
                                        onChange={(c) => handleExclusionChange('blood_test', c)}
                                    />
                                    <div className="bg-white/80 rounded-2xl p-4 border border-red-100 space-y-3">
                                        <p className="text-sm font-bold text-red-800">Presión Arterial</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sistólica</label>
                                                <input
                                                    type="number"
                                                    placeholder="Ej: 120"
                                                    value={data.preWorkout.bp_systolic}
                                                    onChange={(e) => {
                                                        const sysParsed = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                                        const sys = sysParsed === '' ? NaN : sysParsed;
                                                        const diaVal = data.preWorkout.bp_diastolic;
                                                        const dia = (diaVal === '' || diaVal == null) ? NaN : parseInt(String(diaVal), 10);
                                                        const sysValid = !isNaN(sys) && String(sys).length >= 2;
                                                        const diaValid = !isNaN(dia) && String(dia).length >= 2;
                                                        const unsafe = (sysValid && (sys > 160 || sys < 90)) || (diaValid && dia > 100);

                                                        onUpdate({
                                                            ...data,
                                                            preWorkout: { ...data.preWorkout, bp_systolic: sysParsed },
                                                            exclusion: { ...data.exclusion, bp_uncontrolled: unsafe }
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-red-200 text-lg font-bold text-brand-dark focus:ring-2 focus:ring-red-300 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Diastólica</label>
                                                <input
                                                    type="number"
                                                    placeholder="Ej: 80"
                                                    value={data.preWorkout.bp_diastolic}
                                                    onChange={(e) => {
                                                        const diaParsed = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                                        const sysVal = data.preWorkout.bp_systolic;
                                                        const sys = (sysVal === '' || sysVal == null) ? NaN : parseInt(String(sysVal), 10);
                                                        const dia = diaParsed === '' ? NaN : diaParsed;
                                                        const sysValid = !isNaN(sys) && String(sys).length >= 2;
                                                        const diaValid = !isNaN(dia) && String(dia).length >= 2;
                                                        const unsafe = (sysValid && (sys > 160 || sys < 90)) || (diaValid && dia > 100);

                                                        onUpdate({
                                                            ...data,
                                                            preWorkout: { ...data.preWorkout, bp_diastolic: diaParsed },
                                                            exclusion: { ...data.exclusion, bp_uncontrolled: unsafe }
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-red-200 text-lg font-bold text-brand-dark focus:ring-2 focus:ring-red-300 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-red-600 leading-tight">
                                            Si tu tensión es mayor de <b>160/100</b> o menor de <b>90</b> (con mareo), hoy el ejercicio no es seguro. Reporta estos valores y descansa.
                                        </p>
                                        {data.exclusion.bp_uncontrolled && (
                                            <div className="bg-red-100 border border-red-200 rounded-xl p-2 text-xs font-bold text-red-700 text-center">
                                                Tensión fuera de rango seguro
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {hasExclusion ? (
                                <div className="bg-white border-2 border-red-500 rounded-[2rem] p-6 text-center shadow-xl shadow-red-100">
                                    <Square className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                    <h4 className="text-xl font-black text-red-600 mb-2">¡ALTO! SEMÁFORO EN ROJO</h4>
                                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                                        Debido a los criterios marcados, hoy <b>no es seguro entrenar</b>. Tu cuerpo necesita descanso absoluto para recuperarse de estos procesos agudos.
                                    </p>
                                    <button
                                        onClick={onCancel}
                                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
                                    >
                                        Cerrar y Descansar
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-4">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="w-full py-4 bg-brand-green text-white rounded-2xl font-black shadow-lg shadow-brand-mint/40 hover:emerald-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        Semáforo en Verde: Continuar
                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                    </button>
                                </div>
                            )}

                            <div className="bg-slate-100 rounded-2xl p-4 text-[11px] text-slate-500 leading-tight">
                                💡 <b>CONSEJO FINAL:</b> No te castigues si un día solo puedes hacer 10 minutos de movilidad. En oncología, "poco es mucho mejor que nada".
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Pre-Workout Assessment */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right duration-300">
                            <div>
                                <h3 className="text-xl font-black text-brand-dark mb-1">Valoración Pre-Entreno</h3>
                                <p className="text-sm text-slate-500">Ajustaremos la intensidad según cómo estés ahora.</p>
                            </div>

                            {/* Fatigue Slider */}
                            <div className="bg-white rounded-3xl border border-brand-mint/30 p-6 shadow-sm">
                                <label className="block text-sm font-black text-brand-dark mb-4 flex items-center justify-between">
                                    <span>Nivel de Fatiga Actual</span>
                                    <span className={`text-2xl font-black ${data.preWorkout.fatigue > 7 ? 'text-orange-500' : 'text-brand-green'}`}>
                                        {data.preWorkout.fatigue}
                                    </span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={data.preWorkout.fatigue}
                                    onChange={(e) => handlePreWorkoutChange('fatigue', parseInt(e.target.value))}
                                    className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-green"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                                    <span>ENERGÍA TOTAL</span>
                                    <span>AGOTAMIENTO</span>
                                </div>

                                {data.preWorkout.fatigue > 7 && (
                                    <p className="mt-4 p-3 bg-orange-50 border border-orange-100 text-orange-800 rounded-xl text-xs font-bold flex items-start gap-2">
                                        <Info className="w-4 h-4 shrink-0" />
                                        Tu fatiga es alta ({'>'}7). Hoy cambiaremos fuerza por movilidad suave y estiramientos. No fuerces.
                                    </p>
                                )}
                            </div>

                            {/* RPE Type (Green vs Yellow) */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handlePreWorkoutChange('rpe_type', 'verde')}
                                    className={`p-4 rounded-3xl border-2 transition-all text-left ${data.preWorkout.rpe_type === 'verde' ? 'bg-green-50 border-green-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="w-8 h-8 bg-green-500 rounded-full mb-3 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                    </div>
                                    <h4 className="font-black text-sm text-brand-dark">Día Verde</h4>
                                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">Me siento bien. Entrenaré a un 7-8/10 de esfuerzo.</p>
                                </button>
                                <button
                                    onClick={() => handlePreWorkoutChange('rpe_type', 'amarillo')}
                                    className={`p-4 rounded-3xl border-2 transition-all text-left ${data.preWorkout.rpe_type === 'amarillo' ? 'bg-yellow-50 border-yellow-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="w-8 h-8 bg-yellow-500 rounded-full mb-3 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-white rounded-full" />
                                    </div>
                                    <h4 className="font-black text-sm text-brand-dark">Día Amarillo</h4>
                                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">Me siento cansado. Entrenaré a un 4-5/10.</p>
                                </button>
                            </div>

                            {/* Oxygen, Pulse & Blood Pressure */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Oxígeno (%)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 98%"
                                        value={data.preWorkout.oxygen}
                                        onChange={(e) => handlePreWorkoutChange('oxygen', e.target.value)}
                                        className="w-full bg-transparent text-xl font-bold border-none p-0 focus:ring-0 text-brand-dark"
                                    />
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Pulso (ppm)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 72"
                                        value={data.preWorkout.pulse}
                                        onChange={(e) => handlePreWorkoutChange('pulse', e.target.value)}
                                        className="w-full bg-transparent text-xl font-bold border-none p-0 focus:ring-0 text-brand-dark"
                                    />
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tensión Sistólica</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 120"
                                        value={data.preWorkout.bp_systolic}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                            handlePreWorkoutChange('bp_systolic', val);
                                        }}
                                        className="w-full bg-transparent text-xl font-bold border-none p-0 focus:ring-0 text-brand-dark"
                                    />
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tensión Diastólica</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 80"
                                        value={data.preWorkout.bp_diastolic}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                            handlePreWorkoutChange('bp_diastolic', val);
                                        }}
                                        className="w-full bg-transparent text-xl font-bold border-none p-0 focus:ring-0 text-brand-dark"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors">
                                    Atrás
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex-[2] py-4 bg-brand-green text-white rounded-2xl font-black shadow-lg shadow-brand-mint/40 hover:emerald-600 transition-all flex items-center justify-center gap-2"
                                >
                                    Continuar
                                    <ArrowLeft className="w-5 h-5 rotate-180" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Sequelae & Objectives */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right duration-300">
                            <div>
                                <h3 className="text-xl font-black text-brand-dark mb-1 text-teal-800">Atención a Secuelas</h3>
                                <p className="text-sm text-slate-500">¿Sientes alguna de estas hoy?</p>
                            </div>

                            <div className="space-y-3">
                                <CheckCard
                                    label="Hormigueo en pies o manos (Neuropatía)"
                                    description="Ten siempre una silla cerca para apoyarte. El equilibrio es clave."
                                    checked={data.sequelae.tingling}
                                    onChange={(c) => handleSequelaeChange('tingling', c)}
                                    icon={Activity}
                                />
                                <CheckCard
                                    label="Tirantez en axila o brazo"
                                    description="No cojas peso con ese brazo hoy. Haz movimientos circulares suaves."
                                    checked={data.sequelae.tightness}
                                    onChange={(c) => handleSequelaeChange('tightness', c)}
                                    icon={Zap}
                                />
                                <CheckCard
                                    label="Dolor en zona de metástasis ósea"
                                    description="Si el dolor ha aumentado, no apliques carga en ese segmento."
                                    checked={data.sequelae.bone_pain}
                                    onChange={(c) => handleSequelaeChange('bone_pain', c)}
                                    icon={Flame}
                                />
                            </div>

                            <div className="bg-emerald-900 text-white rounded-[2rem] p-6 shadow-xl shadow-emerald-100">
                                <h4 className="text-lg font-black mb-3 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-emerald-300" /> Indicadores de Éxito
                                </h4>
                                <ul className="space-y-3 text-xs opacity-90 leading-tight">
                                    <li className="flex gap-2">
                                        <span className="text-emerald-300">•</span>
                                        <span><b>Test de la Silla:</b> Si el número aumenta, estás ganando la batalla a la pérdida de músculo.  </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-300">•</span>
                                        <span><b>Recuperación:</b> Si al terminar te sientes más despejado, el ejercicio está cumpliendo su función antiinflamatoria.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(2)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors">
                                    Atrás
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-[2] py-4 bg-brand-green text-white rounded-2xl font-black shadow-lg shadow-brand-mint/40 hover:emerald-600 transition-all flex items-center justify-center gap-2 text-lg"
                                >
                                    ¡Listo para empezar!
                                    <Target className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function ExclusionCheck({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 text-left ${checked ? 'bg-red-500 border-red-200 text-white shadow-md' : 'bg-white border-transparent text-slate-700'}`}
        >
            <span className="text-sm font-bold">{label}</span>
            <div className={`w-12 h-6 rounded-full relative transition-all ${checked ? 'bg-white/30' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${checked ? 'right-1 bg-white' : 'left-1 bg-slate-400'}`} />
            </div>
        </button>
    );
}

function CheckCard({ label, description, checked, onChange, icon: Icon }: { label: string, description: string, checked: boolean, onChange: (c: boolean) => void, icon: any }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`w-full p-4 rounded-3xl border-2 transition-all flex gap-4 text-left ${checked ? 'bg-brand-mint/10 border-brand-green' : 'bg-white border-slate-100'}`}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${checked ? 'bg-brand-green text-white' : 'bg-slate-50 text-slate-400'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <h4 className="font-bold text-sm text-brand-dark leading-tight">{label}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{description}</p>
            </div>
            <div className="ml-auto shrink-0 flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${checked ? 'bg-brand-green border-brand-green' : 'bg-white border-slate-200'}`}>
                    {checked && <CheckCircle className="w-4 h-4 text-white fill-current" />}
                </div>
            </div>
        </button>
    );
}

// Sub-component for a single exercise within a superset round
function SupersetExerciseRoundEntry({
    exercise,
    roundIndex,
    setLog,
    isDone,
    onSetUpdate
}: {
    exercise: WorkoutExercise;
    roundIndex: number;
    setLog: { weight?: number | null; reps?: number | null; completed?: boolean };
    isDone: boolean;
    onSetUpdate: (field: 'weight' | 'reps' | 'completed', value: any) => void;
}) {
    const extractYoutubeId = (url?: string) => {
        if (!url) return null;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        return match ? match[1] : null;
    };
    const youtubeId = exercise.exercise?.media_type === 'youtube' ? extractYoutubeId(exercise.exercise?.media_url) : null;
    const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;
    const [videoOpen, setVideoOpen] = useState(false);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                {thumbUrl ? (
                    <button
                        onClick={() => setVideoOpen(v => !v)}
                        className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-brand-mint/20 group shadow-sm border border-brand-mint/30"
                    >
                        <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                    </button>
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-mint/20 border border-brand-mint/30 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5 text-brand-green/40" />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-brand-dark text-sm leading-tight truncate">
                        {exercise.exercise?.name || 'Ejercicio'}
                    </h4>
                    {exercise.reps && (
                        <span className="text-[10px] font-bold text-slate-400">{exercise.reps} reps</span>
                    )}
                </div>

                {/* Inline weight + reps + OK for this round */}
                <div className="flex items-center gap-2 shrink-0">
                    <input
                        type="number"
                        placeholder="Kg"
                        value={setLog.weight || ''}
                        onChange={(e) => onSetUpdate('weight', e.target.value ? Number(e.target.value) : null)}
                        className={`w-16 bg-white border ${isDone ? 'border-brand-green/30 font-bold' : 'border-slate-200'} rounded-lg py-2 text-center text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all`}
                    />
                    <input
                        type="number"
                        placeholder={exercise.reps?.replace(/\D/g, '') || '0'}
                        value={setLog.reps || ''}
                        onChange={(e) => onSetUpdate('reps', e.target.value ? Number(e.target.value) : null)}
                        className={`w-16 bg-white border ${isDone ? 'border-brand-green/30 font-bold' : 'border-slate-200'} rounded-lg py-2 text-center text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all`}
                    />
                    <button
                        onClick={() => onSetUpdate('completed', !setLog.completed)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-brand-green text-white shadow-md shadow-brand-mint/40 scale-105' : 'bg-white border-2 border-slate-200 text-slate-300 hover:border-brand-mint hover:text-brand-mint'}`}
                    >
                        <CheckCircle className={`w-5 h-5 ${isDone ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            {exercise.notes && (
                <div className="bg-amber-50 text-amber-800 text-xs p-2 rounded-lg border border-amber-100 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <p className="leading-snug">{exercise.notes}</p>
                </div>
            )}

            {exercise.exercise?.instructions && (
                <div className="bg-sky-50 text-slate-700 text-xs p-2.5 rounded-lg border border-sky-100 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sky-600" />
                    <p className="leading-relaxed whitespace-pre-line">{exercise.exercise.instructions}</p>
                </div>
            )}

            {videoOpen && youtubeId && (
                <div className="rounded-xl overflow-hidden aspect-video w-full">
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                        title={exercise.exercise?.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-xl"
                    />
                </div>
            )}
        </div>
    );
}

// Sub-component for individual exercise entries
function ExerciseEntry({
    exercise,
    completedSets,
    onSetUpdate,
    assessmentTemplate,
    assessmentState,
    assessmentErrors,
    onAssessmentFieldChange,
    onAssessmentComplete,
    isSupersetChild = false
}: {
    exercise: WorkoutExercise;
    completedSets: any[];
    onSetUpdate: (idx: number, f: 'weight' | 'reps' | 'completed', v: any) => void;
    assessmentTemplate?: AssessmentTemplate | null;
    assessmentState?: { values: Record<string, any>; completed: boolean };
    assessmentErrors?: Record<string, string>;
    onAssessmentFieldChange?: (fieldKey: string, value: any) => void;
    onAssessmentComplete?: () => void;
    isSupersetChild?: boolean;
}) {
    const setsArray = Array.from({ length: exercise.sets || 1 });
    const extractYoutubeId = (url?: string) => {
        if (!url) return null;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        return match ? match[1] : null;
    };
    const youtubeId = exercise.exercise?.media_type === 'youtube' ? extractYoutubeId(exercise.exercise?.media_url) : null;
    const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;
    const [videoOpen, setVideoOpen] = useState(false);

    const isAssessmentExercise = !!assessmentTemplate;

    const renderAssessmentField = (field: AssessmentField) => {
        const type = field.type || 'text';
        const current = assessmentState?.values?.[field.key] ?? '';
        const error = assessmentErrors?.[field.key];
        const className = `w-full bg-white border ${error ? 'border-red-300' : 'border-slate-200'} rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all`;

        if (type === 'textarea') {
            return (
                <textarea
                    value={current}
                    onChange={(e) => onAssessmentFieldChange?.(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                    rows={3}
                    className={`${className} resize-none`}
                />
            );
        }

        if (type === 'select') {
            return (
                <select
                    value={current}
                    onChange={(e) => onAssessmentFieldChange?.(field.key, e.target.value)}
                    className={className}
                >
                    <option value="">Selecciona...</option>
                    {(field.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        return (
            <input
                type={type === 'number' ? 'number' : 'text'}
                value={current}
                onChange={(e) => onAssessmentFieldChange?.(field.key, e.target.value)}
                min={field.min}
                max={field.max}
                step={field.step}
                placeholder={field.placeholder || ''}
                className={className}
            />
        );
    };

    return (
        <div className="flex flex-col gap-3">
            <div className={`flex items-start gap-3 ${isSupersetChild ? 'px-2' : ''}`}>
                {thumbUrl ? (
                    <button
                        onClick={() => setVideoOpen(v => !v)}
                        className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-brand-mint/20 group shadow-sm border border-brand-mint/30"
                        aria-label={`Ver video de ${exercise.exercise?.name}`}
                    >
                        <img
                            src={thumbUrl}
                            alt={exercise.exercise?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-brand-dark fill-brand-dark ml-0.5" />
                            </div>
                        </div>
                    </button>
                ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-mint/20 border border-brand-mint/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                        <Dumbbell className="w-8 h-8 text-brand-green/40" />
                    </div>
                )}
                <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-brand-dark text-sm sm:text-base leading-tight w-full" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {exercise.exercise?.name || 'Ejercicio desconocido'}
                    </h4>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                        {exercise.sets > 0 && (
                            <span className="text-[10px] sm:text-xs font-bold text-brand-dark/80 bg-brand-mint/30 px-2 py-0.5 rounded-md border border-brand-mint/50">
                                {exercise.sets} series
                            </span>
                        )}
                        {exercise.reps && (
                            <span className="text-[10px] sm:text-xs font-bold text-brand-dark/80 bg-brand-mint/30 px-2 py-0.5 rounded-md border border-brand-mint/50">
                                {exercise.reps} reps
                            </span>
                        )}
                        {exercise.rest_seconds > 0 && (
                            <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {exercise.rest_seconds}s
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {exercise.notes && (
                <div className={`bg-amber-50 text-amber-800 text-xs sm:text-sm p-3 rounded-xl border border-amber-100 flex items-start gap-2 ${isSupersetChild ? 'mx-2' : ''}`}>
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="leading-snug">{exercise.notes}</p>
                </div>
            )}

            {exercise.exercise?.instructions && (
                <div className={`bg-sky-50 text-slate-700 text-xs sm:text-sm p-3 rounded-xl border border-sky-100 flex items-start gap-2 ${isSupersetChild ? 'mx-2' : ''}`}>
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-sky-600" />
                    <p className="leading-relaxed whitespace-pre-line">{exercise.exercise.instructions}</p>
                </div>
            )}

            {videoOpen && youtubeId && (
                <div className={`mt-1 mb-2 rounded-xl overflow-hidden aspect-video w-full ${isSupersetChild ? 'px-2' : ''}`}>
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                        title={exercise.exercise?.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-xl"
                    />
                </div>
            )}

            {isAssessmentExercise ? (
                <div className={`mt-2 space-y-3 ${isSupersetChild ? 'px-2' : ''}`}>
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
                        <p className="text-[10px] font-black text-sky-700 uppercase tracking-wider mb-2">Completa estos datos del test</p>
                        {assessmentTemplate?.introText && (
                            <p className="text-xs text-slate-600 mb-3 leading-relaxed">{assessmentTemplate.introText}</p>
                        )}
                        <div className="space-y-2.5">
                            {(assessmentTemplate?.fields || []).map((field) => (
                                <div key={field.key}>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        {field.label}{field.required ? ' *' : ''}
                                    </label>
                                    {field.helpText && (
                                        <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">{field.helpText}</p>
                                    )}
                                    {renderAssessmentField(field)}
                                    {assessmentErrors?.[field.key] && (
                                        <p className="text-[11px] font-semibold text-red-500 mt-1">{assessmentErrors[field.key]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={onAssessmentComplete}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${assessmentState?.completed ? 'bg-brand-green/10 text-brand-green border border-brand-green/30' : 'bg-brand-green text-white hover:bg-emerald-600 active:scale-[0.98]'}`}
                    >
                        <CheckCircle className={`w-5 h-5 ${assessmentState?.completed ? '' : 'fill-current'}`} />
                        {assessmentState?.completed ? 'Resultados guardados (borrador)' : 'Guardar resultado del test'}
                    </button>
                    <p className="text-[11px] text-slate-500 mt-1">
                        Para dejarlo registrado en historial debes pulsar "Finalizar entrenamiento".
                    </p>
                </div>
            ) : (
            <div className={`mt-2 ${isSupersetChild ? 'px-2' : ''}`}>
                <div className="grid grid-cols-[1fr_2fr_2fr_1fr] md:grid-cols-[1fr_2fr_2fr_1fr] gap-2 mb-2 px-2 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    <span>Set</span>
                    <span>LBS/KG</span>
                    <span>Reps</span>
                    <span>OK</span>
                </div>

                <div className="space-y-2">
                    {setsArray.map((_, idx) => {
                        const setLog = (completedSets || [])[idx] || {};
                        const isDone = !!setLog.completed;

                        return (
                            <div
                                key={idx}
                                className={`grid grid-cols-[1fr_2fr_2fr_1fr] gap-2 items-center p-2 rounded-xl transition-all border ${isDone ? 'bg-brand-green/5 border-brand-green/20 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                            >
                                <div className="text-center font-black text-sm text-slate-400 w-full flex justify-center">{idx + 1}</div>

                                <input
                                    type="number"
                                    placeholder="0"
                                    value={setLog.weight || ''}
                                    onChange={(e) => onSetUpdate(idx, 'weight', e.target.value ? Number(e.target.value) : null)}
                                    // disabled={isDone} // Optionally disable if checked
                                    className={`w-full bg-white border ${isDone ? 'border-brand-green/30 text-brand-dark font-bold' : 'border-slate-200'} rounded-lg py-2 sm:py-2.5 text-center text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all`}
                                />

                                <input
                                    type="number"
                                    placeholder={exercise.reps?.replace(/\D/g, '') || "0"}
                                    value={setLog.reps || ''}
                                    onChange={(e) => onSetUpdate(idx, 'reps', e.target.value ? Number(e.target.value) : null)}
                                    className={`w-full bg-white border ${isDone ? 'border-brand-green/30 text-brand-dark font-bold' : 'border-slate-200'} rounded-lg py-2 sm:py-2.5 text-center text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all`}
                                />

                                <div className="flex justify-center w-full">
                                    <button
                                        onClick={() => onSetUpdate(idx, 'completed', !setLog.completed)}
                                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-brand-green text-white shadow-md shadow-brand-mint/40 scale-105' : 'bg-white border-2 border-slate-200 text-slate-300 hover:border-brand-mint hover:text-brand-mint'}`}
                                    >
                                        <CheckCircle className={`w-6 h-6 ${isDone ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            )}
        </div>
    );
}
