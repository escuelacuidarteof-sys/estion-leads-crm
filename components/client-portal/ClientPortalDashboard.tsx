import React, { useEffect, useState } from 'react';
import { trainingService } from '../../services/trainingService';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import {
    TrendingDown, Target, Calendar, Award, Activity, Heart, Zap, ChevronRight, Play, CheckCircle2,
    X, Video, Utensils, GraduationCap, ExternalLink, Clock, AlertCircle, Phone, Mail, Instagram, Stethoscope,
    Scale, Syringe, Ruler, Footprints, Briefcase, Dumbbell, BookOpen, MessageCircle, TrendingUp,
    Hourglass, User, MapPin, Pill, FileHeart, FileText, CreditCard, Upload, Check, Image as ImageIcon, Loader2, Pencil,
    Moon, Shield, Sparkles, CheckCircle, Camera
} from 'lucide-react';
import { Client } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { compressReceiptImage } from '../../utils/imageCompression';
import { ClassesView } from './ClassesView';
import { ReviewsView } from './ReviewsView';
import { CheckinView } from './CheckinView';
import { NutritionView } from './NutritionView';
import { ClientAnnouncements } from '../ClientAnnouncements';
import { SecurityMigrationBanner } from './SecurityMigrationBanner';
import MedicalReviews from '../../components/MedicalReviews';
import { useToast } from '../../components/ToastProvider';
import { BodyMeasurementsCard } from './BodyMeasurementsCard';
import { WellnessCard } from './WellnessCard';
import { AchievementsCard } from './AchievementsCard';
import { StepsCard } from './StepsCard';
import CoachGoalsManager from '../../components/CoachGoalsManager';
import ClientMaterials from '../../components/ClientMaterials';
import { ContractView } from './ContractView';
import { MedicalReportsView } from './MedicalReportsView';
import { CycleTrackingView } from './CycleTrackingView';
import { TrainingView } from './TrainingView';

interface WeightEntry {
    id: string;
    date: string;
    weight: number;
    source: string;
}

interface ClientPortalDashboardProps {
    client: Client;
    onRefresh?: () => void | Promise<void>;
}

