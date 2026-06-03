import fs from 'fs';
const env = fs.readFileSync('.env.production', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('POSTGRES_URL=')).split('=')[1].replace(/"/g, '').trim();
process.env.POSTGRES_URL = url;
console.log('Connecting to', url.slice(0, 30) + '...');
await import('./db/seed.js');
