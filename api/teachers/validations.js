// api/teachers/validations.js — Docente gestiona sus alumnos, valida habilidades, aprueba bitácoras
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (!['teacher','admin'].includes(auth.role)) return jsonResponse(res, 403, { error: 'Acceso denegado' });

  // GET — alumnos del docente con stats + validaciones de un alumno
  if (req.method === 'GET') {
    try {
      const { student_id } = req.query;

      if (student_id) {
        // Validaciones específicas de un alumno
        const { rows } = await sql`
          SELECT sv.*, t.full_name as teacher_name
          FROM skill_validations sv
          JOIN teachers t ON t.id = sv.teacher_id
          WHERE sv.student_id = ${student_id}
          ORDER BY sv.created_at DESC`;
        return jsonResponse(res, 200, { validations: rows });
      }

      // Lista alumnos del docente
      const { rows: teacher } = await sql`SELECT id FROM teachers WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!teacher.length) return jsonResponse(res, 404, { error: 'Perfil docente no encontrado' });

      const { rows: students } = await sql`
        SELECT s.*, u.email,
          (SELECT COUNT(*) FROM skill_validations sv WHERE sv.student_id = s.id) as skill_count,
          (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.id) as application_count,
          (SELECT COUNT(*) FROM portfolio_items pi WHERE pi.student_id = s.id) as portfolio_count,
          (SELECT COUNT(*) FROM logbook_entries le WHERE le.student_id = s.id AND le.approved_by_teacher = false) as pending_logbook
        FROM students s
        JOIN users u ON u.id = s.user_id
        WHERE s.created_by = ${auth.userId}
        ORDER BY s.full_name ASC`;

      return jsonResponse(res, 200, { students, teacher: teacher[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // POST — validar habilidad
  if (req.method === 'POST') {
    try {
      const { student_id, skill, note } = req.body;
      if (!student_id || !skill) return jsonResponse(res, 400, { error: 'student_id y skill requeridos' });
      const { rows: teacher } = await sql`SELECT id FROM teachers WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!teacher.length) return jsonResponse(res, 404, { error: 'Docente no encontrado' });
      const { rows } = await sql`
        INSERT INTO skill_validations (student_id, teacher_id, skill, note)
        VALUES (${student_id}, ${teacher[0].id}, ${skill}, ${note||null})
        RETURNING *`;
      // Notificación al alumno
      const { rows: student } = await sql`SELECT user_id FROM students WHERE id = ${student_id} LIMIT 1`;
      if (student.length) {
        await sql`INSERT INTO notifications (user_id, type, title, message)
          VALUES (${student[0].user_id}, 'skill_validated', 'Nueva habilidad validada',
          ${'Tu docente validó la habilidad: ' + skill})`;
      }
      return jsonResponse(res, 201, { validation: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // PUT — aprobar entrada de bitácora
  if (req.method === 'PUT') {
    try {
      const { entry_id } = req.body;
      if (!entry_id) return jsonResponse(res, 400, { error: 'entry_id requerido' });
      const { rows } = await sql`
        UPDATE logbook_entries SET approved_by_teacher=true WHERE id=${entry_id} RETURNING *`;
      return jsonResponse(res, 200, { entry: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
