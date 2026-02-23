export enum UserRole {
  ADMIN = 'admin',
  COACH = 'coach',
  HEAD_COACH = 'head_coach',
  CLIENT = 'client',
  CLOSER = 'closer',
  CONTABILIDAD = 'contabilidad',
  PSICOLOGO = 'psicologo',
  RRSS = 'rrss',
  SETTER = 'setter',
  DIRECCION = 'direccion',
  DIETITIAN = 'dietitian',
  DOCTOR = 'doctor',
  ENDOCRINO = 'doctor',
  SUPER_ADMIN = 'super_admin'
}

export interface ClassSession {
  id: string;
  title: string;
  description: string;
  speaker: string;
  date: string;
  url?: string;
  category: 'Entrenamiento' | 'Nutrición' | 'Mindset' | 'General';
  is_recorded: boolean;
}

export interface WeeklyCheckin {
  id: string;
  client_id: string;
  created_at: string;
  responses: Record<string, string>;
  rating?: number;
  status: 'pending_review' | 'reviewed';
  coach_notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  avatar_url?: string;
  photo_url?: string;
  bio?: string;
  phone?: string;
  specialty?: string;
  instagram?: string;
  linkedin?: string;
  calendar_url?: string;
  birth_date?: string;
  address?: string;
  bank_account?: string;

  bank_account_holder?: string;
  bank_account_iban?: string;
  bank_name?: string;
  bank_swift_bic?: string;
  tax_id?: string;
  billing_address?: string;

  commission_percentage?: number;
  price_per_client?: number;
  max_clients?: number;
  items_sold?: number;
  permissions?: string[];
  password?: string;

  tier?: 1 | 2 | 3;
  is_exclusive?: boolean;
  tier_updated_at?: string;
  performance_notes?: string;
  internal_nps?: number;
  task_compliance_rate?: number;
  isMockSession?: boolean;
  collegiate_number?: string;
}

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
  DROPOUT = 'dropout',
  COMPLETED = 'completed'
}

// --- DATOS MÉDICOS (Oncología / Salud) ---
export interface MedicalData {
  diagnosis?: string;          // Diagnóstico principal (ej: "Cáncer de mama - estadio IIA")
  diagnosisDate?: string;      // Fecha del diagnóstico
  currentTreatment?: string;   // Tratamiento actual
  pathologies?: string;        // Otras patologías / enfermedades actuales
  medication?: string;         // Medicación diaria
  medicalNotes?: string;       // Notas médicas generales
  medicalReviews?: string;
  otherConditions?: string;
  diabetesType?: string;

  // --- Oncología ---
  oncology_status?: string;              // Estado oncológico (ej: "En remisión - hormonoterapia activa")
  treatment_chemotherapy?: boolean;
  treatment_radiotherapy?: boolean;
  treatment_hormonotherapy?: boolean;
  treatment_immunotherapy?: boolean;
  treatment_none?: boolean;
  treatment_start_date?: string;
  medication_affects_weight?: boolean;
  medication_affects_weight_details?: string;
  exercise_medical_limitations?: boolean;
  exercise_medical_limitations_details?: string;

  // --- Síntomas (escala 0-10) ---
  symptom_fatigue?: number;
  symptom_pain?: number;
  symptom_nausea?: number;
  symptom_vomiting?: number;
  symptom_diarrhea?: number;
  symptom_constipation?: number;
  symptom_appetite_loss?: number;
  symptom_bloating?: number;
  symptom_sleep_quality?: number;
  symptom_taste_alteration?: number;
  symptom_intestinal_transit?: number;
  symptom_brain_fog?: number;
  symptom_stress?: number;

  // --- Analíticas ---
  lab_hemoglobina?: number;
  lab_hierro?: number;
  lab_glucosa?: number;
  lab_vitamina_d?: number;
  lab_otros_notas?: string;

  // Extensiones de Oncología
  tumor_type?: string;
  lymphedema?: string;
  bone_risk?: string;
  peripheral_neuropathy?: string;
  venous_access?: string;
  symptom_chemo_brain?: number;
  symptom_dyspnea?: number;
  significant_weight_loss?: boolean;

