import { sql, handleCors, jsonResponse } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT * FROM official_notes 
        ORDER BY created_at DESC
      `;
      return jsonResponse(res, 200, { notes: rows });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo admin' });
    
    try {
      const b = req.body;
      const { rows } = await sql`
        INSERT INTO official_notes (
          type, recipient_name, recipient_org, subject, body,
          school_name, director_name, school_address, status, created_by
        ) VALUES (
          ${b.type}, ${b.recipient_name || null}, ${b.recipient_org || null}, ${b.subject || null}, ${b.body || null},
          ${b.school_name || null}, ${b.director_name || null}, ${b.school_address || null}, 'borrador', ${auth.userId}
        ) RETURNING *
      `;
      return jsonResponse(res, 201, { note: rows[0] });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  return jsonResponse(res, 404, { error: 'Not found' });
}
