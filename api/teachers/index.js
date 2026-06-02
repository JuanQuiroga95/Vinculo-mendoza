// api/teachers/index.js — handles validations and visits via _resource param
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth, verifyToken } from '../_lib/auth.js';

// ── VALIDATIONS ──────────────────────────────────────────────────────────────
async function handleValidations(req, res, auth) {
  if (req.method === 'GET') {
    try {
      const { rows: teacher } = await sql`SELECT * FROM teachers WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!teacher.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });
      const { rows: students } = await sql`
        SELECT s.*,
               COUNT(DISTINCT p.id) as portfolio_count,
               COUNT(DISTINCT a.id) as application_count,
               JSON_AGG(DISTINCT sv.*) FILTER (WHERE sv.id IS NOT NULL) as validations
        FROM students s
        LEFT JOIN portfolio_items p ON p.student_id = s.id
        LEFT JOIN applications a ON a.student_id = s.id
        LEFT JOIN skill_validations sv ON sv.student_id = s.id AND sv.teacher_id = ${teacher[0].id}
        WHERE s.school = ${teacher[0].school}
        GROUP BY s.id
        ORDER BY s.full_name
      `;
      return jsonResponse(res, 200, { students, teacher: teacher[0] });
    } catch (err) {
      console.error(err);
      return jsonResponse(res, 500, { error: 'Error al obtener estudiantes' });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'teacher') return jsonResponse(res, 403, { error: 'Solo docentes pueden validar habilidades' });
    try {
      const { student_id, skill, note } = req.body;
      const { rows: teacher } = await sql`SELECT id FROM teachers WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!teacher.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });
      const { rows } = await sql`
        INSERT INTO skill_validations (student_id, teacher_id, skill, note)
        VALUES (${student_id}, ${teacher[0].id}, ${skill}, ${note || null})
        RETURNING *
      `;
      return jsonResponse(res, 201, { validation: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al validar habilidad' });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}

// ── VISITS ───────────────────────────────────────────────────────────────────
async function handleVisits(req, res, auth) {
  if (auth.role !== 'teacher') return res.status(403).json({ error: 'Solo docentes' });

  const teacherRows = await sql`SELECT id FROM teachers WHERE user_id = ${auth.userId}`;
  if (!teacherRows.rows?.length && !teacherRows.length) {
    return res.status(404).json({ error: 'Perfil docente no encontrado' });
  }
  const teacherId = (teacherRows.rows || teacherRows)[0].id;

  if (req.method === 'GET') {
    const { pasantia_id } = req.query;
    const where = pasantia_id ? sql`AND v.pasantia_id = ${pasantia_id}` : sql``;
    const rows = await sql`
      SELECT v.*, s.full_name AS student_name,
        COUNT(*) OVER (PARTITION BY v.pasantia_id) AS visit_count_for_pasantia
      FROM visit_logs v
      JOIN pasantias p ON p.id = v.pasantia_id
      JOIN students s ON s.id = p.student_id
      WHERE v.teacher_id = ${teacherId} ${where}
      ORDER BY v.visit_date DESC
    `;
    return res.json({ visits: rows });
  }

  if (req.method === 'POST') {
    const {
      pasantia_id, visit_date,
      asp_puntualidad, asp_uniforme, asp_actitud, asp_comunicacion,
      asp_responsabilidad, asp_adaptabilidad, asp_aprendizaje, asp_reglamentos,
      observations
    } = req.body;

    const aspects = [asp_puntualidad, asp_uniforme, asp_actitud, asp_comunicacion,
      asp_responsabilidad, asp_adaptabilidad, asp_aprendizaje, asp_reglamentos];
    if (aspects.some(a => !a || a < 1 || a > 3)) {
      return res.status(400).json({ error: 'Todos los aspectos deben tener valor 1, 2 o 3' });
    }

    const [countRow] = await sql`
      SELECT COUNT(*)+1 AS next_num FROM visit_logs WHERE pasantia_id = ${pasantia_id}
    `;
    const [visit] = await sql`
      INSERT INTO visit_logs (
        pasantia_id, teacher_id, visit_date, visit_number,
        asp_puntualidad, asp_uniforme, asp_actitud, asp_comunicacion,
        asp_responsabilidad, asp_adaptabilidad, asp_aprendizaje, asp_reglamentos,
        observations, sig_teacher, sig_teacher_at, gem_logged
      ) VALUES (
        ${pasantia_id}, ${teacherId}, ${visit_date || 'NOW()'}, ${countRow.next_num},
        ${asp_puntualidad}, ${asp_uniforme}, ${asp_actitud}, ${asp_comunicacion},
        ${asp_responsabilidad}, ${asp_adaptabilidad}, ${asp_aprendizaje}, ${asp_reglamentos},
        ${observations}, 'Firma docente', NOW(), true
      ) RETURNING *
    `;
    return res.status(201).json({ visit, gem_logged: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ── CHECKLIST ──────────────────────────────────────────────────────────────────
async function handleChecklist(req, res, auth) {
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

// ── GRADES ─────────────────────────────────────────────────────────────────────
function scoreToGrade(total) {
  if (total === 12) return 10.0;
  if (total >= 8)  return +(7.0 + ((total - 8) / 4) * 3.0).toFixed(1);
  if (total >= 4)  return +(3.0 + ((total - 4) / 4) * 4.0).toFixed(1);
  return 1.0;
}

async function handleGrades(req, res, auth) {
  if (req.method === 'GET') {
    const { pasantia_id } = req.query;
    if (!pasantia_id) return res.status(400).json({ error: 'Falta pasantia_id' });
    const { rows } = await sql`
      SELECT fg.*, ps.visit_count, ps.total_hours, ps.student_name
      FROM final_grades fg
      JOIN pasantia_summary ps ON ps.id = fg.pasantia_id
      WHERE fg.pasantia_id = ${pasantia_id}
    `;
    return res.json(rows[0] || null);
  }

  if (req.method === 'POST') {
    if (auth.role !== 'teacher') return res.status(403).json({ error: 'Solo docentes' });

    const { pasantia_id, crit_asistencia, crit_presentacion, crit_conocimientos, crit_informe, teacher_comments } = req.body;

    const crits = [crit_asistencia, crit_presentacion, crit_conocimientos, crit_informe];
    if (crits.some(c => !c || c < 1 || c > 3)) {
      return res.status(400).json({ error: 'Cada criterio debe ser 1, 2 o 3' });
    }

    const { rows: summaryRows } = await sql`
      SELECT visit_count, is_blocked FROM pasantia_summary WHERE id = ${pasantia_id}
    `;
    const summary = summaryRows[0];
    if (!summary) return res.status(404).json({ error: 'Pasantía no encontrada' });
    if (summary.is_blocked) return res.status(403).json({ error: 'Alumno en condición ICE' });
    if (summary.visit_count < 2) {
      return res.status(422).json({
        error: 'No se puede calificar: se requieren al menos 2 visitas docentes registradas.',
        visit_count: summary.visit_count,
        visits_required: 2
      });
    }

    const total = crits.reduce((a, b) => a + b, 0);
    const grade = scoreToGrade(total);

    const { rows: teacher } = await sql`SELECT id FROM teachers WHERE user_id=${auth.userId}`;

    await sql`
      INSERT INTO final_grades (pasantia_id, teacher_id, crit_asistencia, crit_presentacion,
        crit_conocimientos, crit_informe, teacher_comments)
      VALUES (${pasantia_id}, ${teacher[0].id},
        ${crit_asistencia}, ${crit_presentacion}, ${crit_conocimientos}, ${crit_informe},
        ${teacher_comments || null})
      ON CONFLICT (pasantia_id) DO UPDATE SET
        crit_asistencia    = EXCLUDED.crit_asistencia,
        crit_presentacion  = EXCLUDED.crit_presentacion,
        crit_conocimientos = EXCLUDED.crit_conocimientos,
        crit_informe       = EXCLUDED.crit_informe,
        teacher_comments   = EXCLUDED.teacher_comments,
        updated_at         = NOW()
      WHERE final_grades.locked = false
    `;

    return res.json({ success: true, total_score: total, final_grade: grade });
  }

  res.status(405).json({ error: 'Método no permitido' });
}

// ── ROUTER ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  const resource = req.query._resource || req.query.action;
  if (resource === 'validations') return handleValidations(req, res, auth);
  if (resource === 'visits')      return handleVisits(req, res, auth);
  if (resource === 'checklist')   return handleChecklist(req, res, auth);
  if (resource === 'grades')      return handleGrades(req, res, auth);

  return jsonResponse(res, 400, { error: 'Recurso no reconocido' });
}
