// api/teachers/visits.js — Gestión de visitas docentes
import { verifyToken } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

export default async function handler(req, res) {
  const user = verifyToken(req)
  if (!user || user.role !== 'teacher') return res.status(403).json({ error: 'Solo docentes' })

  const teacherRows = await sql`SELECT id FROM teachers WHERE user_id = ${user.id}`
  if (!teacherRows.length) return res.status(404).json({ error: 'Perfil docente no encontrado' })
  const teacherId = teacherRows[0].id

  // GET — visitas del docente
  if (req.method === 'GET') {
    const { pasantia_id } = req.query
    const where = pasantia_id
      ? sql`AND v.pasantia_id = ${pasantia_id}`
      : sql``
    const rows = await sql`
      SELECT v.*, s.full_name AS student_name,
        COUNT(*) OVER (PARTITION BY v.pasantia_id) AS visit_count_for_pasantia
      FROM visit_logs v
      JOIN pasantias p ON p.id = v.pasantia_id
      JOIN students s ON s.id = p.student_id
      WHERE v.teacher_id = ${teacherId} ${where}
      ORDER BY v.visit_date DESC
    `
    return res.json({ visits: rows })
  }

  // POST — registrar nueva visita
  if (req.method === 'POST') {
    const {
      pasantia_id,
      visit_date,
      asp_puntualidad, asp_uniforme, asp_actitud, asp_comunicacion,
      asp_responsabilidad, asp_adaptabilidad, asp_aprendizaje, asp_reglamentos,
      observations
    } = req.body

    const aspects = [asp_puntualidad, asp_uniforme, asp_actitud, asp_comunicacion,
      asp_responsabilidad, asp_adaptabilidad, asp_aprendizaje, asp_reglamentos]

    if (aspects.some(a => !a || a < 1 || a > 3)) {
      return res.status(400).json({ error: 'Todos los aspectos deben tener valor 1, 2 o 3' })
    }

    // Obtener número de visita
    const [countRow] = await sql`
      SELECT COUNT(*)+1 AS next_num FROM visit_logs WHERE pasantia_id = ${pasantia_id}
    `

    const [visit] = await sql`
      INSERT INTO visit_logs (
        pasantia_id, teacher_id, visit_date, visit_number,
        asp_puntualidad, asp_uniforme, asp_actitud, asp_comunicacion,
        asp_responsabilidad, asp_adaptabilidad, asp_aprendizaje, asp_reglamentos,
        observations, sig_teacher, sig_teacher_at, gem_logged
      ) VALUES (
        ${pasantia_id}, ${teacherId}, ${visit_date || 'NOW()'}, ${countRow.next_num},
        ${asp_puntualidad}, ${asp_uniforme}, ${asp_actitud}, ${asp_comunicacion},
        ${asp_responsabilidad}, ${asp_adaptabilidad}, ${asp_aprendizaje}, ${asp_reglamentos},
        ${observations}, 'Firma docente', NOW(), true
      ) RETURNING *
    `
    return res.status(201).json({ visit, gem_logged: true })
  }

  res.status(405).json({ error: 'Método no permitido' })
}
