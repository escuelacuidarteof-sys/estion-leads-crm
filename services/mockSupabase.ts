import { Client, ClientStatus, User, UserRole, ClassSession, WeeklyCheckin, MedicalReview, CoachTask, SupportTicket, SupportTicketComment, UnifiedNotification, AuditLog, CoachInvoice } from '../types';
import { supabase } from './supabaseClient';
import { BUSINESS_CONFIG, storageKey } from '../config/business';

const TABLE_NAME = BUSINESS_CONFIG.tables.clients;

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Local Memory Fallback (for demos/dev without full DB)
let mockCheckins: WeeklyCheckin[] = [];

// --- MOCK DATA STORAGE ---
let clients: Client[] = []; // In-memory storage for clients

// --- HELPERS ---

// Robust value lookup across multiple possible keys (handles casing mismatches, legacy column names)
const getVal = (row: any, keys: string[], fallback?: any): any => {
  if (!row) return fallback;

  // 1. Direct lookup (fast path)
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }

  // 2. Case-insensitive fallback
  const rowKeys = Object.keys(row);
  for (const searchKey of keys) {
    const normalizedSearch = searchKey.toLowerCase().trim();
    const foundKey = rowKeys.find(rk => rk.toLowerCase().trim() === normalizedSearch);
    if (foundKey) {
      const val = row[foundKey];
      if (val !== undefined && val !== null && val !== '') return val;
    }
  }

  return fallback;
};

// Robust number parsing (handles "90 kg", "90,5", etc.)
const parseNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object') {
    if ('number' in val) return Number(val.number) || 0;
    return 0;
  }
  const str = String(val).replace(',', '.').replace(/[^\d.-]/g, '');
  return parseFloat(str) || 0;
};

// Robust text parsing (handles strings, arrays, JSON strings)
const parseText = (val: any): string => {
  if (val === null || val === undefined) return '';

  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (val.length === 0) return '';
      return val.map(item => parseText(item)).filter(s => s.length > 0).join(', ');
    }
    if (val.url) return String(val.url);
    return '';
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseText(parsed);
      } catch (e) {
        // Not valid JSON, treat as plain string
      }
    }
    return trimmed.replace(/^"|"$/g, '');
  }

  return String(val);
};

// Boolean conversion (handles "Si"/"No", "TRUE"/"FALSE", etc.)
const toBool = (val: any): boolean => {
  if (val === true || val === 'TRUE' || val === 'true') return true;
  if (val === 't' || val === 'T') return true;
  if (val === 1 || val === '1') return true;

  if (typeof val === 'string') {
    const v = val.toLowerCase().trim();
    if (v === 'si' || v === 'yes') return true;
    if (v === 'on' || v === 'checked') return true;
  }
  return false;
};

// Date string normalization (ISO, Spanish dates, DD/MM/YYYY, etc.)
const toDateStr = (val: any, fallbackToNow = false): string => {
  if (!val) {
    return fallbackToNow ? new Date().toISOString().split('T')[0] : '';
  }

  if (typeof val === 'object' && val !== null) {
    if (val.start) return val.start;
    if (val.date && val.date.start) return val.date.start;
    if (Array.isArray(val) && val.length > 0) return toDateStr(val[0], fallbackToNow);
  }

  let str = String(val).trim();

  // ISO format YYYY-MM-DD
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;

  // Spanish full date: "24 de enero de 2026"
  const monthsEs: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
    'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
    'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
  };

  const lowerStr = str.toLowerCase();
  const matchEs = lowerStr.match(/(\d{1,2})\s*(?:de)?\s*([a-z]+)\s*(?:de)?\s*(\d{4})/);

  if (matchEs) {
    const day = matchEs[1].padStart(2, '0');
    const monthText = matchEs[2];
    const year = matchEs[3];
    const monthNum = monthsEs[monthText];
    if (monthNum) {
      return `${year}-${monthNum}-${day}`;
    }
  }

  // Slash Format DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].length <= 2
        ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        : str;
      const date = new Date(d);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }
  }

  // Fallback JS Date parser
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return fallbackToNow ? new Date().toISOString().split('T')[0] : '';
};

const normalizePhone = (phone: string) => {
  return phone.replace(/[^\d]/g, '');
};

// --- STATUS MAPPER ---
const mapStatus = (rawStatus: any): ClientStatus => {
  const s = String(rawStatus || '').toLowerCase().trim();
  if (s.includes('pausa') || s === 'paused') return ClientStatus.PAUSED;
  if (s.includes('abandono') || s === 'dropout') return ClientStatus.DROPOUT;
  if (s.includes('baja') || s.includes('inactivo') || s.includes('cancelado') || s === 'inactive') return ClientStatus.INACTIVE;
  if (s.includes('activo') || s === 'active' || s.includes('alta') || s.includes('matriculado')) return ClientStatus.ACTIVE;
  if (s.includes('completado') || s.includes('graduado') || s === 'completed') return ClientStatus.COMPLETED;
  return ClientStatus.INACTIVE;
};