  // Diabetes
  insulin_usage?: boolean;
  insulin_dose?: string;
}

export interface NutritionData {
  planUrl?: string;
  assigned_nutrition_type?: string;
  assigned_calories?: number;
  allergies?: string;
  otherAllergies?: string;
  dislikes?: string;
  preferences?: string;
  consumedFoods?: string;
  cooksForSelf?: boolean;
  eatsWithBread?: boolean;
  breadAmount?: string;
  waterIntake?: string;
  alcohol?: string;
  cravings?: string;
  cravingsDetail?: string;
  snacking?: boolean;
  snackingDetail?: string;
  eatingDisorder?: string;
  eatingDisorderDetail?: string;
  schedules?: {
    breakfast?: string;
    morningSnack?: string;
    lunch?: string;
    afternoonSnack?: string;
    dinner?: string;
  };
  mealsPerDay?: number;
  mealsOutPerWeek?: number;
  willingToWeighFood?: boolean;
  dietaryNotes?: string;
  lastRecallMeal?: string;
  unwantedFoods?: string;
  weighFoodPreference?: 'exacto' | 'visual';
  smokingStatus?: 'si' | 'no' | 'dejado_poco';
  ed_binge_eating?: boolean;
  ed_emotional_eating?: boolean;
}

export interface TrainingData {
  activityLevel?: string;
  stepsGoal?: number;
  strengthTraining?: boolean;
  trainingLocation?: string;
  injuries?: string;
  notes?: string;
  availability?: string;
  sensations_report?: string;
}

export interface AssessmentTest {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  category: string;
  order_index: number;
}

export interface GoalsData {
  motivation?: string;
  goal_3_months?: string;
  goal_3_months_status?: 'pending' | 'achieved' | 'failed';
  goal_6_months?: string;
  goal_6_months_status?: 'pending' | 'achieved' | 'failed';
  goal_1_year?: string;
  goal_1_year_status?: 'pending' | 'achieved' | 'failed';
  weeklyGoal?: string;
  next4WeeksGoal?: string;
  possiblePhaseGoals?: string;
  successStory?: string;
  testimonial?: string;
  testimonialRecorded?: boolean;
  pathToSuccess?: string;
}

// --- DATOS DE SUSCRIPCIÓN (Reemplaza el modelo de fases F1-F5) ---
export interface SubscriptionData {
  subscriptionType?: string;  // monthly, quarterly, biannual, annual, custom
  startDate?: string;
  endDate?: string;
  amount?: number;
  autoRenewal?: boolean;
  durationMonths?: number;

  // Contrato
  contract_signed?: boolean;
  contract_signed_at?: string;
  contract_signature_image?: string;
  contract_link?: string;
  contract_visible_to_client?: boolean;
  assigned_contract_template_id?: string;
  contract_content_override?: string;
  contract_date?: string;
  contract_amount?: number;

  // Historial de renovaciones (genérico, sin fases fijas)
  renewalHistory?: Array<{
    date: string;
    duration: number;
    amount: number;
    paymentMethod?: string;
    receiptUrl?: string;
  }>;

  [key: string]: any;
}

export interface Client {
  id: string;

  // Personal & Info
  firstName: string;
  surname: string;
  name: string;
  email: string;
  idNumber?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  zip?: string;
  instagram?: string;
  telegramId?: string;
  telegram_group_id?: string;

  // Demographics
  age?: number;
  birthDate?: string;
  gender?: string;
  hormonal_status?: 'pre_menopausica' | 'perimenopausica' | 'menopausica';
  average_cycle_length?: number;
  hrt_treatment?: string;
  last_period_start_date?: string;

  // Physical Stats
  height?: number;
  current_weight?: number;
  initial_weight?: number;
  target_weight?: number;
  lost_weight?: number;
  kg_to_goal?: number;
  abdominal_perimeter?: number;
  arm_perimeter?: number;
  thigh_perimeter?: number;
  last_weight_date?: string;

  // Contract & Status
  status: ClientStatus;
  client_state?: string;

