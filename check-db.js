import fs from 'fs';
import pg from 'pg';

const env = fs.readFileSync('.env.production', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('POSTGRES_URL=')).split('=')[1].replace(/"/g, '').trim();

const { Pool } = pg;
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function check() {
  const { rows } = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='teacher_checklists'");
  console.log('Columns in teacher_checklists:', rows.map(r => r.column_name));
  pool.end();
}
check();
