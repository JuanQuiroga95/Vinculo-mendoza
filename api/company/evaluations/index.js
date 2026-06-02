import { sql, handleCors, jsonResponse } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id=${auth.userId} LIMIT 1`;
      if (!comp.length) return jsonResponse(res, 404, { error: 'Empresa no encontrada' });
      
      const { rows } = await sql`
        SELECT ce.*, s.full_name as student_name, s.grade 
        FROM company_evaluations ce 
        JOIN students s ON s.id = ce.student_id 
        WHERE ce.company_id = ${comp[0].id}
        ORDER BY ce.created_at DESC
      `;
      
      // Calculate avg for UI
      const evals = rows.map(r => {
        const sum = r.crit_puntualidad + r.crit_presentacion + r.crit_responsabilidad + r.crit_actitud + r.crit_comunicacion + r.crit_trabajo_equipo + r.crit_iniciativa + r.crit_aprendizaje + r.crit_normas + r.crit_calidad_trabajo;
        return { ...r, avg: (sum / 10).toFixed(1) };
      });
      
      return jsonResponse(res, 200, { evaluations: evals });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'company') return jsonResponse(res, 403, { error: 'Solo empresas pueden evaluar' });
    
    try {
      const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id=${auth.userId} LIMIT 1`;
      if (!comp.length) return jsonResponse(res, 404, { error: 'Empresa no encontrada' });
      
      const b = req.body;
      const { rows } = await sql`
        INSERT INTO company_evaluations (
          company_id, student_id, evaluator_name,
          crit_puntualidad, crit_presentacion, crit_responsabilidad, crit_actitud,
          crit_comunicacion, crit_trabajo_equipo, crit_iniciativa, crit_aprendizaje,
          crit_normas, crit_calidad_trabajo, fortalezas, areas_mejora, recomendaria, status
        ) VALUES (
          ${comp[0].id}, ${b.student_id}, ${b.evaluator_name || null},
          ${b.crit_puntualidad}, ${b.crit_presentacion}, ${b.crit_responsabilidad}, ${b.crit_actitud},
          ${b.crit_comunicacion}, ${b.crit_trabajo_equipo}, ${b.crit_iniciativa}, ${b.crit_aprendizaje},
          ${b.crit_normas}, ${b.crit_calidad_trabajo}, ${b.fortalezas || null}, ${b.areas_mejora || null},
          ${b.recomendaria || false}, 'completada'
        ) RETURNING *
      `;
      
      return jsonResponse(res, 201, { evaluation: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  return jsonResponse(res, 404, { error: 'Not found' });
}