  registration_date?: string;
  start_date: string;
  contract_end_date: string;

  next_renewal_date?: string;
  next_renewal_accepted?: boolean;
  program_duration_months?: number;
  next_program_duration_months?: number;
  start_next_contract_date?: string;

  coach_id: string;
  coach_name?: string; // Nombre del coach (cargado dinámicamente)
  ltv?: number;
  payments_status?: string;
  high_ticket?: boolean;
  renewal_phase?: string;

  // CRM Tracking
  last_contact_date?: string;
  recontact_result?: string;
  recontact_notes?: string;

  // Pausa
  pauseDate?: string;
  pauseReason?: string;
  weeks_paused?: number;

  // Payment & Renewals
  renewal_payment_link?: string;
  renewal_payment_status?: 'none' | 'pending' | 'uploaded' | 'verified';
  renewal_receipt_url?: string;
  renewal_amount?: number;
  renewal_duration?: number;
  renewal_verified_at?: string;
  renewal_payment_method?: string;

  // Fechas de salida
  abandonmentDate?: string;
  abandonmentReason?: string;
  inactiveDate?: string;
  inactiveReason?: string;

  call_warning?: string;
  next_call_date?: string;

  // Revisión semanal
  weeklyReviewUrl?: string;
  weeklyReviewDate?: string;
  weeklyReviewComments?: string;

  last_checkin_submitted?: string;
  last_checkin_status?: 'pending_review' | 'reviewed';
  last_checkin_id?: string;
  last_checkin_reviewed_at?: string;
  missed_checkins_count?: number;
  last_checkin_missed_reason?: string;

  // Sub-objects
  medical: MedicalData;
  nutrition: NutritionData;
  training: TrainingData;
  goals: GoalsData;
  program: SubscriptionData;

  // Nutrition Approval
  nutrition_approved?: boolean;
  nutrition_approved_at?: string;
  nutrition_approved_by?: string;

  general_notes?: string;
  history?: string;
  history_food_behavior?: string;

  // Funcionalidad y energía
  energy_level?: number;
  recovery_capacity?: number;
  fatigue_interference?: number;
  current_strength_score?: number;
  functional_limitation_carry_bag?: boolean;
  functional_limitation_stand_up?: boolean;
  functional_limitation_stairs?: boolean;
  functional_limitation_falls?: boolean;

  // Escuela Cuidarte specific fields
  daily_routine_description?: string;
  exercise_availability_slots?: string;
  main_priority_notes?: string;
  desired_feeling_notes?: string;
  short_term_milestone_notes?: string;
  why_trust_us?: string;
  concerns_fears_notes?: string;

  weight_evolution_status?: string;
  habitual_weight_6_months?: number;

  // Relación con la comida (scores)
  food_fear_score?: number;
  food_guilt_score?: number;
  food_peace_score?: number;
  body_trust_score?: number;

  // Onboarding
  onboarding_token?: string;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  onboarding_phase2_completed?: boolean;
  onboarding_phase2_completed_at?: string;

  // Account Activation
  user_id?: string;
  activation_token?: string;
  activation_token_created_at?: string;

  // Coach Communication Fields
  next_appointment_date?: string;
  next_appointment_time?: string;
  next_appointment_note?: string;
  next_appointment_link?: string;
  next_appointment_status?: string;
  next_appointment_conclusions?: string;
  coach_message?: string;

  created_at: string;
  allow_medical_access?: boolean;
  allow_endocrine_access?: boolean;
  updated_at: string;
  show_health_tracker?: boolean;

  ageVisual?: string;
  internal_notes?: string;
  isMockSession?: boolean;
}

export interface MedicalReview {
  id: string;
  client_id: string;
  coach_id?: string;
  submission_date: string;
  diagnosis?: string;
  treatment?: string;
  medication: string;
  comments: string;
  report_type: string;
  file_urls: string[];

  status: 'pending' | 'reviewed';
  doctor_notes?: string;
  doctor_video_url?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  client_name?: string;