// --- MAPPER: DB ROW -> CLIENT ---
export const mapRowToClient = (row: any): Client => {
  const currentWeight = parseNumber(row.current_weight);
  const initialWeight = parseNumber(row.initial_weight);
  const targetWeight = parseNumber(row.target_weight);

  return {
    id: row.id,
    firstName: row.first_name || '',
    surname: row.surname || '',
    name: `${row.first_name || ''} ${row.surname || ''}`.trim() || 'Sin Nombre',
    email: row.email || '',
    idNumber: row.id_number,
    phone: row.phone,
    address: row.address,
    city: row.city,
    province: row.province,
    zip: row.zip,
    instagram: row.instagram,
    telegramId: row.telegram_id,
    telegram_group_id: row.telegram_group_id,

    age: row.age,
    birthDate: row.birth_date,
    gender: row.gender,
    hormonal_status: row.hormonal_status,
    average_cycle_length: row.average_cycle_length,
    hrt_treatment: row.hrt_treatment,
    last_period_start_date: row.last_period_start_date,

    height: row.height,
    current_weight: currentWeight,
    initial_weight: initialWeight,
    target_weight: targetWeight,
    lost_weight: (initialWeight > 0 && currentWeight > 0) ? parseFloat((initialWeight - currentWeight).toFixed(1)) : 0,
    kg_to_goal: (currentWeight > 0 && targetWeight > 0) ? parseFloat((currentWeight - targetWeight).toFixed(1)) : 0,
    abdominal_perimeter: row.abdominal_perimeter,
    arm_perimeter: row.arm_perimeter,
    thigh_perimeter: row.thigh_perimeter,
    last_weight_date: row.last_weight_date,

    status: mapStatus(row.status),
    registration_date: row.created_at,
    start_date: row.subscription_start || row.created_at || '',
    contract_end_date: row.subscription_end || '',

    next_renewal_date: row.next_renewal_date,
    next_renewal_accepted: row.next_renewal_accepted,
    program_duration_months: row.program_duration_months,

    coach_id: row.coach_id || '',
    coach_name: '', // Loaded dynamically
    ltv: row.ltv,
    payments_status: row.payments_status,
    high_ticket: row.high_ticket,

    last_contact_date: row.last_contact_date,

    pauseDate: row.pause_date,
    pauseReason: row.pause_reason,
    weeks_paused: row.weeks_paused,

    renewal_payment_status: row.renewal_payment_status || 'none',
    renewal_receipt_url: row.renewal_receipt_url,
    renewal_amount: row.renewal_amount,
    renewal_duration: row.renewal_duration,
    renewal_verified_at: row.renewal_verified_at,
    renewal_payment_method: row.renewal_payment_method,

    abandonmentDate: row.abandonment_date,
    abandonmentReason: row.abandonment_reason,
    inactiveDate: row.inactive_date,
    inactiveReason: row.inactive_reason,

    weeklyReviewUrl: row.weekly_review_url,
    weeklyReviewDate: row.weekly_review_date,
    weeklyReviewComments: row.weekly_review_comments,

    last_checkin_submitted: row.last_checkin_submitted,
    last_checkin_status: row.last_checkin_status,
    last_checkin_id: row.last_checkin_id,
    last_checkin_reviewed_at: row.last_checkin_reviewed_at,
    missed_checkins_count: row.missed_checkins_count || 0,

    medical: {
      diagnosis: row.diagnosis,
      diagnosisDate: row.diagnosis_date,
      currentTreatment: row.current_treatment,
      pathologies: row.pathologies,
      medication: row.medication,
      medicalNotes: row.medical_notes,

      // Oncología
      oncology_status: row.oncology_status,
      treatment_chemotherapy: row.treatment_chemotherapy,
      treatment_radiotherapy: row.treatment_radiotherapy,
      treatment_hormonotherapy: row.treatment_hormonotherapy,
      treatment_immunotherapy: row.treatment_immunotherapy,
      treatment_none: row.treatment_none,
      treatment_start_date: row.treatment_start_date,
      medication_affects_weight: row.medication_affects_weight,
      medication_affects_weight_details: row.medication_affects_weight_details,
      exercise_medical_limitations: row.exercise_medical_limitations,
      exercise_medical_limitations_details: row.exercise_medical_limitations_details,

      // Síntomas
      symptom_fatigue: row.symptom_fatigue,
      symptom_pain: row.symptom_pain,
      symptom_nausea: row.symptom_nausea,
      symptom_vomiting: row.symptom_vomiting,
      symptom_diarrhea: row.symptom_diarrhea,
      symptom_constipation: row.symptom_constipation,
      symptom_appetite_loss: row.symptom_appetite_loss,
      symptom_bloating: row.symptom_bloating,
      symptom_sleep_quality: row.symptom_sleep_quality,
    },

    nutrition: {
      allergies: row.allergies,
      preferences: row.dietary_preferences,
      dislikes: row.dislikes,
      cooksForSelf: row.cooks_for_self,
      mealsPerDay: row.meals_per_day,
      dietaryNotes: row.dietary_notes,
    },

    training: {
      activityLevel: row.activity_level,
      stepsGoal: row.steps_goal,
      strengthTraining: row.strength_training,
      trainingLocation: row.training_location,
      injuries: row.injuries,
      notes: row.training_notes,
      availability: row.availability,
    },

    goals: {
      motivation: row.motivation,
      goal_3_months: row.goal_3_months,
      goal_3_months_status: row.goal_3_months_status || 'pending',
      goal_6_months: row.goal_6_months,
      goal_6_months_status: row.goal_6_months_status || 'pending',
      goal_1_year: row.goal_1_year,
      goal_1_year_status: row.goal_1_year_status || 'pending',
      weeklyGoal: row.weekly_goal,
    },

    program: {
      subscriptionType: row.subscription_type,
      startDate: row.subscription_start,
      endDate: row.subscription_end,
      amount: row.subscription_amount,
      autoRenewal: row.auto_renewal,
      durationMonths: row.program_duration_months,
      contract_signed: row.contract_signed,
      contract_signed_at: row.contract_signed_at,
      contract_signature_image: row.contract_signature_image,
      contract_link: row.contract_link,
      contract_visible_to_client: row.contract_visible_to_client,
      assigned_contract_template_id: row.assigned_contract_template_id,
      contract_content_override: row.contract_content_override,
      contract_date: row.contract_date,
      contract_amount: row.contract_amount,
    },

    general_notes: row.general_notes,

    // Funcionalidad y energía
    energy_level: row.energy_level,
    recovery_capacity: row.recovery_capacity,
    fatigue_interference: row.fatigue_interference,
    current_strength_score: row.current_strength_score,
    functional_limitation_carry_bag: row.functional_limitation_carry_bag,
    functional_limitation_stand_up: row.functional_limitation_stand_up,
    functional_limitation_stairs: row.functional_limitation_stairs,
    functional_limitation_falls: row.functional_limitation_falls,

    // Scores relación con comida
    food_fear_score: row.food_fear_score,
    food_guilt_score: row.food_guilt_score,
    food_peace_score: row.food_peace_score,
    body_trust_score: row.body_trust_score,

    nutrition_approved: row.nutrition_approved,
    nutrition_approved_at: row.nutrition_approved_at,
    nutrition_approved_by: row.nutrition_approved_by,

    onboarding_token: row.onboarding_token,
    onboarding_completed: row.onboarding_completed,
    onboarding_completed_at: row.onboarding_completed_at,

    user_id: row.user_id,
    activation_token: row.activation_token,
    activation_token_created_at: row.activation_token_created_at,

    next_appointment_date: row.next_appointment_date,
    next_appointment_time: row.next_appointment_time,
    next_appointment_note: row.next_appointment_note,
    next_appointment_link: row.next_appointment_link,
    next_appointment_status: row.next_appointment_status,
    next_appointment_conclusions: row.next_appointment_conclusions,
    coach_message: row.coach_message,

    allow_medical_access: row.allow_medical_access,
    show_health_tracker: row.show_health_tracker,

    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
};

// --- MAPPER: CLIENT -> DB ROW ---
const mapClientToRow = (client: Partial<Client>): any => {
  const row: any = {};

  // Personal & Contact
  if (client.firstName !== undefined) row.first_name = client.firstName;
  if (client.surname !== undefined) row.surname = client.surname;
  if (client.email !== undefined) row.email = client.email;
  if (client.idNumber !== undefined) row.id_number = client.idNumber;
  if (client.phone !== undefined) row.phone = client.phone;
  if (client.address !== undefined) row.address = client.address;
  if (client.city !== undefined) row.city = client.city;
  if (client.province !== undefined) row.province = client.province;
  if (client.zip !== undefined) row.zip = client.zip;
  if (client.instagram !== undefined) row.instagram = client.instagram;
  if (client.telegramId !== undefined) row.telegram_id = client.telegramId;
  if (client.telegram_group_id !== undefined) row.telegram_group_id = client.telegram_group_id;

  // Demographics
  if (client.age !== undefined) row.age = client.age;
  if (client.birthDate !== undefined) row.birth_date = client.birthDate;
  if (client.gender !== undefined) row.gender = client.gender;
  if (client.hormonal_status !== undefined) row.hormonal_status = client.hormonal_status;
  if (client.average_cycle_length !== undefined) row.average_cycle_length = client.average_cycle_length;
  if (client.hrt_treatment !== undefined) row.hrt_treatment = client.hrt_treatment;
  if (client.last_period_start_date !== undefined) row.last_period_start_date = client.last_period_start_date;

  // Physical Stats
  if (client.height !== undefined) row.height = client.height;
  if (client.current_weight !== undefined) row.current_weight = client.current_weight;
  if (client.initial_weight !== undefined) row.initial_weight = client.initial_weight;
  if (client.target_weight !== undefined) row.target_weight = client.target_weight;
  if (client.abdominal_perimeter !== undefined) row.abdominal_perimeter = client.abdominal_perimeter;
  if (client.arm_perimeter !== undefined) row.arm_perimeter = client.arm_perimeter;
  if (client.thigh_perimeter !== undefined) row.thigh_perimeter = client.thigh_perimeter;
  if (client.last_weight_date !== undefined) row.last_weight_date = client.last_weight_date;

  // Status
  if (client.status) {
    const statusMap: Record<string, string> = {
      [ClientStatus.ACTIVE]: 'active',
      [ClientStatus.INACTIVE]: 'inactive',
      [ClientStatus.PAUSED]: 'paused',
      [ClientStatus.DROPOUT]: 'dropout',
      [ClientStatus.COMPLETED]: 'completed'
    };
    row.status = statusMap[client.status] || client.status;
  }

  // Contract & Dates
  if (client.start_date !== undefined) row.subscription_start = client.start_date;
  if (client.contract_end_date !== undefined) row.subscription_end = client.contract_end_date;
  if (client.program_duration_months !== undefined) row.program_duration_months = client.program_duration_months;
  if (client.next_renewal_date !== undefined) row.next_renewal_date = client.next_renewal_date;
  if (client.next_renewal_accepted !== undefined) row.next_renewal_accepted = client.next_renewal_accepted;

  // Coach
  if (client.coach_id) row.coach_id = client.coach_id;

  // CRM Tracking
  if (client.last_contact_date !== undefined) row.last_contact_date = client.last_contact_date;
  if (client.ltv !== undefined) row.ltv = client.ltv;
  if (client.payments_status !== undefined) row.payments_status = client.payments_status;
  if (client.high_ticket !== undefined) row.high_ticket = client.high_ticket;

  // Pause
  if (client.pauseDate !== undefined) row.pause_date = client.pauseDate;
  if (client.pauseReason !== undefined) row.pause_reason = client.pauseReason;
  if (client.weeks_paused !== undefined) row.weeks_paused = client.weeks_paused;

  // Renewal
  if (client.renewal_payment_status !== undefined) row.renewal_payment_status = client.renewal_payment_status;
  if (client.renewal_receipt_url !== undefined) row.renewal_receipt_url = client.renewal_receipt_url;
  if (client.renewal_amount !== undefined) row.renewal_amount = client.renewal_amount;
  if (client.renewal_duration !== undefined) row.renewal_duration = client.renewal_duration;
  if (client.renewal_verified_at !== undefined) row.renewal_verified_at = client.renewal_verified_at;
  if (client.renewal_payment_method !== undefined) row.renewal_payment_method = client.renewal_payment_method;

  // Exit Dates
  if (client.abandonmentDate !== undefined) row.abandonment_date = client.abandonmentDate;
  if (client.abandonmentReason !== undefined) row.abandonment_reason = client.abandonmentReason;
  if (client.inactiveDate !== undefined) row.inactive_date = client.inactiveDate;
  if (client.inactiveReason !== undefined) row.inactive_reason = client.inactiveReason;

  // Weekly Review
  if (client.weeklyReviewUrl !== undefined) row.weekly_review_url = client.weeklyReviewUrl;
  if (client.weeklyReviewDate !== undefined) row.weekly_review_date = client.weeklyReviewDate;
  if (client.weeklyReviewComments !== undefined) row.weekly_review_comments = client.weeklyReviewComments;

  // Check-in
  if (client.missed_checkins_count !== undefined) row.missed_checkins_count = client.missed_checkins_count;

  // Medical
  if (client.medical) {
    if (client.medical.diagnosis !== undefined) row.diagnosis = client.medical.diagnosis;
    if (client.medical.diagnosisDate !== undefined) row.diagnosis_date = client.medical.diagnosisDate;
    if (client.medical.currentTreatment !== undefined) row.current_treatment = client.medical.currentTreatment;
    if (client.medical.pathologies !== undefined) row.pathologies = client.medical.pathologies;
    if (client.medical.medication !== undefined) row.medication = client.medical.medication;
    if (client.medical.medicalNotes !== undefined) row.medical_notes = client.medical.medicalNotes;

    // Oncología
    if (client.medical.oncology_status !== undefined) row.oncology_status = client.medical.oncology_status;
    if (client.medical.treatment_chemotherapy !== undefined) row.treatment_chemotherapy = client.medical.treatment_chemotherapy;
    if (client.medical.treatment_radiotherapy !== undefined) row.treatment_radiotherapy = client.medical.treatment_radiotherapy;
    if (client.medical.treatment_hormonotherapy !== undefined) row.treatment_hormonotherapy = client.medical.treatment_hormonotherapy;
    if (client.medical.treatment_immunotherapy !== undefined) row.treatment_immunotherapy = client.medical.treatment_immunotherapy;
    if (client.medical.treatment_none !== undefined) row.treatment_none = client.medical.treatment_none;
    if (client.medical.treatment_start_date !== undefined) row.treatment_start_date = client.medical.treatment_start_date;
    if (client.medical.medication_affects_weight !== undefined) row.medication_affects_weight = client.medical.medication_affects_weight;
    if (client.medical.medication_affects_weight_details !== undefined) row.medication_affects_weight_details = client.medical.medication_affects_weight_details;
    if (client.medical.exercise_medical_limitations !== undefined) row.exercise_medical_limitations = client.medical.exercise_medical_limitations;
    if (client.medical.exercise_medical_limitations_details !== undefined) row.exercise_medical_limitations_details = client.medical.exercise_medical_limitations_details;

    // Síntomas
    if (client.medical.symptom_fatigue !== undefined) row.symptom_fatigue = client.medical.symptom_fatigue;
    if (client.medical.symptom_pain !== undefined) row.symptom_pain = client.medical.symptom_pain;
    if (client.medical.symptom_nausea !== undefined) row.symptom_nausea = client.medical.symptom_nausea;
    if (client.medical.symptom_vomiting !== undefined) row.symptom_vomiting = client.medical.symptom_vomiting;
    if (client.medical.symptom_diarrhea !== undefined) row.symptom_diarrhea = client.medical.symptom_diarrhea;
    if (client.medical.symptom_constipation !== undefined) row.symptom_constipation = client.medical.symptom_constipation;
    if (client.medical.symptom_appetite_loss !== undefined) row.symptom_appetite_loss = client.medical.symptom_appetite_loss;
    if (client.medical.symptom_bloating !== undefined) row.symptom_bloating = client.medical.symptom_bloating;
    if (client.medical.symptom_sleep_quality !== undefined) row.symptom_sleep_quality = client.medical.symptom_sleep_quality;
  }

  // Funcionalidad y energía
  if (client.energy_level !== undefined) row.energy_level = client.energy_level;
  if (client.recovery_capacity !== undefined) row.recovery_capacity = client.recovery_capacity;
  if (client.fatigue_interference !== undefined) row.fatigue_interference = client.fatigue_interference;
  if (client.current_strength_score !== undefined) row.current_strength_score = client.current_strength_score;
  if (client.functional_limitation_carry_bag !== undefined) row.functional_limitation_carry_bag = client.functional_limitation_carry_bag;
  if (client.functional_limitation_stand_up !== undefined) row.functional_limitation_stand_up = client.functional_limitation_stand_up;
  if (client.functional_limitation_stairs !== undefined) row.functional_limitation_stairs = client.functional_limitation_stairs;
  if (client.functional_limitation_falls !== undefined) row.functional_limitation_falls = client.functional_limitation_falls;

  // Scores relación con comida
  if (client.food_fear_score !== undefined) row.food_fear_score = client.food_fear_score;
  if (client.food_guilt_score !== undefined) row.food_guilt_score = client.food_guilt_score;
  if (client.food_peace_score !== undefined) row.food_peace_score = client.food_peace_score;
  if (client.body_trust_score !== undefined) row.body_trust_score = client.body_trust_score;

  // Nutrition
  if (client.nutrition) {
    if (client.nutrition.allergies !== undefined) row.allergies = client.nutrition.allergies;
    if (client.nutrition.preferences !== undefined) row.dietary_preferences = client.nutrition.preferences;
    if (client.nutrition.dislikes !== undefined) row.dislikes = client.nutrition.dislikes;
    if (client.nutrition.cooksForSelf !== undefined) row.cooks_for_self = client.nutrition.cooksForSelf;
    if (client.nutrition.mealsPerDay !== undefined) row.meals_per_day = client.nutrition.mealsPerDay;
    if (client.nutrition.dietaryNotes !== undefined) row.dietary_notes = client.nutrition.dietaryNotes;
  }

  // Training
  if (client.training) {
    if (client.training.activityLevel !== undefined) row.activity_level = client.training.activityLevel;
    if (client.training.stepsGoal !== undefined) row.steps_goal = client.training.stepsGoal;
    if (client.training.strengthTraining !== undefined) row.strength_training = client.training.strengthTraining;
    if (client.training.trainingLocation !== undefined) row.training_location = client.training.trainingLocation;
    if (client.training.injuries !== undefined) row.injuries = client.training.injuries;
    if (client.training.notes !== undefined) row.training_notes = client.training.notes;
    if (client.training.availability !== undefined) row.availability = client.training.availability;
  }

  // Goals
  if (client.goals) {
    if (client.goals.motivation !== undefined) row.motivation = client.goals.motivation;
    if (client.goals.goal_3_months !== undefined) row.goal_3_months = client.goals.goal_3_months;
    if (client.goals.goal_3_months_status !== undefined) row.goal_3_months_status = client.goals.goal_3_months_status;
    if (client.goals.goal_6_months !== undefined) row.goal_6_months = client.goals.goal_6_months;
    if (client.goals.goal_6_months_status !== undefined) row.goal_6_months_status = client.goals.goal_6_months_status;
    if (client.goals.goal_1_year !== undefined) row.goal_1_year = client.goals.goal_1_year;
    if (client.goals.goal_1_year_status !== undefined) row.goal_1_year_status = client.goals.goal_1_year_status;
    if (client.goals.weeklyGoal !== undefined) row.weekly_goal = client.goals.weeklyGoal;
  }

  // Program / Subscription
  if (client.program) {
    if (client.program.subscriptionType !== undefined) row.subscription_type = client.program.subscriptionType;
    if (client.program.startDate !== undefined) row.subscription_start = client.program.startDate;
    if (client.program.endDate !== undefined) row.subscription_end = client.program.endDate;
    if (client.program.amount !== undefined) row.subscription_amount = client.program.amount;
    if (client.program.autoRenewal !== undefined) row.auto_renewal = client.program.autoRenewal;
    if (client.program.durationMonths !== undefined) row.program_duration_months = client.program.durationMonths;
    if (client.program.contract_signed !== undefined) row.contract_signed = client.program.contract_signed;
    if (client.program.contract_signed_at !== undefined) row.contract_signed_at = client.program.contract_signed_at;
    if (client.program.contract_signature_image !== undefined) row.contract_signature_image = client.program.contract_signature_image;
    if (client.program.contract_link !== undefined) row.contract_link = client.program.contract_link;
    if (client.program.contract_visible_to_client !== undefined) row.contract_visible_to_client = client.program.contract_visible_to_client;
    if (client.program.assigned_contract_template_id !== undefined) row.assigned_contract_template_id = client.program.assigned_contract_template_id || null;
    if (client.program.contract_content_override !== undefined) row.contract_content_override = client.program.contract_content_override || null;
    if (client.program.contract_date !== undefined) row.contract_date = client.program.contract_date || null;
    if (client.program.contract_amount !== undefined) row.contract_amount = client.program.contract_amount || 0;
  }

  // General Notes
  if (client.general_notes !== undefined) row.general_notes = client.general_notes;

  // Nutrition Approval
  if (client.nutrition_approved !== undefined) row.nutrition_approved = client.nutrition_approved;
  if (client.nutrition_approved_at !== undefined) row.nutrition_approved_at = client.nutrition_approved_at;
  if (client.nutrition_approved_by !== undefined) row.nutrition_approved_by = client.nutrition_approved_by;

  // Onboarding
  if (client.onboarding_token !== undefined) row.onboarding_token = client.onboarding_token;
  if (client.onboarding_completed !== undefined) row.onboarding_completed = client.onboarding_completed;
  if (client.onboarding_completed_at !== undefined) row.onboarding_completed_at = client.onboarding_completed_at;

  // Account Activation
  if (client.user_id !== undefined) row.user_id = client.user_id;
  if (client.activation_token !== undefined) row.activation_token = client.activation_token;
  if (client.activation_token_created_at !== undefined) row.activation_token_created_at = client.activation_token_created_at;

  // Coach Communication Fields
  if (client.next_appointment_date !== undefined) row.next_appointment_date = client.next_appointment_date || null;
  if (client.next_appointment_time !== undefined) row.next_appointment_time = client.next_appointment_time || null;
  if (client.next_appointment_note !== undefined) row.next_appointment_note = client.next_appointment_note || null;
  if (client.next_appointment_link !== undefined) row.next_appointment_link = client.next_appointment_link || null;
  if (client.next_appointment_status !== undefined) row.next_appointment_status = client.next_appointment_status || null;
  if (client.next_appointment_conclusions !== undefined) row.next_appointment_conclusions = client.next_appointment_conclusions || null;
  if (client.coach_message !== undefined) row.coach_message = client.coach_message || null;

  // Access flags
  if (client.allow_medical_access !== undefined) row.allow_medical_access = client.allow_medical_access;
  if (client.show_health_tracker !== undefined) row.show_health_tracker = client.show_health_tracker;

  return row;
};

// --- MOCK IMPLEMENTATIONS ---

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock User Data for Auth (generic demo users)
let mockUsers: User[] = [
  {
    id: 'admin-123',
    name: 'Admin Demo',
    email: 'admin@demo.com',
    role: UserRole.ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Demo'
  },
  {
    id: 'coach-1',
    name: 'Coach Demo',
    email: 'coach@demo.com',
    role: UserRole.COACH,
    avatarUrl: 'https://ui-avatars.com/api/?name=Coach+Demo'
  },
  {
    id: 'closer-1',
    name: 'Closer Demo',
    email: 'closer@demo.com',
    role: UserRole.CLOSER,
    avatarUrl: 'https://ui-avatars.com/api/?name=Closer+Demo'
  },
  {
    id: 'doctor-1',
    name: 'Doctor Demo',
    email: 'doctor@demo.com',
    role: UserRole.DOCTOR,
    avatarUrl: 'https://ui-avatars.com/api/?name=Doctor+Demo'
  },
  {
    id: 'psico-1',
    name: 'Psicologo Demo',
    email: 'psico@demo.com',
    role: UserRole.PSICOLOGO,
    avatarUrl: 'https://ui-avatars.com/api/?name=Psicologo+Demo'
  },
  {
    id: 'rrss-1',
    name: 'RRSS Demo',
    email: 'rrss@demo.com',
    role: UserRole.RRSS,
    avatarUrl: 'https://ui-avatars.com/api/?name=RRSS+Demo'
  },
  {
    id: 'cont-1',
    name: 'Contabilidad Demo',
    email: 'contabilidad@demo.com',
    role: UserRole.CONTABILIDAD,
    avatarUrl: 'https://ui-avatars.com/api/?name=Contabilidad+Demo',
    password: '123'
  },
];

// --- MEDICAL REVIEWS MAPPER ---
const mapRowToMedicalReview = (row: any): MedicalReview => ({
  id: row.id,
  client_id: row.client_id,
  coach_id: row.coach_id,
  submission_date: row.submission_date,
  diagnosis: row.diagnosis,
  treatment: row.treatment,
  medication: row.medication,
  comments: row.comments,
  report_type: row.report_type,
  file_urls: [
    row.file_url_1,
    row.file_url_2,
    row.file_url_3,
    row.file_url_4
  ].filter(Boolean),
  status: row.status === 'completed' || row.status === 'reviewed' ? 'reviewed' : 'pending',
  doctor_notes: row.doctor_notes,
  doctor_video_url: row.doctor_video_url,
  reviewed_at: row.reviewed_at,
  reviewed_by: row.reviewed_by,
  created_at: row.created_at,
  client_name: row.client_name // Virtual field from joined query
});

const mapMedicalReviewToRow = (review: Partial<MedicalReview>) => {
  const row: any = {
    client_id: review.client_id,
    coach_id: review.coach_id,
    diagnosis: review.diagnosis,
    treatment: review.treatment,
    medication: review.medication,
    comments: review.comments,
    report_type: review.report_type,
    status: review.status === 'reviewed' ? 'reviewed' : 'pending',
    doctor_notes: review.doctor_notes,
    doctor_video_url: review.doctor_video_url,
    reviewed_at: review.reviewed_at,
    reviewed_by: review.reviewed_by
  };

  if (review.file_urls) {
    row.file_url_1 = review.file_urls[0] || null;
    row.file_url_2 = review.file_urls[1] || null;
    row.file_url_3 = review.file_urls[2] || null;
    row.file_url_4 = review.file_urls[3] || null;
  }

  return row;
};

// --- AUTHENTICATION ---
export const mockAuth = {
  login: async (identifier: string, password?: string, manualRoleType?: 'staff' | 'client'): Promise<User | null> => {
    const rawEmail = (identifier || '').toLowerCase().trim();
    const rawPass = (password || '').trim();
    const isMasterPass = ['admin123', 'test123', '123', '1234', '123456'].includes(rawPass);

    console.log(`Intentando login para: ${rawEmail}`);

    // --- 1. REAL SUPABASE AUTH ---
    let authData: any = null;
    let authError: any = null;

    if (rawEmail.includes('@') && rawPass) {
      const response = await supabase.auth.signInWithPassword({
        email: rawEmail,
        password: rawPass
      });
      authData = response.data;
      authError = response.error;
    }

    // --- 2. SESSION & PROFILE ---
    if (authData?.user || (isMasterPass && (
      rawEmail.endsWith('@test.com') ||
      rawEmail.endsWith('@demo.com')
    ))) {

      const userId = authData?.user?.id;

      // Try to get profile from public.users (absolute priority)
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq(userId ? 'id' : 'email', userId || rawEmail)
        .maybeSingle();

      if (dbUser) {
        console.log(`Perfil encontrado en DB para ${rawEmail} (Rol: ${dbUser.role})`);
        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role as UserRole,
          avatarUrl: dbUser.avatar_url || `https://ui-avatars.com/api/?name=${dbUser.name}`,
          isMockSession: !authData?.user
        };
      }

      // If no DB profile but real Auth, use metadata
      if (authData?.user) {
        console.warn('Usuario Auth OK pero no encontrado en tabla public.users. Usando metadatos.');
        return {
          id: authData.user.id,
          name: authData.user.user_metadata?.full_name || rawEmail.split('@')[0].toUpperCase(),
          email: rawEmail,
          role: (authData.user.user_metadata?.role as UserRole) || UserRole.CLIENT,
          avatarUrl: authData.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${rawEmail}`,
          isMockSession: false
        };
      }

      // Backdoor mode (mock users)
      if (isMasterPass) {
        console.log('Backdoor detectado (Modo Mock)');
        const mockMatch = mockUsers.find(u => u.email.toLowerCase() === rawEmail);
        if (mockMatch) return mockMatch;

        // Dynamic fallback by prefix
        let role = UserRole.COACH;
        if (rawEmail.startsWith('admin')) role = UserRole.ADMIN;
        if (rawEmail.startsWith('closer')) role = UserRole.CLOSER;
        if (rawEmail.startsWith('setter')) role = UserRole.SETTER;
        if (rawEmail.startsWith('doctor') || rawEmail.startsWith('medico')) role = UserRole.DOCTOR;
        if (rawEmail.startsWith('direccion')) role = UserRole.DIRECCION;

        return {
          id: `mock-${rawEmail.replace(/[^a-z0-9]/g, '-')}`,
          name: rawEmail.split('@')[0].toUpperCase().replace('_', ' '),
          email: rawEmail,
          role: role,
          isMockSession: true
        };
      }
    }

    // --- 2B. DIRECT USERS TABLE AUTH (when Supabase Auth is not configured for this user) ---
    if (!authData?.user && rawEmail.includes('@') && rawPass) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', rawEmail)
        .maybeSingle();

      if (dbUser && dbUser.password === rawPass) {
        console.log(`Login directo via tabla users para ${rawEmail} (Rol: ${dbUser.role})`);
        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role as UserRole,
          avatarUrl: dbUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.name)}`,
          isMockSession: false
        };
      }
    }

    // --- 3. CLIENT LOGIN BY EMAIL ---
    // If staff login failed, try to find a client record with this email
    if (!authData?.user && rawEmail.includes('@')) {
      const { data: clientRecord } = await supabase
        .from(TABLE_NAME)
        .select('id, first_name, surname, email, user_id')
        .eq('email', rawEmail)
        .maybeSingle();

      if (clientRecord && manualRoleType === 'client') {
        return {
          id: clientRecord.user_id || clientRecord.id,
          name: `${clientRecord.first_name || ''} ${clientRecord.surname || ''}`.trim(),
          email: clientRecord.email,
          role: UserRole.CLIENT,
          isMockSession: true
        };
      }
    }

    if (authError) console.error('Error de autenticacion:', authError.message);
    return null;
  },

  updateUser: async (user: User): Promise<User> => {
    await delay(500);
    mockUsers = mockUsers.map(u => u.id === user.id ? user : u);
    return user;
  }
};

