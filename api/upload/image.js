// api/upload/image.js — Sube imagen a Supabase Storage y devuelve la URL pública
import { handleCors, jsonResponse } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: false } };

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Faltan variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Método no permitido' });

  const auth = requireAuth(req, res);
  if (!auth) return;

  const form = formidable({ maxFileSize: 5 * 1024 * 1024 }); // 5MB máx

  form.parse(req, async (err, fields, files) => {
    if (err) return jsonResponse(res, 400, { error: 'Error al procesar la imagen: ' + err.message });

    const file = files.image?.[0] || files.image;
    if (!file) return jsonResponse(res, 400, { error: 'No se recibió ninguna imagen' });

    const ext      = path.extname(file.originalFilename || file.newFilename || '.jpg').toLowerCase() || '.jpg';
    const allowed  = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowed.includes(ext)) return jsonResponse(res, 400, { error: 'Formato no permitido. Usá JPG, PNG o WebP.' });

    const fileName  = `${auth.userId}-${Date.now()}${ext}`;
    const filePath  = `avatars/${fileName}`;
    const fileBuffer = fs.readFileSync(file.filepath);

    try {
      const supabase = getSupabase();

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);

      fs.unlinkSync(file.filepath); // limpiar temp
      return jsonResponse(res, 200, { url: data.publicUrl });
    } catch (e) {
      return jsonResponse(res, 500, { error: 'Error al subir imagen: ' + e.message });
    }
  });
}
