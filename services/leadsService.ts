import { supabase } from './supabaseClient';
import { Lead, LeadStatus } from '../types';
import { BUSINESS_CONFIG } from '../config/business';

const LEADS_TABLE = BUSINESS_CONFIG.tables.leads;

export const leadsService = {
    async getLeads(): Promise<Lead[]> {
        const { data, error } = await supabase
            .from(LEADS_TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
            throw error;
        }

        return (data || []) as Lead[];
    },

    async createLead(lead: Partial<Lead>): Promise<Lead> {
        const { data, error } = await supabase
            .from(LEADS_TABLE)
            .insert([lead])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
        const { error } = await supabase
            .from(LEADS_TABLE)
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
        return this.updateLead(id, { status });
    },

    async deleteLead(id: string): Promise<void> {
        const { error } = await supabase
            .from(LEADS_TABLE)
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