// --- DATABASE OPERATIONS ---
export const mockDb = {
  medical: {
    getStats: async () => {
      const { data, error } = await supabase
        .from('medical_reviews')
        .select('status');

      if (error) return { pending: 0, reviewed: 0 };

      return {
        pending: (data || []).filter(r => r.status === 'pending').length,
        reviewed: (data || []).filter(r => r.status === 'reviewed').length
      };
    },

    getAll: async () => {
      console.log('Solicitando todas las revisiones medicas...');
      const { data, error } = await supabase
        .from('medical_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching medical reviews (GetAll):', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('No se encontraron revisiones medicas en Supabase.');
        return [];
      }

      console.log(`Se han cargado ${data.length} revisiones medicas. Buscando nombres de clientes...`);

      // Get client names manually to avoid 406/ambiguity in RLS joins
      const clientIds = [...new Set(data.map(r => r.client_id))].filter(Boolean);
      if (clientIds.length === 0) return data.map(mapRowToMedicalReview);

      const { data: clientNames, error: clientError } = await supabase
        .from(TABLE_NAME)
        .select('id, first_name, surname')
        .in('id', clientIds);

      if (clientError) {
        console.warn('No se pudieron cargar los nombres de los clientes:', clientError);
      }

      return data.map(row => {
        const clientInfo = clientNames?.find(c => c.id === row.client_id);
        const mapped = mapRowToMedicalReview(row);
        return {
          ...mapped,
          client_name: clientInfo ? `${clientInfo.first_name || ''} ${clientInfo.surname || ''}`.trim() : 'Cliente desconocido'
        };
      });
    },

    getByClient: async (clientId: string) => {
      const { data, error } = await supabase
        .from('medical_reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map(mapRowToMedicalReview);
    },

    create: async (review: Partial<MedicalReview>) => {
      const row = mapMedicalReviewToRow(review);
      const { data, error } = await supabase
        .from('medical_reviews')
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return mapRowToMedicalReview(data);
    },

    update: async (id: string, updates: Partial<MedicalReview>) => {
      const row = mapMedicalReviewToRow(updates);
      const { data, error } = await supabase
        .from('medical_reviews')
        .update(row)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToMedicalReview(data);
    }
  },
  invoices: {
    delete: async (id: string) => {
      return await mockEvolution.invoices.delete(id);
    }
  },
  getClients: async (currentUser: User): Promise<Client[]> => {
    // Client Role: Return only own record
    if (currentUser.role === UserRole.CLIENT) {
      let query = supabase.from(TABLE_NAME).select('*');

      const userId = currentUser.id;
      const userEmail = currentUser.email;

      if (isUUID(userId)) {
        // Search by UUID (id or user_id) OR by email as fallback
        query = query.or(`id.eq.${userId},user_id.eq.${userId},email.eq.${userEmail}`);
      } else {
        query = query.eq('email', userEmail);
      }

      const { data, error } = await query;
      if (error) throw error;
      let clientRecords = (data || []).map(mapRowToClient);

      // Enrich client with latest check-in data
      try {
        const clientId = clientRecords[0]?.id;
        if (clientId) {
          const { data: checkins } = await supabase
            .from('weekly_checkins')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (checkins && checkins.length > 0) {
            const lastCheckin = checkins[0];
            clientRecords = clientRecords.map(c => ({
              ...c,
              last_checkin_submitted: lastCheckin.created_at,
              last_checkin_status: lastCheckin.status,
              last_checkin_id: lastCheckin.id,
              last_checkin_reviewed_at: lastCheckin.reviewed_at
            }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch checkin for client:', err);
      }

      return clientRecords;
    }

    // Helper to normalize text (remove accents and lower case)
    const normalize = (text: string) =>
      (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const roleLower = (currentUser.role || '').toLowerCase();

    let data: any[] | null = null;
    let error: any = null;

    // OPTIMIZATION: For coaches, filter directly in DB
    if (roleLower === 'coach') {
      const coachId = currentUser.id || '';

      console.log(`Coach query optimizada: id="${coachId}"`);

      // Filter by coach_id (UUID) directly in Supabase
      const result = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('coach_id', coachId);

      data = result.data;
      error = result.error;

      console.log(`Coach ${currentUser.name} tiene ${data?.length || 0} clientes (query directa)`);
    } else {
      // Admin/Head Coach: Load all
      const result = await supabase
        .from(TABLE_NAME)
        .select('*');

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    let clients = (data || []).map(mapRowToClient);

    // --- ENRICH CLIENTS WITH LATEST CHECK-IN DATE ---
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: checkins } = await supabase
        .from('weekly_checkins')
        .select('id, client_id, created_at, status, reviewed_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (checkins) {
        const latestCheckinsMap = new Map<string, { date: string; status: any; id: string; reviewed_at?: string }>();

        checkins.forEach((c: any) => {
          if (!latestCheckinsMap.has(c.client_id)) {
            latestCheckinsMap.set(c.client_id, {
              date: c.created_at,
              status: c.status,
              id: c.id,
              reviewed_at: c.reviewed_at
            });
          }
        });

        // Also check local mocks
        mockCheckins.forEach(c => {
          const current = latestCheckinsMap.get(c.client_id);
          if (!current || new Date(c.created_at) > new Date(current.date)) {
            latestCheckinsMap.set(c.client_id, {
              date: c.created_at,
              status: c.status,
              id: c.id,
              reviewed_at: (c as any).reviewed_at
            });
          }
        });

        clients = clients.map(client => {
          const lastCheckin = latestCheckinsMap.get(client.id);
          return {
            ...client,
            last_checkin_submitted: lastCheckin?.date,
            last_checkin_status: lastCheckin?.status,
            last_checkin_id: lastCheckin?.id,
            last_checkin_reviewed_at: lastCheckin?.reviewed_at
          };
        });
      }
    } catch (err) {
      console.warn('Could not fetch latest checkins from Supabase, checking local only:', err);
      const latestCheckinsMap = new Map<string, { date: string; status: any; id: string; reviewed_at?: string }>();
      mockCheckins.forEach(c => {
        const current = latestCheckinsMap.get(c.client_id);
        if (!current || new Date(c.created_at) > new Date(current.date)) {
          latestCheckinsMap.set(c.client_id, {
            date: c.created_at,
            status: c.status,
            id: c.id,
            reviewed_at: (c as any).reviewed_at
          });
        }
      });
      clients = clients.map(client => {
        const lastCheckin = latestCheckinsMap.get(client.id);
        return {
          ...client,
          last_checkin_submitted: lastCheckin?.date,
          last_checkin_status: lastCheckin?.status,
          last_checkin_id: lastCheckin?.id,
          last_checkin_reviewed_at: lastCheckin?.reviewed_at
        };
      });
    }

    return clients;
  },

  updateClientStatus: async (clientId: string, status: ClientStatus, additionalData?: Partial<Client>) => {
    const rowUpdates: any = {};

    // Store status using the clean enum value
    rowUpdates.status = status;

    if (additionalData) {
      const mapped = mapClientToRow(additionalData);
      Object.assign(rowUpdates, mapped);
    }

    // --- PAUSE LOGIC ---
    try {
      if (status === ClientStatus.PAUSED) {
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
          .from('contract_pauses')
          .select('id')
          .eq('client_id', clientId)
          .eq('start_date', today)
          .is('end_date', null)
          .maybeSingle();

        if (existing) {
          console.log('Pause already recorded for today, skipping duplicate insert.');
        } else {
          const { error: pauseError } = await supabase.from('contract_pauses').insert({
            client_id: clientId,
            start_date: additionalData?.pauseDate || today,
            reason: additionalData?.pauseReason || 'Pausa manual'
          });
          if (pauseError) console.warn('Error inserting pause record:', pauseError);
        }
      }
      else if (status === ClientStatus.ACTIVE) {
        const { error: resumeError } = await supabase.from('contract_pauses')
          .update({ end_date: new Date().toISOString().split('T')[0] })
          .eq('client_id', clientId)
          .is('end_date', null);

        if (resumeError) console.warn('Error closing pause record:', resumeError);
      }
    } catch (e) {
      console.error('Error in Pause Logic Side-Effects:', e);
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(rowUpdates)
      .eq('id', clientId);

    if (error) throw error;
  },

  calculateAdjustedEndDate: async (clientId: string, originalEndDate: string): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('calculate_adjusted_end_date', {
        p_client_id: clientId,
        p_original_end_date: originalEndDate
      });

      if (!error && data) return data;

      console.warn('RPC unavailable, calculating locally...');
      const { data: pauses } = await supabase
        .from('contract_pauses')
        .select('*')
        .eq('client_id', clientId);

      if (!pauses || pauses.length === 0) return originalEndDate;

      let totalDays = 0;
      const now = new Date();

      pauses.forEach((p: any) => {
        const start = new Date(p.start_date);
        const end = p.end_date ? new Date(p.end_date) : now;
        const diff = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        totalDays += diff;
      });

      const adjusted = new Date(originalEndDate);
      adjusted.setDate(adjusted.getDate() + totalDays);
      return adjusted.toISOString().split('T')[0];

    } catch (e) {
      console.error('Error calculating adjusted date:', e);
      return originalEndDate;
    }
  },

  updateClient: async (client: Client) => {
    // UPDATE DB
    try {
      const rowUpdates = mapClientToRow(client);
      delete rowUpdates['id'];

      console.log('Sending Update for Client:', client.id, {
        goal_status: {
          g3: rowUpdates['goal_3_months_status'],
          g6: rowUpdates['goal_6_months_status'],
          g1: rowUpdates['goal_1_year_status']
        }
      });

      const { error } = await supabase
        .from(TABLE_NAME)
        .update(rowUpdates)
        .eq('id', client.id);

      if (error) {
        console.error('DB UPDATE FAILED:', error);
        throw new Error(`Error en DB principal: ${error.message}`);
      } else {
        console.log('Update Successful in DB');
      }
    } catch (err: any) {
      console.error('DB Update CRITICAL Exception:', err);
      throw err;
    }

    // INSERT INTO COACHING_SESSIONS TABLE (for reviews)
    if (client.weeklyReviewUrl) {
      try {
        const { error: reviewError } = await supabase
          .from('coaching_sessions')
          .insert({
            client_id: client.id,
            coach_id: client.coach_id,
            date: client.weeklyReviewDate || new Date().toISOString(),
            recording_url: client.weeklyReviewUrl,
            coach_comments: client.weeklyReviewComments,
            type: 'weekly_review',
            summary: `Revision del ${client.weeklyReviewDate || 'fecha actual'}`,
            created_at: new Date().toISOString()
          });
      } catch (e) { console.error(e); }
    }
  },

  createReview: async (review: any) => {
    try {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .insert(review)
        .select()
        .single();

      if (error) {
        console.warn('Could not save to coaching_sessions (Supabase), ignoring for demo:', error);
      }
      return data;
    } catch (e) {
      console.error('Error creating review:', e);
    }
  },

  getClientReviews: async (clientId: string) => {
    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });

    if (data) {
      console.log(`[DEBUG] Fetched ${data.length} reviews for client ${clientId}`);
    }

    if (error) {
      console.warn('Error fetching reviews (using empty list):', error.message);
      return [];
    }
    return data || [];
  },

  // --- CLASSES MANAGEMENT ---
  getClasses: async (): Promise<ClassSession[]> => {
    const { data, error } = await supabase
      .from('weekly_classes')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn("Failed to fetch classes (or table missing)", error.message);
      return [];
    }
    return data || [];
  },

  createClass: async (classSession: Omit<ClassSession, 'id'>) => {
    const { data, error } = await supabase
      .from('weekly_classes')
      .insert(classSession)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- WEEKLY CHECK-INS ---
  submitCheckin: async (checkin: Omit<WeeklyCheckin, 'id' | 'created_at' | 'status'>) => {
    try {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .insert({
          ...checkin,
          status: 'pending_review'
        })
        .select()
        .single();

      if (error) throw error;

      // Update local client for immediate visibility
      try {
        const { data: clientData } = await supabase.from(TABLE_NAME).select('*').eq('id', checkin.client_id).single();
      } catch (e) { }

      return data;
    } catch (e: any) {
      console.warn('Supabase checkin submit failed, using local mock fallback:', e.message);

      const newCheckin: WeeklyCheckin = {
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        client_id: checkin.client_id,
        responses: checkin.responses,
        rating: checkin.rating,
        status: 'pending_review',
        coach_notes: checkin.coach_notes
      };

      mockCheckins.unshift(newCheckin);
      await delay(500);
      return newCheckin;
    }
  },

  getCheckins: async (clientId: string): Promise<WeeklyCheckin[]> => {
    let dbCheckins: WeeklyCheckin[] = [];

    const { data, error } = await supabase
      .from('weekly_checkins')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      dbCheckins = data;
    } else {
      console.warn('Error fetching checkins (or table missing), checking local mock:', error?.message);
    }

    const localCheckins = mockCheckins.filter(c => c.client_id === clientId);

    const allCheckins = [...localCheckins, ...dbCheckins].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return allCheckins;
  },

  updateCheckin: async (checkinId: string, updates: Partial<WeeklyCheckin>) => {
    try {
      const finalUpdates = { ...updates };
      if (updates.status === 'reviewed') {
        (finalUpdates as any).reviewed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('weekly_checkins')
        .update(finalUpdates)
        .eq('id', checkinId);

      if (error) throw error;

      mockCheckins = mockCheckins.map(c => c.id === checkinId ? { ...c, ...finalUpdates } : c);

    } catch (e: any) {
      console.error('Error updating checkin:', e);
      const finalUpdates = { ...updates };
      if (updates.status === 'reviewed') {
        (finalUpdates as any).reviewed_at = new Date().toISOString();
      }
      mockCheckins = mockCheckins.map(c => c.id === checkinId ? { ...c, ...finalUpdates } : c);
    }
  },

  updateClass: async (classSession: ClassSession) => {
    const { error } = await supabase
      .from('weekly_classes')
      .update(classSession)
      .eq('id', classSession.id);
    if (error) throw error;
  },

  deleteClass: async (id: string) => {
    const { error } = await supabase
      .from('weekly_classes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  deleteClient: async (clientId: string, userId?: string) => {
    // 1. Delete from auth if user_id exists
    if (userId) {
      try {
        await supabase.functions.invoke('delete-user', {
          body: { userId }
        });
      } catch (err) {
        console.warn('Could not delete auth user:', err);
      }
    }

    // 2. Delete from clientes table
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', clientId);

    if (error) throw error;

    // 3. Reset associated sales to 'pending'
    try {
      await supabase
        .from('sales')
        .update({
          status: 'pending',
          client_id: null,
          onboarding_completed_at: null
        })
        .eq('client_id', clientId);
    } catch (err) {
      console.warn('Could not reset associated sales:', err);
    }

    // 4. Clear local cache if any
    clients = clients.filter(c => c.id !== clientId);
  },

  // --- CLIENT CREATION (ONBOARDING) ---
  createClient: async (newClient: Partial<Client> & { password?: string }) => {
    try {
      const rowData = mapClientToRow(newClient);

      if (!rowData['created_at']) {
        rowData['created_at'] = new Date().toISOString();
      }
      if (!rowData['status']) {
        rowData['status'] = 'active';
      }

      console.log('Creating new client in CRM DB:', rowData);

      const { data: crmData, error: crmError } = await supabase
        .from(TABLE_NAME)
        .insert(rowData)
        .select()
        .single();

      if (crmError) throw crmError;

      // Create Auth User (users table) so they can login immediately
      if (newClient.password && newClient.email) {
        console.log('Creating Auth User for Client...');
        const { error: authError } = await supabase
          .from('users')
          .insert({
            id: crmData.id,
            email: newClient.email,
            password: newClient.password,
            name: `${newClient.firstName || ''} ${newClient.surname || ''}`.trim(),
            role: UserRole.CLIENT,
            avatar_url: `https://ui-avatars.com/api/?name=${newClient.firstName}`
          });

        if (authError) {
          console.warn('Could not sync ID for Auth User, creating with new ID:', authError.message);
          await supabase.from('users').insert({
            email: newClient.email,
            password: newClient.password,
            name: `${newClient.firstName || ''} ${newClient.surname || ''}`.trim(),
            role: UserRole.CLIENT,
            avatar_url: `https://ui-avatars.com/api/?name=${newClient.firstName}`
          });
        }
      }

      return mapRowToClient(crmData);
    } catch (e: any) {
      console.error('Error creating client:', e);
      throw e;
    }
  }
};

// --- ADMIN OPERATIONS ---
export const mockAdmin = {
  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        console.warn('No users table in Supabase, using mock data:', error.message);
        await delay(500);
        return [...mockUsers];
      }

      if (data && data.length > 0) {
        mockUsers = data.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role as UserRole,
          max_clients: row.max_clients,
          avatarUrl: row.avatarUrl || row.avatar_url || `https://ui-avatars.com/api/?name=${row.name}`,
          password: row.password,
          tier: row.tier,
          is_exclusive: row.is_exclusive,
          performance_notes: row.performance_notes,
          tier_updated_at: row.tier_updated_at
        }));
        return mockUsers;
      }

      if (data && data.length === 0 && mockUsers.length > 0) {
        console.log('Seeding users table with initial data...');
        const { data: seeded, error: seedError } = await supabase
          .from('users')
          .insert(mockUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar_url: u.avatarUrl,
            password: u.password || '123456'
          })))
          .select();

        if (seedError) {
          console.error('Error seeding users:', seedError);
          return [...mockUsers];
        }

        return mockUsers;
      }

      return [...mockUsers];
    } catch (err) {
      console.error('Error fetching users:', err);
      await delay(500);
      return [...mockUsers];
    }
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User & { manualMode?: boolean, tempPassword?: string }> => {
    const tempPassword = (user as any).password || Math.random().toString(36).slice(-8);
    const tempId = Math.random().toString(36).substr(2, 9);

    const newUserObj = {
      ...user,
      id: tempId,
      avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`,
      password: tempPassword
    };

    // ATTEMPT PROFESSIONAL INVITATION (Edge Function)
    try {
      console.log('Attemping to invite via Edge Function...');
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: user.email,
          name: user.name,
          role: user.role,
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      console.log('Invitation sent successfully:', data);

      return {
        ...newUserObj,
        id: data.user?.id || tempId,
      };

    } catch (edgeError: any) {
      console.warn('Edge Function not available or failed. Falling back to Manual Mode.', edgeError);

      // FALLBACK: MANUAL DATABASE INSERTION
      try {
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: newUserObj.id,
            name: newUserObj.name,
            email: newUserObj.email,
            role: newUserObj.role,
            avatar_url: newUserObj.avatarUrl,
            password: newUserObj.password
          })
          .select()
          .single();

        if (error) {
          console.warn('Could not save to Supabase public table either, using mock storage:', error.message);
          await delay(500);
          mockUsers.push(newUserObj);
          return { ...newUserObj, manualMode: true, tempPassword };
        }

        mockUsers.push(newUserObj);
        return { ...newUserObj, manualMode: true, tempPassword };

      } catch (err) {
        console.error('Error creating user entirely:', err);
        await delay(500);
        mockUsers.push(newUserObj);
        return { ...newUserObj, manualMode: true, tempPassword };
      }
    }
  },

  updateUser: async (user: User): Promise<User> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: user.name,
          email: user.email,
          role: user.role,
          max_clients: user.max_clients,
          avatar_url: user.avatarUrl,
          password: (user as any).password,
          tier: user.tier,
          is_exclusive: user.is_exclusive,
          performance_notes: user.performance_notes,
          tier_updated_at: user.tier_updated_at
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.warn('Could not update in Supabase, using mock storage:', error.message);
        await delay(500);
        mockUsers = mockUsers.map(u => u.id === user.id ? user : u);
        return user;
      }

      mockUsers = mockUsers.map(u => u.id === user.id ? user : u);
      return user;
    } catch (err) {
      console.error('Error updating user:', err);
      await delay(500);
      mockUsers = mockUsers.map(u => u.id === user.id ? user : u);
      return user;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      const { data, error: functionError } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (functionError) {
        console.warn('Edge Function delete-user no disponible o error:', functionError.message);

        const { error: dbError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (dbError) {
          throw new Error(`No se pudo eliminar de la base de datos: ${dbError.message}`);
        }
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      await supabase.from('users').delete().eq('id', userId);
    }

    mockUsers = mockUsers.filter(u => u.id !== userId);
    await delay(300);
  },

  runDiagnostics: async () => {
    try {
      const { data, error, count } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      const { data: sample } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .limit(1);

      return {
        success: true,
        count: count,
        columns: sample && sample.length > 0 ? Object.keys(sample[0]) : [],
        sample: sample && sample.length > 0 ? sample[0] : null
      };
    } catch (err) {
      return { success: false, error: err };
    }
  }
};

// --- EVOLUTION / CRM OPERATIONS ---
export const mockEvolution = {
  tasks: {
    getAll: async (): Promise<CoachTask[]> => {
      const { data, error } = await supabase
        .from('coach_tasks')
        .select(`
          *,
          ${TABLE_NAME}(id, first_name, surname)
        `)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching all tasks:', error);
        return [];
      }

      return (data || []).map(t => ({
        ...t,
        client_name: t[TABLE_NAME] ? `${t[TABLE_NAME].first_name || ''} ${t[TABLE_NAME].surname || ''}`.trim() : 'Desconocido'
      })) as CoachTask[];
    },

    getByCoach: async (coachId: string): Promise<CoachTask[]> => {
      const { data, error } = await supabase
        .from('coach_tasks')
        .select(`
          *,
          ${TABLE_NAME}(id, first_name, surname)
        `)
        .eq('coach_id', coachId)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching tasks from DB:', error);
        return [];
      }

      return (data || []).map(t => ({
        ...t,
        client_name: t[TABLE_NAME] ? `${t[TABLE_NAME].first_name || ''} ${t[TABLE_NAME].surname || ''}`.trim() : 'Desconocido'
      })) as CoachTask[];
    },

    create: async (task: Partial<CoachTask>) => {
      const { data, error } = await supabase
        .from('coach_tasks')
        .insert(task)
        .select()
        .single();
      if (error) throw error;
      return data as CoachTask;
    },

    update: async (taskId: string, updates: Partial<CoachTask>) => {
      const { error } = await supabase
        .from('coach_tasks')
        .update(updates)
        .eq('id', taskId);
      if (error) throw error;
    },

    delete: async (taskId: string) => {
      const { error } = await supabase
        .from('coach_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },

    getStaff: async () => {
      return await supabase
        .from('users')
        .select('*')
        .order('name');
    }
  },

  notifications: {
    getByUser: async (userId: string): Promise<UnifiedNotification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return data as UnifiedNotification[];
    },

    markAsRead: async (notificationId: string) => {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
    },

    create: async (notification: Partial<UnifiedNotification>) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();
      if (error) throw error;
      return data as UnifiedNotification;
    }
  },

  tickets: {
    getAll: async (): Promise<SupportTicket[]> => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          ${TABLE_NAME}(id, first_name, surname),
          users!created_by(id, name),
          target_staff:users!staff_id(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tickets:', error);
        return [];
      }
      return (data || []).map(t => ({
        ...t,
        client_name: t[TABLE_NAME] ? `${t[TABLE_NAME].first_name || ''} ${t[TABLE_NAME].surname || ''}`.trim() : undefined,
        staff_name: (t as any).target_staff?.name,
        creator_name: (t as any).users?.name || 'Sistema'
      })) as SupportTicket[];
    },

    getByClient: async (clientId: string): Promise<SupportTicket[]> => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          ${TABLE_NAME}(id, first_name, surname),
          users!created_by(id, name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map(t => ({
        ...t,
        client_name: t[TABLE_NAME] ? `${t[TABLE_NAME].first_name || ''} ${t[TABLE_NAME].surname || ''}`.trim() : 'Desconocido',
        creator_name: (t as any).users?.name || 'Sistema'
      })) as SupportTicket[];
    },

    update: async (id: string, updates: Partial<SupportTicket>) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SupportTicket;
    },

    create: async (ticket: Partial<SupportTicket>) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticket)
        .select()
        .single();
      if (error) throw error;
      return data as SupportTicket;
    },

    comments: {
      getByTicket: async (ticketId: string): Promise<SupportTicketComment[]> => {
        const { data, error } = await supabase
          .from('ticket_comments')
          .select(`
            *,
            users(name, photo_url)
          `)
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (error) return [];
        return (data || []).map(c => ({
          ...c,
          user_name: (c as any).users?.name || 'Usuario',
          user_photo: (c as any).users?.photo_url
        })) as SupportTicketComment[];
      },

      create: async (comment: Partial<SupportTicketComment>) => {
        const { data, error } = await supabase
          .from('ticket_comments')
          .insert(comment)
          .select()
          .single();
        if (error) throw error;
        return data as SupportTicketComment;
      }
    }
  },

  invoices: {
    getAll: async (): Promise<CoachInvoice[]> => {
      const { data, error } = await supabase
        .from('coach_invoices')
        .select(`
          *,
          users!coach_id(name)
        `)
        .order('submitted_at', { ascending: false });

      if (error) return [];
      return (data || []).map(i => ({
        ...i,
        coach_name: i.users?.name
      })) as CoachInvoice[];
    },

    getByCoach: async (coachId: string): Promise<CoachInvoice[]> => {
      const { data, error } = await supabase
        .from('coach_invoices')
        .select('*')
        .eq('coach_id', coachId)
        .order('period_date', { ascending: false });

      if (error) return [];
      return data as CoachInvoice[];
    },

    create: async (invoice: Partial<CoachInvoice>) => {
      const { data, error } = await supabase
        .from('coach_invoices')
        .insert(invoice)
        .select()
        .single();
      if (error) throw error;
      return data as CoachInvoice;
    },

    update: async (id: string, updates: Partial<CoachInvoice>) => {
      const { data, error } = await supabase
        .from('coach_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CoachInvoice;
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('coach_invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  }
};
