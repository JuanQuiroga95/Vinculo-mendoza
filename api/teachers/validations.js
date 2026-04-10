// api/teachers/validations.js
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      // Teacher sees all students at their school
      const { rows: teacher } = await sql`SELECT * FROM teachers WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!teacher.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });

      const { rows: students } = await sql`
        SELECT s.*, 
               COUNT(DISTINCT p.id) as portfolio_count,
               COUNT(DISTINCT a.id) as application_count,
               JSON_AGG(DISTINCT sv.*) FILTER (WHERE sv.id IS NOT NULL) as validations
        FROM students s
        LEFT JOIN portfolio_items p ON p.student_id = s.id
        LEFT JOIN applications a ON a.student_id = s.id
        LEFT JOIN skill_validations sv ON sv.student_id = s.id AND sv.teacher_id = ${teacher[0].id}
        WHERE s.school = ${teacher[0].school}
        GROUP BY s.id
        ORDER BY s.full_name
      `;
      return jsonResponse(res, 200, { students, teacher: teacher[0] });
    } catch (err) {
      console.error(err);
      return jsonResponse(res, 500, { error: 'Error al obtener estudiantes' });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'teacher') return jsonResponse(res, 403, { error: 'Solo docentes pueden validar habilidades' });
    try {
      const { student_id, skill, note } = req.body;
      const { rows: teacher } = await sql`SELECT id FROM teachers WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!teacher.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });

      const { rows } = await sql`
        INSERT INTO skill_validations (student_id, teacher_id, skill, note)
        VALUES (${student_id}, ${teacher[0].id}, ${skill}, ${note || null})
        RETURNING *
      `;
      return jsonResponse(res, 201, { validation: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al validar habilidad' });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
