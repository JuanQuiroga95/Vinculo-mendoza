// db/seed.js — Run with: node db/seed.js
// Requires POSTGRES_URL env variable

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Simple pg usage for seeding
import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg

const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } })

async function seed() {
  console.log('🌱 Seeding demo users...')

  const hash = await bcrypt.hash('demo1234', 12)

  // Student
  const { rows: [su] } = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash=$2 RETURNING id`,
    ['alumno@demo.com', hash, 'student']
  )
  await pool.query(
    `INSERT INTO students (user_id, full_name, school, orientation, grade, bio, location, interests)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
    [su.id, 'Valentina Pérez', 'EMETA N°1 - Mendoza', 'Comunicación', '5to año',
     'Me apasiona el diseño y la comunicación digital. Busco mi primera experiencia real.',
     'Capital', ['Diseño Gráfico', 'Marketing', 'Redes Sociales']]
  )

  // Company
  const { rows: [cu] } = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash=$2 RETURNING id`,
    ['empresa@demo.com', hash, 'company']
  )
  const { rows: [comp] } = await pool.query(
    `INSERT INTO companies (user_id, company_name, sector, location, contact_name, verified)
     VALUES ($1, $2, $3, $4, $5, true) ON CONFLICT DO NOTHING RETURNING id`,
    [cu.id, 'Agencia Digital Mendoza', 'Tecnología / TIC', 'Capital', 'Carlos Rivas']
  )

  // Add demo vacancy
  if (comp) {
    await pool.query(
      `INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
      [comp.id, 'Pasante de Community Management', 'Apoyo en gestión de redes sociales, creación de contenido y análisis de métricas. Ideal para orientación Comunicación.',
       'Comunicación', 15, 'Capital', ['Marketing', 'Redes Sociales', 'Contenido'], 2]
    )
    await pool.query(
      `INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
      [comp.id, 'Pasante de Diseño Gráfico', 'Asistencia en diseño de piezas para clientes. Manejo básico de Canva o Adobe. ',
       'Arte', 12, 'Godoy Cruz', ['Diseño', 'Visual', 'Arte'], 1]
    )
  }

  // Teacher
  const { rows: [tu] } = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash=$2 RETURNING id`,
    ['docente@demo.com', hash, 'teacher']
  )
  await pool.query(
    `INSERT INTO teachers (user_id, full_name, school, subject)
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
    [tu.id, 'Prof. María González', 'EMETA N°1 - Mendoza', 'Proyecto Vocacional']
  )

  console.log('✅ Seed complete!')
  console.log('   alumno@demo.com / demo1234')
  console.log('   empresa@demo.com / demo1234')
  console.log('   docente@demo.com / demo1234')
  await pool.end()
}

seed().catch(e => { console.error(e); process.exit(1) })
