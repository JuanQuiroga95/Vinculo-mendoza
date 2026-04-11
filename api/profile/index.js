// api/profile/index.js — Ver y actualizar perfil propio
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;

  if (req.method === 'GET') {
    let profile = null;
    if (user.role === 'student') {
      const { rows } = await sql`SELECT s.*, sc.name as school_name FROM students s LEFT JOIN schools sc ON sc.id = s.school_id WHERE s.user_id = ${user.userId}`;
      profile = rows[0];
    } else if (user.role === 'company') {
      const { rows } = await sql`SELECT * FROM companies WHERE user_id = ${user.userId}`;
      profile = rows[0];
    } else if (user.role === 'teacher') {
      const { rows } = await sql`SELECT t.*, sc.name as school_name FROM teachers t LEFT JOIN schools sc ON sc.id = t.school_id WHERE t.user_id = ${user.userId}`;
      profile = rows[0];
    }
    return jsonResponse(res, 200, { profile });
  }

  if (req.method === 'PUT') {
    const body = req.body;
    if (user.role === 'student') {
      const { rows } = await sql`
        UPDATE students SET
          full_name     = COALESCE(${body.full_name||null}, full_name),
          bio           = ${body.bio !== undefined ? body.bio : null},
          avatar_url    = ${body.avatar_url !== undefined ? body.avatar_url : null},
          phone         = ${body.phone !== undefined ? body.phone : null},
          linkedin_url  = ${body.linkedin_url !== undefined ? body.linkedin_url : null},
          orientation   = COALESCE(${body.orientation||null}, orientation),
          grade         = COALESCE(${body.grade||null}, grade),
          location      = ${body.location !== undefined ? body.location : null},
          interests     = ${body.interests ? body.interests : null},
          updated_at    = NOW()
        WHERE user_id = ${user.userId} RETURNING *`;
      return jsonResponse(res, 200, { profile: rows[0] });
    }

    if (user.role === 'company') {
      const { rows } = await sql`
        UPDATE companies SET
          company_name  = COALESCE(${body.company_name||null}, company_name),
          sector        = ${body.sector !== undefined ? body.sector : null},
          description   = ${body.description !== undefined ? body.description : null},
          location      = ${body.location !== undefined ? body.location : null},
          address       = ${body.address !== undefined ? body.address : null},
          department    = ${body.department !== undefined ? body.department : null},
          phone         = ${body.phone !== undefined ? body.phone : null},
          website       = ${body.website !== undefined ? body.website : null},
          logo_url      = ${body.logo_url !== undefined ? body.logo_url : null},
          contact_name  = COALESCE(${body.contact_name||null}, contact_name),
          updated_at    = NOW()
        WHERE user_id = ${user.userId} RETURNING *`;
      return jsonResponse(res, 200, { profile: rows[0] });
    }

    if (user.role === 'teacher') {
      const { rows } = await sql`
        UPDATE teachers SET
          full_name   = COALESCE(${body.full_name||null}, full_name),
          bio         = ${body.bio !== undefined ? body.bio : null},
          avatar_url  = ${body.avatar_url !== undefined ? body.avatar_url : null},
          phone       = ${body.phone !== undefined ? body.phone : null},
          subject     = ${body.subject !== undefined ? body.subject : null},
          updated_at  = NOW()
        WHERE user_id = ${user.userId} RETURNING *`;
      return jsonResponse(res, 200, { profile: rows[0] });
    }

    return jsonResponse(res, 400, { error: 'Rol no soportado' });
  }

  return jsonResponse(res, 405, { error: 'Método no permitido' });
}
