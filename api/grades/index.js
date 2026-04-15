// api/grades/index.js — Evaluación final por rúbrica
// REGLA INNEGOCIABLE: requiere >= 2 visitas registradas
import { verifyToken } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

function scoreToGrade(total) {
  if (total === 12) return 10.0
  if (total >= 8)  return +(7.0 + ((total - 8) / 4) * 3.0).toFixed(1)
  if (total >= 4)  return +(3.0 + ((total - 4) / 4) * 4.0).toFixed(1)
  return 1.0
}

export default async function handler(req, res) {
  const user = verifyToken(req)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  // GET — obtener calificación de una pasantía
  if (req.method === 'GET') {
    const { pasantia_id } = req.query
    if (!pasantia_id) return res.status(400).json({ error: 'Falta pasantia_id' })
    const rows = await sql`
      SELECT fg.*, ps.visit_count, ps.total_hours, ps.student_name
      FROM final_grades fg
      JOIN pasantia_summary ps ON ps.id = fg.pasantia_id
      WHERE fg.pasantia_id = ${pasantia_id}
    `
    return res.json(rows[0] || null)
  }

  // POST — cargar/actualizar calificación
  if (req.method === 'POST') {
    if (user.role !== 'teacher') return res.status(403).json({ error: 'Solo docentes' })

    const { pasantia_id, crit_asistencia, crit_presentacion, crit_conocimientos, crit_informe, teacher_comments } = req.body

    // Validar criterios
    const crits = [crit_asistencia, crit_presentacion, crit_conocimientos, crit_informe]
    if (crits.some(c => !c || c < 1 || c > 3)) {
      return res.status(400).json({ error: 'Cada criterio debe ser 1, 2 o 3' })
    }

    // BLOQUEO CRÍTICO: verificar mínimo 2 visitas
    const [summary] = await sql`
      SELECT visit_count, is_blocked FROM pasantia_summary WHERE id = ${pasantia_id}
    `
    if (!summary) return res.status(404).json({ error: 'Pasantía no encontrada' })
    if (summary.is_blocked) return res.status(403).json({ error: 'Alumno en condición ICE' })
    if (summary.visit_count < 2) {
      return res.status(422).json({
        error: 'No se puede calificar: se requieren al menos 2 visitas docentes registradas.',
        visit_count: summary.visit_count,
        visits_required: 2
      })
    }

    const total = crits.reduce((a, b) => a + b, 0)
    const grade = scoreToGrade(total)

    await sql`
      INSERT INTO final_grades (pasantia_id, teacher_id, crit_asistencia, crit_presentacion,
        crit_conocimientos, crit_informe, teacher_comments)
      VALUES (${pasantia_id}, (SELECT id FROM teachers WHERE user_id=${user.id}),
        ${crit_asistencia}, ${crit_presentacion}, ${crit_conocimientos}, ${crit_informe},
        ${teacher_comments || null})
      ON CONFLICT (pasantia_id) DO UPDATE SET
        crit_asistencia    = EXCLUDED.crit_asistencia,
        crit_presentacion  = EXCLUDED.crit_presentacion,
        crit_conocimientos = EXCLUDED.crit_conocimientos,
        crit_informe       = EXCLUDED.crit_informe,
        teacher_comments   = EXCLUDED.teacher_comments,
        updated_at         = NOW()
      WHERE final_grades.locked = false
    `

    return res.json({ success: true, total_score: total, final_grade: grade })
  }

  res.status(405).json({ error: 'Método no permitido' })
}
