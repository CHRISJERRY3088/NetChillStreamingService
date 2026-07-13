// app/page.jsx
import { createClient } from '@/lib/supabase/server';

// ✅ Server Component (no "use client" needed)
// ✅ Async function works in JS Server Components
async function getData() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('your_table_name').select();
  
  if (error) return <div>Error: {error.message}</div>;
  return data;
}

// ✅ Export default component (JS syntax)
export default async function Home() {
  const data = await getData();

  return (
    <main>
      <h1>Your Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
