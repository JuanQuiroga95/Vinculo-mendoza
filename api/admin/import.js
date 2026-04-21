// api/admin/import.js — Importación masiva desde Excel (JSON parseado en cliente)
// El cliente parsea el xlsx con SheetJS y envía JSON. Esta API lo procesa e inserta en DB.
import { sql, handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import bcrypt from 'bcryptjs';

function rand8() {
  return Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);
}

function parseBool(val) {
  if (!val) return false;
  return String(val).trim().toUpperCase() === 'SI';
}

function parseDate(val) {
  if (!val) return null;
  const str = String(val).trim();
  // DD/MM/AAAA
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
  // AAAA-MM-DD (ya en formato ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return null;
}

function sanitizeCuit(val) {
  return String(val || '').replace(/[^0-9]/g, '');
}

function required(val, field, row) {
  if (!val || String(val).trim() === '') throw new Error(`Fila ${row}: campo obligatorio "${field}" vacío`);
  return String(val).trim();
}

// ── IMPORTAR ALUMNOS ─────────────────────────────────────────────────────────
async function importAlumnos(rows) {
  const results = { created: 0, updated: 0, errors: [] };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 5; // fila real en el Excel (empieza en fila 5)
    try {
      const fullName  = required(row['*apellido_nombre'], '*apellido_nombre', rowNum);
      const email     = required(row['*email'], '*email', rowNum).toLowerCase();
      const school    = required(row['*escuela'], '*escuela', rowNum);
      const orient    = required(row['*orientacion'], '*orientacion', rowNum);
      const grade     = required(row['*curso_anio'], '*curso_anio', rowNum);
      const password  = row['password_temp']?.trim() || rand8();
      const birthDate = parseDate(row['fecha_nacimiento']);
      const cuil      = sanitizeCuit(row['cuil']);
      const location  = row['ubicacion']?.trim() || null;
      const interests = row['intereses'] ? row['intereses'].split(',').map(s => s.trim()).filter(Boolean) : [];
      const isSim     = parseBool(row['is_simulation']);

      const hash = await bcrypt.hash(password, 10);

      // Upsert usuario
      const [u] = await sql`
        INSERT INTO users (email, password_hash, role)
        VALUES (${email}, ${hash}, 'student')
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id, (xmax = 0) AS inserted
      `;

      // Upsert perfil alumno
      const [s] = await sql`
        INSERT INTO students (user_id, full_name, school, orientation, grade, birth_date, cuil, location)
        VALUES (${u.id}, ${fullName}, ${school}, ${orient}, ${grade},
                ${birthDate}, ${cuil || null}, ${location})
        ON CONFLICT (user_id) DO UPDATE SET
          full_name = EXCLUDED.full_name, school = EXCLUDED.school,
          orientation = EXCLUDED.orientation, grade = EXCLUDED.grade,
          birth_date = EXCLUDED.birth_date, cuil = EXCLUDED.cuil, location = EXCLUDED.location
        RETURNING id
      `;

      if (u.inserted) results.created++;
      else results.updated++;

      // Guardar contraseña generada para devolverla al admin
      if (!row['password_temp']?.trim()) {
        results.passwords = results.passwords || [];
        results.passwords.push({ email, password, nombre: fullName });
      }
    } catch (e) {
      results.errors.push({ row: rowNum, message: e.message });
    }
  }
  return results;
}

// ── IMPORTAR DOCENTES ────────────────────────────────────────────────────────
async function importDocentes(rows) {
  const results = { created: 0, updated: 0, errors: [] };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 5;
    try {
      const fullName = required(row['*apellido_nombre'], '*apellido_nombre', rowNum);
      const email    = required(row['*email'], '*email', rowNum).toLowerCase();
      const school   = required(row['*escuela'], '*escuela', rowNum);
      const subject  = required(row['*materia'], '*materia', rowNum);
      const role     = row['*rol']?.trim() === 'preceptor' ? 'preceptor' : 'teacher';
      const password = row['password_temp']?.trim() || rand8();
      const hash     = await bcrypt.hash(password, 10);

      const [u] = await sql`
        INSERT INTO users (email, password_hash, role)
        VALUES (${email}, ${hash}, ${role})
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
        RETURNING id, (xmax = 0) AS inserted
      `;

      await sql`
        INSERT INTO teachers (user_id, full_name, school, subject)
        VALUES (${u.id}, ${fullName}, ${school}, ${subject})
        ON CONFLICT (user_id) DO UPDATE SET
          full_name = EXCLUDED.full_name, school = EXCLUDED.school, subject = EXCLUDED.subject
      `;

      if (u.inserted) results.created++;
      else results.updated++;

      if (!row['password_temp']?.trim()) {
        results.passwords = results.passwords || [];
        results.passwords.push({ email, password, nombre: fullName });
      }
    } catch (e) {
      results.errors.push({ row: rowNum, message: e.message });
    }
  }
  return results;
}

