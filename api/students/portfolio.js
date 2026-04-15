// api/students/portfolio.js
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  const studentId = req.query.studentId;

  if (req.method === 'GET') {
    try {
      let id = studentId;
      if (!id && auth.role === 'student') {
        const { rows } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
        id = rows[0]?.id;
      }
      if (!id) return jsonResponse(res, 400, { error: 'studentId requerido' });

      const { rows } = await sql`
        SELECT * FROM portfolio_items WHERE student_id = ${id} ORDER BY created_at DESC
      `;
      return jsonResponse(res, 200, { items: rows });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al obtener portafolio' });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'student') return jsonResponse(res, 403, { error: 'Solo alumnos pueden agregar al portafolio' });
    try {
      const { title, description, category, file_url, image_url, subject } = req.body;
      const { rows: student } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!student.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });

      const { rows } = await sql`
        INSERT INTO portfolio_items (student_id, title, description, category, file_url, image_url, subject)
        VALUES (${student[0].id}, ${title}, ${description || null}, ${category || null}, ${file_url || null}, ${image_url || null}, ${subject || null})
        RETURNING *
      `;
      return jsonResponse(res, 201, { item: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al agregar item' });
    }
  }

  if (req.method === 'DELETE') {
    if (auth.role !== 'student') return jsonResponse(res, 403, { error: 'No autorizado' });
    try {
      const { item_id } = req.body;
      await sql`DELETE FROM portfolio_items WHERE id = ${item_id}`;
      return jsonResponse(res, 200, { success: true });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al eliminar item' });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
