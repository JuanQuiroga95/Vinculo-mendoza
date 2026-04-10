// api/_lib/db.js — compatible con Supabase + Vercel
import pg from 'pg';

const { Pool } = pg;

// Supabase requiere la URL sin pooling para queries directas
// Vercel inyecta POSTGRES_URL_NON_POOLING automáticamente
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1, // Serverless: máximo 1 conexión por función
});

// Wrapper que imita la API de @vercel/postgres (template literals)
export const sql = async (strings, ...values) => {
  // Armar query con $1, $2... en lugar de interpolación directa
  let text = '';
  strings.forEach((str, i) => {
    text += str;
    if (i < values.length) text += `$${i + 1}`;
  });

  const client = await pool.connect();
  try {
    const result = await client.query(text, values);
    return { rows: result.rows, rowCount: result.rowCount };
  } finally {
    client.release();
  }
};

export function handleCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function jsonResponse(res, status, data) {
  res.status(status).json(data);
}
