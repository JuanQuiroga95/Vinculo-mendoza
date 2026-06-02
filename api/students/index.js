// api/students/index.js — handles portfolio, logbook, attendance via _resource param
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth, verifyToken } from '../_lib/auth.js';

// ── PORTFOLIO ────────────────────────────────────────────────────────────────
async function handlePortfolio(req, res, auth) {
  const studentId = req.query.studentId;

  if (req.method === 'GET') {
    try {
      let id = studentId;
      if (!id && auth.role === 'student') {
        const { rows } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
        id = rows[0]?.id;
      }
      if (!id) return jsonResponse(res, 400, { error: 'studentId requerido' });
      const { rows } = await sql`SELECT * FROM portfolio_items WHERE student_id = ${id} ORDER BY created_at DESC`;
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

// ── LOGBOOK ──────────────────────────────────────────────────────────────────
async function handleLogbook(req, res, auth) {
  if (req.method === 'GET') {
    try {
      let studentId = req.query.studentId;
      if (!studentId && auth.role === 'student') {
        const { rows } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
        studentId = rows[0]?.id;
      }
      if (!studentId) return jsonResponse(res, 400, { error: 'studentId requerido' });
      const { rows } = await sql`
        SELECT l.*, a.vacancy_id, v.title as vacancy_title, c.company_name
        FROM logbook_entries l
        JOIN applications a ON l.application_id = a.id
        JOIN vacancies v ON a.vacancy_id = v.id
        JOIN companies c ON v.company_id = c.id
        WHERE l.student_id = ${studentId}
        ORDER BY l.entry_date DESC
      `;
      return jsonResponse(res, 200, { entries: rows });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al obtener bitácora' });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'student') return jsonResponse(res, 403, { error: 'Solo alumnos pueden agregar entradas' });
    try {
      const { application_id, content, hours_worked, entry_date, image_url } = req.body;
      const { rows: student } = await sql`SELECT id FROM students WHERE user_id = ${auth.userId} LIMIT 1`;
      if (!student.length) return jsonResponse(res, 404, { error: 'Perfil no encontrado' });
      const { rows } = await sql`
        INSERT INTO logbook_entries (student_id, application_id, content, hours_worked, entry_date, image_url)
        VALUES (${student[0].id}, ${application_id}, ${content}, ${hours_worked || null}, ${entry_date || null}, ${image_url || null})
        RETURNING *
      `;
      return jsonResponse(res, 201, { entry: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: 'Error al agregar entrada' });
    }
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}

// ── ATTENDANCE ───────────────────────────────────────────────────────────────
const MAX_HOURS_DAY  = 4;
const MAX_HOURS_WEEK = 20;
const TIME_MIN = '08:00';
const TIME_MAX = '18:00';
function toMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

async function handleAttendance(req, res, auth) {
  const [studentRow] = await sql`SELECT id FROM students WHERE user_id = ${auth.userId}`;
  if (!studentRow) return res.status(404).json({ error: 'Perfil no encontrado' });
  const studentId = studentRow.id;

  if (req.method === 'GET') {
    const { pasantia_id } = req.query;
    const rows = await sql`
      SELECT a.*,
        SUM(a.hours_worked) OVER () AS total_accumulated
      FROM attendance a
      WHERE a.pasantia_id = ${pasantia_id} AND a.student_id = ${studentId}
      ORDER BY a.entry_date DESC, a.clock_in DESC
    `;
    const total = rows[0]?.total_accumulated || 0;
    return res.json({
      entries: rows,
      total_hours: +total,
      hours_remaining: Math.max(0, 100 - +total),
      goal_reached: +total >= 100
    });
  }

  if (req.method === 'POST') {
    const { pasantia_id, clock_in, clock_out, entry_date } = req.body;
    const inMin  = toMinutes(clock_in);
    const outMin = toMinutes(clock_out);
    const minMin = toMinutes(TIME_MIN);
    const maxMin = toMinutes(TIME_MAX);

    if (inMin < minMin || outMin > maxMin) {
      return res.status(422).json({ error: `Horario fuera de franja permitida (${TIME_MIN} – ${TIME_MAX})`, code: 'OUTSIDE_HOURS' });
    }
    const hoursToday = (outMin - inMin) / 60;
    if (hoursToday > MAX_HOURS_DAY) {
      return res.status(422).json({ error: `No se pueden registrar más de ${MAX_HOURS_DAY} horas por día`, code: 'EXCEEDS_DAILY_LIMIT' });
    }
    const date = entry_date || new Date().toISOString().slice(0, 10);
    const [weekRow] = await sql`
      SELECT COALESCE(SUM(hours_worked),0) AS week_total FROM attendance
      WHERE pasantia_id = ${pasantia_id} AND student_id = ${studentId}
        AND entry_date >= DATE_TRUNC('week', ${date}::DATE) AND entry_date <= ${date}::DATE
    `;
    if (+weekRow.week_total + hoursToday > MAX_HOURS_WEEK) {
      return res.status(422).json({ error: `Límite semanal: máx. ${MAX_HOURS_WEEK} horas. Esta semana ya tenés ${weekRow.week_total} horas.`, code: 'EXCEEDS_WEEKLY_LIMIT' });
    }
    const [entry] = await sql`
      INSERT INTO attendance (pasantia_id, student_id, entry_date, clock_in, clock_out)
      VALUES (${pasantia_id}, ${studentId}, ${date}, ${clock_in}, ${clock_out})
      RETURNING *
    `;
    return res.status(201).json({ entry });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ── SELF-EVALUATION ────────────────────────────────────────────────────────────
async function handleSelfEvaluation(req, res, auth) {
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

// ── AUTHORIZATION ──────────────────────────────────────────────────────────────
async function handleAuthorization(req, res, auth) {
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

// ── ROUTER ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  const resource = req.query._resource || req.query.action;
  if (resource === 'portfolio')  return handlePortfolio(req, res, auth);
  if (resource === 'logbook')    return handleLogbook(req, res, auth);
  if (resource === 'attendance') return handleAttendance(req, res, auth);
  if (resource === 'pasantia')   return handleActivePasantia(req, res, auth);
  if (resource === 'report')     return handleReport(req, res, auth);
  if (resource === 'self-evaluation') return handleSelfEvaluation(req, res, auth);
  if (resource === 'authorization') return handleAuthorization(req, res, auth);

  return jsonResponse(res, 400, { error: 'Recurso no reconocido' });
}

// ── PASANTÍA ACTIVA ───────────────────────────────────────────────────────────
async function handleActivePasantia(req, res, auth) {
  const [studentRow] = await sql`SELECT id FROM students WHERE user_id = ${auth.userId}`;
  if (!studentRow) return res.status(404).json({ error: 'Perfil no encontrado' });

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT p.id, p.status, c.company_name,
        COALESCE(SUM(a.hours_worked), 0) AS total_hours,
        COUNT(a.id) AS attendance_count
      FROM pasantias p
      JOIN companies c ON c.id = p.company_id
      LEFT JOIN attendance a ON a.pasantia_id = p.id
      WHERE p.student_id = ${studentRow.id} AND p.status IN ('active','simulation')
      GROUP BY p.id, c.company_name
      LIMIT 1
    `;
    return res.json({ pasantia: rows[0] || null });
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

// ── INFORME FINAL ─────────────────────────────────────────────────────────────
async function handleReport(req, res, auth) {
  const [studentRow] = await sql`SELECT id FROM students WHERE user_id = ${auth.userId}`;
  if (!studentRow) return res.status(404).json({ error: 'Perfil no encontrado' });
  const studentId = studentRow.id;

  if (req.method === 'GET') {
    const { pasantia_id } = req.query;
    if (!pasantia_id) return res.status(400).json({ error: 'Falta pasantia_id' });
    const rows = await sql`
      SELECT * FROM final_reports
      WHERE pasantia_id = ${pasantia_id} AND student_id = ${studentId}
      LIMIT 1
    `;
    return res.json(rows[0] || null);
  }

  if (req.method === 'POST') {
    const {
      pasantia_id, status,
      q_expectativas, q_sentimientos, q_aprendizajes, q_conflictos,
      q_saberes, q_mejoras, q_relaciones, q_recomendacion,
      saberes_tags
    } = req.body;
    if (!pasantia_id) return res.status(400).json({ error: 'Falta pasantia_id' });

    const rows = await sql`
      INSERT INTO final_reports (
        pasantia_id, student_id, status,
        q_expectativas, q_sentimientos, q_aprendizajes, q_conflictos,
        q_saberes, q_mejoras, q_relaciones, q_recomendacion,
        saberes_tags, updated_at
      ) VALUES (
        ${pasantia_id}, ${studentId}, ${status || 'draft'},
        ${q_expectativas || ''}, ${q_sentimientos || ''}, ${q_aprendizajes || ''}, ${q_conflictos || ''},
        ${q_saberes || ''}, ${q_mejoras || ''}, ${q_relaciones || ''}, ${q_recomendacion || ''},
        ${JSON.stringify(saberes_tags || [])}, NOW()
      )
      ON CONFLICT (pasantia_id, student_id) DO UPDATE SET
        status = EXCLUDED.status,
        q_expectativas = EXCLUDED.q_expectativas,
        q_sentimientos = EXCLUDED.q_sentimientos,
        q_aprendizajes = EXCLUDED.q_aprendizajes,
        q_conflictos = EXCLUDED.q_conflictos,
        q_saberes = EXCLUDED.q_saberes,
        q_mejoras = EXCLUDED.q_mejoras,
        q_relaciones = EXCLUDED.q_relaciones,
        q_recomendacion = EXCLUDED.q_recomendacion,
        saberes_tags = EXCLUDED.saberes_tags,
        updated_at = NOW()
      RETURNING *
    `;
    return res.json(rows[0]);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}
