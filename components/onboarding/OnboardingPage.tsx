import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import {
    Heart, Lock, User, Stethoscope, Thermometer, Scale, Utensils, Dumbbell, Target,
    Loader2, AlertCircle, ArrowLeft, ArrowRight, Mail
} from 'lucide-react';
import InstallationGuide from '../InstallationGuide';
import { storageKey } from '../../config/business';

// Import all step components
import { WelcomeStep } from './steps/WelcomeStep';
import { CredentialsStep } from './steps/CredentialsStep';
import { PersonalDataStep } from './steps/PersonalDataStep';
import { MedicalDataStep } from './steps/MedicalDataStep';
import { SymptomsStep } from './steps/SymptomsStep';
import { MeasurementsStep } from './steps/MeasurementsStep';
import { NutritionStep } from './steps/NutritionStep';
import { ActivityStep } from './steps/ActivityStep';
import { GoalsStep } from './steps/GoalsStep';

export interface OnboardingData {
    // Credenciales
    email: string;
    password: string;
    confirmPassword: string;

    // BLOQUE 1: Personales
    firstName: string;
    surname: string;
    birthDate: string;
    age: number;
    gender: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    idNumber: string;

    // BLOQUE 2 & 3: Médicos y Hormonal
    oncologyStatus: string;
    treatments: string[];
    diagnosisDate: string;
    treatmentStartDate: string;
    healthConditions: string[];
    otherHealthConditions: string;
    dailyMedication: string;
    drugAllergies: string;
    exerciseLimitations: string;
    hormonalStatus: string;
    menopauseSymptoms: string[];
    labResultsNotes: string;

    // BLOQUE 4: Síntomas (0-10)
    symptom_fatigue: number;
    symptom_fatigue_interference: number;
    symptom_pain: number;
    symptom_nausea: number;
    symptom_vomiting: number;
    symptom_diarrhea: number;
    symptom_constipation: number;
    symptom_appetite_loss: number;
    symptom_taste_alteration: number;
    symptom_bloating: number;
    symptom_sleep_quality: number;
    sleep_hours: number;
    stress_level: number;
    recovery_capacity: number;

    // BLOQUE 5: Antropometría
    currentWeight: number;
    height: number;
    habitualWeight6Months: number;
    weightEvolutionStatus: string;
    bodyEvolutionGoal: string;
    armCircumference?: number;
    waistCircumference?: number;
    thighCircumference?: number;

    // BLOQUE 6 & 7: Nutrición y Psicología
    dietType: string;
    foodAllergies: string;
    regularFoods: string[];
    unwantedFoods: string;
    cooksSelf: string;
    mealsPerDay: number;
    mealSchedules: {
        breakfast: string;
        midMorning: string;
        lunch: string;
        snack: string;
        dinner: string;
    };
    weighFoodPreference: string;
    alcoholPerWeek: string;
    smokingStatus: string;
    last24hMeals: string;
    psychologySituations: string[];

    // BLOQUE 8: Actividad Física
    dailySteps: string;
    dailyRoutineDescription: string;
    exerciseAvailability: string;
    hasStrengthTraining: string;
    exerciseLocation: string;
    currentStrengthScale: number;
    functionalTests: string[];

    // BLOQUE 9: Objetivos
    mainPriority: string;
    desiredFeeling: string;
    shortTermMilestone: string;
    whyTrustUs: string;
    additionalConcerns: string;

    // Legal
    contractAccepted: boolean;
    healthConsent: boolean;
    signatureImage: string;
    labResultsFile: string;
}

