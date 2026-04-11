// api/auth/login.js
import bcrypt from 'bcryptjs';
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { signToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Método no permitido' });

  try {
    const { email, password } = req.body;
    if (!email || !password) return jsonResponse(res, 400, { error: 'Email y contraseña requeridos' });

    const { rows } = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (!rows.length) return jsonResponse(res, 401, { error: 'Credenciales incorrectas' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return jsonResponse(res, 401, { error: 'Credenciales incorrectas' });

    let profile = null;
    if (user.role === 'student') {
      const { rows: p } = await sql`
        SELECT s.*, sc.name as school_name
        FROM students s
        LEFT JOIN schools sc ON sc.id = s.school_id
        WHERE s.user_id = ${user.id} LIMIT 1`;
      profile = p[0] || null;
    } else if (user.role === 'company') {
      const { rows: p } = await sql`SELECT * FROM companies WHERE user_id = ${user.id} LIMIT 1`;
      profile = p[0] || null;
    } else if (user.role === 'teacher') {
      const { rows: p } = await sql`
        SELECT t.*, sc.name as school_name
        FROM teachers t
        LEFT JOIN schools sc ON sc.id = t.school_id
        WHERE t.user_id = ${user.id} LIMIT 1`;
      profile = p[0] || null;
    } else if (user.role === 'admin') {
      profile = { full_name: 'Administrador', role: 'admin' };
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email });

    return jsonResponse(res, 200, {
      token,
      user: { id: user.id, email: user.email, role: user.role },
      profile
    });
  } catch (err) {
    console.error('Login error:', err);
    return jsonResponse(res, 500, { error: 'Error interno del servidor' });
  }
}
