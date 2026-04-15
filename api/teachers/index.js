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

// ── ROUTER ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  const resource = req.query._resource;
  if (resource === 'validations') return handleValidations(req, res, auth);
  if (resource === 'visits')      return handleVisits(req, res, auth);

  return jsonResponse(res, 400, { error: 'Recurso no reconocido' });
}
