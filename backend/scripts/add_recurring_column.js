import { Client } from 'pg';
import path from 'node:path';
import fs from 'fs';

async function main() {
  const sqlPath = path.resolve(process.cwd(), 'backend', 'sql', '003_add_recurring_billing_enabled.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration SQL not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = process.env.DATABASE_URL;
  if (!connection) {
    console.error('DATABASE_URL environment variable not set. Provide a Postgres connection URL to run the migration.');
    process.exit(1);
  }

  const client = new Client({ connectionString: connection });
  try {
    await client.connect();
    console.log('Connected to DB, running migration...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    try { await client.query('ROLLBACK'); } catch (_) {}
    process.exit(1);
  } finally {
    await client.end().catch(()=>{});
  }
}

main();
