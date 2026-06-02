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
        SELECT * FROM teacher_checklists 
        WHERE pasantia_id = ${pasantia_id} 
        ORDER BY week_number ASC
      `;
      return jsonResponse(res, 200, { checklists: rows });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'teacher') return jsonResponse(res, 403, { error: 'Solo docentes' });
    
    try {
      const { rows: teacher } = await sql`SELECT id FROM teachers WHERE user_id=${auth.userId} LIMIT 1`;
      if (!teacher.length) return jsonResponse(res, 404, { error: 'Docente no encontrado' });
      
      const b = req.body;
      const { rows } = await sql`
        INSERT INTO teacher_checklists (
          pasantia_id, teacher_id, student_id, week_number, week_start,
          ind_asiste_regularmente, ind_cumple_horario, ind_vestimenta_adecuada,
          ind_respeta_normas, ind_muestra_interes, ind_cumple_tareas,
          ind_se_integra_equipo, ind_comunicacion_adecuada, ind_aplica_saberes,
          ind_autonomia, observations
        ) VALUES (
          ${b.pasantia_id}, ${teacher[0].id}, ${b.student_id || null}, ${b.week_number}, ${b.week_start || null},
          ${b.ind_asiste_regularmente}, ${b.ind_cumple_horario}, ${b.ind_vestimenta_adecuada},
          ${b.ind_respeta_normas}, ${b.ind_muestra_interes}, ${b.ind_cumple_tareas},
          ${b.ind_se_integra_equipo}, ${b.ind_comunicacion_adecuada}, ${b.ind_aplica_saberes},
          ${b.ind_autonomia}, ${b.observations || null}
        ) RETURNING *
      `;
      return jsonResponse(res, 201, { checklist: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  return jsonResponse(res, 404, { error: 'Not found' });
}
