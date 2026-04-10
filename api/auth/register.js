// api/auth/register.js
import bcrypt from 'bcryptjs';
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { signToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Método no permitido' });

  try {
    const { email, password, role, profileData } = req.body;

    if (!email || !password || !role) {
      return jsonResponse(res, 400, { error: 'Datos incompletos' });
    }
    if (!['student', 'company', 'teacher'].includes(role)) {
      return jsonResponse(res, 400, { error: 'Rol inválido' });
    }

    // Check existing
    const { rows: existing } = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (existing.length) return jsonResponse(res, 409, { error: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 12);

    // Create user
    const { rows: userRows } = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email.toLowerCase()}, ${hash}, ${role})
      RETURNING id, email, role
    `;
    const user = userRows[0];

    // Create profile
    let profile = null;
    if (role === 'student') {
      const { full_name, school, orientation, grade, birth_date } = profileData || {};
      const { rows: p } = await sql`
        INSERT INTO students (user_id, full_name, school, orientation, grade, birth_date)
        VALUES (${user.id}, ${full_name || ''}, ${school || ''}, ${orientation || ''}, ${grade || ''}, ${birth_date || null})
        RETURNING *
      `;
      profile = p[0];
    } else if (role === 'company') {
      const { company_name, sector, location, contact_name } = profileData || {};
      const { rows: p } = await sql`
        INSERT INTO companies (user_id, company_name, sector, location, contact_name)
        VALUES (${user.id}, ${company_name || ''}, ${sector || ''}, ${location || ''}, ${contact_name || ''})
        RETURNING *
      `;
      profile = p[0];
    } else if (role === 'teacher') {
      const { full_name, school, subject } = profileData || {};
      const { rows: p } = await sql`
        INSERT INTO teachers (user_id, full_name, school, subject)
        VALUES (${user.id}, ${full_name || ''}, ${school || ''}, ${subject || ''})
        RETURNING *
      `;
      profile = p[0];
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email });

    return jsonResponse(res, 201, {
      token,
      user: { id: user.id, email: user.email, role: user.role },
      profile
    });
  } catch (err) {
    console.error('Register error:', err);
    return jsonResponse(res, 500, { error: 'Error interno del servidor' });
  }
}
