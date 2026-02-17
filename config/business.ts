/**
 * CONFIGURACIÓN CENTRALIZADA DEL NEGOCIO
 * ========================================
 * Este archivo contiene TODA la información específica del negocio.
 * Para adaptar el CRM a otro negocio, solo hay que modificar este archivo
 * y las variables de entorno (.env.local).
 */

export const BUSINESS_CONFIG = {
  // --- Identidad del negocio ---
  name: 'Escuela Cuid-Arte',
  shortName: 'Cuid-Arte',
  description: 'Plataforma de coaching y acompañamiento en salud',
  owner: 'Dra. Odiel Fernández',
  sector: 'Salud y Bienestar',

  // --- Branding ---
  branding: {
    primaryColor: '#6BA06B',
    secondaryColor: '#CDE8CD',
    accentColor: '#D4AF37',
    logoUrl: '/logo.png',
    signatureUrl: '/firma.png',
    themeColor: '#6BA06B',
  },

  // --- Tablas de Supabase ---
  tables: {
    clients: 'clientes',
    leads: 'leads_escuela_cuidarte',
    users: 'users',
    weightHistory: 'weight_history',
    dailyCheckins: 'daily_checkins',
    coachingSessions: 'coaching_sessions',
    messages: 'messages',
    chatRooms: 'chat_rooms',
    chatMessages: 'chat_messages',
    chatParticipants: 'chat_participants',
    notifications: 'notifications',
    appSettings: 'app_settings',
    coachInvoices: 'coach_invoices',
    supportTickets: 'support_tickets',
    supportTicketComments: 'support_ticket_comments',
    auditLog: 'audit_log',
    coachTasks: 'coach_tasks',
    nutritionPlans: 'nutrition_plans',
    nutritionRecipes: 'nutrition_recipes',
    clientNutritionAssignments: 'client_nutrition_assignments',
    clientNutritionOverrides: 'client_nutrition_overrides',
    classSessions: 'class_sessions',
    riskAlerts: 'risk_alerts',
    riskAlertComments: 'risk_alert_comments',
    contractTemplates: 'contract_templates',
    teamAnnouncements: 'team_announcements',
    coachGoals: 'coach_goals',
    clientMaterials: 'client_materials',
    bodyMeasurements: 'body_measurements',
  },

  // --- Prefijo de localStorage ---
  storagePrefix: 'ec_crm',

  // --- Roles activos ---
  roles: {
    admin: 'Administrador',
    head_coach: 'Coach Principal',
    coach: 'Coach',
    client: 'Cliente/Paciente',
    closer: 'Closer (Ventas)',
    setter: 'Setter (Cualificación)',
    contabilidad: 'Contabilidad',
    doctor: 'Médico',
    psicologo: 'Psicólogo',
    rrss: 'Redes Sociales',
    direccion: 'Dirección',
    dietitian: 'Nutricionista',
    super_admin: 'Super Admin',
  },

  // --- Modelo de negocio ---
  businessModel: {
    type: 'subscription' as const, // 'subscription' | 'phases'
    subscriptionTypes: [
      { id: 'monthly', label: 'Mensual', months: 1 },
      { id: 'quarterly', label: 'Trimestral', months: 3 },
      { id: 'biannual', label: 'Semestral', months: 6 },
      { id: 'annual', label: 'Anual', months: 12 },
    ],
  },

  // --- Moneda y locale ---
  locale: {
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'es-ES',
    timezone: 'Europe/Madrid',
  },

  // --- Datos del contrato ---
  contract: {
    companyName: 'Escuela CUIDARTE',
    companyLegalName: 'NEIKO HEALTH, S.L.', // Razón social completa
    responsibleName: 'NEIKO HEALTH, S.L.',
    responsibleId: 'B22928311', // NIF/DNI
    companyAddress: 'C/ Princesa 31, 2º puerta 2, 28008 Madrid', // Dirección fiscal
    collegiateNumber: '', // No aplica si es empresa
    serviceDescription: 'Servicio de coaching y acompañamiento personalizado en salud y bienestar',
  },

  // --- Categorías médicas (genéricas, no diabetes) ---
  medicalCategories: {
    diagnosisLabel: 'Diagnóstico principal',
    treatmentLabel: 'Tratamiento actual',
    trackingMetrics: ['weight', 'wellbeing', 'energy', 'sleep', 'pain'],
  },

  // --- Categorías de soporte ---
  supportCategories: [
    { id: 'nutricion', label: 'Nutrición' },
    { id: 'entrenamiento', label: 'Entrenamiento' },
    { id: 'tecnico_app', label: 'Técnico / App' },
    { id: 'facturacion', label: 'Facturación' },
    { id: 'medico', label: 'Médico' },
    { id: 'otros', label: 'Otros' },
  ],

  // --- Fuentes de leads ---
  leadSources: [
    'Instagram',
    'Facebook',
    'TikTok',
    'YouTube',
    'WhatsApp',
    'Formulario Web',
    'Referido',
    'Otro',
  ],
} as const;

// Helper para generar claves de localStorage
export const storageKey = (key: string): string =>
  `${BUSINESS_CONFIG.storagePrefix}_${key}`;

// Helper para formatear moneda
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat(BUSINESS_CONFIG.locale.locale, {
    style: 'currency',
    currency: BUSINESS_CONFIG.locale.currency,
  }).format(amount);

export type BusinessConfig = typeof BUSINESS_CONFIG;
