require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection to Supabase...');
    try {
        // Try to fetch data from a common table or just list something simple
        // Since we don't know the schema, we'll try to list tables using a query if possible,
        // or just a simple query if we knew a table name.
        // However, listing tables usually requires admin rights or knowing the schema.
        // Let's try to get the user or something generic.
        // Actually, let's try to query 'leads_escuela_cuidarte' since it was mentioned in previous conversations.
        // If that fails, we can catch the error.

        // First, let's just check if we can authenticate.
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        // If we're using a secret key (service_role), getUser might return null if no user is signed in,
        // but the client itself is valid.

        console.log('Attempting to query "leads_escuela_cuidarte"...');
        const { data, error } = await supabase
            .from('leads_escuela_cuidarte')
            .select('*')
            .limit(5);

        if (error) {
            console.error('Error querying table:', error.message);
        } else {
            console.log('Successfully connected! Data sample:');
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
