import { sql, handleCors, jsonResponse } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { pasantia_id } = req.query;
      if (!pasantia_id) return jsonResponse(res, 400, { error: 'pasantia_id requerido' });
      
      const { rows } = await sql`
        SELECT * FROM self_evaluations 
        WHERE pasantia_id = ${pasantia_id} 
        LIMIT 1
      `;
      return jsonResponse(res, 200, rows[0] || {});
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
        INSERT INTO self_evaluations (
          pasantia_id, student_id,
          crit_puntualidad, crit_responsabilidad, crit_actitud, crit_relaciones,
          crit_aprendizaje, crit_comunicacion, crit_presentacion, crit_normas,
          que_aprendi, que_mejoraria, lo_mejor, lo_mas_dificil, status, submitted_at
        ) VALUES (
          ${b.pasantia_id}, ${st[0].id},
          ${b.crit_puntualidad || null}, ${b.crit_responsabilidad || null}, ${b.crit_actitud || null}, ${b.crit_relaciones || null},
          ${b.crit_aprendizaje || null}, ${b.crit_comunicacion || null}, ${b.crit_presentacion || null}, ${b.crit_normas || null},
          ${b.que_aprendi || null}, ${b.que_mejoraria || null}, ${b.lo_mejor || null}, ${b.lo_mas_dificil || null},
          ${b.status || 'borrador'}, ${b.status === 'enviada' ? new Date().toISOString() : null}
        )
        ON CONFLICT (pasantia_id) DO UPDATE SET
          crit_puntualidad = EXCLUDED.crit_puntualidad,
          crit_responsabilidad = EXCLUDED.crit_responsabilidad,
          crit_actitud = EXCLUDED.crit_actitud,
          crit_relaciones = EXCLUDED.crit_relaciones,
          crit_aprendizaje = EXCLUDED.crit_aprendizaje,
          crit_comunicacion = EXCLUDED.crit_comunicacion,
          crit_presentacion = EXCLUDED.crit_presentacion,
          crit_normas = EXCLUDED.crit_normas,
          que_aprendi = EXCLUDED.que_aprendi,
          que_mejoraria = EXCLUDED.que_mejoraria,
          lo_mejor = EXCLUDED.lo_mejor,
          lo_mas_dificil = EXCLUDED.lo_mas_dificil,
          status = EXCLUDED.status,
          submitted_at = EXCLUDED.submitted_at
        RETURNING *
      `;
      return jsonResponse(res, 201, rows[0]);
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  return jsonResponse(res, 404, { error: 'Not found' });
}
