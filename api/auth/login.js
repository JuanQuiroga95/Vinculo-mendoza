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

    // Get user
    const { rows } = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (!rows.length) return jsonResponse(res, 401, { error: 'Credenciales incorrectas' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return jsonResponse(res, 401, { error: 'Credenciales incorrectas' });

    // Get profile based on role
    let profile = null;
    if (user.role === 'student') {
      const { rows: p } = await sql`SELECT * FROM students WHERE user_id = ${user.id} LIMIT 1`;
      profile = p[0] || null;
    } else if (user.role === 'company') {
      const { rows: p } = await sql`SELECT * FROM companies WHERE user_id = ${user.id} LIMIT 1`;
      profile = p[0] || null;
    } else if (user.role === 'teacher') {
      const { rows: p } = await sql`SELECT * FROM teachers WHERE user_id = ${user.id} LIMIT 1`;
      profile = p[0] || null;
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