  // Clinical/Compatibility fields
  diabetes_type?: string;
  oncology_status?: string;
  active_treatments?: string;
  treatment_details?: string;
  insulin_usage?: boolean;
  insulin_dose?: string;
}

export interface Alert {
  type: 'expiration';
  clientId: string;
  clientName: string;
  daysRemaining: number;
  contractEndDate: string;
}

// --- ENTIDADES CRM ---

export interface CoachTask {
  id: string;
  coach_id: string;
  client_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  client_name?: string;
}

export interface SupportTicket {
  id: string;
  client_id?: string;
  staff_id?: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: 'nutricion' | 'entrenamiento' | 'tecnico_app' | 'facturacion' | 'medico' | 'otros';
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  staff_name?: string;
  creator_name?: string;
}

export interface SupportTicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
  user_photo?: string;
}

export interface CoachInvoice {
  id: string;
  coach_id: string;
  period_date: string;
  amount: number;
  invoice_url: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  admin_notes?: string;
  coach_notes?: string;
  submitted_at: string;
  updated_at: string;
  coach_name?: string;
}

export interface UnifiedNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'assignment' | 'checkin' | 'task' | 'system' | 'ticket';
  link?: string;
  read_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  target_table: string;
  target_id: string;
  changes?: Record<string, { old: any; new: any }>;
  created_at: string;
  user_name?: string;
}

// --- MODULE: LEADS (PRE-VENTA) ---

export type LeadStatus = 'new' | 'contacted' | 'appointment_set' | 'show' | 'no_show' | 'sold' | 'lost' | 'unqualified';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  notes?: string;
  closer_id?: string;
  created_at: string;
  updated_at?: string;

  // Datos del formulario
  age?: string;
  sex?: string;
  situation?: string;
  interest?: string;
  consent?: boolean;
  country?: string;

  // Datos medicos/contexto
  situacion?: string;
  tipo_cancer?: string;
  estadio?: string;
  perdida_peso?: string;
  actividad_fisica?: string;
  nivel_compromiso?: number;
  disponibilidad?: string;
  preocupacion_principal?: string;

  // Origen y tracking
  origen?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  downloaded_kit?: boolean;

  // Scoring
  score?: number;

  // Closer / ventas
  appointment_at?: string;
  last_contacted_at?: string;
  call_outcome?: string;
  sale_amount?: number;
}

// --- MODULE: CHAT ---

export interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  photo_url?: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  created_by?: string;
  metadata?: Record<string, any>;

  participants?: ChatParticipant[];
  unread_count?: number;
}

export interface ChatParticipant {
  room_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;

  user_name?: string;
  user_photo?: string;
  user_role?: UserRole;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'file';
  file_url?: string;
  created_at: string;

  sender_name?: string;
  sender_photo?: string;
}

export interface CoachGoal {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  start_date?: string;
  deadline?: string;
  completed_at?: string;
  goal_type: 'weekly' | 'monthly' | 'custom';
  status: 'pending' | 'achieved' | 'failed';
  feedback?: string;
  failure_reason?: string;
  action_plan?: string;
  created_by?: string;
  created_at: string;
}

// --- MODULE: RISK ALERTS (SISTEMA ANTIABANDONO) ---

export type RiskAlertStatus = 'active' | 'resolved' | 'escalated';
export type RiskReasonCategory = 'no_response' | 'no_checkins' | 'not_following_plan' | 'demotivated' | 'personal_issues' | 'other';

export interface ClientRiskAlert {
  id: string;
  client_id: string;
  coach_id: string;
  reason_category: RiskReasonCategory;
  notes?: string;
  status: RiskAlertStatus;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  coach_name?: string;
  resolved_by_name?: string;
}

// --- MODULE: NUTRITION PLANS ---

export type NutritionPlanStatus = 'draft' | 'published';
export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type DietType =
  | 'Flexible'
  | 'Sin Gluten'
  | 'Vegetariano'
  | 'Pescetariano'
  | 'Vegano'
  | 'Sin Carne Roja'
  | 'Ovolactovegetariano';

