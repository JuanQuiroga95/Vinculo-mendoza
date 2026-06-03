import fs from 'fs';
import pg from 'pg';

const env = fs.readFileSync('.env.production', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('POSTGRES_URL=')).split('=')[1].replace(/"/g, '').trim();

const { Pool } = pg;
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function runSchema(file) {
  console.log(`Running ${file}...`);
  const sql = fs.readFileSync(`./db/${file}`, 'utf-8');
  await pool.query(sql);
  console.log(`Finished ${file}`);
}

async function main() {
  try {
    await runSchema('schema_v2.sql');
    await runSchema('schema_v3.sql');
    await runSchema('migrate.sql');
    console.log('✅ Schemas updated successfully!');
  } catch (err) {
    console.error('Error running schemas:', err);
  } finally {
    await pool.end();
  }
}

main();
