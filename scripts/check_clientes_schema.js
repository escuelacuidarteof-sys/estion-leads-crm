import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'clientes' });
  if (error) {
    // If rpc doesn't exist, try a simple query
    console.log('RPC failed, trying query...');
    const { data: cols, error: colError } = await supabase
      .from('clientes')
      .select('*')
      .limit(1);
    
    if (colError) {
      console.error('Error fetching clientes:', colError);
    } else {
      console.log('Columns in clientes:', Object.keys(cols[0] || {}));
    }
  } else {
    console.log('Table info:', data);
  }
}

checkSchema();