export type IngredientSection =
  | 'Pescadería'
  | 'Carnicería'
  | 'Frutería'
  | 'Lácteos'
  | 'Despensa'
  | 'Panadería'
  | 'Congelados'
  | 'Otros';

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  section?: IngredientSection;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface WeeklyPlanSlot {
  day: number;
  meal: MealSlot;
  recipeId: string | null;
}

export type WeeklyPlanGrid = WeeklyPlanSlot[];

export interface NutritionPlan {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  target_calories?: number;
  diet_type?: DietType;
  target_month?: number;
  target_fortnight?: 1 | 2;
  instructions?: string;
  intro_content?: string;
  breakfast_content?: string;
  lunch_content?: string;
  dinner_content?: string;
  snack_content?: string;
  status: NutritionPlanStatus;
  published_at?: string;
  published_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  recipes_count?: number;
  assigned_clients_count?: number;
}

export interface NutritionRecipe {
  id: string;
  plan_id: string;
  category: RecipeCategory;
  position: number;
  name: string;
  ingredients: RecipeIngredient[];
  preparation?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  image_url?: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientNutritionAssignment {
  id: string;
  client_id: string;
  plan_id: string;
  assigned_at: string;
  assigned_by?: string;
  plan_name?: string;
  client_name?: string;
}

export interface ClientNutritionOverride {
  id: string;
  client_id: string;
  recipe_id: string;
  custom_name?: string;
  custom_ingredients?: RecipeIngredient[];
  custom_preparation?: string;
  custom_calories?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NutritionPlanVersion {
  id: string;
  plan_id: string;
  version_number: number;
  snapshot: any;
  published_at: string;
}

export interface ClientMaterial {
  id: string;
  client_id: string;
  created_by: string;
  title: string;
  type: 'link' | 'document' | 'video';
  url: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

// --- MODULE: TRAINING ---

export type ExerciseMediaType = 'youtube' | 'vimeo' | 'image' | 'none';

export interface Exercise {
  id: string;
  name: string;
  media_type: ExerciseMediaType;
  media_url?: string;
  instructions?: string;
  muscle_main: string;
  muscle_secondary?: string[];
  equipment?: string[];
  movement_pattern?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  mechanics?: 'compound' | 'isolation';
  articulation?: 'single' | 'multi';
  tags?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  blocks: WorkoutBlock[];
}

export interface WorkoutBlock {
  id: string;
  workout_id: string;
  name: string; // e.g., "Calentamiento", "Parte Principal", "Finisher"
  description?: string;
  position: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  block_id: string;
  exercise_id: string;
  exercise?: Exercise; // Loaded via join
  superset_id?: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  position: number;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description?: string;
  weeks_count: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  days: ProgramDay[];
}

export interface ProgramDay {
  id: string;
  program_id: string;
  week_number: number;
  day_number: number; // 1-7
  activities: ProgramActivity[];
}

export interface ProgramActivity {
  id: string;
  day_id: string;
  type: 'workout' | 'metrics' | 'photo' | 'form' | 'custom' | 'walking';
  activity_id?: string; // Generic ID
  workout_id?: string;
  workout?: Workout;
  title?: string;
  description?: string;
  position: number;
  color?: string;
  config?: Record<string, any>;
}

export interface ClientTrainingAssignment {
  id: string;
  client_id: string;
  program_id: string;
  start_date: string;
  assigned_by?: string;
  assigned_at?: string;
}

export interface ClientDayLog {
  id: string;
  client_id: string;
  day_id: string;
  completed_at: string;
  effort_rating?: number;
  notes?: string;
  duration_minutes?: number;
  exercises?: ClientExerciseLog[];
  created_at?: string;
}

export interface ClientExerciseLog {
  id: string;
  log_id: string;
  workout_exercise_id: string;
  sets_completed?: number;
  reps_completed?: string;
  weight_used?: string;
  is_completed: boolean;
  created_at?: string;
}

export interface ClientActivityLog {
  id: string;
  client_id: string;
  activity_id: string;
  day_id: string;
  completed_at: string;
  data: Record<string, any>;
  created_at?: string;
}