export function ClientPortalDashboard({ client, onRefresh }: ClientPortalDashboardProps) {
    const toast = useToast();
    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'dashboard' | 'classes' | 'reviews' | 'checkin' | 'nutrition' | 'medical' | 'materials' | 'contract' | 'reports' | 'cycle' | 'training'>('dashboard');
    const [activeTab, setActiveTab] = useState<'home' | 'health' | 'program' | 'consultas' | 'profile'>('home');
    const [hasMigratedSecurity, setHasMigratedSecurity] = useState(false);
    const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coachData, setCoachData] = useState<any>(null);

    // Today's Tasks
    const [todayProgramDay, setTodayProgramDay] = useState<any | null>(null);
    const [todayWorkout, setTodayWorkout] = useState<any | null>(null);
    const [todayActivityLogs, setTodayActivityLogs] = useState<any[]>([]);
    const [isTodayTasksLoading, setIsTodayTasksLoading] = useState(false);

    // Unread badges
    const [unreadReportsCount, setUnreadReportsCount] = useState(0);
    const [unreadReviewsCount, setUnreadReviewsCount] = useState(0);

    // Last check-in data (for metrics)
    const [lastCheckin, setLastCheckin] = useState<any>(null);

    // Payment States
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isUploadingPayment, setIsUploadingPayment] = useState(false);
    const [paymentFile, setPaymentFile] = useState<File | null>(null);

    // Medication Edit States
    const [isEditingMedication, setIsEditingMedication] = useState(false);
    const [medicationValue, setMedicationValue] = useState(client.medical?.medication || '');
    const [isSavingMedication, setIsSavingMedication] = useState(false);

    // Target Weight Edit States
    const [isEditingTargetWeight, setIsEditingTargetWeight] = useState(false);
    const [tempTargetWeight, setTempTargetWeight] = useState(client.target_weight?.toString() || '');
    const [isSavingTargetWeight, setIsSavingTargetWeight] = useState(false);
    const [localTargetWeight, setLocalTargetWeight] = useState<number | null>(null);

    // Sync localTargetWeight when client prop changes (e.g. after onRefresh)
    useEffect(() => {
        if (client.target_weight) {
            setLocalTargetWeight(client.target_weight);
        }
    }, [client.target_weight]);

    // Long-term Goals Edit States
    const [isEditingGoal3, setIsEditingGoal3] = useState(false);
    const [tempGoal3, setTempGoal3] = useState(client.goals?.goal_3_months || '');
    const [isSavingGoal3, setIsSavingGoal3] = useState(false);

    const [isEditingGoal6, setIsEditingGoal6] = useState(false);
    const [tempGoal6, setTempGoal6] = useState(client.goals?.goal_6_months || '');
    const [isSavingGoal6, setIsSavingGoal6] = useState(false);

    const [isEditingGoal1, setIsEditingGoal1] = useState(false);
    const [tempGoal1, setTempGoal1] = useState(client.goals?.goal_1_year || '');
    const [isSavingGoal1, setIsSavingGoal1] = useState(false);

    useEffect(() => {
        loadData();
    }, [client.id, client.coach_id]);

    const loadData = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('weight_history')
            .select('*')
            .eq('client_id', client.id)
            .order('date', { ascending: false })
            .limit(12);
        if (data) setWeightHistory(data);

        // Fetch last check-in for dashboard metrics
        const { data: checkinData } = await supabase
            .from('weekly_checkins')
            .select('responses, rating, created_at')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (checkinData) setLastCheckin(checkinData);

        if (client.coach_id) {
            const { data: cData } = await supabase
                .from('users')
                .select('name, photo_url, bio, specialty, calendar_url, email, instagram')
                .eq('id', client.coach_id)
                .single();
            if (cData) setCoachData(cData);
        }
        setLoading(false);
    }

    // Load today tasks
    useEffect(() => {
        const loadTodayTasks = async () => {
            setIsTodayTasksLoading(true);
            try {
                const asgn = await trainingService.getClientAssignment(client.id);
                if (!asgn) return;
                const prog = await trainingService.getProgramById(asgn.program_id);
                if (!prog) return;

                const startDate = new Date(asgn.start_date);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
                const calculatedWeek = Math.max(1, Math.ceil((diffDays + 1) / 7));
                const clampedWeek = Math.min(calculatedWeek, prog.weeks_count);

                let currentDayIndex = now.getDay() || 7;

                const todayDay = prog.days?.find((d: any) => d.week_number === clampedWeek && d.day_number === currentDayIndex);
                if (todayDay) {
                    setTodayProgramDay(todayDay);
                    const logs = await trainingService.getClientActivityLogs(client.id, todayDay.id);
                    setTodayActivityLogs(logs);

                    const workoutActivity = todayDay.activities?.find((a: any) => a.type === 'workout');
                    if (workoutActivity) {
                        const workoutId = workoutActivity.activity_id || workoutActivity.workout_id;
                        if (workoutId) {
                            const w = await trainingService.getWorkoutById(workoutId);
                            setTodayWorkout(w);
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading today tasks:", err);
            } finally {
                setIsTodayTasksLoading(false);
            }
        };
        loadTodayTasks();
    }, [client.id]);

    // --- Unread notifications logic ---
    const REPORTS_READ_KEY = `ec_crm_reports_last_seen_${client.id}`;
    const REVIEWS_READ_KEY = `ec_crm_reviews_last_seen_${client.id}`;

    const loadUnreadCounts = async () => {
        try {
            // 1. Informes médicos (PDFs) no leídos
            const reportsLastSeen = localStorage.getItem(REPORTS_READ_KEY);
            let reportsQuery = supabase
                .from('medical_reviews')
                .select('id', { count: 'exact', head: true })
                .eq('client_id', client.id)
                .eq('report_type', 'Informe Médico')
                .eq('status', 'reviewed');
            if (reportsLastSeen) {
                reportsQuery = reportsQuery.gt('reviewed_at', reportsLastSeen);
            }
            const { count: reportsCount } = await reportsQuery;
            setUnreadReportsCount(reportsCount || 0);

            // 2. Revisiones no leídas (valoración inicial + analíticas del profesional de salud)
            const reviewsLastSeen = localStorage.getItem(REVIEWS_READ_KEY);
            let medicalQuery = supabase
                .from('medical_reviews')
                .select('id', { count: 'exact', head: true })
                .eq('client_id', client.id)
                .neq('report_type', 'Informe Médico')
                .eq('status', 'reviewed');
            if (reviewsLastSeen) {
                medicalQuery = medicalQuery.gt('reviewed_at', reviewsLastSeen);
            }

            let coachQuery = supabase
                .from('coaching_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('client_id', client.id);
            if (reviewsLastSeen) {
                coachQuery = coachQuery.gt('date', reviewsLastSeen.split('T')[0]);
            }

            const [{ count: medCount }, { count: coachCount }] = await Promise.all([medicalQuery, coachQuery]);
            setUnreadReviewsCount((medCount || 0) + (coachCount || 0));
        } catch (err) {
            console.warn('Error loading unread counts:', err);
        }
    };

    const markReportsAsRead = () => {
        localStorage.setItem(REPORTS_READ_KEY, new Date().toISOString());
        setUnreadReportsCount(0);
    };

    const markReviewsAsRead = () => {
        localStorage.setItem(REVIEWS_READ_KEY, new Date().toISOString());
        setUnreadReviewsCount(0);
    };

    useEffect(() => {
        loadUnreadCounts();
    }, [client.id]);

    useEffect(() => {
        if (activeView === 'reports') markReportsAsRead();
        if (activeView === 'reviews') markReviewsAsRead();
    }, [activeView]);

    const handleWeightSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWeight) return;
        setIsSubmitting(true);
        try {
            const weightVal = parseFloat(newWeight);
            const today = new Date().toISOString().split('T')[0];

            const { error: historyError } = await supabase
                .from('weight_history')
                .upsert(
                    [{
                        client_id: client.id,
                        weight: weightVal,
                        date: today,
                        source: 'user_input'
                    }],
                    {
                        onConflict: 'client_id,date' // Specify the unique constraint columns
                    }
                );

            if (historyError) throw historyError;

            loadData();
            setIsWeightModalOpen(false);
            setNewWeight('');
        } catch (error) {
            console.error(error);
            alert("Error al guardar peso");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSecurityMigration = async (email: string, pass: string) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setHasMigratedSecurity(true);
    };

    // Save medication changes
    const handleMedicationSave = async () => {
        setIsSavingMedication(true);
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ property_medicaci_n: medicationValue })
                .eq('id', client.id);

            if (error) throw error;

            toast.success('Medicación actualizada correctamente');
            setIsEditingMedication(false);
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error('Error saving medication:', error);
            toast.error('Error al guardar la medicación');
        } finally {
            setIsSavingMedication(false);
        }
    };

    const handleTargetWeightSave = async () => {
        const weightVal = parseFloat(tempTargetWeight);
        if (isNaN(weightVal)) return toast.error('Peso no válido');

        setIsSavingTargetWeight(true);
        try {
            const { error, data } = await supabase
                .from('clientes')
                .update({ property_peso_objetivo: weightVal })
                .eq('id', client.id)
                .select('property_peso_objetivo');

            if (error) throw error;

            console.log('[TARGET_WEIGHT] Save result:', { weightVal, data, clientId: client.id });

            // Immediately update local state so UI reflects change
            setLocalTargetWeight(weightVal);
            toast.success('Peso objetivo guardado correctamente');
            setIsEditingTargetWeight(false);
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error('[TARGET_WEIGHT] Error saving:', error);
            toast.error('Error al actualizar el peso objetivo');
        } finally {
            setIsSavingTargetWeight(false);
        }
    };

    const handleGoalSave = async (period: '3m' | '6m' | '1y') => {
        let value = '';
        let column = '';
        let setSaving: (v: boolean) => void = () => { };
        let setEditing: (v: boolean) => void = () => { };

        if (period === '3m') {
            value = tempGoal3;
            column = 'property_3_meses';
            setSaving = setIsSavingGoal3;
            setEditing = setIsEditingGoal3;
        } else if (period === '6m') {
            value = tempGoal6;
            column = 'property_6_meses';
            setSaving = setIsSavingGoal6;
            setEditing = setIsEditingGoal6;
        } else {
            value = tempGoal1;
            column = 'property_1_a_o';
            setSaving = setIsSavingGoal1;
            setEditing = setIsEditingGoal1;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ [column]: value })
                .eq('id', client.id);

            if (error) throw error;

            toast.success('Objetivo actualizado correctamente');
            setEditing(false);
            // Actualizar estado local inmediatamente para que se vea el cambio
            setLocalGoals((prev: any) => ({
                ...prev,
                ...(period === '3m' ? { goal_3_months: value } : {}),
                ...(period === '6m' ? { goal_6_months: value } : {}),
                ...(period === '1y' ? { goal_1_year: value } : {}),
            }));
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error('Error saving goal:', error);
            toast.error('Error al actualizar el objetivo');
        } finally {
            setSaving(false);
        }
    };

    // --- CONTRACT & PHASE CALCULATIONS ---
    // Función para obtener los datos del contrato ACTIVO ACTUAL
    const getActiveContractData = () => {
        const today = new Date();
        const c = client as any;
        const program = (client.program || {}) as any;

        // Construir array de contratos con sus datos
        const contracts = [
            {
                phase: 'F1',
                startDate: client.start_date,
                endDate: program.f1_endDate,
                duration: client.program_duration_months || 0,
                name: program.contract1_name || `${client.program_duration_months || 3} meses`,
                isRenewed: true // F1 siempre está activo si existe
            },
            {
                phase: 'F2',
                startDate: program.f2_renewalDate,
                endDate: program.f2_endDate,
                duration: program.f2_duration || 0,
                name: program.contract2_name || `${program.f2_duration || 0} meses`,
                isRenewed: program.renewal_f2_contracted
            },
            {
                phase: 'F3',
                startDate: program.f3_renewalDate,
                endDate: program.f3_endDate,
                duration: program.f3_duration || 0,
                name: program.contract3_name || `${program.f3_duration || 0} meses`,
                isRenewed: program.renewal_f3_contracted
            },
            {
                phase: 'F4',
                startDate: program.f4_renewalDate,
                endDate: program.f4_endDate,
                duration: program.f4_duration || 0,
                name: program.contract4_name || `${program.f4_duration || 0} meses`,
                isRenewed: program.renewal_f4_contracted
            },
            {
                phase: 'F5',
                startDate: program.f5_renewalDate,
                endDate: program.f5_endDate,
                duration: program.f5_duration || 0,
                name: program.contract5_name || `${program.f5_duration || 0} meses`,
                isRenewed: program.renewal_f5_contracted
            }
        ];

        // Filtrar solo contratos renovados/activos con fechas válidas
        const activeContracts = contracts.filter(contract =>
            contract.isRenewed &&
            contract.startDate &&
            contract.endDate &&
            !isNaN(new Date(contract.startDate).getTime()) &&
            !isNaN(new Date(contract.endDate).getTime())
        );

        if (activeContracts.length === 0) {
            // Fallback al primer contrato
            return {
                phase: 'F1',
                startDate: client.start_date,
                endDate: client.contract_end_date,
                duration: client.program_duration_months || 0,
                name: `${client.program_duration_months || 3} Meses`
            };
        }

        // Encontrar el contrato VIGENTE (donde hoy está entre start y end)
        const currentContract = activeContracts.find(contract => {
            const start = new Date(contract.startDate);
            const end = new Date(contract.endDate);
            return today >= start && today <= end;
        });

        // Si no hay contrato vigente actualmente, tomar el último contrato renovado
        const activeContract = currentContract || activeContracts[activeContracts.length - 1];

        return {
            phase: activeContract.phase,
            startDate: activeContract.startDate,
            endDate: activeContract.endDate,
            duration: activeContract.duration,
            name: `${activeContract.duration} Meses`
        };
    };

    const activeContract = getActiveContractData();

    const getCurrentPhaseDaysRemaining = () => {
        const today = new Date();
        const c = client as any;
        const phases = [
            { name: 'F1', date: c.f1_endDate },
            { name: 'F2', date: c.f2_endDate },
            { name: 'F3', date: c.f3_endDate },
            { name: 'F4', date: c.f4_endDate },
            { name: 'F5', date: c.f5_endDate },
            { name: 'Fin Contrato', date: client.contract_end_date }
        ];

        const validDates = phases
            .filter(p => p.date)
            .map(p => ({ ...p, dateObj: new Date(p.date) }))
            .filter(d => !isNaN(d.dateObj.getTime()))
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        if (validDates.length === 0) return null;

        const nextTarget = validDates.find(d => d.dateObj.getTime() >= today.getTime() - (24 * 60 * 60 * 1000));
        const target = nextTarget || validDates[validDates.length - 1];

        const diffTime = target.dateObj.getTime() - today.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { days, phaseName: target.name, date: target.dateObj };
    };

    const contractStatus = getCurrentPhaseDaysRemaining();
    const daysRemaining = contractStatus?.days ?? null;
    const isUrgent = daysRemaining !== null && daysRemaining <= 15;

    // --- WEIGHT PROGRESS CALC ---
    const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : (client.current_weight || 0);
    const oldestLoadedWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : currentWeight;
    const startWeight = client.initial_weight || (client as any).starting_weight || oldestLoadedWeight;
    const targetWeight = localTargetWeight || client.target_weight || startWeight;

    const totalDist = targetWeight - startWeight;
    const currentDist = currentWeight - startWeight;

    let weightProgress = 0;
    if (Math.abs(totalDist) > 0.1) {
        const rawProgress = currentDist / totalDist;
        weightProgress = Math.min(100, Math.max(0, Math.round(rawProgress * 100)));
    }

    const remainingWeight = Math.abs(targetWeight - currentWeight).toFixed(1);
    const isWeightLoss = totalDist < 0;

    // --- PROGRAM WEEK CALCULATION ---
    const getProgramWeek = () => {
        // Usar datos del contrato activo actual
        if (!activeContract.startDate || !activeContract.duration) return null;
        const startDate = new Date(activeContract.startDate);
        const today = new Date();
        const diffTime = today.getTime() - startDate.getTime();
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
        const totalWeeks = activeContract.duration * 4;
        return { current: Math.min(diffWeeks, totalWeeks), total: totalWeeks };
    };
    const programWeek = getProgramWeek();

    // --- LAST ACTIVITY DATES ---
    const lastCheckinDate = client.last_checkin_submitted ? new Date(client.last_checkin_submitted) : null;
    const lastWeightDate = weightHistory.length > 0 ? new Date(weightHistory[0].date) : null;

    // --- CHECK-IN REMINDER LOGIC ---
    // Show banner Friday-Sunday if no check-in submitted since this week's Friday
    const shouldShowCheckinReminder = (() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sunday, 5=Friday, 6=Saturday

        // Only show on Friday (5), Saturday (6), Sunday (0), or Monday (1)
        const isCheckinWindow = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 || dayOfWeek === 1;
        if (!isCheckinWindow) return false;

        // Calculate the date of the most recent Friday (start of check-in week)
        let fridayDate = new Date(today);
        const daysFromFriday = dayOfWeek === 0 ? 2 : (dayOfWeek === 6 ? 1 : 0);
        fridayDate.setDate(fridayDate.getDate() - daysFromFriday);
        fridayDate.setHours(0, 0, 0, 0);

        // If no check-in ever, show the banner
        if (!lastCheckinDate) return true;

        // Check if last check-in was before this Friday
        return lastCheckinDate < fridayDate;
    })();

    // Safe Accessors
    const cAny = client as any;
    const medical = cAny.medical || {};
    const [localGoals, setLocalGoals] = useState(cAny.goals || {});
    useEffect(() => { setLocalGoals(cAny.goals || {}); }, [cAny.goals]);
    const goals = localGoals;

    // --- PAYMENT UPLOAD HANDLER ---
    const handlePaymentUpload = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!paymentFile) return;

        setIsUploadingPayment(true);
        try {
            // 0. Compress image if needed (reduces 3-12MB phone photos to ~1MB)
            const fileToUpload = await compressReceiptImage(paymentFile);

            // 1. Upload logic (Real Supabase Storage)
            const fileExt = fileToUpload.name.split('.').pop();
            const fileName = `${client.id}/${Date.now()}.${fileExt}`;
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, fileToUpload, {
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            // 2. Update Client Record
            const { error: updateError } = await supabase
                .from('clientes')
                .update({
                    renewal_payment_status: 'uploaded',
                    renewal_receipt_url: publicUrl
                })
                .eq('id', client.id);

            if (updateError) {
                console.error('Supabase update error:', updateError);
                throw new Error(updateError.message || "Error al actualizar la base de datos");
            }

            console.log('Update result:', { status: 'success', id: client.id });

            // 3. UI Feedback
            toast.success("¡Comprobante subido correctamente! Tu coach lo revisará pronto para activar tu nueva fase.");
            setIsPaymentModalOpen(false);
            setPaymentFile(null);

            // Refetch data instead of full page reload
            if (onRefresh) {
                onRefresh();
            }

        } catch (error: any) {
            console.error('Error uploading receipt:', error);
            toast.error(`Hubo un error al guardar el pago: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsUploadingPayment(false);
        }
    };

    // --- CHART GENERATION (SVG Area Chart) ---
    const generateChartPath = (width: number, height: number) => {
        if (weightHistory.length < 2) return '';

        const data = [...weightHistory].reverse();
        const maxW = Math.max(...data.map(d => d.weight)) + 1;
        const minW = Math.min(...data.map(d => d.weight)) - 1;
        const rangeW = maxW - minW || 1;

        // Map points to SVG coordinates
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d.weight - minW) / rangeW) * height;
            return { x, y, val: d.weight, date: d.date };
        });

        // Generate Path Command (Smooth Bezier)
        // Simple L version for reliability first, then C if needed. Let's do straight lines for clarity or simple Catmull-Rom logic if we want smooth.
        // Let's stick to straight lines but area fill for robustness, or simple curve.

        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            // Simple smoothing: control points
            const p0 = points[i - 1];
            const p1 = points[i];
            const cp1x = p0.x + (p1.x - p0.x) / 2;
            const cp1y = p0.y;
            const cp2x = p0.x + (p1.x - p0.x) / 2;
            const cp2y = p1.y;
            pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
        }

        // Close path for area fill
        const areaPath = `${pathD} L ${width} ${height} L 0 ${height} Z`;

        return { line: pathD, area: areaPath, points };
    };

    const chartW = 500; // viewbox units
    const chartH = 150;
    const chartDataSvg = generateChartPath(chartW, chartH);

    // --- SUB-VIEWS (pantalla completa, sin bottom nav) ---
    const SubViewWrapper = ({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) => (
        <div className="min-h-screen bg-[#f8faf8] flex flex-col">
            <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
                <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                    <ChevronRight className="w-5 h-5 rotate-180 text-slate-600" />
                </button>
                <span className="font-heading font-black text-brand-dark">{title}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">{children}</div>
        </div>
    );

    if (activeView === 'classes') return <ClassesView onBack={() => setActiveView('dashboard')} />;
    if (activeView === 'reviews') return <ReviewsView clientId={client.id} onBack={() => setActiveView('dashboard')} currentWeeklyComments={client.weeklyReviewComments} />;
    if (activeView === 'checkin') return <CheckinView client={client} onBack={async () => { if (onRefresh) await onRefresh(); setActiveView('dashboard'); }} />;
    if (activeView === 'nutrition') return <NutritionView client={client} onBack={() => setActiveView('dashboard')} />;
    if (activeView === 'medical') return (
        <SubViewWrapper title="Consultas Dra. Odile" onBack={() => setActiveView('dashboard')}>
            <MedicalReviews client={client} />
        </SubViewWrapper>
    );
    if (activeView === 'materials') return (
        <SubViewWrapper title="Materiales" onBack={() => setActiveView('dashboard')}>
            <ClientMaterials clientId={client.id} currentUser={{ role: 'client', id: client.id, name: client.firstName, email: client.email || '' } as any} readOnly={true} />
        </SubViewWrapper>
    );
    if (activeView === 'contract') return (
        <ContractView client={client} onBack={() => setActiveView('dashboard')} onRefresh={onRefresh} />
    );
    if (activeView === 'reports') return (
        <MedicalReportsView
            clientId={client.id}
            clientName={`${client.firstName || ''} ${(client as any).surname || ''}`.trim()}
            onBack={() => setActiveView('dashboard')}
        />
    );
    if (activeView === 'cycle') return (
        <CycleTrackingView client={client} onBack={() => setActiveView('dashboard')} />
    );
    if (activeView === 'training') return (
        <TrainingView client={client} onBack={() => setActiveView('dashboard')} />
    );

    // --- HELPERS ---
    // Parse real metrics from the last check-in responses
    const parseCheckinMetrics = () => {
        if (!lastCheckin?.responses?.question_1) return { fatigue: null, sleep: null };
        const q1 = lastCheckin.responses.question_1;
        const fatigueMatch = q1.match(/Fatiga:\s*(\d+)/);
        const sleepMatch = q1.match(/Sueño:\s*(\d+)/);
        return {
            fatigue: fatigueMatch ? parseInt(fatigueMatch[1]) : null,
            sleep: sleepMatch ? parseInt(sleepMatch[1]) : null,
        };
    };
    const checkinMetrics = parseCheckinMetrics();
    const energyVal = lastCheckin?.rating ?? (lastCheckin?.responses?.question_6 ? parseInt(lastCheckin.responses.question_6) : null);
    const fatigueVal = checkinMetrics.fatigue;
    const sleepVal = checkinMetrics.sleep;
    const oncologyStatus = (medical as any).oncology_status || '';

    const displayTargetWeight = localTargetWeight ?? client.target_weight;
    const latestWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;
    const prevWeight = weightHistory.length > 1 ? weightHistory[1].weight : null;
    const weightDelta = latestWeight && prevWeight ? (latestWeight - prevWeight) : null;
    const weightProgressPct = latestWeight && displayTargetWeight && client.initial_weight
        ? Math.min(100, Math.max(0, Math.round(((client.initial_weight - latestWeight) / (client.initial_weight - displayTargetWeight)) * 100)))
        : null;

    // Calcular próxima cita
    const nextAppt = cAny.next_appointment_date ? {
        date: new Date(cAny.next_appointment_date),
        time: cAny.next_appointment_time || '',
        note: cAny.next_appointment_note || '',
        videoUrl: cAny.next_appointment_video_url || '',
    } : null;
    const apptDaysAway = nextAppt ? Math.ceil((nextAppt.date.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;
    const apptLabel = apptDaysAway === 0 ? 'Hoy' : apptDaysAway === 1 ? 'Mañana' : apptDaysAway && apptDaysAway > 0 ? `En ${apptDaysAway} días` : null;

    // Banner prioritario
    const needsCheckin = shouldShowCheckinReminder;
    const hasNewReviews = unreadReviewsCount > 0;
    const hasRenewal = cAny.renewal_status === 'pending';

    // Program progress
    const programWeekCurrent = cAny.program_week_current || (programWeek ? programWeek.current : 0);
    const programWeekTotal = cAny.program_week_total || (programWeek ? programWeek.total : 12);
    const programProgress = programWeekTotal > 0 ? Math.round((programWeekCurrent / programWeekTotal) * 100) : 0;

    // Chart data for Recharts
    const chartData = [...weightHistory].reverse().map(e => ({
        date: new Date(e.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        peso: e.weight,
    }));

    // --- TAB CONTENT ---

    const HomeTab = () => (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Extended Hero Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-dark via-[#1a2e1a] to-[#0a140a] p-8 md:p-10 shadow-2xl">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-green/20 blur-[120px] -mr-32 -mt-32 rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-mint/10 blur-[100px] -ml-32 -mb-32 rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4 flex-1">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-lg mb-2">
                            <Sparkles className="w-4 h-4 text-brand-mint" />
                            <span className="text-[11px] text-white font-black uppercase tracking-widest">{oncologyStatus || 'Programa Activo'}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-heading font-black text-white leading-[1.1]">
                            {(() => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'; })()}, <br /><span className="text-brand-mint">{client.firstName || 'campeón/a'} 💪</span>
                        </h2>
                        {programWeekTotal > 0 && (
                            <div className="flex flex-col gap-2 mt-6 max-w-sm">
                                <div className="flex justify-between items-end">
                                    <span className="text-white font-bold text-sm">Progreso del programa</span>
                                    <span className="text-brand-mint font-black text-xs">Semana {programWeekCurrent} de {programWeekTotal}</span>
                                </div>
                                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden w-full backdrop-blur-md">
                                    <div className="h-full bg-gradient-to-r from-brand-mint to-brand-green rounded-full shadow-[0_0_10px_rgba(107,160,107,0.5)] transition-all duration-1000" style={{ width: `${programProgress}%` }} />
                                </div>
                                {activeContract.startDate && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-white/50 text-[10px] font-bold">
                                            {new Date(activeContract.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="text-white/30 text-[10px]">→</span>
                                        <span className="text-brand-mint/70 text-[10px] font-bold">
                                            {activeContract.endDate
                                                ? new Date(activeContract.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : activeContract.duration
                                                    ? new Date(new Date(activeContract.startDate).getTime() + activeContract.duration * 30 * 86400000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : '—'
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 min-w-[200px] shadow-2xl ring-1 ring-white/5 relative group cursor-default">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-3">Valoración Semanal</p>
                        <div className="relative w-28 h-28 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                                <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={289.02} strokeDashoffset={289.02 * (1 - (energyVal || 0) / 10)} className="text-brand-mint transition-all duration-1000 ease-out" strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-4xl font-black text-white">{energyVal !== null ? energyVal : '—'}</span>
                        </div>
                        <p className="text-brand-green-dark text-[10px] font-black mt-3 bg-brand-mint px-3 py-1 rounded-full shadow-sm">
                            {energyVal !== null ? (energyVal >= 7 ? '¡Genial!' : energyVal >= 4 ? 'En progreso' : 'Ánimo 💚') : 'Sin datos aún'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Daily Tasks Section */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                <div className="flex items-center justify-between mb-5 px-2">
                    <h3 className="text-xl font-heading font-black text-brand-dark flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-brand-green" /> Tareas de Hoy
                    </h3>
                    <button onClick={() => setActiveTab('program')} className="text-xs font-bold text-brand-green hover:text-brand-green-dark hover:underline transition-all">Ver programa completo</button>
                </div>

                {isTodayTasksLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-28 bg-slate-100 animate-pulse rounded-[2rem]" />
                        <div className="h-28 bg-slate-100 animate-pulse rounded-[2rem]" />
                    </div>
                ) : todayProgramDay && todayProgramDay.activities && todayProgramDay.activities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todayProgramDay.activities.map((activity: any) => {
                            const isCompleted = todayActivityLogs.some((l: any) => l.activity_id === activity.id);
                            const ACTIVITY_META: Record<string, { label: string, icon: any, color: string, bg: string, ring: string }> = {
                                workout: { label: 'Entrenamiento', icon: Dumbbell, color: 'text-brand-green', bg: 'bg-brand-mint/40', ring: 'group-hover:ring-brand-green/30' },
                                walking: { label: 'Caminata', icon: Footprints, color: 'text-pink-600', bg: 'bg-pink-100', ring: 'group-hover:ring-pink-300' },
                                metrics: { label: 'Métricas', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-100', ring: 'group-hover:ring-amber-300' },
                                photo: { label: 'Foto progreso', icon: Camera, color: 'text-cyan-500', bg: 'bg-cyan-100', ring: 'group-hover:ring-cyan-300' },
                                form: { label: 'Check-in', icon: FileText, color: 'text-teal-600', bg: 'bg-teal-100', ring: 'group-hover:ring-teal-300' },
                                custom: { label: 'Tarea', icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-100', ring: 'group-hover:ring-violet-300' },
                            };
                            const type = activity.type || 'custom';
                            const meta = ACTIVITY_META[type] || ACTIVITY_META.custom;
                            const Icon = meta.icon;

                            return (
                                <button
                                    key={activity.id}
                                    onClick={() => setActiveView('training')}
                                    className={`bg-white rounded-[2rem] p-5 shadow-xl shadow-slate-200/40 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-left flex items-center justify-between group flex-row ${isCompleted ? 'border-brand-green/30 opacity-80' : 'border-transparent hover:border-brand-mint/50'}`}
                                >
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ring-4 ring-transparent ${meta.ring} ${isCompleted ? 'bg-brand-green/10' : meta.bg}`}>
                                            {isCompleted ? <CheckCircle className="w-6 h-6 text-brand-green drop-shadow-sm" /> : <Icon className={`w-6 h-6 ${meta.color}`} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-heading font-black text-brand-dark text-lg leading-tight">{activity.title || meta.label}</p>
                                            {activity.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">{activity.description}</p>}
                                        </div>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-brand-green/10' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
                                        <ChevronRight className={`w-5 h-5 ${isCompleted ? 'text-brand-green' : 'text-slate-300 group-hover:text-slate-500'}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-[2rem] p-10 border border-slate-100 text-center shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-mint/20 rounded-full blur-[40px] -mr-10 -mt-10" />
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 rotate-3 transform relative z-10">
                            <CheckCircle className="w-10 h-10 text-brand-mint" />
                        </div>
                        <h4 className="text-xl font-heading font-black text-brand-dark relative z-10">¡Todo cubierto por hoy!</h4>
                        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto relative z-10 font-medium leading-relaxed">Hoy no tienes tareas programadas. Aprovecha para descansar, desconectar y recuperarte bien.</p>
                    </div>
                )}
            </div>

            {/* Priority Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                {/* Priority Banners */}
                {hasRenewal && (
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2rem] p-6 flex flex-col justify-between shadow-xl shadow-amber-500/20 group hover:scale-[1.02] transition-transform">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <Award className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-black text-lg italic leading-tight">Nueva Etapa</p>
                                <p className="text-white/80 text-sm font-medium mt-1">Renovación ya disponible</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab('profile')} className="w-full bg-white text-amber-600 font-black py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider">Continuar Progreso</button>
                    </div>
                )}

                {hasNewReviews && (
                    <div className="bg-gradient-to-br from-brand-green to-[#2DA061] rounded-[2rem] p-6 flex flex-col justify-between shadow-xl shadow-brand-green/20 group hover:scale-[1.02] transition-transform">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <MessageCircle className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-black text-lg italic leading-tight">Nueva Revisión</p>
                                <p className="text-white/80 text-sm font-medium mt-1">Feedback personalizado listo</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveView('reviews')} className="w-full bg-white text-brand-green-dark font-black py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider">Ver Respuesta</button>
                    </div>
                )}

                {!hasRenewal && !hasNewReviews && needsCheckin && (
                    <div className="bg-white rounded-[2rem] p-6 border-2 border-brand-mint flex flex-col justify-between shadow-xl shadow-brand-mint/20 group hover:scale-[1.02] transition-transform relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-mint/30 rounded-full blur-[30px] -mr-8 -mt-8" />
                        <div className="flex items-start gap-4 mb-5 relative z-10">
                            <div className="w-14 h-14 bg-brand-mint text-brand-green rounded-2xl flex items-center justify-center">
                                <Calendar className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-brand-dark font-black text-lg italic leading-tight">Check-in Semanal</p>
                                <p className="text-slate-500 text-sm font-medium mt-1">Cuéntanos cómo vas</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveView('checkin')} className="w-full bg-brand-green text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-brand-green/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider relative z-10">Completar ahora</button>
                    </div>
                )}
            </div>

            {/* Dashboard Grid 2nd Level */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats & Progress */}
                <div className="space-y-6">
                    {/* Bienestar Card */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-brand-mint/40 rounded-xl">
                                    <Heart className="w-5 h-5 text-brand-green" />
                                </div>
                                <h3 className="text-lg font-black text-brand-dark">Tus Métricas</h3>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Estado Actual</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Sueño', val: sleepVal, icon: Moon, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
                                { label: 'Fatiga', val: fatigueVal !== null ? 10 - fatigueVal : null, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' },
                                { label: 'Ánimo', val: energyVal, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
                            ].map(({ label, val, icon: Icon, color, bg, bar }) => (
                                <div key={label} className={`${bg} rounded-3xl p-4 text-center border border-transparent hover:border-white transition-all`}>
                                    <div className={`w-8 h-8 ${bg} brightness-95 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                                        <Icon className={`w-4 h-4 ${color}`} />
                                    </div>
                                    <p className={`text-xl font-black ${color}`}>{val !== null ? val : '—'}<span className="text-[10px] opacity-40">/10</span></p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weight Brief */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-mint/20 rounded-3xl flex items-center justify-center">
                                <Scale className="w-7 h-7 text-brand-green" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Peso más reciente</p>
                                <p className="text-2xl font-black text-brand-dark">{latestWeight || '--'} <span className="text-sm font-medium text-slate-400">kg</span></p>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab('health')} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                            <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-brand-green transition-colors" />
                        </button>
                    </div>

                    {/* Próxima Cita Premium */}
                    {nextAppt && apptLabel && (
                        <div className="bg-gradient-to-br from-slate-50 to-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 rotate-12 opacity-[0.03] group-hover:rotate-0 transition-transform duration-700">
                                <Calendar className="w-32 h-32 text-brand-dark" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-gold/20">
                                        Próxima Sesión
                                    </div>
                                    <span className="text-xs font-black text-brand-gold">{apptLabel}</span>
                                </div>
                                <h4 className="text-xl font-black text-brand-dark mb-1">Consulta Médica</h4>
                                <p className="text-slate-500 text-sm mb-4">{nextAppt.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} {nextAppt.time && `· ${nextAppt.time}`}</p>
                                {nextAppt.videoUrl && (
                                    <a href={nextAppt.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-black/10">
                                        <Video className="w-4 h-4" /> Unirme a la videollamada
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Feed & Coach */}
                <div className="space-y-6">
                    {/* Coach Card */}
                    {coachData && (
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-brand-green" />
                            <div className="relative mb-6 inline-block">
                                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl relative z-10">
                                    {coachData.photo_url ? (
                                        <img src={coachData.photo_url} className="w-full h-full object-cover" alt={coachData.name} />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-heading text-3xl">{(coachData.name || '?')[0]}</div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-brand-gold p-2 rounded-xl shadow-lg border-2 border-white z-20">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                            </div>
                            <h4 className="text-xl font-black text-brand-dark leading-tight">{coachData.name}</h4>
                            <p className="text-brand-green text-xs font-bold uppercase tracking-widest mt-1 mb-4">{coachData.specialty || 'Tu Mentor Principal'}</p>

                            {cAny.weeklyCoachMessage && (
                                <div className="bg-slate-50 italic rounded-3xl p-5 text-slate-600 text-sm leading-relaxed relative">
                                    <div className="absolute top-2 left-4 text-4xl text-slate-200 serif opacity-50 select-none">“</div>
                                    <p className="relative z-10">"{cAny.weeklyCoachMessage}"</p>
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-3 mt-6">
                                {coachData.calendar_url && (
                                    <a href={coachData.calendar_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-brand-dark text-white py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-black transition-all">Reservar Sesión</a>
                                )}
                                {coachData.instagram && (
                                    <a href={`https://instagram.com/${coachData.instagram}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-pink-50 text-pink-600 border border-pink-100"><Instagram className="w-5 h-5" /></a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Announcements */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                            <h4 className="text-sm font-black text-brand-dark">Tablón de la Escuela</h4>
                            <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
                        </div>
                        <div className="p-2">
                            <ClientAnnouncements clientId={client.id} coachId={client.coach_id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const HealthTab = () => (
        <div className="space-y-4 pb-2">
            {/* Peso Hero */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Peso Actual</p>
                        <div className="flex items-end gap-2 mt-0.5">
                            <span className="text-4xl font-heading font-black text-brand-dark">{latestWeight ?? '—'}</span>
                            <span className="text-slate-400 font-medium mb-1">kg</span>
                            {weightDelta !== null && (
                                <span className={`text-sm font-black mb-1 flex items-center gap-0.5 ${weightDelta < 0 ? 'text-brand-green' : 'text-red-500'}`}>
                                    {weightDelta < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                    {Math.abs(weightDelta).toFixed(1)}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsWeightModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand-green bg-brand-mint/40 px-3 py-2 rounded-xl hover:bg-brand-mint transition-colors"
                    >
                        <Scale className="w-3.5 h-3.5" /> Registrar
                    </button>
                </div>
                {displayTargetWeight && latestWeight && (
                    <div>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-500">Objetivo: <strong className="text-brand-dark">{displayTargetWeight} kg</strong></span>
                            {weightProgressPct !== null && <span className="text-brand-green font-black">{weightProgressPct}% completado</span>}
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-green rounded-full transition-all" style={{ width: `${weightProgressPct ?? 0}%` }} />
                        </div>
                        {latestWeight && displayTargetWeight && latestWeight > displayTargetWeight && (
                            <p className="text-xs text-slate-400 mt-1">{(latestWeight - displayTargetWeight).toFixed(1)} kg hasta tu objetivo</p>
                        )}
                    </div>
                )}
            </div>

            {/* Gráfico */}
            {chartData.length > 1 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                    <p className="text-sm font-black text-brand-dark mb-3">Evolución del peso</p>
                    <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6BA06B" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#6BA06B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip contentStyle={{ background: '#1a2e1a', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                            {displayTargetWeight && <ReferenceLine y={displayTargetWeight} stroke="#D4AF37" strokeDasharray="4 4" label={{ value: `Meta ${displayTargetWeight}kg`, fontSize: 9, fill: '#D4AF37', position: 'insideTopRight' }} />}
                            <Area type="monotone" dataKey="peso" stroke="#6BA06B" strokeWidth={2.5} fill="url(#wGrad)" dot={false} activeDot={{ r: 4, fill: '#6BA06B' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Medidas */}
            <BodyMeasurementsCard clientId={client.id} initialAbdominal={client.abdominal_perimeter} initialArm={client.arm_perimeter} initialThigh={client.thigh_perimeter} />
            <WellnessCard clientId={client.id} />

            {/* Objetivos */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <p className="text-sm font-black text-brand-dark mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-brand-green" /> Mis Objetivos</p>
                <div className="space-y-3">
                    {[
                        { key: '3m', label: '3 Meses', goal: client.goals?.goal_3_months, color: 'border-brand-green', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', isEditing: isEditingGoal3, setEditing: setIsEditingGoal3, temp: tempGoal3, setTemp: setTempGoal3, saving: isSavingGoal3, onSave: () => handleGoalSave('3m') },
                        { key: '6m', label: '6 Meses', goal: client.goals?.goal_6_months, color: 'border-brand-gold', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', isEditing: isEditingGoal6, setEditing: setIsEditingGoal6, temp: tempGoal6, setTemp: setTempGoal6, saving: isSavingGoal6, onSave: () => handleGoalSave('6m') },
                        { key: '1y', label: '1 Año', goal: client.goals?.goal_1_year, color: 'border-purple-400', badgeBg: 'bg-purple-50', badgeText: 'text-purple-700', isEditing: isEditingGoal1, setEditing: setIsEditingGoal1, temp: tempGoal1, setTemp: setTempGoal1, saving: isSavingGoal1, onSave: () => handleGoalSave('1y') },
                    ].map(({ key, label, goal, color, badgeBg, badgeText, isEditing, setEditing, temp, setTemp, saving, onSave }) => (
                        <div key={key} className={`border-l-4 ${color} bg-slate-50/50 rounded-xl p-3`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeBg} ${badgeText}`}>{label}</span>
                                {!isEditing && (
                                    <button onClick={() => setEditing(true)} className="text-slate-300 hover:text-slate-500 transition-colors">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            {isEditing ? (
                                <div className="space-y-2 mt-2">
                                    <textarea
                                        className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-green/20 resize-none"
                                        rows={2}
                                        value={temp}
                                        onChange={e => setTemp(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={onSave} disabled={saving} className="flex-1 py-1.5 bg-brand-green text-white text-xs font-bold rounded-lg disabled:opacity-50">
                                            {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Guardar'}
                                        </button>
                                        <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-600 leading-relaxed">{goal || <span className="text-slate-300 italic">Sin objetivo definido</span>}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <AchievementsCard clientId={client.id} />
            <StepsCard clientId={client.id} isClientView={true} />
        </div>
    );

    const ProgramTab = () => (
        <div className="space-y-4 pb-2">
            {/* Estado del programa */}
            {(cAny.program?.name || cAny.program_phase) && (
                <div className="bg-brand-dark rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <p className="font-black">{cAny.program?.name || 'Tu Programa'}</p>
                        <span className="text-[10px] bg-brand-green/30 text-brand-mint px-2 py-1 rounded-full font-bold uppercase">VIGENTE</span>
                    </div>
                    {cAny.program_phase && <p className="text-brand-mint/70 text-xs mb-3">{cAny.program_phase}</p>}
                    {programWeekTotal > 0 && (
                        <>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/60">Progreso</span>
                                <span className="text-brand-mint font-bold">Semana {programWeekCurrent} / {programWeekTotal}</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-green rounded-full" style={{ width: `${programProgress}%` }} />
                            </div>
                        </>
                    )}
                    <div className="flex gap-4 mt-3 text-xs text-white/50">
                        {cAny.program?.start_date && <span>Inicio: {new Date(cAny.program.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>}
                        {cAny.program?.end_date && <span>Fin: {new Date(cAny.program.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                </div>
            )}

            {/* Grid de recursos */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Clases', desc: 'Sesiones de la escuela', icon: GraduationCap, bg: 'bg-violet-50', color: 'text-violet-600', border: 'border-violet-100', action: () => setActiveView('classes') },
                    { label: 'Mi Nutrición', desc: 'Tu plan alimentario', icon: Utensils, bg: 'bg-orange-50', color: 'text-orange-600', border: 'border-orange-100', action: () => setActiveView('nutrition') },
                    { label: 'Materiales', desc: 'Recursos de tu coach', icon: FileHeart, bg: 'bg-indigo-50', color: 'text-indigo-600', border: 'border-indigo-100', action: () => setActiveView('materials') },
                    { label: 'Mis Revisiones', desc: 'Feedback semanal', icon: CheckCircle2, bg: 'bg-sky-50', color: 'text-sky-600', border: 'border-sky-100', action: () => setActiveView('reviews'), badge: unreadReviewsCount > 0 ? unreadReviewsCount : null },
                ].map(({ label, desc, icon: Icon, bg, color, border, action, badge }) => (
                    <button key={label} onClick={action} className={`bg-white rounded-2xl p-4 border ${border} shadow-sm flex flex-col items-start gap-3 hover:shadow-md active:scale-[0.97] transition-all text-left`}>
                        <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center relative`}>
                            <Icon className={`w-6 h-6 ${color}`} />
                            {badge && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">{badge}</span>}
                        </div>
                        <div>
                            <p className="font-black text-brand-dark text-sm">{label}</p>
                            <p className="text-xs text-slate-400">{desc}</p>
                        </div>
                    </button>
                ))}
                <button
                    onClick={() => setActiveView('training')}
                    className="col-span-2 bg-white rounded-2xl p-4 border border-brand-mint shadow-sm flex flex-col items-start gap-3 hover:shadow-md active:scale-[0.97] transition-all text-left"
                >
                    <div className="w-12 h-12 bg-brand-mint rounded-xl flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-brand-green" />
                    </div>
                    <div>
                        <p className="font-black text-brand-dark text-sm">Entrenamientos</p>
                        <p className="text-xs text-slate-400">Tu programa semanal</p>
                    </div>
                </button>
            </div>

            {/* Ciclo hormonal si aplica */}
            {client.hormonal_status && ['mujer', 'femenino', 'female'].includes((client.gender || '').toLowerCase()) && (
                <button onClick={() => setActiveView('cycle')} className="w-full bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100 flex items-center gap-3 hover:shadow-md active:scale-[0.98] transition-all text-left">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <Heart className="w-6 h-6 text-pink-500" />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-pink-900 text-sm">Mi Ciclo</p>
                        <p className="text-xs text-pink-600">{client.hormonal_status === 'pre_menopausica' ? 'Seguimiento menstrual' : client.hormonal_status === 'perimenopausica' ? 'Seguimiento perimenopáusico' : 'Seguimiento menopáusico'}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-pink-300 flex-shrink-0" />
                </button>
            )}
        </div>
    );

    const ConsultasTab = () => (
        <div className="space-y-4 pb-2">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-brand-green" />
                </div>
                <div>
                    <p className="font-black text-brand-dark text-sm">Consultas a la Dra. Odile</p>
                    <p className="text-xs text-slate-400">Respuesta en 24-48 horas</p>
                </div>
            </div>
            <MedicalReviews client={client} />
            <div className="border-t border-slate-100 pt-4 mt-2">
                <p className="text-sm font-black text-brand-dark mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" /> Mis Informes Médicos
                    {unreadReportsCount > 0 && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-black">{unreadReportsCount} nuevo{unreadReportsCount > 1 ? 's' : ''}</span>}
                </p>
                <button onClick={() => setActiveView('reports')} className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100 flex items-center gap-3 hover:shadow-md active:scale-[0.98] transition-all text-left">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 relative">
                        <FileText className="w-5 h-5 text-purple-600" />
                        {unreadReportsCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">{unreadReportsCount}</span>}
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-purple-900 text-sm">Ver informes descargables</p>
                        <p className="text-xs text-purple-600">{unreadReportsCount > 0 ? `${unreadReportsCount} nuevo${unreadReportsCount > 1 ? 's' : ''} disponible${unreadReportsCount > 1 ? 's' : ''}` : 'Informes médicos en PDF'}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-300 flex-shrink-0" />
                </button>
            </div>
        </div>
    );

    const ProfileTab = () => {
        const paymentStatus = cAny.renewal_payment_status;
        return (
            <div className="space-y-4 pb-2">
                {/* Hero */}
                <div className="bg-gradient-to-br from-brand-mint/40 to-brand-mint/10 rounded-2xl p-5 text-center border border-brand-mint">
                    <div className="w-20 h-20 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <span className="text-white font-heading font-black text-2xl">{(client.firstName || '?')[0].toUpperCase()}</span>
                    </div>
                    <h2 className="font-heading font-black text-brand-dark text-lg">{client.firstName} {client.surname || ''}</h2>
                    {cAny.program?.name && <span className="text-xs bg-brand-gold/20 text-amber-800 font-bold px-3 py-1 rounded-full border border-brand-gold/30 mt-1 inline-block">{cAny.program.name}</span>}
                </div>

                {/* Datos personales */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
                    {[
                        { icon: Mail, label: 'Email', value: client.email },
                        { icon: Phone, label: 'Teléfono', value: client.phone },
                        { icon: MapPin, label: 'Ciudad', value: client.city || client.province },
                    ].filter(d => d.value).map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 px-4 py-3">
                            <Icon className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
                                <p className="text-sm text-brand-dark font-medium truncate">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contrato */}
                <button onClick={() => setActiveView('contract')} className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 hover:shadow-md active:scale-[0.98] transition-all text-left">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-brand-dark text-sm">Mi Contrato</p>
                        <p className={`text-xs font-bold ${cAny.program?.contract_signed ? 'text-brand-green' : 'text-amber-600'}`}>
                            {cAny.program?.contract_signed ? '✓ Firmado' : '⏳ Pendiente de firma'}
                        </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                </button>

                {/* Pago / Renovación */}
                {hasRenewal && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4">
                        <p className="font-black text-amber-900 text-sm mb-1 flex items-center gap-2"><Award className="w-4 h-4" /> Renovación disponible</p>
                        <p className="text-xs text-amber-700 mb-3">Continúa tu transformación con el programa {cAny.renewal_phase_name || 'siguiente'}.</p>
                        {paymentStatus === 'uploaded' ? (
                            <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <p className="text-xs text-emerald-700 font-bold">Comprobante enviado — en verificación</p>
                            </div>
                        ) : (
                            <button onClick={() => setIsPaymentModalOpen(true)} className="w-full py-3 bg-brand-gold text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                                <Upload className="w-4 h-4" /> Subir comprobante de pago
                            </button>
                        )}
                    </div>
                )}

                {/* Coach info */}
                {coachData && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
                        {coachData.photo_url ? (
                            <img src={coachData.photo_url} className="w-12 h-12 rounded-full object-cover flex-shrink-0" alt={coachData.name} />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-brand-green flex items-center justify-center text-white font-black flex-shrink-0">{coachData.name?.[0]}</div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-brand-dark text-sm">{coachData.name}</p>
                            <p className="text-xs text-slate-400">{coachData.specialty || 'Tu Coach'}</p>
                        </div>
                        <div className="flex gap-2">
                            {coachData.instagram && <a href={`https://instagram.com/${coachData.instagram}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center"><Instagram className="w-4 h-4 text-pink-600" /></a>}
                            {coachData.calendar_url && <a href={coachData.calendar_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-brand-mint/40 rounded-lg flex items-center justify-center"><Calendar className="w-4 h-4 text-brand-green" /></a>}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // --- BOTTOM NAV TABS CONFIG ---
    const tabs = [
        { id: 'home' as const, label: 'Inicio', icon: Activity },
        { id: 'health' as const, label: 'Mi Salud', icon: Heart },
        { id: 'program' as const, label: 'Programa', icon: BookOpen },
        { id: 'consultas' as const, label: 'Consultas', icon: MessageCircle, badge: unreadReviewsCount + (unreadReportsCount > 0 ? 1 : 0) },
        { id: 'profile' as const, label: 'Perfil', icon: User },
    ];

    // --- MAIN RENDER ---
    return (
        <div className="min-h-screen bg-[#f8faf8] flex flex-col items-center">
            <div className="w-full max-w-6xl mx-auto flex flex-col min-h-screen relative">
                {/* Header fijo */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-green to-brand-green-dark rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
                            <span className="text-white font-heading font-black text-xl">{(client.firstName || '?')[0].toUpperCase()}</span>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bienvenida</p>
                            <p className="font-heading font-black text-brand-dark text-lg leading-none">{client.firstName} {client.surname || ''}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {coachData && (
                            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-full border border-slate-100 pr-3">
                                <div className="relative">
                                    {coachData.photo_url ? (
                                        <img src={coachData.photo_url} className="w-9 h-9 rounded-full object-cover shadow-sm" alt={coachData.name} />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center text-white text-xs font-black">{coachData.name?.[0]}</div>
                                    )}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Tu Coach</p>
                                    <p className="text-[11px] font-black text-brand-dark leading-none">{coachData.name?.split(' ')[0]}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contenido scrollable */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-32">
                    <div className="max-w-5xl mx-auto w-full">
                        {activeTab === 'home' && <HomeTab />}
                        {activeTab === 'health' && <HealthTab />}
                        {activeTab === 'program' && <ProgramTab />}
                        {activeTab === 'consultas' && <ConsultasTab />}
                        {activeTab === 'profile' && <ProfileTab />}
                    </div>
                </div>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl z-40 p-2 rounded-3xl flex items-center justify-around">
                    <div className="flex items-center justify-around px-2 py-2">
                        {tabs.map(({ id, label, icon: Icon, badge }) => {
                            const isActive = activeTab === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative"
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-brand-mint' : ''} relative`}>
                                        <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-green' : 'text-slate-400'}`} />
                                        {badge !== undefined && badge > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">{badge > 9 ? '9+' : badge}</span>
                                        )}
                                    </div>
                                    <span className={`text-[9px] font-bold transition-colors ${isActive ? 'text-brand-green' : 'text-slate-400'}`}>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Modal Registrar Peso */}
                {isWeightModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setIsWeightModalOpen(false)}>
                        <div className="bg-white rounded-t-3xl p-6 w-full max-w-[480px]" onClick={e => e.stopPropagation()}>
                            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
                            <h3 className="font-heading font-black text-brand-dark text-lg mb-4 flex items-center gap-2"><Scale className="w-5 h-5 text-brand-green" /> Registrar Peso</h3>
                            <form onSubmit={handleWeightSubmit} className="space-y-4">
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Ej: 72.4"
                                    value={newWeight}
                                    onChange={e => setNewWeight(e.target.value)}
                                    className="w-full px-4 py-4 text-2xl font-black text-center bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all"
                                    autoFocus
                                />
                                <p className="text-center text-slate-400 text-xs">kilos · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsWeightModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black rounded-xl">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting || !newWeight} className="flex-1 py-3.5 bg-brand-green text-white font-black rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Pago */}
                {isPaymentModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => { if (!isUploadingPayment) setIsPaymentModalOpen(false); }}>
                        <div className="bg-white rounded-t-3xl p-6 w-full max-w-[480px]" onClick={e => e.stopPropagation()}>
                            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
                            <h3 className="font-heading font-black text-brand-dark text-lg mb-1">Comprobante de Pago</h3>
                            <p className="text-slate-500 text-sm mb-4">Sube una foto o PDF de tu transferencia</p>
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center mb-4 relative">
                                <input type="file" accept="image/*,application/pdf" onChange={e => setPaymentFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 font-medium">{paymentFile ? paymentFile.name : 'Toca para seleccionar archivo'}</p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black rounded-xl">Cancelar</button>
                                <button onClick={() => handlePaymentUpload()} disabled={!paymentFile || isUploadingPayment} className="flex-1 py-3.5 bg-brand-green text-white font-black rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isUploadingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
