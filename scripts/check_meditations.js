import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkMeditations() {
  const { data, error } = await supabase
    .from('materials_library')
    .select('*')
    .eq('category', 'meditacion');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Meditations found:', data.length);
    data.forEach(m => {
      console.log(`- Title: ${m.title}, URL: ${m.url}, Tags: ${m.tags}`);
    });
  }
}

checkMeditations();