export function OnboardingPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saleData, setSaleData] = useState<any>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [contractTemplate, setContractTemplate] = useState<any>(null);
    const [verificationEmail, setVerificationEmail] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const [formData, setFormData] = useState<OnboardingData>({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        surname: '',
        birthDate: '',
        age: 0,
        gender: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        idNumber: '',
        oncologyStatus: '',
        treatments: [],
        diagnosisDate: '',
        treatmentStartDate: '',
        healthConditions: [],
        otherHealthConditions: '',
        dailyMedication: '',
        drugAllergies: '',
        exerciseLimitations: '',
        hormonalStatus: '',
        menopauseSymptoms: [],
        labResultsNotes: '',
        symptom_fatigue: 0,
        symptom_fatigue_interference: 0,
        symptom_pain: 0,
        symptom_nausea: 0,
        symptom_vomiting: 0,
        symptom_diarrhea: 0,
        symptom_constipation: 0,
        symptom_appetite_loss: 0,
        symptom_taste_alteration: 0,
        symptom_bloating: 0,
        symptom_sleep_quality: 0,
        sleep_hours: 0,
        stress_level: 0,
        recovery_capacity: 0,
        currentWeight: 0,
        height: 0,
        habitualWeight6Months: 0,
        weightEvolutionStatus: '',
        bodyEvolutionGoal: '',
        dietType: '',
        foodAllergies: '',
        regularFoods: [],
        unwantedFoods: '',
        cooksSelf: '',
        mealsPerDay: 3,
        mealSchedules: {
            breakfast: '',
            midMorning: '',
            lunch: '',
            snack: '',
            dinner: ''
        },
        weighFoodPreference: '',
        alcoholPerWeek: '',
        smokingStatus: 'no',
        last24hMeals: '',
        psychologySituations: [],
        dailySteps: '',
        dailyRoutineDescription: '',
        exerciseAvailability: '',
        hasStrengthTraining: '',
        exerciseLocation: '',
        currentStrengthScale: 0,
        functionalTests: [],
        mainPriority: '',
        desiredFeeling: '',
        shortTermMilestone: '',
        whyTrustUs: '',
        additionalConcerns: '',
        contractAccepted: false,
        healthConsent: false,
        signatureImage: '',
        labResultsFile: ''
    });

    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .select('*, assigned_coach_id')
                .eq('onboarding_token', token)
                .eq('status', 'pending_onboarding')
                .single();

            if (saleError || !sale) {
                setError('Este enlace ya fue usado o no es válido');
                setLoading(false);
                return;
            }

            setSaleData(sale);
            setFormData(prev => ({
                ...prev,
                email: sale.client_email || '',
                phone: sale.client_phone || '',
                firstName: sale.client_first_name || '',
                surname: sale.client_last_name || '',
                idNumber: sale.client_dni || '',
                address: sale.client_address || ''
            }));

            if (sale.contract_template_id) {
                const { data: template } = await supabase
                    .from('contract_templates')
                    .select('*')
                    .eq('id', sale.contract_template_id)
                    .single();
                if (template) setContractTemplate(template);
            }

            setLoading(false);
        } catch (err) {
            setError('Error al validar el acceso');
            setLoading(false);
        }
    };

    const handleEmailVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationEmail) {
            // Si el usuario no pone email y pulsa continuar, permitimos formulario en blanco
            setLoading(false);
            return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            // Intentamos buscar una venta que coincida con este email
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .select('*, assigned_coach_id')
                .eq('client_email', verificationEmail.trim().toLowerCase())
                .eq('status', 'pending_onboarding')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (sale) {
                // EXITO: Hemos encontrado una venta previa del Closer. Cargamos los datos.
                setSaleData(sale);
                setFormData(prev => ({
                    ...prev,
                    email: sale.client_email || verificationEmail,
                    phone: sale.client_phone || '',
                    firstName: sale.client_first_name || '',
                    surname: sale.client_last_name || '',
                    idNumber: sale.client_dni || '',
                    address: sale.client_address || ''
                }));

                if (sale.contract_template_id) {
                    const { data: template } = await supabase
                        .from('contract_templates')
                        .select('*')
                        .eq('id', sale.contract_template_id)
                        .single();
                    if (template) setContractTemplate(template);
                }
            } else {
                // NO HAY VENTA PREVIA: Es un alta 100% nueva.
                // Simplemente inicializamos el email y dejamos que siga.
                setFormData(prev => ({ ...prev, email: verificationEmail.trim().toLowerCase() }));
                // Creamos un saleData ficticio o marcamos que es nuevo
                setSaleData({ id: 'new', is_new_signup: true });
            }
        } catch (err) {
            console.error('Error in verification:', err);
            // Si hay error, permitimos continuar como alta nueva por si acaso
            setSaleData({ id: 'new', is_new_signup: true });
        } finally {
            setIsVerifying(false);
        }
    };

    const updateField = (field: keyof OnboardingData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleArrayField = (field: keyof OnboardingData, value: string) => {
        setFormData(prev => {
            const currentArray = prev[field] as string[];
            const isIncluded = currentArray.includes(value);
            const newArray = isIncluded
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [field]: newArray };
        });
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        if (formData.password !== formData.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        if (!formData.contractAccepted || !formData.healthConsent || !formData.signatureImage) {
            alert('Por favor, acepta los términos y firma el contrato para finalizar.');
            return;
        }

        setSubmitting(true);

        try {
            // Mapping fields to Supabase column names
            const clientData = {
                first_name: formData.firstName,
                surname: formData.surname,
                email: formData.email,
                phone: formData.phone,
                birth_date: formData.birthDate,
                age: formData.age,
                gender: formData.gender,
                address: formData.address,
                city: formData.city,
                province: formData.province,
                id_number: formData.idNumber,

                oncology_status: formData.oncologyStatus,
                current_treatments: formData.treatments,
                oncology_diagnosis_date: formData.diagnosisDate ? `${formData.diagnosisDate}-01` : null,
                treatment_start_date: formData.treatmentStartDate ? `${formData.treatmentStartDate}-01` : null,
                health_conditions_prev: formData.healthConditions,
                pathologies: formData.otherHealthConditions,
                medication: formData.dailyMedication,
                drug_allergies: formData.drugAllergies,
                exercise_medical_limitations_details: formData.exerciseLimitations,
                menopause_status: formData.hormonalStatus,
                menopause_symptoms: formData.menopauseSymptoms,
                lab_otros_notes: formData.labResultsNotes,

                symptom_fatigue: formData.symptom_fatigue,
                fatigue_interference: formData.symptom_fatigue_interference,
                symptom_pain: formData.symptom_pain,
                symptom_nausea: formData.symptom_nausea,
                symptom_vomiting: formData.symptom_vomiting,
                symptom_diarrhea: formData.symptom_diarrhea,
                symptom_constipation: formData.symptom_constipation,
                symptom_appetite_loss: formData.symptom_appetite_loss,
                symptom_taste_alteration: formData.symptom_taste_alteration,
                symptom_bloating: formData.symptom_bloating,
                symptom_sleep_quality: formData.symptom_sleep_quality,
                sleep_hours: formData.sleep_hours,
                stress_level: formData.stress_level,
                recovery_capacity: formData.recovery_capacity,

                current_weight: formData.currentWeight,
                initial_weight: formData.currentWeight,
                height: formData.height,
                habitual_weight_6_months: formData.habitualWeight6Months,
                weight_evolution_status: formData.weightEvolutionStatus,
                body_evolution_goal_notes: formData.bodyEvolutionGoal,
                arm_perimeter: formData.armCircumference,
                abdominal_perimeter: formData.waistCircumference,
                thigh_perimeter: formData.thighCircumference,

                assigned_nutrition_type: formData.dietType,
                allergies: formData.foodAllergies,
                regular_foods: formData.regularFoods,
                unwanted_foods: formData.unwantedFoods,
                cooks_for_self: formData.cooksSelf === 'Sí',
                meals_per_day: formData.mealsPerDay,
                meal_schedules: formData.mealSchedules,
                weigh_food_preference: formData.weighFoodPreference,
                alcohol_weekly: formData.alcoholPerWeek,
                smoking_status: formData.smokingStatus,
                last_recall_meal: formData.last24hMeals,
                food_fear_tumor: formData.psychologySituations.some(s => s.includes('miedo')),
                ed_binge_eating: formData.psychologySituations.some(s => s.includes('atracón')),
                ed_emotional_eating: formData.psychologySituations.some(s => s.includes('estresado')),

                activity_level: formData.dailySteps,
                daily_routine_description: formData.dailyRoutineDescription,
                exercise_availability_slots: formData.exerciseAvailability,
                strength_training: formData.hasStrengthTraining === 'Sí',
                training_location: formData.exerciseLocation,
                current_strength_score: formData.currentStrengthScale,
                func_test_lift_bags: formData.functionalTests.some(s => s.includes('levantar')),
                func_test_get_up_chair: formData.functionalTests.some(s => s.includes('silla')),
                func_test_stairs: formData.functionalTests.some(s => s.includes('escaleras')),
                func_test_falls: formData.functionalTests.some(s => s.includes('caídas')),

                main_priority_notes: formData.mainPriority,
                desired_feeling_notes: formData.desiredFeeling,
                short_term_milestone_notes: formData.shortTermMilestone,
                why_trust_us: formData.whyTrustUs,
                concerns_fears_notes: formData.additionalConcerns,
                lab_results_url: formData.labResultsFile,

                // Datos del Contrato y Firma
                contract_signed: formData.contractAccepted,
                contract_signed_at: new Date().toISOString(),
                contract_signature_image: formData.signatureImage,
                assigned_contract_template_id: saleData?.contract_template_id,

                coach_id: saleData?.assigned_coach_id,
                status: 'active',
                onboarding_completed: true,
                onboarding_completed_at: new Date().toISOString(),
                onboarding_phase2_completed: true,
                onboarding_phase2_completed_at: new Date().toISOString(),
                subscription_start: new Date().toISOString().split('T')[0]
            };

            // 1. Check if client exists
            const { data: existingClient } = await supabase
                .from('clientes')
                .select('id')
                .eq('email', formData.email)
                .maybeSingle();

            let targetId = existingClient?.id;
            if (targetId) {
                const { error: updateError } = await supabase.from('clientes').update(clientData).eq('id', targetId);
                if (updateError) throw updateError;
            } else {
                const { data: newC, error: insertError } = await supabase.from('clientes').insert([clientData]).select('id').single();
                if (insertError) throw insertError;
                targetId = newC?.id;
            }

            // 2. Auth Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: `${formData.firstName} ${formData.surname}`,
                        role: 'client',
                        client_id: targetId
                    }
                }
            });

            let retryLogin: any = null;
            let loginData: any = null;

            if (authError) {
                // Si el error es por límite de tasa (demasiados intentos), intentamos login directo
                // por si el usuario ya se creó en un intento previo pero falló el envío del email
                if (authError.message.includes('rate limit')) {
                    const { data, error: retryError } = await supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password
                    });
                    retryLogin = data;

                    if (retryError) {
                        throw new Error('Límite de envíos de email de Supabase alcanzado. Por favor, ve a tu panel de Supabase -> Auth -> Providers -> Email y DESACTIVA "Confirm email" para continuar testeando libremente.');
                    }
                    // Si el login funcionó, continuamos el flujo normalmente
                } else if (authError.message.includes('already registered')) {
                    const { data, error: signInError } = await supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password
                    });
                    loginData = data;
                    if (signInError) throw new Error('Este email ya está registrado. Si olvidaste tu contraseña, recupérala en la pantalla de inicio.');
                } else {
                    throw authError;
                }
            }

            const effectiveUser = authData?.user || (retryLogin?.user) || (loginData?.user);
            const authUserId = effectiveUser?.id;

            if (authUserId) {
                // Sincronizar user_id en la tabla de clientes
                await supabase.from('clientes').update({ user_id: authUserId }).eq('id', targetId);
            }

            // 3. Update Sale
            const { error: saleUpdateError } = await supabase.from('sales').update({
                status: 'onboarding_completed',
                client_id: targetId,
                onboarding_completed_at: new Date().toISOString()
            }).eq('id', saleData.id);
            if (saleUpdateError) throw saleUpdateError;

            // 4. Final log of the session to ensure persistence
            const clientSession = {
                id: authUserId || targetId,
                email: formData.email,
                name: `${formData.firstName} ${formData.surname}`.trim(),
                role: 'client',
                clientId: targetId
            };
            localStorage.setItem(storageKey('session'), JSON.stringify({
                user: clientSession,
                timestamp: Date.now()
            }));

            alert('¡Registro completado! Bienvenido/a.');
            window.location.href = '/'; // Full reload to pick up new session
        } catch (err: any) {
            console.error('Submit error:', err);
            alert('Error al guardar: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const steps = [
        { title: 'Bienvenida', icon: Heart, component: <WelcomeStep /> },
        { title: 'Cuenta', icon: Lock, component: <CredentialsStep formData={formData} updateField={updateField} /> },
        { title: 'Personales', icon: User, component: <PersonalDataStep formData={formData} updateField={updateField} /> },
        { title: 'Clínico', icon: Stethoscope, component: <MedicalDataStep formData={formData} updateField={updateField} toggleArrayField={toggleArrayField} /> },
        { title: 'Bienestar', icon: Thermometer, component: <SymptomsStep formData={formData} updateField={updateField} /> },
        { title: 'Cuerpo', icon: Scale, component: <MeasurementsStep formData={formData} updateField={updateField} /> },
        { title: 'Nutrición', icon: Utensils, component: <NutritionStep formData={formData} updateField={updateField} toggleArrayField={toggleArrayField} /> },
        { title: 'Actividad', icon: Dumbbell, component: <ActivityStep formData={formData} updateField={updateField} toggleArrayField={toggleArrayField} /> },
        { title: 'Finalizar', icon: Target, component: <GoalsStep formData={formData} updateField={updateField} contractTemplate={contractTemplate} /> }
    ];

    if (loading) return <div className="min-h-screen bg-emerald-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>;

    if (!saleData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-emerald-600 p-8 text-center text-white">
                        <div className="mb-6 inline-block p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Heart className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Comienza tu Valoración</h1>
                        <p className="text-emerald-100 text-sm">Usa el email con el que te inscribiste en la Escuela o introduce uno nuevo para empezar.</p>
                    </div>

                    <form onSubmit={handleEmailVerification} className="p-8 space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 border border-red-100">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Tu Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={verificationEmail}
                                    onChange={(e) => setVerificationEmail(e.target.value)}
                                    placeholder="ejemplo@email.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl transition-all outline-none text-slate-900 font-medium"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-extrabold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Buscando tu perfil...</span>
                                </>
                            ) : (
                                <>
                                    <span>Entrar al Formulario</span>
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const CurrentStepIcon = steps[currentStep].icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-emerald-600">Paso {currentStep + 1} de {steps.length}</span>
                        <span className="text-xs text-slate-400">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                    <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg">
                                <img src="https://i.postimg.cc/Kj6R2R75/LOGODRA.png" alt="Cuidarte Logo" className="h-8 w-auto" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">{steps[currentStep].title}</h1>
                                <p className="text-emerald-100 text-[10px] uppercase tracking-wider font-medium">Escuela Cuid-Arte · Integral</p>
                            </div>
                        </div>
                        <div className="hidden sm:block p-3 bg-white/20 rounded-xl">
                            <CurrentStepIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="p-8 flex-grow">{steps[currentStep].component}</div>
                    <div className="p-6 bg-slate-50 border-t flex justify-between">
                        <button onClick={prevStep} disabled={currentStep === 0} className="px-6 py-2 font-bold text-slate-400 disabled:opacity-30">Anterior</button>
                        {currentStep === steps.length - 1 ? (
                            <button onClick={handleSubmit} disabled={submitting} className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2">
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar y Entrar'}
                            </button>
                        ) : (
                            <button onClick={nextStep} className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">Siguiente</button>
                        )}
                    </div>
                </div>
            </div>
            <InstallationGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        </div>
    );
}
