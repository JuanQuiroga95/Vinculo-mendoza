// api/students/logbook.js
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      let studentId = req.query.studentId;
      if (!studentId && auth.role === 'student') {
        const { rows } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
        studentId = rows[0]?.id;
      }
      if (!studentId) return jsonResponse(res, 400, { error: 'studentId requerido' });

      const { rows } = await sql`
        SELECT l.*, a.vacancy_id, v.title as vacancy_title, c.company_name
        FROM logbook_entries l
        JOIN applications a ON l.application_id = a.id
        JOIN vacancies v ON a.vacancy_id = v.id
        JOIN companies c ON v.company_id = c.id
        WHERE l.student_id = ${studentId}
        ORDER BY l.entry_date DESC
      `;
      return jsonResponse(res, 200, { entries: rows });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al obtener bitácora' });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'student') return jsonResponse(res, 403, { error: 'Solo alumnos pueden agregar entradas' });
    try {
      const { application_id, content, hours_worked, entry_date, image_url } = req.body;
      const { rows: student } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!student.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });

      const { rows } = await sql`
        INSERT INTO logbook_entries (student_id, application_id, content, hours_worked, entry_date, image_url)
        VALUES (${student[0].id}, ${application_id}, ${content}, ${hours_worked || null}, ${entry_date || null}, ${image_url || null})
        RETURNING *
      `;
      return jsonResponse(res, 201, { entry: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al agregar entrada' });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
