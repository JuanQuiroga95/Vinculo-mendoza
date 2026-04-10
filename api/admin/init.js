// api/admin/init.js
// Crea las tablas y carga datos de demo en un solo request.
// Protegido con ?secret=INIT_SECRET (variable de entorno en Vercel)

import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Protección básica: requerir ?secret=... o header x-init-secret
  const secret = req.query.secret || req.headers['x-init-secret'];
  const expected = process.env.INIT_SECRET || 'vinculo2025';
  if (secret !== expected) {
    return jsonResponse(res, 403, { error: 'Forbidden. Pasá ?secret=TU_CLAVE' });
  }

  const log = [];

  try {
    // ── 1. EXTENSIÓN ──────────────────────────────────────────
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    log.push('✅ Extension uuid-ossp');

    // ── 2. USERS ──────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'company', 'teacher')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    log.push('✅ Table: users');

    // ── 3. STUDENTS ───────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        school VARCHAR(255),
        orientation VARCHAR(100),
        grade VARCHAR(20),
        birth_date DATE,
        bio TEXT,
        interests TEXT[],
        avatar_url VARCHAR(500),
        location VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    log.push('✅ Table: students');

    // ── 4. COMPANIES ──────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        sector VARCHAR(100),
        description TEXT,
        location VARCHAR(100),
        website VARCHAR(255),
        contact_name VARCHAR(255),
        verified BOOLEAN DEFAULT false,
        logo_url VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    log.push('✅ Table: companies');

    // ── 5. TEACHERS ───────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS teachers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        school VARCHAR(255),
        subject VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    log.push('✅ Table: teachers');

    // ── 6. PORTFOLIO ──────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS portfolio_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        file_url VARCHAR(500),
        image_url VARCHAR(500),
        subject VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    log.push('✅ Table: portfolio_items');

    // ── 7. SKILL VALIDATIONS ──────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS skill_validations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES teachers(id),
        skill VARCHAR(100) NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    log.push('✅ Table: skill_validations');

    // ── 8. VACANCIES ──────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS vacancies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        orientation_required VARCHAR(100),
        hours_per_week INTEGER CHECK (hours_per_week <= 20),
        schedule_start TIME DEFAULT '08:00',
        schedule_end TIME DEFAULT '18:00',
        location VARCHAR(100),
        tags TEXT[],
        slots INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    log.push('✅ Table: vacancies');

    // ── 9. APPLICATIONS ───────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
        status VARCHAR(30) DEFAULT 'pending'
          CHECK (status IN ('pending','reviewed','interview','accepted','rejected')),
        cover_note TEXT,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(student_id, vacancy_id)
      )
    `;
    log.push('✅ Table: applications');

    // ── 10. LOGBOOK ───────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS logbook_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        hours_worked DECIMAL(4,1),
        entry_date DATE DEFAULT CURRENT_DATE,
        image_url VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    log.push('✅ Table: logbook_entries');

    // ── 11. INDEXES ───────────────────────────────────────────
    await sql`CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vacancies_company ON vacancies(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id)`;
    log.push('✅ Indexes');

    // ── 12. SEED DEMO DATA ────────────────────────────────────
    const hash = await bcrypt.hash('demo1234', 12);

    // Student
    const { rows: [su] } = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES ('alumno@demo.com', ${hash}, 'student')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
      RETURNING id
    `;
    await sql`
      INSERT INTO students (user_id, full_name, school, orientation, grade, bio, location, interests)
      VALUES (
        ${su.id}, 'Valentina Pérez', 'EMETA N°1 - Mendoza',
        'Comunicación', '5to año',
        'Me apasiona el diseño y la comunicación digital. Busco mi primera experiencia real.',
        'Capital', ARRAY['Diseño Gráfico','Marketing','Redes Sociales']
      )
      ON CONFLICT DO NOTHING
    `;
    log.push('✅ Seed: alumno@demo.com');

    // Company
    const { rows: [cu] } = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES ('empresa@demo.com', ${hash}, 'company')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
      RETURNING id
    `;
    const { rows: [comp] } = await sql`
      INSERT INTO companies (user_id, company_name, sector, location, contact_name, verified)
      VALUES (${cu.id}, 'Agencia Digital Mendoza', 'Tecnología / TIC', 'Capital', 'Carlos Rivas', true)
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    if (comp) {
      await sql`
        INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots)
        VALUES (
          ${comp.id},
          'Pasante de Community Management',
          'Apoyo en gestión de redes sociales, creación de contenido y análisis de métricas.',
          'Comunicación', 15, 'Capital',
          ARRAY['Marketing','Redes Sociales','Contenido'], 2
        ) ON CONFLICT DO NOTHING
      `;
      await sql`
        INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots)
        VALUES (
          ${comp.id},
          'Pasante de Diseño Gráfico',
          'Asistencia en diseño de piezas para clientes. Manejo básico de Canva o Adobe.',
          'Arte', 12, 'Godoy Cruz',
          ARRAY['Diseño','Visual','Arte'], 1
        ) ON CONFLICT DO NOTHING
      `;
      log.push('✅ Seed: empresa@demo.com + 2 vacantes');
    }

    // Teacher
    const { rows: [tu] } = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES ('docente@demo.com', ${hash}, 'teacher')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
      RETURNING id
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
        { role: 'student',  email: 'alumno@demo.com',  password: 'demo1234' },
        { role: 'company',  email: 'empresa@demo.com', password: 'demo1234' },
        { role: 'teacher',  email: 'docente@demo.com', password: 'demo1234' },
      ]
    });

  } catch (err) {
    console.error('Init error:', err);
    return jsonResponse(res, 500, {
      ok: false,
      error: err.message,
      completed_steps: log,
    });
  }
}
