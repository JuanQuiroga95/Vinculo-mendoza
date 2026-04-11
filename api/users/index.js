// api/users/index.js — Admin crea empresas; escuela/docente crea docentes/alumnos
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;

  // GET — admin: lista todos; teacher: lista sus alumnos
  if (req.method === 'GET') {
    if (user.role === 'admin') {
      const { rows } = await sql`
        SELECT u.id, u.email, u.role, u.created_at,
          COALESCE(s.full_name, c.company_name, t.full_name) as display_name,
          COALESCE(s.school, c.sector, t.school) as detail,
          sc.name as school_name
        FROM users u
        LEFT JOIN students s ON s.user_id = u.id
        LEFT JOIN companies c ON c.user_id = u.id
        LEFT JOIN teachers t ON t.user_id = u.id
        LEFT JOIN schools sc ON sc.id = u.school_id
        ORDER BY u.created_at DESC`;
      return jsonResponse(res, 200, { users: rows });
    }
    if (user.role === 'teacher') {
      const { rows } = await sql`
        SELECT s.*, u.email,
          sv.skill_count,
          app_count.application_count,
          port_count.portfolio_count
        FROM students s
        JOIN users u ON u.id = s.user_id
        LEFT JOIN (SELECT student_id, COUNT(*) as skill_count FROM skill_validations GROUP BY student_id) sv ON sv.student_id = s.id
        LEFT JOIN (SELECT student_id, COUNT(*) as application_count FROM applications GROUP BY student_id) app_count ON app_count.student_id = s.id
        LEFT JOIN (SELECT student_id, COUNT(*) as portfolio_count FROM portfolio_items GROUP BY student_id) port_count ON port_count.student_id = s.id
        WHERE s.created_by = ${user.userId}
        ORDER BY s.full_name ASC`;
      return jsonResponse(res, 200, { students: rows });
    }
    return jsonResponse(res, 403, { error: 'Acceso denegado' });
  }

  // POST — crear usuario
  if (req.method === 'POST') {
    const { email, password, role, full_name, school_id, ...extra } = req.body;

    // Permisos: admin crea company/admin; teacher crea student; admin tb crea teacher
    if (role === 'company' && user.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo admin puede crear empresas' });
    if (role === 'teacher' && user.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo admin puede crear docentes' });
    if (role === 'student' && !['teacher','admin'].includes(user.role)) return jsonResponse(res, 403, { error: 'Solo docentes o admin pueden crear alumnos' });

    if (!email || !password || !role || !full_name) return jsonResponse(res, 400, { error: 'Faltan campos requeridos' });

    const hash = await bcrypt.hash(password, 12);
    const { rows: [newUser] } = await sql`
      INSERT INTO users (email, password_hash, role, school_id, created_by)
      VALUES (${email.toLowerCase()}, ${hash}, ${role}, ${school_id||null}, ${user.userId})
      RETURNING id, email, role`;

    // Crear perfil según rol
    if (role === 'student') {
      await sql`INSERT INTO students (user_id, full_name, school_id, created_by, orientation, grade, location)
        VALUES (${newUser.id}, ${full_name}, ${school_id||null}, ${user.userId}, ${extra.orientation||null}, ${extra.grade||null}, ${extra.location||null})`;
    } else if (role === 'teacher') {
      await sql`INSERT INTO teachers (user_id, full_name, school_id, subject, email)
        VALUES (${newUser.id}, ${full_name}, ${school_id||null}, ${extra.subject||null}, ${email})`;
    } else if (role === 'company') {
      await sql`INSERT INTO companies (user_id, company_name, sector, location, contact_name, department)
        VALUES (${newUser.id}, ${full_name}, ${extra.sector||null}, ${extra.location||null}, ${extra.contact_name||null}, ${extra.department||null})`;
    }

    return jsonResponse(res, 201, { user: newUser, message: 'Usuario creado correctamente' });
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
