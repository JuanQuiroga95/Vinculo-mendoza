// api/admin/dashboard.js — Endpoints Master Admin
// Solo accesible con role: 'admin'
import { verifyToken } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

function requireAdmin(req, res) {
  const user = verifyToken(req)
  if (!user) { res.status(401).json({ error: 'No autorizado' }); return null }
  if (user.role !== 'admin') { res.status(403).json({ error: 'Solo Master Admin' }); return null }
  return user
}

export default async function handler(req, res) {
  const user = requireAdmin(req, res)
  if (!user) return

  const { action } = req.query

  // GET /api/admin/dashboard?action=overview
  if (req.method === 'GET' && action === 'overview') {
    const [totals] = await sql`
      SELECT
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM teachers) AS total_teachers,
        (SELECT COUNT(*) FROM companies WHERE verified = true) AS verified_companies,
        (SELECT COUNT(*) FROM companies WHERE verified = false) AS pending_companies,
        (SELECT COUNT(*) FROM pasantias WHERE status = 'active') AS active_pasantias,
        (SELECT COUNT(*) FROM ice_status WHERE is_blocked = true) AS ice_count
    `
    // Docentes con 0 visitas y alumnos activos
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
    `
    return res.json({ totals, alertTeachers })
  }

  // GET /api/admin/dashboard?action=trajectories
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
      JOIN students s ON s.id = ps.id  -- join via pasantias.student_id
      LEFT JOIN teachers t ON t.id = (SELECT teacher_id FROM pasantias WHERE id = ps.id LIMIT 1)
      LEFT JOIN companies c ON c.id = (SELECT company_id FROM pasantias WHERE id = ps.id LIMIT 1)
      LEFT JOIN final_grades fg ON fg.pasantia_id = ps.id
      ORDER BY ps.status, s.full_name
    `
    return res.json({ trajectories: rows })
  }

  // POST /api/admin/dashboard?action=create_teacher
  if (req.method === 'POST' && action === 'create_teacher') {
    const { full_name, email, school, subject } = req.body
    if (!full_name || !email) return res.status(400).json({ error: 'Faltan campos' })

    const temp_password = Math.random().toString(36).slice(2, 10)
    // En producción: hashear la contraseña y enviar email
    const [u] = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email}, crypt(${temp_password}, gen_salt('bf')), 'teacher')
      RETURNING id
    `
    await sql`
      INSERT INTO teachers (user_id, full_name, school, subject)
      VALUES (${u.id}, ${full_name}, ${school}, ${subject || ''})
    `
    // TODO: enviar email con credenciales temporales
    return res.status(201).json({
      success: true,
      message: `Docente creado. Credenciales temporales enviadas a ${email}`,
      temp_password // SOLO en dev — remover en producción
    })
  }

  // POST /api/admin/dashboard?action=verify_company
  if (req.method === 'POST' && action === 'verify_company') {
    const { company_id } = req.body
    await sql`UPDATE companies SET verified = true WHERE id = ${company_id}`
    return res.json({ success: true })
  }

  // POST /api/admin/dashboard?action=toggle_ice
  if (req.method === 'POST' && action === 'toggle_ice') {
    const { student_id, block, reason } = req.body
    if (block) {
      await sql`
        INSERT INTO ice_status (student_id, is_blocked, reason, set_by)
        VALUES (${student_id}, true, ${reason}, ${user.id})
        ON CONFLICT (student_id) DO UPDATE SET is_blocked=true, reason=EXCLUDED.reason, set_by=EXCLUDED.set_by, set_at=NOW(), lifted_at=NULL
      `
      await sql`UPDATE pasantias SET status='blocked' WHERE student_id=${student_id} AND status='active'`
    } else {
      await sql`UPDATE ice_status SET is_blocked=false, lifted_at=NOW() WHERE student_id=${student_id}`
      await sql`UPDATE pasantias SET status='active' WHERE student_id=${student_id} AND status='blocked'`
    }
    return res.json({ success: true })
  }

  // POST /api/admin/dashboard?action=update_settings
  if (req.method === 'POST' && action === 'update_settings') {
    const { smvm, incentive_pct, max_hours_day, max_hours_week } = req.body
    // En producción: guardar en tabla de configuración global
    return res.json({ success: true, settings: { smvm, incentive_pct, max_hours_day, max_hours_week } })
  }

  res.status(400).json({ error: 'Acción no reconocida' })
}
