import { sql, handleCors, jsonResponse } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      if (auth.role === 'student') {
        const { rows: st } = await sql`SELECT id FROM students WHERE user_id=${auth.userId} LIMIT 1`;
        if (!st.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
        
        const { rows } = await sql`SELECT * FROM family_authorizations WHERE student_id = ${st[0].id} LIMIT 1`;
        return jsonResponse(res, 200, rows[0] || {});
      } else {
        const { student_id } = req.query;
        if (!student_id) return jsonResponse(res, 400, { error: 'student_id requerido' });
        const { rows } = await sql`SELECT * FROM family_authorizations WHERE student_id = ${student_id} LIMIT 1`;
        return jsonResponse(res, 200, rows[0] || {});
      }
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'student') return jsonResponse(res, 403, { error: 'Solo alumnos' });
    
    try {
      const { rows: st } = await sql`SELECT id FROM students WHERE user_id=${auth.userId} LIMIT 1`;
      if (!st.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
      
      const b = req.body;
      const { rows } = await sql`
        INSERT INTO family_authorizations (
          student_id, parent_name, parent_dni, parent_relationship, parent_phone,
          authorized, legal_text_accepted, status, signed_at
        ) VALUES (
          ${st[0].id}, ${b.parent_name}, ${b.parent_dni}, ${b.parent_relationship || 'madre/padre'}, ${b.parent_phone},
          ${b.authorized || false}, ${b.legal_text_accepted || false}, 'completada', NOW()
        )
        ON CONFLICT (student_id) DO UPDATE SET
          parent_name = EXCLUDED.parent_name,
          parent_dni = EXCLUDED.parent_dni,
          parent_relationship = EXCLUDED.parent_relationship,
          parent_phone = EXCLUDED.parent_phone,
          authorized = EXCLUDED.authorized,
          legal_text_accepted = EXCLUDED.legal_text_accepted,
          status = 'completada',
          signed_at = NOW()
        RETURNING *
      `;
      return jsonResponse(res, 201, rows[0]);
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }
  
  if (req.method === 'PUT') {
    if (auth.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo admin' });
    try {
      const { id, status } = req.body;
      const { rows } = await sql`
        UPDATE family_authorizations SET 
          status = ${status}, 
          validated_by = ${auth.userId},
          validated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return jsonResponse(res, 200, rows[0]);
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  return jsonResponse(res, 404, { error: 'Not found' });
}
