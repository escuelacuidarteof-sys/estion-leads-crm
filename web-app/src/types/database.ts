export interface Lead {
    id: string;
    created_at: string;
    name: string;
    email: string;
    phone: string;
    age: string;
    sex: string;
    situation: string; // The text description
    interest: string;
    status: 'new' | 'contacted' | 'appointment_set' | 'show' | 'no_show' | 'sold' | 'lost' | 'unqualified';
    score: number;
    notes: string | null;
    last_contacted_at: string | null;
    appointment_at: string | null;
    closer_id: string | null;
    call_outcome: string | null;
    sale_amount: number | null;
    // Other fields relevant to scoring
    situacion: string | null;
    tipo_cancer: string | null;
    estadio: string | null;
    perdida_peso: string | null;
    actividad_fisica: string | null;
    nivel_compromiso: number | null;
    disponibilidad: string | null;
    downloaded_kit: boolean;
    computedScore?: number;
}

export interface ScoringRule {
    id: string;
    field_name: string;
    value_match: string;
    points: number;
}

export interface TeamMember {
    id: string;
    created_at: string;
    name: string;
    role: string;
    active: boolean;
}
