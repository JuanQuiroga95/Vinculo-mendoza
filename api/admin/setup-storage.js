// api/admin/setup-storage.js — Crea el bucket de Supabase Storage una sola vez
import { handleCors, jsonResponse } from '../_lib/db.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const secret = req.query.secret || req.headers['x-init-secret'];
  if (secret !== (process.env.INIT_SECRET || 'vinculo2025')) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return jsonResponse(res, 500, {
      error: 'Faltan variables de entorno',
      needed: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      hint: 'Agregá estas variables en Vercel → Settings → Environment Variables'
    });
  }

  const supabase = createClient(url, key);

  // Crear bucket "profiles" si no existe
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === 'profiles');

  if (!exists) {
    const { error } = await supabase.storage.createBucket('profiles', {
      public: true,           // Las fotos son públicas (URLs directas)
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });
    if (error) return jsonResponse(res, 500, { error: 'Error al crear bucket: ' + error.message });
  }

  return jsonResponse(res, 200, {
    ok: true,
    message: exists ? '✅ Bucket "profiles" ya existía' : '✅ Bucket "profiles" creado correctamente',
    next: 'Ahora los usuarios pueden subir fotos de perfil'
  });
}
