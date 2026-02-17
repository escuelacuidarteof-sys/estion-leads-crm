import React, { useEffect, useState } from 'react';
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
    Moon, Shield
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
import { SymptomTrackerCard } from './SymptomTrackerCard';
import { BodyMeasurementsCard } from './BodyMeasurementsCard';
import { WellnessCard } from './WellnessCard';
import { AchievementsCard } from './AchievementsCard';
import { StepsCard } from './StepsCard';
import CoachGoalsManager from '../../components/CoachGoalsManager';
import ClientMaterials from '../../components/ClientMaterials';
import { ContractView } from './ContractView';
import { MedicalReportsView } from './MedicalReportsView';
import { CycleTrackingView } from './CycleTrackingView';

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
    const [activeView, setActiveView] = useState<'dashboard' | 'classes' | 'reviews' | 'checkin' | 'nutrition' | 'medical' | 'materials' | 'contract' | 'reports' | 'cycle'>('dashboard');
    const [hasMigratedSecurity, setHasMigratedSecurity] = useState(false);
    const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coachData, setCoachData] = useState<any>(null);

    // Unread badges
    const [unreadReportsCount, setUnreadReportsCount] = useState(0);
    const [unreadReviewsCount, setUnreadReviewsCount] = useState(0);

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

            // 2. Revisiones no leídas (valoración inicial + analíticas del endocrino)
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

        // Only show on Friday (5), Saturday (6), or Sunday (0)
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
        if (!isWeekend) return false;

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
    const handlePaymentUpload = async (e: React.FormEvent) => {
        e.preventDefault();
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
    const chartData = generateChartPath(chartW, chartH);


    // --- VIEWS ---
    if (activeView === 'classes') return <ClassesView onBack={() => setActiveView('dashboard')} />;
    if (activeView === 'reviews') return <ReviewsView clientId={client.id} onBack={() => setActiveView('dashboard')} currentWeeklyComments={client.weeklyReviewComments} />;
    if (activeView === 'checkin') return <CheckinView client={client} onBack={async () => {
        if (onRefresh) await onRefresh();
        setActiveView('dashboard');
    }} />;
    if (activeView === 'nutrition') return <NutritionView client={client} onBack={() => setActiveView('dashboard')} />;
    if (activeView === 'medical') return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4">
            <button onClick={() => setActiveView('dashboard')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold group">
                <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
            </button>
            <MedicalReviews client={client} />
        </div>
    );

    if (activeView === 'materials') return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4">
            <button onClick={() => setActiveView('dashboard')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold group">
                <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
            </button>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                        <FileHeart className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Materiales y Recursos</h2>
                        <p className="text-slate-500 text-sm">Documentos y enlaces compartidos por tu coach</p>
                    </div>
                </div>
                <ClientMaterials clientId={client.id} currentUser={{ role: 'client', id: client.id, name: client.firstName, email: client.email || '' } as any} readOnly={true} />
            </div>
        </div>
    );

    if (activeView === 'contract') return (
        <ContractView client={client} onBack={() => setActiveView('dashboard')} onRefresh={onRefresh} />
    );

    if (activeView === 'reports') return (
        <MedicalReportsView
            clientId={client.id}
            clientName={`${client.firstName || ''} ${client.surname || ''}`.trim()}
            onBack={() => setActiveView('dashboard')}
        />
    );

    if (activeView === 'cycle') return (
        <CycleTrackingView client={client} onBack={() => setActiveView('dashboard')} />
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 animate-fade-in">
            {/* --- HEADER --- */}
            <header className="bg-white sticky top-0 z-40 border-b border-slate-100/80 backdrop-blur-md bg-white/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                            {client.firstName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                Hola, {client.firstName} <span className="text-xl animate-bounce">👋</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ClientAnnouncements clientId={client.id} coachId={client.coach_id} />
                        {coachData && (
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                                <img
                                    src={coachData.photo_url || `https://ui-avatars.com/api/?name=${coachData.name}`}
                                    alt="Coach"
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="pr-1">
                                    <p className="text-[10px] text-slate-400 font-medium leading-none">Tu Coach</p>
                                    <p className="text-sm font-bold text-slate-700 leading-tight">{coachData.name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {!hasMigratedSecurity && (
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <SecurityMigrationBanner clientName={client.firstName} onMigrate={handleSecurityMigration} />
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* --- RENEWAL PAYMENT BANNER (NEW) --- */}
                {client.renewal_payment_link && client.renewal_payment_status === 'pending' && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 mb-2 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden animate-in slide-in-from-top-4">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shrink-0">
                                <CreditCard className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    Renovación Disponible <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">Pendiente de Pago</span>
                                </h2>
                                <p className="text-indigo-100 text-sm max-w-xl leading-relaxed mt-1">
                                    Tu plan para la fase <strong>{client.renewal_phase || 'siguiente'}</strong> está listo.
                                    Realiza el pago para asegurar tu plaza y continuar tu progreso sin interrupciones.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10 shrink-0">
                            <a
                                href={client.renewal_payment_link}
                                target="_blank"
                                rel="noreferrer"
                                className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                Pagar Ahora <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="px-6 py-3 bg-indigo-800/40 text-white font-bold rounded-xl border border-indigo-400/30 hover:bg-indigo-800/60 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Upload className="w-4 h-4" /> Subir Comprobante
                            </button>
                        </div>
                    </div>
                )}

                {/* --- PENDING VERIFICATION BANNER --- */}
                {(client.renewal_payment_status === 'uploaded' || (client as any).renewal_payment_status === 'uploaded') && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 flex items-center gap-4 animate-in fade-in mb-6">
                        <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-emerald-900 text-sm">Comprobante enviado</p>
                            <p className="text-emerald-700 text-xs">Tu coach revisará el pago en breve y activará tu nueva fase.</p>
                        </div>
                    </div>
                )}

                {/* --- PENDING CONTRACT SIGNATURE BANNER --- */}
                {client.program?.contract_visible_to_client && !client.program?.contract_signed && (
                    <div
                        onClick={() => setActiveView('contract')}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-5 text-white shadow-xl shadow-emerald-200 mb-2 flex items-center justify-between gap-4 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all animate-in slide-in-from-top-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shrink-0">
                                <FileText className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Contrato Pendiente de Firma</h2>
                                <p className="text-emerald-100 text-sm">Tu contrato está listo para ser revisado y firmado digitalmente.</p>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-white/60 shrink-0" />
                    </div>
                )}

                {/* --- WEEKLY CHECK-IN REMINDER BANNER --- */}
                {shouldShowCheckinReminder && (
                    <div
                        onClick={() => setActiveView('checkin')}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-5 text-white shadow-xl shadow-amber-200 mb-2 flex items-center justify-between gap-4 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all animate-in slide-in-from-top-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shrink-0">
                                <CheckCircle2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    ¡Es hora de tu Check-in Semanal!
                                </h2>
                                <p className="text-amber-100 text-sm mt-0.5">
                                    Cuéntale a tu coach cómo ha ido tu semana. Solo te llevará 2 minutos.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl font-bold text-sm shrink-0">
                            Rellenar ahora <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                )}

                {/* --- NEW MEDICAL CONTENT BANNER --- */}
                {(unreadReportsCount > 0 || unreadReviewsCount > 0) && (
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-purple-200 mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shrink-0">
                                <Stethoscope className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Tienes novedades del endocrino</h2>
                                <p className="text-purple-100 text-sm mt-0.5">
                                    {[
                                        unreadReportsCount > 0 && `${unreadReportsCount} informe${unreadReportsCount > 1 ? 's' : ''} nuevo${unreadReportsCount > 1 ? 's' : ''}`,
                                        unreadReviewsCount > 0 && `${unreadReviewsCount} revisi${unreadReviewsCount > 1 ? 'ones' : 'ón'} nueva${unreadReviewsCount > 1 ? 's' : ''}`
                                    ].filter(Boolean).join(' y ')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            {unreadReviewsCount > 0 && (
                                <button
                                    onClick={() => setActiveView('reviews')}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
                                >
                                    Ver Revisiones <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                            {unreadReportsCount > 0 && (
                                <button
                                    onClick={() => setActiveView('reports')}
                                    className="px-4 py-2 bg-white text-purple-600 font-bold rounded-xl text-sm hover:bg-purple-50 transition-colors flex items-center gap-2"
                                >
                                    Ver Informes <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* --- RENEWAL SUCCESS BANNER (Show for 7 days) --- */}
                {client.renewal_payment_status === 'verified' && (() => {
                    if (!client.renewal_verified_at) return true;
                    const verifiedDate = new Date(client.renewal_verified_at);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - verifiedDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                })() && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-100 mb-2 flex items-center justify-between gap-6 relative overflow-hidden animate-in zoom-in-95 duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                    <Award className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">¡Renovación Confirmada! 🚀</h2>
                                    <p className="text-emerald-50 opacity-90 text-sm mt-1">
                                        Tu pago ha sido verificado con éxito. ¡Ya tienes acceso completo a tu nueva fase de programa!
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 hidden sm:block">
                                <CheckCircle2 className="w-12 h-12 text-white/50" />
                            </div>
                        </div>
                    )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* --- LEFT COLUMN --- */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* 0. CONTRACT STATUS */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className={`p-3 rounded-2xl ${isUrgent ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Tu Plan Actual</p>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {activeContract.duration ? `Programa ${activeContract.duration} Meses` : 'Seguimiento Activo'}
                                    </h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                        {activeContract.phase || 'Fase General'}
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">VIGENTE</span>
                                        {activeContract.endDate && <span className="text-slate-300">•</span>}
                                        {activeContract.endDate && `Hasta el ${new Date(activeContract.endDate).toLocaleDateString()}`}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto bg-slate-50 rounded-2xl p-4 flex items-center justify-between sm:justify-center gap-6 min-w-[200px]">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Inicio</p>
                                    <p className="font-semibold text-slate-700 text-sm">
                                        {activeContract.startDate ? new Date(activeContract.startDate).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-slate-200"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Fin</p>
                                    <p className={`font-semibold text-sm ${isUrgent ? 'text-red-600' : 'text-slate-700'}`}>
                                        {activeContract.endDate ? new Date(activeContract.endDate).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 1. BIENESTAR CARD — oncológico */}
                        {(() => {
                            const oncologyStatus = (medical as any).oncology_status || '';
                            const statusLabel: Record<string, { label: string; color: string }> = {
                                en_tratamiento: { label: 'En tratamiento activo', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                                seguimiento_oncologico: { label: 'Seguimiento oncológico', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                                superviviente: { label: 'Superviviente', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                                recidiva: { label: 'Recidiva / Recaída', color: 'bg-red-100 text-red-800 border-red-200' },
                                paliativo: { label: 'Cuidados paliativos', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                            };
                            const badge = statusLabel[oncologyStatus];

                            const fatigueVal = (medical as any).symptom_fatigue ?? null;
                            const energyVal = client.energy_level ?? null;
                            const sleepVal = (medical as any).symptom_sleep_quality ?? null;

                            const scoreColor = (val: number | null, invert = false) => {
                                if (val === null) return 'text-slate-300';
                                const good = invert ? val <= 3 : val >= 7;
                                const mid = invert ? val <= 6 : val >= 4;
                                return good ? 'text-emerald-400' : mid ? 'text-amber-400' : 'text-red-400';
                            };

                            return (
                                <div className="relative rounded-3xl overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950" />
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-full blur-3xl -mr-24 -mt-24" />
                                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-emerald-600/10 to-cyan-500/10 rounded-full blur-3xl -ml-12 -mb-12" />

                                    <div className="relative z-10 p-6 sm:p-8">
                                        {/* Header */}
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 ring-4 ring-white/10">
                                                    <Heart className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Tu Bienestar</h2>
                                                    <p className="text-emerald-200/80 text-sm">
                                                        {programWeek ? `Semana ${programWeek.current} de ${programWeek.total}` : 'Programa activo'}
                                                    </p>
                                                </div>
                                            </div>
                                            {badge && (
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${badge.color}`}>
                                                    <Shield className="w-3 h-3" />
                                                    {badge.label}
                                                </span>
                                            )}
                                        </div>

                                        {/* Indicators */}
                                        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                                            <div className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                                                <Zap className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Fatiga</p>
                                                <p className={`text-2xl sm:text-3xl font-bold ${scoreColor(fatigueVal, true)}`}>
                                                    {fatigueVal !== null ? fatigueVal : '--'}
                                                    {fatigueVal !== null && <span className="text-xs font-normal text-slate-500">/10</span>}
                                                </p>
                                            </div>
                                            <div className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                                                <Activity className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Energía</p>
                                                <p className={`text-2xl sm:text-3xl font-bold ${scoreColor(energyVal)}`}>
                                                    {energyVal !== null ? energyVal : '--'}
                                                    {energyVal !== null && <span className="text-xs font-normal text-slate-500">/10</span>}
                                                </p>
                                            </div>
                                            <div className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                                                <Moon className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Sueño</p>
                                                <p className={`text-2xl sm:text-3xl font-bold ${scoreColor(sleepVal)}`}>
                                                    {sleepVal !== null ? sleepVal : '--'}
                                                    {sleepVal !== null && <span className="text-xs font-normal text-slate-500">/10</span>}
                                                </p>
                                            </div>
                                        </div>

                                        {/* CTA */}
                                        <button
                                            onClick={() => setActiveView('checkin')}
                                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Registrar cómo me siento hoy
                                        </button>

                                        {lastCheckinDate && (
                                            <p className="text-center text-xs text-emerald-200/50 mt-3">
                                                Último check-in: {lastCheckinDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 2. MEDICAL & PERSONAL DATA GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Health Card */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50">
                                    <div className="bg-red-50 p-2 rounded-xl text-red-500"><Heart className="w-5 h-5" /></div>
                                    <h3 className="font-bold text-slate-900">Ficha de Salud</h3>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Estado oncológico</p>
                                        <p className="font-medium text-slate-900 flex items-center gap-2">
                                            {medical.oncology_status || medical.diagnosis || 'No especificado'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Tratamiento actual</p>
                                        <p className="font-medium text-slate-900">{medical.currentTreatment || '--'}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs text-slate-400 font-bold uppercase">Medicación</p>
                                            {!isEditingMedication && (
                                                <button
                                                    onClick={() => {
                                                        setMedicationValue(medical.medication || '');
                                                        setIsEditingMedication(true);
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Editar
                                                </button>
                                            )}
                                        </div>
                                        {isEditingMedication ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={medicationValue}
                                                    onChange={(e) => setMedicationValue(e.target.value)}
                                                    className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    rows={4}
                                                    placeholder="Escribe tu medicación actual..."
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleMedicationSave}
                                                        disabled={isSavingMedication}
                                                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {isSavingMedication ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                                                        ) : (
                                                            <><Check className="w-4 h-4" /> Guardar</>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditingMedication(false)}
                                                        className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="font-medium text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">
                                                {medical.medication || 'Sin medicación registrada'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Activity Summary Card */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50">
                                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500"><Calendar className="w-5 h-5" /></div>
                                    <h3 className="font-bold text-slate-900">Tu Actividad</h3>
                                </div>
                                <div className="space-y-4 text-sm">
                                    {/* Program Week */}
                                    {programWeek && (
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                                            <p className="text-xs text-indigo-600 font-bold uppercase mb-1">Semana del Programa</p>
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-indigo-900 text-2xl">
                                                    {programWeek.current} <span className="text-sm font-medium text-indigo-400">de {programWeek.total}</span>
                                                </p>
                                                <div className="w-16 h-16 relative">
                                                    <svg className="w-16 h-16 transform -rotate-90">
                                                        <circle cx="32" cy="32" r="28" stroke="#e0e7ff" strokeWidth="6" fill="none" />
                                                        <circle
                                                            cx="32" cy="32" r="28"
                                                            stroke="#6366f1"
                                                            strokeWidth="6"
                                                            fill="none"
                                                            strokeDasharray={`${(programWeek.current / programWeek.total) * 176} 176`}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                        {Math.round((programWeek.current / programWeek.total) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Last Check-in */}
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${lastCheckinDate ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase">Último Check-in</p>
                                                <p className="font-medium text-slate-700">
                                                    {lastCheckinDate ? lastCheckinDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin registros'}
                                                </p>
                                            </div>
                                        </div>
                                        {lastCheckinDate && (
                                            <span className="text-xs text-slate-400">
                                                hace {Math.floor((new Date().getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24))} días
                                            </span>
                                        )}
                                    </div>
                                    {/* Last Body Measurements */}
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${(client as any).arm_perimeter ? 'bg-teal-100 text-teal-600' : 'bg-slate-200 text-slate-400'}`}>
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase">Masa Muscular</p>
                                                <p className="font-medium text-slate-700">
                                                    {(client as any).arm_perimeter
                                                        ? `Brazo: ${(client as any).arm_perimeter} cm`
                                                        : 'Sin registros'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Next Appointment */}
                                    {(client as any).next_appointment_date && (
                                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-amber-600 font-bold uppercase">Próxima Cita</p>
                                                        <p className="font-medium text-amber-900">
                                                            {new Date((client as any).next_appointment_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                            {(client as any).next_appointment_time && (
                                                                <span className="font-bold"> - {(client as any).next_appointment_time}h</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">
                                                    {(() => {
                                                        const days = Math.ceil((new Date((client as any).next_appointment_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                        return days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `En ${days} días`;
                                                    })()}
                                                </span>
                                            </div>
                                            {(client as any).next_appointment_note && (
                                                <p className="text-sm text-amber-700 mt-2 pl-12 italic">
                                                    "{(client as any).next_appointment_note}"
                                                </p>
                                            )}
                                            {(client as any).next_appointment_link && (
                                                <div className="mt-3 pl-12">
                                                    <a
                                                        href={(client as any).next_appointment_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-sm transition-all"
                                                    >
                                                        <Video className="w-4 h-4" />
                                                        Unirse a la reunión
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. COACH MESSAGE */}
                        {(client as any).coach_message && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 shadow-sm border border-amber-100 relative overflow-hidden">
                                <div className="absolute top-4 right-4 opacity-10">
                                    <MessageCircle className="w-16 h-16 text-amber-500" />
                                </div>
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 shrink-0">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-amber-600 font-bold uppercase mb-2">Mensaje de tu Coach</p>
                                        <p className="text-amber-900 font-medium leading-relaxed italic">
                                            "{(client as any).coach_message}"
                                        </p>
                                        {coachData?.name && (
                                            <p className="text-amber-600 text-sm mt-3 font-bold">— {coachData.name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. OBJECTIVES CARD (Dynamic) */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Award className="w-5 h-5 text-emerald-500" /> Tus Objetivos
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3">
                                    <div className="mt-0.5"><Target className="w-4 h-4 text-emerald-600" /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-emerald-800 text-xs font-bold uppercase">3 Meses</p>
                                            <div className="flex items-center gap-2">
                                                {goals.goal_3_months_status && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${goals.goal_3_months_status === 'achieved' ? 'bg-emerald-200 text-emerald-700' :
                                                        goals.goal_3_months_status === 'failed' ? 'bg-red-100 text-red-600' :
                                                            'bg-white/50 text-emerald-600'
                                                        }`}>
                                                        {goals.goal_3_months_status === 'achieved' ? 'Conseguido' : goals.goal_3_months_status === 'failed' ? 'No Conseguido' : 'Pendiente'}
                                                    </span>
                                                )}
                                                {!isEditingGoal3 && (
                                                    <button onClick={() => { setTempGoal3(goals.goal_3_months || ''); setIsEditingGoal3(true); }} className="flex items-center gap-1 px-2 py-0.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors">
                                                        <Pencil className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold">Editar</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isEditingGoal3 ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={tempGoal3}
                                                    onChange={(e) => setTempGoal3(e.target.value)}
                                                    className="w-full p-2 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleGoalSave('3m')}
                                                        disabled={isSavingGoal3}
                                                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                                    >
                                                        {isSavingGoal3 ? '...' : 'Guardar'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsEditingGoal3(false);
                                                            setTempGoal3(goals.goal_3_months || '');
                                                        }}
                                                        className="px-3 py-1 bg-white text-emerald-600 border border-emerald-200 text-xs font-bold rounded-lg hover:bg-emerald-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div onClick={() => { setTempGoal3(goals.goal_3_months || ''); setIsEditingGoal3(true); }} className="cursor-pointer group/goal">
                                                {goals.goal_3_months ? (
                                                    <p className="text-emerald-900 font-medium text-sm group-hover/goal:text-emerald-600 transition-colors">{goals.goal_3_months}</p>
                                                ) : (
                                                    <p className="text-emerald-400 italic text-sm">Toca para definir tu objetivo</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                                    <div className="mt-0.5"><Target className="w-4 h-4 text-blue-600" /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-blue-800 text-xs font-bold uppercase">6 Meses</p>
                                            <div className="flex items-center gap-2">
                                                {goals.goal_6_months_status && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${goals.goal_6_months_status === 'achieved' ? 'bg-blue-200 text-blue-700' :
                                                        goals.goal_6_months_status === 'failed' ? 'bg-red-100 text-red-600' :
                                                            'bg-white/50 text-blue-600'
                                                        }`}>
                                                        {goals.goal_6_months_status === 'achieved' ? 'Conseguido' : goals.goal_6_months_status === 'failed' ? 'No Conseguido' : 'Pendiente'}
                                                    </span>
                                                )}
                                                {!isEditingGoal6 && (
                                                    <button onClick={() => { setTempGoal6(goals.goal_6_months || ''); setIsEditingGoal6(true); }} className="flex items-center gap-1 px-2 py-0.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                                                        <Pencil className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold">Editar</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isEditingGoal6 ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={tempGoal6}
                                                    onChange={(e) => setTempGoal6(e.target.value)}
                                                    className="w-full p-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleGoalSave('6m')}
                                                        disabled={isSavingGoal6}
                                                        className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {isSavingGoal6 ? '...' : 'Guardar'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsEditingGoal6(false);
                                                            setTempGoal6(goals.goal_6_months || '');
                                                        }}
                                                        className="px-3 py-1 bg-white text-blue-600 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div onClick={() => { setTempGoal6(goals.goal_6_months || ''); setIsEditingGoal6(true); }} className="cursor-pointer group/goal">
                                                {goals.goal_6_months ? (
                                                    <p className="text-blue-900 font-medium text-sm group-hover/goal:text-blue-600 transition-colors">{goals.goal_6_months}</p>
                                                ) : (
                                                    <p className="text-blue-400 italic text-sm">Toca para definir tu objetivo</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex gap-3">
                                    <div className="mt-0.5"><Target className="w-4 h-4 text-purple-600" /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-purple-800 text-xs font-bold uppercase">1 Año</p>
                                            <div className="flex items-center gap-2">
                                                {goals.goal_1_year_status && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${goals.goal_1_year_status === 'achieved' ? 'bg-purple-200 text-purple-700' :
                                                        goals.goal_1_year_status === 'failed' ? 'bg-red-100 text-red-600' :
                                                            'bg-white/50 text-purple-600'
                                                        }`}>
                                                        {goals.goal_1_year_status === 'achieved' ? 'Conseguido' : goals.goal_1_year_status === 'failed' ? 'No Conseguido' : 'Pendiente'}
                                                    </span>
                                                )}
                                                {!isEditingGoal1 && (
                                                    <button onClick={() => { setTempGoal1(goals.goal_1_year || ''); setIsEditingGoal1(true); }} className="flex items-center gap-1 px-2 py-0.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors">
                                                        <Pencil className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold">Editar</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isEditingGoal1 ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={tempGoal1}
                                                    onChange={(e) => setTempGoal1(e.target.value)}
                                                    className="w-full p-2 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleGoalSave('1y')}
                                                        disabled={isSavingGoal1}
                                                        className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                                    >
                                                        {isSavingGoal1 ? '...' : 'Guardar'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsEditingGoal1(false);
                                                            setTempGoal1(goals.goal_1_year || '');
                                                        }}
                                                        className="px-3 py-1 bg-white text-purple-600 border border-purple-200 text-xs font-bold rounded-lg hover:bg-purple-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div onClick={() => { setTempGoal1(goals.goal_1_year || ''); setIsEditingGoal1(true); }} className="cursor-pointer group/goal">
                                                {goals.goal_1_year ? (
                                                    <p className="text-purple-900 font-medium text-sm group-hover/goal:text-purple-600 transition-colors">{goals.goal_1_year}</p>
                                                ) : (
                                                    <p className="text-purple-400 italic text-sm">Toca para definir tu objetivo</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ASSIGNED GOALS (Interaction) */}
                                <div className="pt-6 mt-2 border-t border-slate-100">
                                    <CoachGoalsManager clientId={client.id} isCoach={false} />
                                </div>
                            </div>
                        </div>


                        {/* 5. SYMPTOM TRACKER & MEASUREMENTS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SymptomTrackerCard medical={client.medical} energyLevel={client.energy_level} recoveryCapacity={client.recovery_capacity} />
                            <BodyMeasurementsCard
                                clientId={client.id}
                                initialAbdominal={client.abdominal_perimeter}
                                initialArm={client.arm_perimeter}
                                initialThigh={client.thigh_perimeter}
                            />
                        </div>

                        {/* 6. NEW: WELLNESS & ACHIEVEMENTS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <WellnessCard clientId={client.id} />
                            <AchievementsCard clientId={client.id} />
                        </div>

                        {/* 7. STEPS TRACKING */}
                        <StepsCard clientId={client.id} isClientView={true} />

                    </div>

                    {/* --- RIGHT COLUMN --- */}
                    <div className="lg:col-span-4 space-y-6 lg:space-y-8">
                        {/* QUICK ACTIONS & RESOURCES (Same as before) */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 lg:sticky lg:top-24">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Acciones Rápidas
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                                <button
                                    onClick={() => activeView !== 'checkin' && setActiveView('checkin')}
                                    className="col-span-2 flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm">Check-in Semanal</p>
                                            <p className="text-xs text-white/70">¿Cómo te has sentido?</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => setIsWeightModalOpen(true)}
                                    className="col-span-2 flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-xl"><Scale className="w-4 h-4" /></div>
                                        <p className="font-medium text-sm">Registrar Peso</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-1 md:p-0 rounded-3xl">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 px-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-slate-600" /> Tus Recursos
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div onClick={() => setActiveView('classes')} className="group cursor-pointer bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]">
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Video className="w-6 h-6" /></div>
                                    <div className="flex-1"><h4 className="font-bold text-slate-900 text-sm">Escuela Cuid-Arte</h4><p className="text-xs text-slate-500">Clases semanales</p></div><ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                                <div onClick={() => setActiveView('reviews')} className="group cursor-pointer bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 relative">
                                        <Play className="w-6 h-6" />
                                        {unreadReviewsCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                                                {unreadReviewsCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 text-sm">Mis Revisiones</h4>
                                        <p className="text-xs text-slate-500">{unreadReviewsCount > 0 ? `${unreadReviewsCount} nueva${unreadReviewsCount > 1 ? 's' : ''} disponible${unreadReviewsCount > 1 ? 's' : ''}` : 'Feedback semanal'}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                                <div onClick={() => setActiveView('nutrition')} className="group cursor-pointer bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Utensils className="w-6 h-6" /></div>
                                    <div className="flex-1"><h4 className="font-bold text-slate-900 text-sm">Plan Nutricional</h4><p className="text-xs text-slate-500">Tu menú</p></div><ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                                <div onClick={() => setActiveView('materials')} className="group cursor-pointer bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]">
                                    <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><FileHeart className="w-6 h-6" /></div>
                                    <div className="flex-1"><h4 className="font-bold text-slate-900 text-sm">Materiales</h4><p className="text-xs text-slate-500">Recursos extra</p></div><ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                                {client.program?.contract_visible_to_client && (
                                    <div onClick={() => setActiveView('contract')} className="group cursor-pointer bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><FileText className="w-6 h-6" /></div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 text-sm">Mi Contrato</h4>
                                            <p className="text-xs text-slate-500">{client.program?.contract_signed ? 'Firmado' : 'Pendiente de firma'}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300" />
                                    </div>
                                )}
                                {client.allow_endocrine_access && (
                                    <div onClick={() => setActiveView('medical')} className="group cursor-pointer bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 shadow-sm border border-emerald-100 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]">
                                        <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><Stethoscope className="w-6 h-6" /></div>
                                        <div className="flex-1"><h4 className="font-bold text-emerald-900 text-sm">Endocrinología</h4><p className="text-xs text-emerald-700">Premium Access</p></div><ChevronRight className="w-5 h-5 text-emerald-400" />
                                    </div>
                                )}
                                {client.hormonal_status && ['mujer', 'femenino', 'female'].includes(client.gender?.toLowerCase() || '') && (
                                    <div onClick={() => setActiveView('cycle')} className="group cursor-pointer bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4 shadow-sm border border-pink-100 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]">
                                        <div className="w-12 h-12 rounded-xl bg-white text-pink-600 flex items-center justify-center shrink-0 shadow-sm"><Heart className="w-6 h-6" /></div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-pink-900 text-sm">Mi Ciclo</h4>
                                            <p className="text-xs text-pink-700">
                                                {client.hormonal_status === 'pre_menopausica' ? 'Seguimiento menstrual' :
                                                 client.hormonal_status === 'perimenopausica' ? 'Seguimiento perimenopáusico' :
                                                 'Seguimiento menopáusico'}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-pink-400" />
                                    </div>
                                )}
                                <div onClick={() => setActiveView('reports')} className="group cursor-pointer bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 shadow-sm border border-purple-100 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98] relative">
                                    <div className="w-12 h-12 rounded-xl bg-white text-purple-600 flex items-center justify-center shrink-0 shadow-sm relative">
                                        <FileText className="w-6 h-6" />
                                        {unreadReportsCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                                                {unreadReportsCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-purple-900 text-sm">Mis Informes</h4>
                                        <p className="text-xs text-purple-700">{unreadReportsCount > 0 ? `${unreadReportsCount} nuevo${unreadReportsCount > 1 ? 's' : ''} disponible${unreadReportsCount > 1 ? 's' : ''}` : 'Informes médicos descargables'}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-purple-400" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- FOOTER: HISTORY AREA CHART (Recharts) --- */}
                {weightHistory.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Evolución en el Tiempo</h3>
                                <p className="text-slate-500 text-sm">Tu histórico de peso visualizado</p>
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={[...weightHistory].reverse().map(w => ({
                                        date: new Date(w.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                                        fullDate: w.date,
                                        weight: w.weight
                                    }))}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={['dataMin - 1', 'dataMax + 1']}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    {targetWeight && targetWeight !== startWeight && (
                                        <ReferenceLine
                                            y={targetWeight}
                                            stroke="#10b981"
                                            strokeDasharray="8 4"
                                            strokeWidth={2}
                                            label={{
                                                value: `Meta: ${targetWeight} kg`,
                                                position: 'right',
                                                fill: '#10b981',
                                                fontSize: 11,
                                                fontWeight: 600
                                            }}
                                        />
                                    )}
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                        cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorWeight)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#fff', stroke: '#4f46e5' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </main>

            {/* WEIGHT MODAL */}
            {isWeightModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 animate-in fade-in">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-sm shadow-2xl scale-100 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
                        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
                        <h3 className="text-2xl font-bold mb-2 text-slate-900 text-center">Registrar Peso</h3>
                        <p className="text-slate-500 text-center mb-6 text-sm">Introduce tu peso actual para actualizar tu progreso.</p>
                        <form onSubmit={handleWeightSubmit}>
                            <div className="relative mb-6">
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="00.0"
                                    className="w-full py-4 text-center text-4xl font-bold text-slate-900 border-b-2 border-slate-200 focus:border-purple-600 outline-none bg-transparent placeholder:text-slate-200 transition-colors"
                                    value={newWeight}
                                    onChange={e => setNewWeight(e.target.value)}
                                    autoFocus
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 font-bold">kg</span>
                            </div>
                            <div className="space-y-3">
                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50 transition-all active:scale-95">
                                    {isSubmitting ? 'Guardando...' : 'Guardar Peso'}
                                </button>
                                <button type="button" onClick={() => setIsWeightModalOpen(false)} className="w-full py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PAYMENT UPLOAD MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Subir Comprobante</h3>
                            <p className="text-slate-500 text-sm mt-2">Sube una captura de pantalla o foto del recibo de pago para que tu coach pueda validarlo.</p>
                        </div>

                        <form onSubmit={handlePaymentUpload}>
                            <div className="mb-6">
                                <label
                                    htmlFor="receipt-upload"
                                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${paymentFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                                >
                                    {paymentFile ? (
                                        <>
                                            <CheckCircle2 className="w-10 h-10 text-indigo-600 mb-2" />
                                            <p className="font-bold text-indigo-900 text-sm">{paymentFile.name}</p>
                                            <p className="text-indigo-500 text-xs mt-1">Click para cambiar</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-slate-300 mb-2" />
                                            <p className="font-bold text-slate-600 text-sm">Click para seleccionar</p>
                                            <p className="text-slate-400 text-xs mt-1">JPG, PNG, PDF</p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        id="receipt-upload"
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        capture="environment"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            if (file.size > 10 * 1024 * 1024) {
                                                toast.error('El archivo es demasiado grande. Máximo 10MB.');
                                                e.target.value = '';
                                                return;
                                            }
                                            setPaymentFile(file);
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={!paymentFile || isUploadingPayment}
                                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isUploadingPayment ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Subiendo...
                                        </>
                                    ) : (
                                        'Enviar Comprobante'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="w-full py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
