import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT * FROM schools ORDER BY name ASC`;
    return jsonResponse(res, 200, { schools: rows });
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo el admin puede crear escuelas' });
    const { name, cue, address, city, department, type, phone, email, website, logo_url, description, director_name } = req.body;
    if (!name) return jsonResponse(res, 400, { error: 'Nombre requerido' });
    const { rows } = await sql`
      INSERT INTO schools (name,cue,address,city,department,type,phone,email,website,logo_url,description,director_name,created_by)
      VALUES (${name},${cue||null},${address||null},${city||null},${department||null},${type||'orientada'},
              ${phone||null},${email||null},${website||null},${logo_url||null},${description||null},${director_name||null},${user.userId})
      RETURNING *`;
    return jsonResponse(res, 201, { school: rows[0] });
  }

  if (req.method === 'PUT') {
    if (user.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo el admin puede editar escuelas' });
    const { school_id, ...fields } = req.body;
    if (!school_id) return jsonResponse(res, 400, { error: 'school_id requerido' });
    const { rows } = await sql`
      UPDATE schools SET name=${fields.name},cue=${fields.cue||null},address=${fields.address||null},
        city=${fields.city||null},department=${fields.department||null},type=${fields.type||'orientada'},
        phone=${fields.phone||null},email=${fields.email||null},website=${fields.website||null},
        logo_url=${fields.logo_url||null},description=${fields.description||null},director_name=${fields.director_name||null}
      WHERE id=${school_id} RETURNING *`;
    return jsonResponse(res, 200, { school: rows[0] });
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
