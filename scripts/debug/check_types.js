import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
};

const url = getEnvVar('VITE_SUPABASE_URL');
const key = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_KEY');

const supabase = createClient(url, key);

async function checkSchema() {
    console.log("Checking data types for 'clientes' table via RPC or inspection...");
    // Since we can't easily query information_schema directly via anon key usually unless allowed,
    // let's try to infer from a direct select and checking the metadata if possible, 
    // but better yet, let's assume the error is correct: it says 'text and uuid'.
    // Detail: Key columns "client_id" and "id" are of incompatible types: text and uuid.
    // This means one is TEXT and the other is UUID.
    // My script used TEXT for client_id. So 'id' in clientes must be UUID.
    
    // Let's verify with a quick select again just to see if we can get more info.
    const { data, error } = await supabase.from('clientes').select('id').limit(1);
    console.log("Result:", data);
}

checkSchema();
