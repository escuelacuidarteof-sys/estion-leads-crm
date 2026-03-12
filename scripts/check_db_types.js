import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTypes() {
  const { data, error } = await supabase.rpc('run_sql', {
    sql_query: `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' AND column_name = 'id';
    `
  });

  if (error) {
    console.error('Error:', error);
    // If run_sql is not available, try to insert a dummy and see the error or use another way
    console.log('Maybe run_sql is not available. Trying to fetch one row and check type of ID.');
    const { data: row } = await supabase.from('clientes').select('id').limit(1).single();
    if (row) {
      console.log('Sample ID:', row.id, 'Type:', typeof row.id);
      // Check if it looks like a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id);
      console.log('Is valid UUID string?', isUUID);
    }
  } else {
    console.log('Columns types:', data);
  }
}

checkTypes();
