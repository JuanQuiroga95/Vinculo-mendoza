// api/admin/init.js — Inicializa BD y carga datos demo
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { handleCors, jsonResponse } from '../_lib/db.js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = pg;

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const secret = req.query.secret || req.headers['x-init-secret'];
  const expected = process.env.INIT_SECRET || 'vinculo2025';
  if (secret !== expected) return jsonResponse(res, 403, { error: 'Forbidden' });

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
    ssl: false, max: 1,
  });

  const log = [];
  const q = (text, params) => pool.query(text, params);

  try {
    await q(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── USERS ──
    await q(`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('student','company','teacher','admin')),
      school_id UUID,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ users');

    // ── SCHOOLS ──
    await q(`CREATE TABLE IF NOT EXISTS schools (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      cue VARCHAR(20) UNIQUE,
      address VARCHAR(255),
      city VARCHAR(100),
      department VARCHAR(100),
      type VARCHAR(30) DEFAULT 'orientada',
      phone VARCHAR(30),
      email VARCHAR(255),
      website VARCHAR(255),
      logo_url VARCHAR(500),
      description TEXT,
      director_name VARCHAR(255),
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ schools');

    // ── STUDENTS ──
    await q(`CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      school VARCHAR(255),
      school_id UUID REFERENCES schools(id),
      orientation VARCHAR(100),
      grade VARCHAR(20),
      birth_date DATE,
      bio TEXT,
      interests TEXT[],
      avatar_url VARCHAR(500),
      phone VARCHAR(30),
      linkedin_url VARCHAR(255),
      location VARCHAR(100),
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ students');

    // ── COMPANIES ──
    await q(`CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      company_name VARCHAR(255) NOT NULL,
      sector VARCHAR(100),
      description TEXT,
      location VARCHAR(100),
      address VARCHAR(255),
      department VARCHAR(100),
      website VARCHAR(255),
      phone VARCHAR(30),
      contact_name VARCHAR(255),
      verified BOOLEAN DEFAULT false,
      logo_url VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ companies');

    // ── TEACHERS ──
    await q(`CREATE TABLE IF NOT EXISTS teachers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      school VARCHAR(255),
      school_id UUID REFERENCES schools(id),
      subject VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(30),
      bio TEXT,
      avatar_url VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ teachers');

    // ── PORTFOLIO ──
    await q(`CREATE TABLE IF NOT EXISTS portfolio_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      file_url VARCHAR(500),
      image_url VARCHAR(500),
      subject VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ portfolio_items');

    // ── SKILL VALIDATIONS ──
    await q(`CREATE TABLE IF NOT EXISTS skill_validations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      teacher_id UUID REFERENCES teachers(id),
      skill VARCHAR(100) NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ skill_validations');

    // ── VACANCIES ──
    await q(`CREATE TABLE IF NOT EXISTS vacancies (
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
    )`); log.push('✅ vacancies');

    // ── APPLICATIONS ──
    await q(`CREATE TABLE IF NOT EXISTS applications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
      status VARCHAR(30) DEFAULT 'pending'
        CHECK (status IN ('pending','reviewed','interview','accepted','rejected')),
      cover_note TEXT,
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(student_id, vacancy_id)
    )`); log.push('✅ applications');

    // ── LOGBOOK ──
    await q(`CREATE TABLE IF NOT EXISTS logbook_entries (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      hours_worked DECIMAL(4,1),
      entry_date DATE DEFAULT CURRENT_DATE,
      image_url VARCHAR(500),
      approved_by_teacher BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ logbook_entries');

    // ── NOTIFICATIONS ──
    await q(`CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      read BOOLEAN DEFAULT FALSE,
      link VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ notifications');

    // ── MESSAGES ──
    await q(`CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); log.push('✅ messages');

    // ── INDEXES ──
    await q(`CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_vacancies_company ON vacancies(company_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read)`);
    log.push('✅ indexes');

    // ── SEED ──
    const hash = await bcrypt.hash('demo1234', 12);

    // Admin
    const { rows: [au] } = await q(
      `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash=$2 RETURNING id`,
      ['admin@demo.com', hash]
    );
    log.push('✅ admin@demo.com');

    // School
    const { rows: [school] } = await q(
      `INSERT INTO schools (name, cue, city, department, type, director_name, email, created_by)
       VALUES ('EMETA N°1 - Mendoza','500001','Ciudad','Capital','tecnica','Prof. García','emeta1@mendoza.edu.ar',$1)
       ON CONFLICT (cue) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [au.id]
    );
    log.push('✅ school: EMETA N°1');

    // Teacher
    const { rows: [tu] } = await q(
      `INSERT INTO users (email, password_hash, role, school_id) VALUES ($1,$2,'teacher',$3)
       ON CONFLICT (email) DO UPDATE SET password_hash=$2 RETURNING id`,
      ['docente@demo.com', hash, school.id]
    );
    await q(
      `INSERT INTO teachers (user_id, full_name, school, school_id, subject, email)
       VALUES ($1,'Prof. María González','EMETA N°1',$2,'Proyecto Vocacional','docente@demo.com')
       ON CONFLICT (user_id) DO NOTHING`,
      [tu.id, school.id]
    );
    log.push('✅ docente@demo.com');

    // Student (created by teacher)
    const { rows: [su] } = await q(
      `INSERT INTO users (email, password_hash, role, school_id, created_by) VALUES ($1,$2,'student',$3,$4)
       ON CONFLICT (email) DO UPDATE SET password_hash=$2 RETURNING id`,
      ['alumno@demo.com', hash, school.id, tu.id]
    );
    await q(
      `INSERT INTO students (user_id, full_name, school, school_id, orientation, grade, bio, location, interests, created_by)
       VALUES ($1,'Valentina Pérez','EMETA N°1',$2,'Comunicación','5to año',
       'Me apasiona el diseño y la comunicación digital.',$3,ARRAY['Diseño Gráfico','Marketing','Redes Sociales'],$4)
       ON CONFLICT (user_id) DO NOTHING`,
      [su.id, school.id, 'Capital', tu.id]
    );
    log.push('✅ alumno@demo.com');

    // Company
    const { rows: [cu] } = await q(
      `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'company')
       ON CONFLICT (email) DO UPDATE SET password_hash=$2 RETURNING id`,
      ['empresa@demo.com', hash]
    );
    const { rows: [comp] } = await q(
      `INSERT INTO companies (user_id, company_name, sector, location, department, contact_name, verified, description)
       VALUES ($1,'Agencia Digital Mendoza','Tecnología / TIC','Capital','Capital','Carlos Rivas',true,
       'Agencia de marketing digital especializada en PYMES mendocinas.')
       ON CONFLICT (user_id) DO NOTHING RETURNING id`,
      [cu.id]
    );

    if (comp) {
      await q(
        `INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots)
         VALUES ($1,'Pasante de Community Management','Apoyo en gestión de redes sociales y creación de contenido.','Comunicación',15,'Capital',ARRAY['Marketing','Redes Sociales','Contenido'],2)
         ON CONFLICT DO NOTHING`,
        [comp.id]
      );
      await q(
        `INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots)
         VALUES ($1,'Pasante de Diseño Gráfico','Asistencia en diseño de piezas para clientes.','Arte',12,'Godoy Cruz',ARRAY['Diseño','Visual','Canva'],1)
         ON CONFLICT DO NOTHING`,
        [comp.id]
      );
      log.push('✅ empresa@demo.com + 2 vacantes');
    }

    await pool.end();
    return jsonResponse(res, 200, {
      ok: true,
      message: '🎉 Base inicializada correctamente',
      steps: log,
      demo_users: [
        { role: 'admin',   email: 'admin@demo.com',   password: 'demo1234' },
        { role: 'teacher', email: 'docente@demo.com', password: 'demo1234' },
        { role: 'student', email: 'alumno@demo.com',  password: 'demo1234' },
        { role: 'company', email: 'empresa@demo.com', password: 'demo1234' },
      ]
    });

  } catch (err) {
    await pool.end().catch(() => {});
    return jsonResponse(res, 500, { ok: false, error: err.message, completed_steps: log });
  }
}
