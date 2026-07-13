import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env.js";

function createFallbackAdminClient() {
  const makeQuery = () => ({
    select() { return this; },
    eq() { return this; },
    lt() { return Promise.resolve({ data: [], error: null }); },
    limit() { return Promise.resolve({ data: [], error: null }); },
    single() { return Promise.resolve({ data: null, error: { code: 'PGRST116' } }); },
    insert() { return Promise.resolve({ data: null, error: null }); },
    update() { return Promise.resolve({ data: null, error: null }); },
    order() { return this; },
  });

  return {
    from: () => makeQuery(),
  };
}

export const supabaseAdmin = ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      ENV.SUPABASE_URL,
      ENV.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : createFallbackAdminClient();
