// api/_lib/db.js — shared DB helper for all API routes
import { sql } from '@vercel/postgres';

export { sql };

export function handleCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function jsonResponse(res, status, data) {
  res.status(status).json(data);
}