// ── IMPORTAR EMPRESAS ────────────────────────────────────────────────────────
async function importEmpresas(rows) {
  const results = { created: 0, updated: 0, errors: [] };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 5;
    try {
      const name     = required(row['*razon_social'], '*razon_social', rowNum);
      const cuit     = required(sanitizeCuit(row['*cuit']), '*cuit', rowNum);
      const sector   = required(row['*sector'], '*sector', rowNum);
      const contact  = required(row['*nombre_contacto'], '*nombre_contacto', rowNum);
      const phone    = row['telefono']?.trim() || null;
      const emailEmp = row['email_empresa']?.trim()?.toLowerCase() || null;
      const location = row['ubicacion']?.trim() || null;
      const verified = parseBool(row['verificada']);

      // Las empresas no tienen login propio en la carga masiva — se crean directo
      const [existing] = await sql`SELECT id FROM companies WHERE cuit = ${cuit} LIMIT 1`;
      if (existing) {
        await sql`
          UPDATE companies SET company_name=${name}, sector=${sector}, contact_name=${contact},
            location=${location}, verified=${verified}
          WHERE id = ${existing.id}
        `;
        results.updated++;
      } else {
        // Crear usuario placeholder para FK
        const placeholderEmail = emailEmp || `empresa_${cuit}@vinculo.sys`;
        const hash = await bcrypt.hash(rand8(), 8);
        const [u] = await sql`
          INSERT INTO users (email, password_hash, role)
          VALUES (${placeholderEmail}, ${hash}, 'company')
          ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
          RETURNING id
        `;
        await sql`
          INSERT INTO companies (user_id, company_name, cuit, sector, contact_name, location, verified)
          VALUES (${u.id}, ${name}, ${cuit}, ${sector}, ${contact}, ${location}, ${verified})
          ON CONFLICT (cuit) DO UPDATE SET company_name=EXCLUDED.company_name,
            sector=EXCLUDED.sector, contact_name=EXCLUDED.contact_name,
            location=EXCLUDED.location, verified=EXCLUDED.verified
        `;
        results.created++;
      }
    } catch (e) {
      results.errors.push({ row: rowNum, message: e.message });
    }
  }
  return results;
}

// ── IMPORTAR ASIGNACIONES ────────────────────────────────────────────────────
async function importAsignaciones(rows) {
  const results = { created: 0, updated: 0, errors: [] };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 5;
    try {
      const emailAlumno  = required(row['*email_alumno'], '*email_alumno', rowNum).toLowerCase();
      const emailDocente = required(row['*email_docente'], '*email_docente', rowNum).toLowerCase();
      const cuitEmpresa  = required(sanitizeCuit(row['*cuit_empresa']), '*cuit_empresa', rowNum);
      const fechaInicio  = parseDate(required(row['*fecha_inicio'], '*fecha_inicio', rowNum));
      const fechaFin     = parseDate(row['fecha_fin']);
      const isSim        = parseBool(row['is_simulation']);
      const simReason    = row['simulation_reason']?.trim() || null;

      // Resolver IDs
      const [uAlu] = await sql`SELECT s.id FROM students s JOIN users u ON u.id=s.user_id WHERE u.email=${emailAlumno}`;
      if (!uAlu) throw new Error(`Fila ${rowNum}: alumno "${emailAlumno}" no encontrado. Verificar hoja Alumnos.`);

      const [uDoc] = await sql`SELECT t.id FROM teachers t JOIN users u ON u.id=t.user_id WHERE u.email=${emailDocente}`;
      if (!uDoc) throw new Error(`Fila ${rowNum}: docente "${emailDocente}" no encontrado. Verificar hoja Docentes.`);

      const [emp] = await sql`SELECT id FROM companies WHERE cuit=${cuitEmpresa}`;
      if (!emp && !isSim) throw new Error(`Fila ${rowNum}: empresa CUIT "${cuitEmpresa}" no encontrada. Verificar hoja Empresas.`);

      // Upsert pasantía
      const [existing] = await sql`
        SELECT id FROM pasantias WHERE student_id=${uAlu.id} AND status IN ('active','simulation') LIMIT 1
      `;

      if (existing) {
        await sql`
          UPDATE pasantias SET teacher_id=${uDoc.id}, company_id=${emp?.id || null},
            start_date=${fechaInicio}, end_date=${fechaFin},
            is_simulation=${isSim}, simulation_reason=${simReason}
          WHERE id=${existing.id}
        `;
        results.updated++;
      } else {
        await sql`
          INSERT INTO pasantias (student_id, teacher_id, company_id, start_date, end_date,
            status, is_simulation, simulation_reason)
          VALUES (${uAlu.id}, ${uDoc.id}, ${emp?.id || null}, ${fechaInicio}, ${fechaFin},
            ${isSim ? 'simulation' : 'active'}, ${isSim}, ${simReason})
        `;
        results.created++;
      }
    } catch (e) {
      results.errors.push({ row: rowNum, message: e.message });
    }
  }
  return results;
}

// ── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'admin') return jsonResponse(res, 403, { error: 'Solo Master Admin' });

  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Método no permitido' });

  const { sheet, rows } = req.body;
  if (!sheet || !Array.isArray(rows) || rows.length === 0) {
    return jsonResponse(res, 400, { error: 'Body inválido: se esperan { sheet, rows[] }' });
  }

  // Filtrar filas vacías
  const validRows = rows.filter(r =>
    Object.values(r).some(v => v !== null && v !== undefined && String(v).trim() !== '')
  );

  try {
    let result;
    if (sheet === 'alumnos')       result = await importAlumnos(validRows);
    else if (sheet === 'docentes') result = await importDocentes(validRows);
    else if (sheet === 'empresas') result = await importEmpresas(validRows);
    else if (sheet === 'asignaciones') result = await importAsignaciones(validRows);
    else return jsonResponse(res, 400, { error: `Hoja desconocida: "${sheet}". Usar: alumnos | docentes | empresas | asignaciones` });

    return jsonResponse(res, 200, {
      ok: true,
      sheet,
      total_procesados: validRows.length,
      ...result,
    });
  } catch (e) {
    console.error('Import error:', e);
    return jsonResponse(res, 500, { error: e.message });
  }
}
