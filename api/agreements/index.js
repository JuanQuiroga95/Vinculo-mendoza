import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      let query;
      if (auth.role === 'student') {
        const { rows: st } = await sql`SELECT id FROM students WHERE user_id=${auth.userId} LIMIT 1`;
        if (!st.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
        query = sql`SELECT a.*, c.company_name, s.full_name as student_name FROM agreements a LEFT JOIN companies c ON c.id=a.company_id LEFT JOIN students s ON s.id=a.student_id WHERE a.student_id=${st[0].id} ORDER BY a.created_at DESC`;
      } else if (auth.role === 'company') {
        const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id=${auth.userId} LIMIT 1`;
        if (!comp.length) return jsonResponse(res, 404, { error: 'Empresa no encontrada' });
        query = sql`SELECT a.*, c.company_name, s.full_name as student_name FROM agreements a LEFT JOIN companies c ON c.id=a.company_id LEFT JOIN students s ON s.id=a.student_id WHERE a.company_id=${comp[0].id} ORDER BY a.created_at DESC`;
      } else {
        query = sql`SELECT a.*, c.company_name, s.full_name as student_name FROM agreements a LEFT JOIN companies c ON c.id=a.company_id LEFT JOIN students s ON s.id=a.student_id ORDER BY a.created_at DESC`;
      }
      
      const { rows } = await query;
      return jsonResponse(res, 200, { agreements: rows });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (!['admin', 'teacher'].includes(auth.role)) return jsonResponse(res, 403, { error: 'No autorizado' });
    const { type, company_id, student_id, teacher_id, start_date, end_date, schedule_hours, instructor_name, clauses } = req.body;
    
    try {
      const { rows } = await sql`
        INSERT INTO agreements (type, company_id, student_id, teacher_id, start_date, end_date, schedule_hours, instructor_name, clauses, created_by)
        VALUES (${type}, ${company_id || null}, ${student_id || null}, ${teacher_id || null}, ${start_date || null}, ${end_date || null}, ${schedule_hours || null}, ${instructor_name || null}, ${JSON.stringify(clauses || [])}, ${auth.userId})
        RETURNING *
      `;
      return jsonResponse(res, 201, { agreement: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  if (req.method === 'PUT') {
    const { id, status, sig_director, sig_director_at, sig_company, sig_company_at, sig_student, sig_student_at, sig_parent, sig_parent_at, sig_teacher, sig_teacher_at } = req.body;
    
    try {
      const { rows } = await sql`
        UPDATE agreements SET
          status = COALESCE(${status}, status),
          sig_director = COALESCE(${sig_director}, sig_director),
          sig_director_at = COALESCE(${sig_director_at}, sig_director_at),
          sig_company = COALESCE(${sig_company}, sig_company),
          sig_company_at = COALESCE(${sig_company_at}, sig_company_at),
          sig_student = COALESCE(${sig_student}, sig_student),
          sig_student_at = COALESCE(${sig_student_at}, sig_student_at),
          sig_parent = COALESCE(${sig_parent}, sig_parent),
          sig_parent_at = COALESCE(${sig_parent_at}, sig_parent_at),
          sig_teacher = COALESCE(${sig_teacher}, sig_teacher),
          sig_teacher_at = COALESCE(${sig_teacher_at}, sig_teacher_at),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return jsonResponse(res, 200, { agreement: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  return jsonResponse(res, 404, { error: 'Not found' });
}
