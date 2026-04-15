// api/students/attendance.js — Asistencia con validaciones DGE
import { verifyToken } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

const MAX_HOURS_DAY = 4
const MAX_HOURS_WEEK = 20
const TIME_MIN = '08:00'
const TIME_MAX = '18:00'

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default async function handler(req, res) {
  const user = verifyToken(req)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  const [studentRow] = await sql`SELECT id FROM students WHERE user_id = ${user.id}`
  if (!studentRow) return res.status(404).json({ error: 'Perfil no encontrado' })
  const studentId = studentRow.id

  if (req.method === 'GET') {
    const { pasantia_id } = req.query
    const rows = await sql`
      SELECT a.*,
        SUM(a.hours_worked) OVER () AS total_accumulated
      FROM attendance a
      WHERE a.pasantia_id = ${pasantia_id} AND a.student_id = ${studentId}
      ORDER BY a.entry_date DESC, a.clock_in DESC
    `
    const total = rows[0]?.total_accumulated || 0
    return res.json({
      entries: rows,
      total_hours: +total,
      hours_remaining: Math.max(0, 100 - +total),
      goal_reached: +total >= 100
    })
  }

  if (req.method === 'POST') {
    const { pasantia_id, clock_in, clock_out, entry_date } = req.body

    // Validar franja horaria
    const inMin = toMinutes(clock_in)
    const outMin = toMinutes(clock_out)
    const minMin = toMinutes(TIME_MIN)
    const maxMin = toMinutes(TIME_MAX)

    if (inMin < minMin || outMin > maxMin) {
      return res.status(422).json({
        error: `Horario fuera de franja permitida (${TIME_MIN} – ${TIME_MAX})`,
        code: 'OUTSIDE_HOURS'
      })
    }

    const hoursToday = (outMin - inMin) / 60
    if (hoursToday > MAX_HOURS_DAY) {
      return res.status(422).json({
        error: `No se pueden registrar más de ${MAX_HOURS_DAY} horas por día`,
        code: 'EXCEEDS_DAILY_LIMIT'
      })
    }

    // Validar límite semanal
    const date = entry_date || new Date().toISOString().slice(0, 10)
    const [weekRow] = await sql`
      SELECT COALESCE(SUM(hours_worked),0) AS week_total
      FROM attendance
      WHERE pasantia_id = ${pasantia_id}
        AND student_id = ${studentId}
        AND entry_date >= DATE_TRUNC('week', ${date}::DATE)
        AND entry_date <= ${date}::DATE
    `
    if (+weekRow.week_total + hoursToday > MAX_HOURS_WEEK) {
      return res.status(422).json({
        error: `Límite semanal: máx. ${MAX_HOURS_WEEK} horas. Esta semana ya tenés ${weekRow.week_total} horas.`,
        code: 'EXCEEDS_WEEKLY_LIMIT'
      })
    }

    const [entry] = await sql`
      INSERT INTO attendance (pasantia_id, student_id, entry_date, clock_in, clock_out)
      VALUES (${pasantia_id}, ${studentId}, ${date}, ${clock_in}, ${clock_out})
      RETURNING *
    `
    return res.status(201).json({ entry })
  }

  res.status(405).json({ error: 'Método no permitido' })
}
