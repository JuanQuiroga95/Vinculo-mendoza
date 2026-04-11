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
      // Docente puede ver todos los logbooks de sus alumnos
      if (auth.role === 'teacher' && req.query.all === '1') {
        const { rows } = await sql`
          SELECT le.*, s.full_name as student_name,
            v.title as vacancy_title, c.company_name
          FROM logbook_entries le
          JOIN students s ON s.id = le.student_id
          LEFT JOIN applications a ON a.id = le.application_id
          LEFT JOIN vacancies v ON v.id = a.vacancy_id
          LEFT JOIN companies c ON c.id = v.company_id
          WHERE s.created_by = ${auth.userId}
          ORDER BY le.entry_date DESC`;
        return jsonResponse(res, 200, { entries: rows });
      }

      // Alumno ve sus propias entradas
      const { rows: student } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!student.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
      const { rows } = await sql`
        SELECT le.*, v.title as vacancy_title, c.company_name
        FROM logbook_entries le
        LEFT JOIN applications a ON a.id = le.application_id
        LEFT JOIN vacancies v ON v.id = a.vacancy_id
        LEFT JOIN companies c ON c.id = v.company_id
        WHERE le.student_id = ${student[0].id}
        ORDER BY le.entry_date DESC`;
      return jsonResponse(res, 200, { entries: rows });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'student') return jsonResponse(res, 403, { error: 'Solo alumnos pueden agregar entradas' });
    try {
      const { application_id, content, hours_worked, entry_date, image_url } = req.body;
      if (!content) return jsonResponse(res, 400, { error: 'El contenido es requerido' });
      const { rows: student } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!student.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
      const { rows } = await sql`
        INSERT INTO logbook_entries (student_id, application_id, content, hours_worked, entry_date, image_url)
        VALUES (${student[0].id}, ${application_id||null}, ${content}, ${hours_worked||null},
                ${entry_date||new Date().toISOString().split('T')[0]}, ${image_url||null})
        RETURNING *`;
      return jsonResponse(res, 201, { entry: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
