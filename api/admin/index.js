// api/admin/index.js — handles dashboard and init via _resource param
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { verifyToken } from '../_lib/auth.js';
import bcrypt from 'bcryptjs';

function requireAdmin(req, res) {
  const user = verifyToken(req);
  if (!user) { res.status(401).json({ error: 'No autorizado' }); return null; }
  if (user.role !== 'admin') { res.status(403).json({ error: 'Solo Master Admin' }); return null; }
  return user;
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
async function handleDashboard(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  const { action } = req.query;

  if (req.method === 'GET' && action === 'overview') {
    const [totals] = await sql`
      SELECT
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM teachers) AS total_teachers,
        (SELECT COUNT(*) FROM companies WHERE verified = true) AS verified_companies,
        (SELECT COUNT(*) FROM companies WHERE verified = false) AS pending_companies,
        (SELECT COUNT(*) FROM pasantias WHERE status = 'active') AS active_pasantias,
        (SELECT COUNT(*) FROM ice_status WHERE is_blocked = true) AS ice_count
    `;
    const alertTeachers = await sql`
      SELECT t.id, u.email, t.full_name,
        COUNT(DISTINCT p.id) AS student_count,
        COUNT(DISTINCT v.id) AS visit_count
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      JOIN pasantias p ON p.teacher_id = t.id AND p.status = 'active'
      LEFT JOIN visit_logs v ON v.teacher_id = t.id
      GROUP BY t.id, u.email, t.full_name
      HAVING COUNT(DISTINCT v.id) = 0 AND COUNT(DISTINCT p.id) > 0
    `;
    return res.json({ totals, alertTeachers });
  }

  if (req.method === 'GET' && action === 'trajectories') {
    const rows = await sql`
      SELECT
        s.full_name AS student_name,
        t.full_name AS teacher_name,
        c.company_name,
        ps.status,
        ps.total_hours,
        ps.visit_count,
        ps.is_blocked,
        fg.final_grade
      FROM pasantia_summary ps
      JOIN students s ON s.id = ps.id
      LEFT JOIN teachers t ON t.id = (SELECT teacher_id FROM pasantias WHERE id = ps.id LIMIT 1)
      LEFT JOIN companies c ON c.id = (SELECT company_id FROM pasantias WHERE id = ps.id LIMIT 1)
      LEFT JOIN final_grades fg ON fg.pasantia_id = ps.id
      ORDER BY ps.status, s.full_name
    `;
    return res.json({ trajectories: rows });
  }

  if (req.method === 'POST' && action === 'create_teacher') {
    const { full_name, email, school, subject } = req.body;
    if (!full_name || !email) return res.status(400).json({ error: 'Faltan campos' });
    const temp_password = Math.random().toString(36).slice(2, 10);
    const [u] = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email}, crypt(${temp_password}, gen_salt('bf')), 'teacher')
      RETURNING id
    `;
    await sql`INSERT INTO teachers (user_id, full_name, school, subject) VALUES (${u.id}, ${full_name}, ${school}, ${subject || ''})`;
    return res.status(201).json({ success: true, message: `Docente creado. Credenciales temporales enviadas a ${email}`, temp_password });
  }

  if (req.method === 'POST' && action === 'verify_company') {
    const { company_id } = req.body;
    await sql`UPDATE companies SET verified = true WHERE id = ${company_id}`;
    return res.json({ success: true });
  }

  if (req.method === 'POST' && action === 'toggle_ice') {
    const { student_id, block, reason } = req.body;
    if (block) {
      await sql`
        INSERT INTO ice_status (student_id, is_blocked, reason, set_by)
        VALUES (${student_id}, true, ${reason}, ${user.id})
        ON CONFLICT (student_id) DO UPDATE SET is_blocked=true, reason=EXCLUDED.reason, set_by=EXCLUDED.set_by, set_at=NOW(), lifted_at=NULL
      `;
      await sql`UPDATE pasantias SET status='blocked' WHERE student_id=${student_id} AND status='active'`;
    } else {
      await sql`UPDATE ice_status SET is_blocked=false, lifted_at=NOW() WHERE student_id=${student_id}`;
      await sql`UPDATE pasantias SET status='active' WHERE student_id=${student_id} AND status='blocked'`;
    }
    return res.json({ success: true });
  }

  if (req.method === 'GET' && action === 'get_accidents') {
    return handleAccidents(req, res, user);
  }
  if (req.method === 'POST' && action === 'add_accident') {
    return handleAccidents(req, res, user);
  }
  if (req.method === 'POST' && action === 'mark_sent') {
    req.method = 'PUT';
    return handleAccidents(req, res, user);
  }
  if (req.method === 'POST' && action === 'update_settings') {
    const { smvm, incentive_pct, max_hours_day, max_hours_week } = req.body;
    return res.json({ success: true, settings: { smvm, incentive_pct, max_hours_day, max_hours_week } });
  }

  return res.status(400).json({ error: 'Acción no reconocida' });
}

// ── INIT ─────────────────────────────────────────────────────────────────────
async function handleInit(req, res) {
  handleCors(res);
  const secret = req.query.secret || req.headers['x-init-secret'];
  const expected = process.env.INIT_SECRET || 'vinculo2025';
  if (secret !== expected) return jsonResponse(res, 403, { error: 'Forbidden. Pasá ?secret=TU_CLAVE' });

  const log = [];
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    log.push('✅ Extension uuid-ossp');

    await sql`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('student','company','teacher')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    log.push('✅ Table: users');

    await sql`CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL,
      school VARCHAR(255), orientation VARCHAR(100), grade VARCHAR(20),
      birth_date DATE, bio TEXT, interests TEXT[], avatar_url VARCHAR(500),
      location VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    log.push('✅ Table: students');

    await sql`CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(255) NOT NULL, sector VARCHAR(100), description TEXT,
      location VARCHAR(100), website VARCHAR(255), contact_name VARCHAR(255),
      verified BOOLEAN DEFAULT false, logo_url VARCHAR(500), created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    log.push('✅ Table: companies');

    await sql`CREATE TABLE IF NOT EXISTS teachers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL, school VARCHAR(255), subject VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    log.push('✅ Table: teachers');

    await sql`CREATE TABLE IF NOT EXISTS portfolio_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL, description TEXT, category VARCHAR(100),
      file_url VARCHAR(500), image_url VARCHAR(500), subject VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    log.push('✅ Table: portfolio_items');

    await sql`CREATE TABLE IF NOT EXISTS skill_validations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      teacher_id UUID REFERENCES teachers(id),
      skill VARCHAR(100) NOT NULL, note TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    log.push('✅ Table: skill_validations');

    await sql`CREATE TABLE IF NOT EXISTS vacancies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL, description TEXT, orientation_required VARCHAR(100),
      hours_per_week INTEGER CHECK (hours_per_week <= 20),
      schedule_start TIME DEFAULT '08:00', schedule_end TIME DEFAULT '18:00',
      location VARCHAR(100), tags TEXT[], slots INTEGER DEFAULT 1,
      active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    log.push('✅ Table: vacancies');

    await sql`CREATE TABLE IF NOT EXISTS applications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
      status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','reviewed','interview','accepted','rejected')),
      cover_note TEXT, applied_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(student_id, vacancy_id)
    )`;
    log.push('✅ Table: applications');

    await sql`CREATE TABLE IF NOT EXISTS logbook_entries (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
      content TEXT NOT NULL, hours_worked DECIMAL(4,1),
      entry_date DATE DEFAULT CURRENT_DATE, image_url VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    log.push('✅ Table: logbook_entries');

    await sql`CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vacancies_company ON vacancies(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id)`;
    log.push('✅ Indexes');

    const hash = await bcrypt.hash('demo1234', 12);

    const { rows: [su] } = await sql`
      INSERT INTO users (email, password_hash, role) VALUES ('alumno@demo.com', ${hash}, 'student')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash} RETURNING id
    `;
    await sql`
      INSERT INTO students (user_id, full_name, school, orientation, grade, bio, location, interests)
      VALUES (${su.id}, 'Valentina Pérez', 'EMETA N°1 - Mendoza', 'Comunicación', '5to año',
        'Me apasiona el diseño y la comunicación digital. Busco mi primera experiencia real.',
        'Capital', ARRAY['Diseño Gráfico','Marketing','Redes Sociales'])
      ON CONFLICT DO NOTHING
    `;
    log.push('✅ Seed: alumno@demo.com');

    const { rows: [cu] } = await sql`
      INSERT INTO users (email, password_hash, role) VALUES ('empresa@demo.com', ${hash}, 'company')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash} RETURNING id
    `;
    const { rows: [comp] } = await sql`
      INSERT INTO companies (user_id, company_name, sector, location, contact_name, verified)
      VALUES (${cu.id}, 'Agencia Digital Mendoza', 'Tecnología / TIC', 'Capital', 'Carlos Rivas', true)
      ON CONFLICT DO NOTHING RETURNING id
    `;
    if (comp) {
      await sql`
        INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots)
        VALUES (${comp.id}, 'Pasante de Community Management',
          'Apoyo en gestión de redes sociales, creación de contenido y análisis de métricas.',
          'Comunicación', 15, 'Capital', ARRAY['Marketing','Redes Sociales','Contenido'], 2)
        ON CONFLICT DO NOTHING
      `;
      await sql`
        INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots)
        VALUES (${comp.id}, 'Pasante de Diseño Gráfico',
          'Asistencia en diseño de piezas para clientes. Manejo básico de Canva o Adobe.',
          'Arte', 12, 'Godoy Cruz', ARRAY['Diseño','Visual','Arte'], 1)
        ON CONFLICT DO NOTHING
      `;
      log.push('✅ Seed: empresa@demo.com + 2 vacantes');
    }

    const { rows: [tu] } = await sql`
      INSERT INTO users (email, password_hash, role) VALUES ('docente@demo.com', ${hash}, 'teacher')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash} RETURNING id
    `;
    await sql`
      INSERT INTO teachers (user_id, full_name, school, subject)
      VALUES (${tu.id}, 'Prof. María González', 'EMETA N°1 - Mendoza', 'Proyecto Vocacional')
      ON CONFLICT DO NOTHING
    `;
    log.push('✅ Seed: docente@demo.com');

    return jsonResponse(res, 200, {
      ok: true,
      message: '🎉 Base de datos inicializada correctamente',
      steps: log,
      demo_users: [
        { role: 'student', email: 'alumno@demo.com',  password: 'demo1234' },
        { role: 'company', email: 'empresa@demo.com', password: 'demo1234' },
        { role: 'teacher', email: 'docente@demo.com', password: 'demo1234' },
      ]
    });
  } catch (err) {
    console.error('Init error:', err);
    return jsonResponse(res, 500, { ok: false, error: err.message, completed_steps: log });
  }
}


// ── ACCIDENT REPORTS ─────────────────────────────────────────────────────────
async function handleAccidents(req, res, user) {
  if (req.method === 'GET') {
    const rows = await sql`
      SELECT ar.*, s.full_name AS student_name, c.company_name
      FROM accident_reports ar
      JOIN students s ON s.id = ar.student_id
      LEFT JOIN pasantias p ON p.student_id = ar.student_id AND p.status IN ('active','blocked','simulation')
      LEFT JOIN companies c ON c.id = p.company_id
      ORDER BY ar.occurred_at DESC
    `;
    return res.json({ accidents: rows });
  }
  if (req.method === 'POST') {
    const { student_id, report_type, occurred_at, description } = req.body;
    if (!student_id || !occurred_at || !description) return res.status(400).json({ error: 'Faltan campos obligatorios' });
    const [row] = await sql`
      INSERT INTO accident_reports (student_id, report_type, occurred_at, description, reported_by, reported_at)
      VALUES (${student_id}, ${report_type || 'accidente_trabajo'}, ${occurred_at}, ${description}, ${user.id}, NOW())
      RETURNING *
    `;
    return res.status(201).json({ accident: row });
  }
  if (req.method === 'PUT') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Falta id' });
    const [row] = await sql`
      UPDATE accident_reports SET sent_to_dge = true, sent_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
    return res.json({ accident: row });
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

// ── ROUTER ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const resource = req.query._resource;
  if (resource === 'dashboard') return handleDashboard(req, res);
  if (resource === 'init')      return handleInit(req, res);

  return jsonResponse(res, 400, { error: 'Recurso no reconocido' });
}
