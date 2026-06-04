import { createClient } from '@supabase/supabase-js';
// pulls function from supabase package that letsme connect to database

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;


//opens connection to database 
const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

export default supabase;