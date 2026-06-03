import fs from 'fs';
import pg from 'pg';

const env = fs.readFileSync('.env.production', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('POSTGRES_URL=')).split('=')[1].replace(/"/g, '').trim();

const { Pool } = pg;
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function check() {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, u.email, u.role,
        t.full_name AS teacher_name,
        p.id AS pasantia_id, p.status AS pasantia_status,
        c.company_name,
        COALESCE(SUM(att.hours_worked),0)::DECIMAL(6,1) AS total_hours,
        COUNT(DISTINCT v.id) AS visit_count,
        EXISTS(SELECT 1 FROM ice_status i WHERE i.student_id=s.id AND i.is_blocked) AS ice
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN pasantias p ON p.student_id = s.id AND p.status IN ('active','simulation','blocked')
      LEFT JOIN teachers t ON t.id = p.teacher_id
      LEFT JOIN companies c ON c.id = p.company_id
      LEFT JOIN attendance att ON att.pasantia_id = p.id
      LEFT JOIN visit_logs v ON v.pasantia_id = p.id
      GROUP BY s.id, u.email, u.role, t.full_name, p.id, p.status, c.company_name
      ORDER BY s.full_name
    `);
    console.log('Query succeeded!', rows.length, 'rows');
  } catch (err) {
    console.error('Query failed:', err.message);
  } finally {
    pool.end();
  }
}
check();
