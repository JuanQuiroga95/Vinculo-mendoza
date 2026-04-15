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

// ── ROUTER ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  const resource = req.query._resource;
  if (resource === 'portfolio')  return handlePortfolio(req, res, auth);
  if (resource === 'logbook')    return handleLogbook(req, res, auth);
  if (resource === 'attendance') return handleAttendance(req, res, auth);

  return jsonResponse(res, 400, { error: 'Recurso no reconocido' });
}
