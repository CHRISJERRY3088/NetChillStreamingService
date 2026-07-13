// lib/supabase/client.js
// ✅ Use 'require' instead of 'import' for Node.js (CommonJS)
// If you use "type": "module" in package.json, change this to 'import'
const { createClient } = require('@supabase/supabase-js');

// Environment variables in Node.js do NOT need NEXT_PUBLIC_ prefix
// They are just process.env.VAR_NAME
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Create and export the client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };