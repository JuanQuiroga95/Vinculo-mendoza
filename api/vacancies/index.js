// api/vacancies/index.js — GET all active vacancies, POST new vacancy (company only)
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const { orientation, location } = req.query;
      let query = sql`
        SELECT v.*, c.company_name, c.sector, c.logo_url, c.location as company_location
        FROM vacancies v
        JOIN companies c ON v.company_id = c.id
        WHERE v.active = true
      `;
      // Simple filter — for more complex filtering use dynamic query building
      const { rows } = await sql`
        SELECT v.*, c.company_name, c.sector, c.logo_url, c.location as company_location
        FROM vacancies v
        JOIN companies c ON v.company_id = c.id
        WHERE v.active = true
        ORDER BY v.created_at DESC
        LIMIT 50
      `;
      return jsonResponse(res, 200, { vacancies: rows });
    } catch (err) {
      console.error(err);
      return jsonResponse(res, 500, { error: 'Error al obtener vacantes' });
    }
  }

  if (req.method === 'POST') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    if (auth.role !== 'company') return jsonResponse(res, 403, { error: 'Solo empresas pueden publicar vacantes' });

    try {
      const { title, description, orientation_required, hours_per_week, location, tags, slots } = req.body;

      // Get company id from user_id
      const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!comp.length) return jsonResponse(res, 404, { error: 'Perfil de empresa no encontrado' });

      const { rows } = await sql`
        INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots)
        VALUES (${comp[0].id}, ${title}, ${description}, ${orientation_required || null}, ${hours_per_week || 15}, ${location || ''}, ${tags || null}, ${slots || 1})
        RETURNING *
      `;
      return jsonResponse(res, 201, { vacancy: rows[0] });
    } catch (err) {
      console.error(err);
      return jsonResponse(res, 500, { error: 'Error al crear vacante' });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
