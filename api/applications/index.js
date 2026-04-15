// api/applications/index.js
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  // GET — student sees their applications, company sees apps for their vacancies
  if (req.method === 'GET') {
    try {
      if (auth.role === 'student') {
        const { rows: student } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
        if (!student.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });

        const { rows } = await sql`
          SELECT a.*, v.title as vacancy_title, c.company_name, v.location, v.hours_per_week
          FROM applications a
          JOIN vacancies v ON a.vacancy_id = v.id
          JOIN companies c ON v.company_id = c.id
          WHERE a.student_id = ${student[0].id}
          ORDER BY a.applied_at DESC
        `;
        return jsonResponse(res, 200, { applications: rows });

      } else if (auth.role === 'company') {
        const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id = ${auth.userId} LIMIT 1`;
        if (!comp.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });

        const { rows } = await sql`
          SELECT a.*, s.full_name, s.school, s.orientation, s.bio, s.interests,
                 v.title as vacancy_title
          FROM applications a
          JOIN students s ON a.student_id = s.id
          JOIN vacancies v ON a.vacancy_id = v.id
          WHERE v.company_id = ${comp[0].id}
          ORDER BY a.applied_at DESC
        `;
        return jsonResponse(res, 200, { applications: rows });
      }
    } catch (err) {
      console.error(err);
      return jsonResponse(res, 500, { error: 'Error al obtener postulaciones' });
    }
  }

  // POST — student applies to a vacancy
  if (req.method === 'POST') {
    if (auth.role !== 'student') return jsonResponse(res, 403, { error: 'Solo alumnos pueden postularse' });

    try {
      const { vacancy_id, cover_note } = req.body;
      const { rows: student } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!student.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });

      const { rows } = await sql`
        INSERT INTO applications (student_id, vacancy_id, cover_note)
        VALUES (${student[0].id}, ${vacancy_id}, ${cover_note || null})
        RETURNING *
      `;
      return jsonResponse(res, 201, { application: rows[0] });
    } catch (err) {
      if (err.message?.includes('unique')) {
        return jsonResponse(res, 409, { error: 'Ya te postulaste a esta vacante' });
      }
      console.error(err);
      return jsonResponse(res, 500, { error: 'Error al postularse' });
    }
  }

  // PUT — company updates application status
  if (req.method === 'PUT') {
    if (auth.role !== 'company') return jsonResponse(res, 403, { error: 'Solo empresas pueden actualizar postulaciones' });

    try {
      const { application_id, status } = req.body;
      const validStatuses = ['pending', 'reviewed', 'interview', 'accepted', 'rejected'];
      if (!validStatuses.includes(status)) return jsonResponse(res, 400, { error: 'Estado inválido' });

      const { rows } = await sql`
        UPDATE applications SET status = ${status}, updated_at = NOW()
        WHERE id = ${application_id}
        RETURNING *
      `;
      return jsonResponse(res, 200, { application: rows[0] });
    } catch (err) {
      console.error(err);
      return jsonResponse(res, 500, { error: 'Error al actualizar postulación' });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
