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

async function checkColumns() {
    const { data, error } = await supabase.from('clientes').select('*').limit(1);
    if (data && data.length > 0) {
        const cols = Object.keys(data[0]);
        const targets = ['hormonal_status', 'average_cycle_length', 'hrt_treatment', 'last_period_start_date'];
        targets.forEach(t => {
            console.log(`${t}: ${cols.includes(t) ? 'EXISTS' : 'MISSING'}`);
        });
    }
}

checkColumns();
