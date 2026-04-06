import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  const { error } = await supabase.from('staff_achievements').delete().eq('month', 3).eq('year', 2026);
  console.log('Cleaned 3/2026 duplicates:', error || 'Success');
}

clean();
