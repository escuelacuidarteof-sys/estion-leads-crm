import { ScoringRule, Lead } from '../types/database';

export function calculateScore(lead: Lead, rules: ScoringRule[]): number {
    let score = 0;

    // 1. Apply Rule-based scoring
    rules.forEach(rule => {
        const leadValue = (lead as any)[rule.field_name];

        // Check for exact match (string or boolean converted to string)
        if (String(leadValue) === rule.value_match) {
            score += rule.points;
        }
    });

    // 2. Apply Nivel Compromiso (Direct Addition 0-10)
    if (lead.nivel_compromiso) {
        score += Number(lead.nivel_compromiso);
    }

    return score;
}
