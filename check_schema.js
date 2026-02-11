
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking schema...');

    // Check leads_escuela_cuidarte columns by selecting 1 record
    const { data: leads, error: leadsError } = await supabase
        .from('leads_escuela_cuidarte')
        .select('*')
        .limit(1);

    if (leadsError) {
        console.error('Error fetching leads:', leadsError.message);
    } else if (leads.length > 0) {
        const columns = Object.keys(leads[0]);
        console.log('Existing columns in leads_escuela_cuidarte:', columns);

        const missingColumns = [
            'status', 'score', 'notes', 'last_contacted_at',
            'appointment_at', 'closer_id', 'call_outcome', 'sale_amount'
        ].filter(col => !columns.includes(col));

        if (missingColumns.length === 0) {
            console.log('ALL CRM columns are present.');
        } else {
            console.log('Missing CRM columns:', missingColumns);
        }
    } else {
        console.log('Table leads_escuela_cuidarte is empty, cannot verify columns strictly from data.');
    }

    // Check if scoring_rules table exists
    const { data: rules, error: rulesError } = await supabase
        .from('scoring_rules')
        .select('*')
        .limit(1);

    if (rulesError) { // If table doesn't exist, this usually errors
        console.log('Table scoring_rules does NOT exist (or permission denied). Error:', rulesError.message);
    } else {
        console.log('Table scoring_rules EXISTS.');
    }
}

checkSchema();
