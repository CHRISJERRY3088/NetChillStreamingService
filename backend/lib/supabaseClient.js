import { createClient } from '@supabase/supabase-js';
import "dotenv/config";

function createFallbackClient() {
  const makeQuery = () => ({
    select() { return this; },
    eq() { return this; },
    limit() { return Promise.resolve({ data: [], error: null }); },
    single() { return Promise.resolve({ data: null, error: { code: 'PGRST116' } }); },
    insert() { return Promise.resolve({ data: null, error: null }); },
    update() { return Promise.resolve({ data: null, error: null }); },
    order() { return this; },
  });

  return {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
      signOut: async () => ({ error: null }),
      updateUser: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
      getUser: async () => ({ data: { user: null }, error: { message: 'Supabase is not configured' } }),
    },
    from: () => makeQuery(),
  };
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : createFallbackClient();