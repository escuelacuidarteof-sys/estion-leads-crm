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

async function checkTable() {
    const tables = ['clientes', 'clientes_ado_notion'];
    for (const table of tables) {
        console.log(`Checking table '${table}'...`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error accessing ${table}:`, error.message);
        } else {
            console.log(`${table} exists. Records:`, data.length);
        }
    }
}

checkTable();
