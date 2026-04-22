// api/admin/users.js — ABM de usuarios (admin: todo, docente: solo sus alumnos)
import { sql, handleCors, jsonResponse } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import bcrypt from 'bcryptjs'

function rand8() {
  return Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6)
}

// ── LISTAR ────────────────────────────────────────────────────────────────────
async function handleList(req, res, auth) {
  const { type } = req.query // students | teachers | companies

  if (type === 'students') {
    const rows = await sql`
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
      ${auth.role === 'teacher'
        ? sql`WHERE t.user_id = ${auth.userId}`
        : sql``
      }
      GROUP BY s.id, u.email, u.role, t.full_name, p.id, p.status, c.company_name
      ORDER BY s.full_name
    `
    return res.json({ students: rows })
  }

  if (type === 'teachers') {
    if (auth.role !== 'admin') return res.status(403).json({ error: 'Solo admin' })
    const rows = await sql`
      SELECT t.*, u.email, u.role,
        COUNT(DISTINCT p.id) AS student_count,
        COUNT(DISTINCT v.id) AS visit_count
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN pasantias p ON p.teacher_id = t.id AND p.status IN ('active','simulation')
      LEFT JOIN visit_logs v ON v.teacher_id = t.id
      GROUP BY t.id, u.email, u.role
      ORDER BY t.full_name
    `
    return res.json({ teachers: rows })
  }

  if (type === 'companies') {
    if (auth.role !== 'admin') return res.status(403).json({ error: 'Solo admin' })
    const rows = await sql`
      SELECT c.*, u.email,
        COUNT(DISTINCT p.id) AS student_count
      FROM companies c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN pasantias p ON p.company_id = c.id AND p.status IN ('active','simulation')
      GROUP BY c.id, u.email
      ORDER BY c.company_name
    `
    return res.json({ companies: rows })
  }

  return res.status(400).json({ error: 'type requerido: students | teachers | companies' })
}

// ── CREAR ─────────────────────────────────────────────────────────────────────
async function handleCreate(req, res, auth) {
  const { type, email, password, full_name, school, orientation, grade,
          subject, company_name, cuit, sector, contact_name, location,
          teacher_id, company_id, start_date, is_simulation, simulation_reason } = req.body

  const pass = password || rand8()
  const hash = await bcrypt.hash(pass, 10)

  if (type === 'student') {
    // Admin puede crear cualquier alumno; docente puede crear y asignarlos a sí mismo
    const emailFinal = email?.toLowerCase()
    if (!emailFinal || !full_name) return res.status(400).json({ error: 'email y full_name requeridos' })

    const { rows: [u] } = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${emailFinal}, ${hash}, 'student')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash} RETURNING id, (xmax=0) AS inserted`
    const { rows: [s] } = await sql`
      INSERT INTO students (user_id, full_name, school, orientation, grade, location)
      VALUES (${u.id}, ${full_name}, ${school||''}, ${orientation||''}, ${grade||''}, ${location||null})
      ON CONFLICT (user_id) DO UPDATE SET full_name=${full_name}, school=${school||''}, orientation=${orientation||''}, grade=${grade||''}
      RETURNING id`

    // Si viene teacher_id o el que crea es docente → crear pasantía asignada
    const tId = teacher_id || (auth.role === 'teacher'
      ? (await sql`SELECT id FROM teachers WHERE user_id=${auth.userId}`).rows[0]?.id
      : null)

    if (tId) {
      const cId = company_id || null
      await sql`
        INSERT INTO pasantias (student_id, teacher_id, company_id, start_date, status, is_simulation, simulation_reason)
        VALUES (${s.id}, ${tId}, ${cId}, ${start_date||null},
                ${is_simulation ? 'simulation' : 'active'}, ${!!is_simulation}, ${simulation_reason||null})
        ON CONFLICT DO NOTHING`
    }

    return res.status(201).json({ ok: true, user_id: u.id, student_id: s.id, generated_password: password ? null : pass })
  }

  if (type === 'teacher') {
    if (auth.role !== 'admin') return res.status(403).json({ error: 'Solo admin' })
    if (!email || !full_name) return res.status(400).json({ error: 'email y full_name requeridos' })
    const { rows: [u] } = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email.toLowerCase()}, ${hash}, 'teacher')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash} RETURNING id`
    const { rows: [t] } = await sql`
      INSERT INTO teachers (user_id, full_name, school, subject)
      VALUES (${u.id}, ${full_name}, ${school||''}, ${subject||''})
      ON CONFLICT (user_id) DO UPDATE SET full_name=${full_name}, school=${school||''}, subject=${subject||''}
      RETURNING id`
    return res.status(201).json({ ok: true, user_id: u.id, teacher_id: t.id, generated_password: password ? null : pass })
  }

  if (type === 'company') {
    if (auth.role !== 'admin') return res.status(403).json({ error: 'Solo admin' })
    if (!company_name) return res.status(400).json({ error: 'company_name requerido' })
    const emailFinal = email?.toLowerCase() || `empresa_${cuit||Date.now()}@vinculo.sys`
    const { rows: [u] } = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${emailFinal}, ${hash}, 'company')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash} RETURNING id`
    const { rows: [c] } = await sql`
      INSERT INTO companies (user_id, company_name, cuit, sector, contact_name, location, verified)
      VALUES (${u.id}, ${company_name}, ${cuit||null}, ${sector||''}, ${contact_name||''}, ${location||null}, false)
      ON CONFLICT (user_id) DO UPDATE SET company_name=${company_name}, cuit=${cuit||null}, sector=${sector||''}, contact_name=${contact_name||''}
      RETURNING id`
    return res.status(201).json({ ok: true, user_id: u.id, company_id: c.id, generated_password: password ? null : pass })
  }

  return res.status(400).json({ error: 'type inválido' })
}

// ── BORRAR ────────────────────────────────────────────────────────────────────
async function handleDelete(req, res, auth) {
  if (auth.role !== 'admin') return res.status(403).json({ error: 'Solo admin puede borrar usuarios' })
  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' })
  // CASCADE borra students/teachers/companies/pasantias automáticamente
  await sql`DELETE FROM users WHERE id = ${user_id}`
  return res.json({ ok: true })
}

// ── ROUTER ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  handleCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const auth = requireAuth(req, res)
  if (!auth) return
  if (!['admin', 'teacher'].includes(auth.role)) return res.status(403).json({ error: 'Sin permisos' })

  if (req.method === 'GET')    return handleList(req, res, auth)
  if (req.method === 'POST')   return handleCreate(req, res, auth)
  if (req.method === 'DELETE') return handleDelete(req, res, auth)

  return res.status(405).json({ error: 'Método no permitido' })
}
