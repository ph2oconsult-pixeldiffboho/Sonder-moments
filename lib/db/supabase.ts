import { createClient } from '@supabase/supabase-js';

// Server-side client with service role (full DB access, never expose to browser)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
