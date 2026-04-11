// api/index.js — Router único. Toda la API en una sola Serverless Function.
// Rutas disponibles:
//   POST   /api  { _path: 'auth/login' }
//   POST   /api  { _path: 'auth/register' }
//   GET    /api?_path=vacancies
//   POST   /api  { _path: 'vacancies' }
//   ...etc — el cliente agrega _path en body (POST) o query (GET/DELETE)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import bcrypt    from 'bcryptjs';
import { sql, handleCors, jsonResponse } from './_lib/db.js';
import { requireAuth, signToken }        from './_lib/auth.js';

// ─── Upload helper (multipart sin formidable extra) ───────────────────────────
async function handleUpload(req, res, auth) {
  // Usamos el body raw como buffer — Vercel lo provee en req como stream
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buf = Buffer.concat(chunks);
  const ct  = req.headers['content-type'] || '';
  if (!ct.includes('multipart/form-data')) return jsonResponse(res, 400, { error: 'Se esperaba multipart/form-data' });

  const boundary = ct.split('boundary=')[1];
  if (!boundary) return jsonResponse(res, 400, { error: 'Boundary faltante' });

  // Parse multipart simple
  const parts = buf.toString('binary').split('--' + boundary);
  let fileBuffer = null, mimeType = 'image/jpeg', originalName = 'photo.jpg';

  for (const part of parts) {
    if (!part.includes('Content-Disposition')) continue;
    if (!part.includes('filename=')) continue;
    const nameMatch = part.match(/filename="([^"]+)"/);
    if (nameMatch) originalName = nameMatch[1];
    const mimeMatch = part.match(/Content-Type: ([^\r\n]+)/);
    if (mimeMatch) mimeType = mimeMatch[1].trim();
    const bodyStart = part.indexOf('\r\n\r\n');
    if (bodyStart === -1) continue;
    const rawBody = part.slice(bodyStart + 4, part.lastIndexOf('\r\n'));
    fileBuffer = Buffer.from(rawBody, 'binary');
    break;
  }

  if (!fileBuffer || fileBuffer.length < 100) return jsonResponse(res, 400, { error: 'No se recibió imagen válida' });
  if (fileBuffer.length > 5 * 1024 * 1024) return jsonResponse(res, 400, { error: 'La imagen supera los 5MB' });

  const allowedMimes = ['image/jpeg','image/png','image/webp','image/gif'];
  if (!allowedMimes.includes(mimeType)) return jsonResponse(res, 400, { error: 'Formato no permitido (JPG, PNG, WebP)' });

  const ext      = originalName.split('.').pop().toLowerCase() || 'jpg';
  const fileName = `avatars/${auth.userId}-${Date.now()}.${ext}`;

  // Subir a Supabase Storage via REST (sin SDK extra)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse(res, 500, {
      error: 'Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Vercel'
    });
  }

  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/profiles/${fileName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: fileBuffer,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return jsonResponse(res, 500, { error: 'Error al subir a Supabase: ' + err });
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/profiles/${fileName}`;
  return jsonResponse(res, 200, { url: publicUrl });
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Determinar ruta: query param _path (GET/DELETE) o body._path (POST/PUT)
  let path = req.query._path || '';
  let body = req.body || {};

  if (!path && typeof body._path === 'string') {
    path = body._path;
    const { _path, ...rest } = body;
    body = rest;
    req.body = body;
  }

  path = path.replace(/^\/+/, '');

  // Soporte para _method override (DELETE via POST)
  if (body._method) { req.method = body._method.toUpperCase(); delete body._method; req.body = body; }


  // ── Upload (multipart — no lee body como JSON) ──────────────────────────────
  if (path === 'upload/image') {
    const auth = requireAuth(req, res); if (!auth) return;
    return handleUpload(req, res, auth);
  }

  // ── AUTH ────────────────────────────────────────────────────────────────────
  if (path === 'auth/login' && req.method === 'POST') {
    const { email, password } = body;
    if (!email || !password) return jsonResponse(res, 400, { error: 'Email y contraseña requeridos' });
    const { rows } = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (!rows.length) return jsonResponse(res, 401, { error: 'Credenciales incorrectas' });
    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return jsonResponse(res, 401, { error: 'Credenciales incorrectas' });
    let profile = null;
    if (user.role === 'student') {
      const { rows: p } = await sql`SELECT s.*, sc.name as school_name FROM students s LEFT JOIN schools sc ON sc.id=s.school_id WHERE s.user_id=${user.id} LIMIT 1`;
      profile = p[0] || null;
    } else if (user.role === 'company') {
      const { rows: p } = await sql`SELECT * FROM companies WHERE user_id=${user.id} LIMIT 1`;
      profile = p[0] || null;
    } else if (user.role === 'teacher') {
      const { rows: p } = await sql`SELECT t.*, sc.name as school_name FROM teachers t LEFT JOIN schools sc ON sc.id=t.school_id WHERE t.user_id=${user.id} LIMIT 1`;
      profile = p[0] || null;
    } else if (user.role === 'admin') {
      profile = { full_name: 'Administrador', role: 'admin' };
    }
    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    return jsonResponse(res, 200, { token, user: { id: user.id, email: user.email, role: user.role }, profile });
  }

  if (path === 'auth/register' && req.method === 'POST') {
    const { email, password, role, profileData } = body;
    if (!email || !password || !role) return jsonResponse(res, 400, { error: 'Datos incompletos' });
    if (!['student','company','teacher'].includes(role)) return jsonResponse(res, 400, { error: 'Rol inválido' });
    const { rows: ex } = await sql`SELECT id FROM users WHERE email=${email.toLowerCase()} LIMIT 1`;
    if (ex.length) return jsonResponse(res, 409, { error: 'El email ya está registrado' });
    const hash = await bcrypt.hash(password, 12);
    const { rows: ur } = await sql`INSERT INTO users (email,password_hash,role) VALUES (${email.toLowerCase()},${hash},${role}) RETURNING id,email,role`;
    const user = ur[0];
    let profile = null;
    if (role === 'student') {
      const { full_name, school, orientation, grade, birth_date } = profileData || {};
      const { rows: p } = await sql`INSERT INTO students (user_id,full_name,school,orientation,grade,birth_date) VALUES (${user.id},${full_name||''},${school||''},${orientation||''},${grade||''},${birth_date||null}) RETURNING *`;
      profile = p[0];
    } else if (role === 'company') {
      const { company_name, sector, location, contact_name } = profileData || {};
      const { rows: p } = await sql`INSERT INTO companies (user_id,company_name,sector,location,contact_name) VALUES (${user.id},${company_name||''},${sector||''},${location||''},${contact_name||''}) RETURNING *`;
      profile = p[0];
    } else if (role === 'teacher') {
      const { full_name, school, subject } = profileData || {};
      const { rows: p } = await sql`INSERT INTO teachers (user_id,full_name,school,subject) VALUES (${user.id},${full_name||''},${school||''},${subject||''}) RETURNING *`;
      profile = p[0];
    }
    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    return jsonResponse(res, 201, { token, user: { id: user.id, email: user.email, role: user.role }, profile });
  }

  // ── VACANCIES ───────────────────────────────────────────────────────────────
  if (path === 'vacancies') {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT v.*,c.company_name,c.sector,c.logo_url,c.location as company_location,c.description as company_description,c.id as company_id FROM vacancies v JOIN companies c ON v.company_id=c.id WHERE v.active=true ORDER BY v.created_at DESC LIMIT 100`;
      return jsonResponse(res, 200, { vacancies: rows });
    }
    const auth = requireAuth(req, res); if (!auth) return;
    if (req.method === 'POST') {
      if (auth.role !== 'company') return jsonResponse(res, 403, { error: 'Solo empresas pueden publicar vacantes' });
      const { title, description, orientation_required, hours_per_week, location, tags, slots, schedule_start, schedule_end } = body;
      const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id=${auth.userId} LIMIT 1`;
      if (!comp.length) return jsonResponse(res, 404, { error: 'Empresa no encontrada' });
      const { rows } = await sql`INSERT INTO vacancies (company_id,title,description,orientation_required,hours_per_week,location,tags,slots,schedule_start,schedule_end) VALUES (${comp[0].id},${title},${description||null},${orientation_required||null},${Number(hours_per_week)||15},${location||''},${tags||null},${Number(slots)||1},${schedule_start||'08:00'},${schedule_end||'14:00'}) RETURNING *`;
      return jsonResponse(res, 201, { vacancy: rows[0] });
    }
    if (req.method === 'PUT') {
      if (auth.role !== 'company') return jsonResponse(res, 403, { error: 'Solo empresas' });
      const { vacancy_id, title, description, orientation_required, hours_per_week, location, tags, slots, active, schedule_start, schedule_end } = body;
      const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id=${auth.userId} LIMIT 1`;
      const { rows } = await sql`UPDATE vacancies SET title=${title},description=${description||null},orientation_required=${orientation_required||null},hours_per_week=${Number(hours_per_week)||15},location=${location||''},tags=${tags||null},slots=${Number(slots)||1},active=${active!==undefined?active:true},schedule_start=${schedule_start||'08:00'},schedule_end=${schedule_end||'14:00'} WHERE id=${vacancy_id} AND company_id=${comp[0].id} RETURNING *`;
      return jsonResponse(res, 200, { vacancy: rows[0] });
    }
    if (req.method === 'DELETE') {
      const { vacancy_id } = body;
      const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id=${auth.userId} LIMIT 1`;
      await sql`UPDATE vacancies SET active=false WHERE id=${vacancy_id} AND company_id=${comp[0].id}`;
      return jsonResponse(res, 200, { ok: true });
    }
  }

  // ── APPLICATIONS ────────────────────────────────────────────────────────────
  if (path === 'applications') {
    const auth = requireAuth(req, res); if (!auth) return;
    if (req.method === 'GET') {
      if (auth.role === 'student') {
        const { rows: st } = await sql`SELECT id FROM students WHERE user_id=${auth.userId} LIMIT 1`;
        if (!st.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
        const { rows } = await sql`SELECT a.*,v.title as vacancy_title,c.company_name,v.location,v.hours_per_week FROM applications a JOIN vacancies v ON a.vacancy_id=v.id JOIN companies c ON v.company_id=c.id WHERE a.student_id=${st[0].id} ORDER BY a.applied_at DESC`;
        return jsonResponse(res, 200, { applications: rows });
      } else if (auth.role === 'company') {
        const { rows: comp } = await sql`SELECT id FROM companies WHERE user_id=${auth.userId} LIMIT 1`;
        if (!comp.length) return jsonResponse(res, 404, { error: 'Empresa no encontrada' });
        const { rows } = await sql`SELECT a.*,s.full_name as student_name,s.school,s.orientation,s.grade,s.bio,s.interests,s.avatar_url,v.title as vacancy_title FROM applications a JOIN students s ON a.student_id=s.id JOIN vacancies v ON a.vacancy_id=v.id WHERE v.company_id=${comp[0].id} ORDER BY a.applied_at DESC`;
        return jsonResponse(res, 200, { applications: rows });
      }
    }
    if (req.method === 'POST') {
      if (auth.role !== 'student') return jsonResponse(res, 403, { error: 'Solo alumnos' });
      const { vacancy_id, cover_note } = body;
      const { rows: st } = await sql`SELECT id FROM students WHERE user_id=${auth.userId} LIMIT 1`;
      if (!st.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
      try {
        const { rows } = await sql`INSERT INTO applications (student_id,vacancy_id,cover_note) VALUES (${st[0].id},${vacancy_id},${cover_note||null}) RETURNING *`;
        return jsonResponse(res, 201, { application: rows[0] });
      } catch(e) {
        if (e.message?.includes('unique')) return jsonResponse(res, 409, { error: 'Ya te postulaste a esta vacante' });
        throw e;
      }
    }
    if (req.method === 'PUT') {
      if (auth.role !== 'company') return jsonResponse(res, 403, { error: 'Solo empresas' });
      const { application_id, status } = body;
      const valid = ['pending','reviewed','interview','accepted','rejected'];
      if (!valid.includes(status)) return jsonResponse(res, 400, { error: 'Estado inválido' });
      const { rows } = await sql`UPDATE applications SET status=${status},updated_at=NOW() WHERE id=${application_id} RETURNING *`;
      return jsonResponse(res, 200, { application: rows[0] });
    }
  }

  // ── PORTFOLIO ───────────────────────────────────────────────────────────────
  if (path === 'students/portfolio') {
    const auth = requireAuth(req, res); if (!auth) return;
    if (req.method === 'GET') {
      const { rows: st } = await sql`SELECT id FROM students WHERE user_id=${auth.userId} LIMIT 1`;
      if (!st.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
      const { rows } = await sql`SELECT * FROM portfolio_items WHERE student_id=${st[0].id} ORDER BY created_at DESC`;
      return jsonResponse(res, 200, { items: rows });
    }
    if (req.method === 'POST') {
      const { title, description, category, file_url, image_url, subject } = body;
      const { rows: st } = await sql`SELECT id FROM students WHERE user_id=${auth.userId} LIMIT 1`;
      if (!st.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
      const { rows } = await sql`INSERT INTO portfolio_items (student_id,title,description,category,file_url,image_url,subject) VALUES (${st[0].id},${title},${description||null},${category||null},${file_url||null},${image_url||null},${subject||null}) RETURNING *`;
      return jsonResponse(res, 201, { item: rows[0] });
    }
    if (req.method === 'DELETE') {
      const { item_id } = body;
      await sql`DELETE FROM portfolio_items WHERE id=${item_id}`;
      return jsonResponse(res, 200, { success: true });
    }
  }

  // ── LOGBOOK ─────────────────────────────────────────────────────────────────
  if (path === 'students/logbook') {
    const auth = requireAuth(req, res); if (!auth) return;
    if (req.method === 'GET') {
      if (auth.role === 'teacher' && req.query.all === '1') {
        const { rows } = await sql`SELECT le.*,s.full_name as student_name,v.title as vacancy_title,c.company_name FROM logbook_entries le JOIN students s ON s.id=le.student_id LEFT JOIN applications a ON a.id=le.application_id LEFT JOIN vacancies v ON v.id=a.vacancy_id LEFT JOIN companies c ON c.id=v.company_id WHERE s.created_by=${auth.userId} ORDER BY le.entry_date DESC`;
        return jsonResponse(res, 200, { entries: rows });
      }
      const { rows: st } = await sql`SELECT id FROM students WHERE user_id=${auth.userId} LIMIT 1`;
      if (!st.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
      const { rows } = await sql`SELECT le.*,v.title as vacancy_title,c.company_name FROM logbook_entries le LEFT JOIN applications a ON a.id=le.application_id LEFT JOIN vacancies v ON v.id=a.vacancy_id LEFT JOIN companies c ON c.id=v.company_id WHERE le.student_id=${st[0].id} ORDER BY le.entry_date DESC`;
      return jsonResponse(res, 200, { entries: rows });
    }
    if (req.method === 'POST') {
      if (auth.role !== 'student') return jsonResponse(res, 403, { error: 'Solo alumnos' });
      const { application_id, content, hours_worked, entry_date, image_url } = body;
      if (!content) return jsonResponse(res, 400, { error: 'Contenido requerido' });
      const { rows: st } = await sql`SELECT id FROM students WHERE user_id=${auth.userId} LIMIT 1`;
      if (!st.length) return jsonResponse(res, 404, { error: 'Alumno no encontrado' });
      const { rows } = await sql`INSERT INTO logbook_entries (student_id,application_id,content,hours_worked,entry_date,image_url) VALUES (${st[0].id},${application_id||null},${content},${hours_worked||null},${entry_date||new Date().toISOString().split('T')[0]},${image_url||null}) RETURNING *`;
      return jsonResponse(res, 201, { entry: rows[0] });
    }
  }

  // ── TEACHER VALIDATIONS ─────────────────────────────────────────────────────
  if (path === 'teachers/validations') {
    const auth = requireAuth(req, res); if (!auth) return;
    if (!['teacher','admin'].includes(auth.role)) return jsonResponse(res, 403, { error: 'Solo docentes' });
    if (req.method === 'GET') {
      const { student_id } = req.query;
      if (student_id) {
        const { rows } = await sql`SELECT sv.*,t.full_name as teacher_name FROM skill_validations sv JOIN teachers t ON t.id=sv.teacher_id WHERE sv.student_id=${student_id} ORDER BY sv.created_at DESC`;
        return jsonResponse(res, 200, { validations: rows });
      }
      const { rows: teacher } = await sql`SELECT id FROM teachers WHERE user_id=${auth.userId} LIMIT 1`;
      if (!teacher.length) return jsonResponse(res, 404, { error: 'Docente no encontrado' });
      const { rows } = await sql`SELECT s.*,u.email,(SELECT COUNT(*) FROM skill_validations sv WHERE sv.student_id=s.id) as skill_count,(SELECT COUNT(*) FROM applications a WHERE a.student_id=s.id) as application_count,(SELECT COUNT(*) FROM portfolio_items pi WHERE pi.student_id=s.id) as portfolio_count FROM students s JOIN users u ON u.id=s.user_id WHERE s.created_by=${auth.userId} ORDER BY s.full_name ASC`;
      return jsonResponse(res, 200, { students: rows, teacher: teacher[0] });
    }
    if (req.method === 'POST') {
      const { student_id, skill, note } = body;
      if (!student_id || !skill) return jsonResponse(res, 400, { error: 'student_id y skill requeridos' });
      const { rows: teacher } = await sql`SELECT id FROM teachers WHERE user_id=${auth.userId} LIMIT 1`;
      if (!teacher.length) return jsonResponse(res, 404, { error: 'Docente no encontrado' });
      const { rows } = await sql`INSERT INTO skill_validations (student_id,teacher_id,skill,note) VALUES (${student_id},${teacher[0].id},${skill},${note||null}) RETURNING *`;
      return jsonResponse(res, 201, { validation: rows[0] });
    }
    if (req.method === 'PUT') {
      const { entry_id } = body;
      if (!entry_id) return jsonResponse(res, 400, { error: 'entry_id requerido' });
      const { rows } = await sql`UPDATE logbook_entries SET approved_by_teacher=true WHERE id=${entry_id} RETURNING *`;
      return jsonResponse(res, 200, { entry: rows[0] });
    }
  }

  // ── PROFILE ─────────────────────────────────────────────────────────────────
  if (path === 'profile') {
    const auth = requireAuth(req, res); if (!auth) return;
    if (req.method === 'GET') {
      let profile = null;
      if (auth.role === 'student') {
        const { rows } = await sql`SELECT s.*,sc.name as school_name FROM students s LEFT JOIN schools sc ON sc.id=s.school_id WHERE s.user_id=${auth.userId}`;
        profile = rows[0];
      } else if (auth.role === 'company') {
        const { rows } = await sql`SELECT * FROM companies WHERE user_id=${auth.userId}`;
        profile = rows[0];
      } else if (auth.role === 'teacher') {
        const { rows } = await sql`SELECT t.*,sc.name as school_name FROM teachers t LEFT JOIN schools sc ON sc.id=t.school_id WHERE t.user_id=${auth.userId}`;
        profile = rows[0];
      }
      return jsonResponse(res, 200, { profile });
    }
    if (req.method === 'PUT') {
      if (auth.role === 'student') {
        const { full_name, bio, avatar_url, phone, linkedin_url, orientation, grade, location, interests } = body;
        const { rows } = await sql`UPDATE students SET full_name=COALESCE(${full_name||null},full_name),bio=${bio!==undefined?bio:null},avatar_url=${avatar_url!==undefined?avatar_url:null},phone=${phone!==undefined?phone:null},linkedin_url=${linkedin_url!==undefined?linkedin_url:null},orientation=COALESCE(${orientation||null},orientation),grade=COALESCE(${grade||null},grade),location=${location!==undefined?location:null},interests=${interests||null},updated_at=NOW() WHERE user_id=${auth.userId} RETURNING *`;
        return jsonResponse(res, 200, { profile: rows[0] });
      }
      if (auth.role === 'company') {
        const { company_name, sector, description, location, address, department, phone, website, logo_url, contact_name } = body;
        const { rows } = await sql`UPDATE companies SET company_name=COALESCE(${company_name||null},company_name),sector=${sector!==undefined?sector:null},description=${description!==undefined?description:null},location=${location!==undefined?location:null},address=${address!==undefined?address:null},department=${department!==undefined?department:null},phone=${phone!==undefined?phone:null},website=${website!==undefined?website:null},logo_url=${logo_url!==undefined?logo_url:null},contact_name=COALESCE(${contact_name||null},contact_name),updated_at=NOW() WHERE user_id=${auth.userId} RETURNING *`;
        return jsonResponse(res, 200, { profile: rows[0] });
      }
      if (auth.role === 'teacher') {
        const { full_name, bio, avatar_url, phone, subject } = body;
        const { rows } = await sql`UPDATE teachers SET full_name=COALESCE(${full_name||null},full_name),bio=${bio!==undefined?bio:null},avatar_url=${avatar_url!==undefined?avatar_url:null},phone=${phone!==undefined?phone:null},subject=${subject!==undefined?subject:null},updated_at=NOW() WHERE user_id=${auth.userId} RETURNING *`;
        return jsonResponse(res, 200, { profile: rows[0] });
      }
    }
  }

  // ── SCHOOLS ─────────────────────────────────────────────────────────────────
  if (path === 'schools') {
    const auth = requireAuth(req, res); if (!auth) return;
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM schools ORDER BY name ASC`;
      return jsonResponse(res, 200, { schools: rows });
    }
    if (auth.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo el admin puede gestionar escuelas' });
    if (req.method === 'POST') {
      const { name, cue, address, city, department, type, phone, email, website, logo_url, description, director_name } = body;
      if (!name) return jsonResponse(res, 400, { error: 'Nombre requerido' });
      const { rows } = await sql`INSERT INTO schools (name,cue,address,city,department,type,phone,email,website,logo_url,description,director_name,created_by) VALUES (${name},${cue||null},${address||null},${city||null},${department||null},${type||'orientada'},${phone||null},${email||null},${website||null},${logo_url||null},${description||null},${director_name||null},${auth.userId}) RETURNING *`;
      return jsonResponse(res, 201, { school: rows[0] });
    }
    if (req.method === 'PUT') {
      const { school_id, name, cue, address, city, department, type, phone, email, website, logo_url, description, director_name } = body;
      const { rows } = await sql`UPDATE schools SET name=${name},cue=${cue||null},address=${address||null},city=${city||null},department=${department||null},type=${type||'orientada'},phone=${phone||null},email=${email||null},website=${website||null},logo_url=${logo_url||null},description=${description||null},director_name=${director_name||null} WHERE id=${school_id} RETURNING *`;
      return jsonResponse(res, 200, { school: rows[0] });
    }
  }

  // ── USERS (admin / teacher crea alumnos) ────────────────────────────────────
  if (path === 'users') {
    const auth = requireAuth(req, res); if (!auth) return;
    if (req.method === 'GET') {
      if (auth.role === 'admin') {
        const { rows } = await sql`SELECT u.id,u.email,u.role,u.created_at,COALESCE(s.full_name,c.company_name,t.full_name) as display_name,COALESCE(s.school,c.sector,t.school) as detail,sc.name as school_name FROM users u LEFT JOIN students s ON s.user_id=u.id LEFT JOIN companies c ON c.user_id=u.id LEFT JOIN teachers t ON t.user_id=u.id LEFT JOIN schools sc ON sc.id=u.school_id ORDER BY u.created_at DESC`;
        return jsonResponse(res, 200, { users: rows });
      }
      if (auth.role === 'teacher') {
        const { rows } = await sql`SELECT s.*,u.email,(SELECT COUNT(*) FROM skill_validations sv WHERE sv.student_id=s.id) as skill_count,(SELECT COUNT(*) FROM applications a WHERE a.student_id=s.id) as application_count,(SELECT COUNT(*) FROM portfolio_items pi WHERE pi.student_id=s.id) as portfolio_count FROM students s JOIN users u ON u.id=s.user_id WHERE s.created_by=${auth.userId} ORDER BY s.full_name ASC`;
        return jsonResponse(res, 200, { students: rows });
      }
      return jsonResponse(res, 403, { error: 'Acceso denegado' });
    }
    if (req.method === 'POST') {
      const { email, password, role, full_name, school_id, ...extra } = body;
      if (role === 'company' && auth.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo admin puede crear empresas' });
      if (role === 'teacher' && auth.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo admin puede crear docentes' });
      if (role === 'student' && !['teacher','admin'].includes(auth.role)) return jsonResponse(res, 403, { error: 'Solo docentes o admin pueden crear alumnos' });
      if (!email || !password || !role || !full_name) return jsonResponse(res, 400, { error: 'Faltan campos requeridos' });
      const hash = await bcrypt.hash(password, 12);
      const { rows: ur } = await sql`INSERT INTO users (email,password_hash,role,school_id,created_by) VALUES (${email.toLowerCase()},${hash},${role},${school_id||null},${auth.userId}) RETURNING id,email,role`;
      const newUser = ur[0];
      if (role === 'student') {
        await sql`INSERT INTO students (user_id,full_name,school_id,created_by,orientation,grade,location) VALUES (${newUser.id},${full_name},${school_id||null},${auth.userId},${extra.orientation||null},${extra.grade||null},${extra.location||null})`;
      } else if (role === 'teacher') {
        await sql`INSERT INTO teachers (user_id,full_name,school_id,subject,email) VALUES (${newUser.id},${full_name},${school_id||null},${extra.subject||null},${email})`;
      } else if (role === 'company') {
        await sql`INSERT INTO companies (user_id,company_name,sector,location,contact_name,department) VALUES (${newUser.id},${full_name},${extra.sector||null},${extra.location||null},${extra.contact_name||null},${extra.department||null})`;
      }
      return jsonResponse(res, 201, { user: newUser, message: 'Usuario creado correctamente' });
    }
  }

  // ── ADMIN: init & setup-storage ─────────────────────────────────────────────
  if (path === 'admin/setup-storage') {
    const secret = req.query.secret || body.secret;
    if (secret !== (process.env.INIT_SECRET || 'vinculo2025')) return jsonResponse(res, 403, { error: 'Forbidden' });
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return jsonResponse(res, 500, { error: 'Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY' });
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'profiles');
    if (!exists) {
      const { error } = await supabase.storage.createBucket('profiles', { public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['image/jpeg','image/png','image/webp','image/gif'] });
      if (error) return jsonResponse(res, 500, { error: error.message });
    }
    return jsonResponse(res, 200, { ok: true, message: exists ? '✅ Bucket ya existía' : '✅ Bucket creado' });
  }

  return jsonResponse(res, 404, { error: `Ruta no encontrada: ${path}` });
}
