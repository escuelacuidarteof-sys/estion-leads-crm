import { supabase } from './supabaseClient';
import { Lead, LeadStatus, Client, ClientStatus } from '../types';
import { BUSINESS_CONFIG } from '../config/business';

const LEADS_TABLE = BUSINESS_CONFIG.tables.leads;

export const leadsService = {
    // --- CRUD ---

    async getLeads(): Promise<Lead[]> {
        const { data, error } = await supabase
            .from(LEADS_TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
            throw error;
        }

        // Map data and compute fullName
        return (data || []).map((lead: any) => ({
            ...lead,
            name: `${lead.firstName} ${lead.surname}`
        }));
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

    // --- ACTIONS ---

    /**
     * Converts a WON lead into a Client directly in the database.
     * 1. Creates Client record
     * 2. (Optional) Deletes Lead or marks as Archived
     */
    async convertLeadToClient(lead: Lead, assignedCoachId: string): Promise<string> {
        // 1. Prepare Client Data
        // NOTE: This assumes default values for a new client
        const newClient: Partial<Client> = {
            firstName: lead.firstName,
            surname: lead.surname,
            email: lead.email || '',
            phone: lead.phone || '',
            instagram: lead.instagram_user || '',
            coach_id: assignedCoachId,
            status: ClientStatus.ACTIVE,
            registration_date: new Date().toISOString().split('T')[0],
            start_date: new Date().toISOString().split('T')[0],

            // Default subscription data
            program: {
                subscriptionType: 'monthly',
                startDate: new Date().toISOString().split('T')[0],
                autoRenewal: true
            } as any,
            medical: {} as any,
            nutrition: {} as any,
            training: {} as any,
            goals: {} as any
        };

        // 2. Insert into 'clientes' table
        const { data: clientData, error: clientError } = await supabase
            .from('clientes')
            .insert([newClient])
            .select('id')
            .single();

        if (clientError) {
            console.error('Error converting lead to client:', clientError);
            throw new Error('No se pudo crear el cliente.');
        }

        // 3. Mark Lead as WON if not already
        if (lead.status !== 'WON') {
            await this.updateLeadStatus(lead.id, 'WON');
        }

        // 4. (Optional) Archive lead or just leave it as WON history
        // For now we just return the new client ID
        return clientData.id;
    }
};
