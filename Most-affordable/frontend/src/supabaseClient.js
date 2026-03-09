import { createClient } from '@supabase/supabase-js';

// These should ideally be in a .env local file.
// For demonstration and test purposes we use placeholder values
// that the Admin must replace with their own Supabase keys (found in the guide).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ubymqfmqxasmppqaurbj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieW1xZm1xeGFzbXBwcWF1cmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjYyMTcsImV4cCI6MjA4ODYwMjIxN30.6xMFRyZGJ-w0kSY3cIz8Lr8OLFylykKErwDL2JD7vHA';

export const supabase = createClient(supabaseUrl, supabaseKey);
