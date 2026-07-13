// supabase.js
require('dotenv').config(); // Loads variables from .env file
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
4. Update Your Main App File (e.g., index.js)
Action: Replace your current fetch/login code with this example.

// index.js
import { supabase } from './supabase.js';

// Example: Fetch data from a table named 'your_table_name'
async function getData() {
  try {
    const { data, error } = await supabase
      .from('your_table_name')
      .select('*');

    if (error) {
      console.error('Error fetching data:', error);
      return null;
    }

    console.log('Data fetched:', data);
    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}

getData();