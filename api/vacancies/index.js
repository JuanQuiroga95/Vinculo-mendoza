// api/vacancies/index.js
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — todas las vacantes activas (público)
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT v.*, c.company_name, c.sector, c.logo_url, c.location as company_location, c.description as company_description, c.id as company_id
        FROM vacancies v
        JOIN companies c ON v.company_id = c.id
        WHERE v.active = true
        ORDER BY v.created_at DESC
        LIMIT 100`;
      return jsonResponse(res, 200, { vacancies: rows });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al obtener vacantes' });
    }
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  // POST — crear vacante (empresa)
  if (req.method === 'POST') {
    if (auth.role !== 'company') return jsonResponse(res, 403, { error: 'Solo empresas pueden publicar vacantes' });
    try {
      const { title, description, orientation_required, hours_per_week, location, tags, slots, schedule_start, schedule_end } = req.body;
      const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!comp.length) return jsonResponse(res, 404, { error: 'Perfil de empresa no encontrado' });
      const { rows } = await sql`
        INSERT INTO vacancies (company_id, title, description, orientation_required, hours_per_week, location, tags, slots, schedule_start, schedule_end)
        VALUES (${comp[0].id}, ${title}, ${description||null}, ${orientation_required||null},
                ${Number(hours_per_week)||15}, ${location||''}, ${tags||null}, ${Number(slots)||1},
                ${schedule_start||'08:00'}, ${schedule_end||'14:00'})
        RETURNING *`;
      return jsonResponse(res, 201, { vacancy: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al crear vacante: ' + err.message });
    }
  }

  // PUT — editar vacante (empresa propietaria)
  if (req.method === 'PUT') {
    if (auth.role !== 'company') return jsonResponse(res, 403, { error: 'Solo empresas pueden editar vacantes' });
    try {
      const { vacancy_id, title, description, orientation_required, hours_per_week, location, tags, slots, active, schedule_start, schedule_end } = req.body;
      const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!comp.length) return jsonResponse(res, 404, { error: 'Empresa no encontrada' });
      const { rows } = await sql`
        UPDATE vacancies SET
          title=${title}, description=${description||null}, orientation_required=${orientation_required||null},
          hours_per_week=${Number(hours_per_week)||15}, location=${location||''}, tags=${tags||null},
          slots=${Number(slots)||1}, active=${active!==undefined?active:true},
          schedule_start=${schedule_start||'08:00'}, schedule_end=${schedule_end||'14:00'}
        WHERE id=${vacancy_id} AND company_id=${comp[0].id}
        RETURNING *`;
      return jsonResponse(res, 200, { vacancy: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al actualizar vacante' });
    }
  }

  // DELETE — desactivar vacante
  if (req.method === 'DELETE') {
    if (auth.role !== 'company') return jsonResponse(res, 403, { error: 'Solo empresas pueden eliminar vacantes' });
    try {
      const { vacancy_id } = req.body;
      const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id = ${auth.userId} LIMIT 1`;
      await sql`UPDATE vacancies SET active=false WHERE id=${vacancy_id} AND company_id=${comp[0].id}`;
      return jsonResponse(res, 200, { ok: true });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al eliminar vacante' });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
