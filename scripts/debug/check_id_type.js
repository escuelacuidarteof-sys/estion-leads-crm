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

async function checkIdType() {
    console.log("Checking ID type for table 'clientes'...");
    const { data, error } = await supabase.from('clientes').select('id').limit(1);
    
    if (error) {
        console.error("Error:", error.message);
    } else if (data && data.length > 0) {
        console.log("Example ID:", data[0].id);
        console.log("Type:", typeof data[0].id);
    } else {
        console.log("No records found in 'clientes' to check type.");
    }
}

checkIdType();
