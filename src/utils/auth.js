// src/utils/auth.js — Todo va a /api con ?_path= (GET) o body._path (POST/PUT/DELETE)
const BASE = '/api';

export function getToken()   { return localStorage.getItem('vm_token'); }
export function setToken(t)  { localStorage.setItem('vm_token', t); }
export function getUser()    { try { return JSON.parse(localStorage.getItem('vm_user')); } catch { return null; } }
export function setUser(u)   { localStorage.setItem('vm_user', JSON.stringify(u)); }
export function getProfile() { try { return JSON.parse(localStorage.getItem('vm_profile')); } catch { return null; } }
export function setProfile(p){ localStorage.setItem('vm_profile', JSON.stringify(p)); }
export function isLoggedIn() { return !!getToken(); }

export function logout() {
  ['vm_token','vm_user','vm_profile'].forEach(k => localStorage.removeItem(k));
  window.location.href = '/login';
}

// GET/DELETE → query param; POST/PUT → body con _path
async function apiFetch(path, options = {}) {
  const token   = getToken();
  const method  = (options.method || 'GET').toUpperCase();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let url  = BASE;
  let body = undefined;

  if (method === 'GET' || method === 'DELETE') {
    // Para DELETE también ponemos _path en query
    const params = new URLSearchParams({ _path: path });
    // Pasar query params adicionales
    if (options.query) Object.entries(options.query).forEach(([k,v]) => params.set(k, v));
    url = `${BASE}?${params}`;
    if (method === 'DELETE' && options.body) {
      headers['Content-Type'] = 'application/json';
      // DELETE con body: lo mandamos como POST con _path
      body = JSON.stringify({ _path: path, ...JSON.parse(options.body) });
      return fetch(BASE, { method: 'POST', headers: { ...headers, 'x-method-override': 'DELETE' }, body }).then(r => r.json().then(d => { if (!r.ok) throw new Error(d.error || 'Error'); return d; }));
    }
  } else {
    // POST / PUT
    headers['Content-Type'] = 'application/json';
    const parsed = options.body ? JSON.parse(options.body) : {};
    body = JSON.stringify({ _path: path, ...parsed });
  }

  const res  = await fetch(url, { method, headers, body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error desconocido');
  return data;
}

// DELETE especial que usa POST internamente con override
async function apiDelete(path, bodyObj = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  const res  = await fetch(BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify({ _path: path, _method: 'DELETE', ...bodyObj }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

// GET con query params extra
async function apiGet(path, query = {}) {
  const token = getToken();
  const params = new URLSearchParams({ _path: path, ...query });
  const res = await fetch(`${BASE}?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

const post = (path, body)   => apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
const put  = (path, body)   => apiFetch(path, { method: 'PUT',  body: JSON.stringify(body) });
const get  = (path, q = {}) => apiGet(path, q);
const del  = (path, body)   => apiDelete(path, body);

export const authAPI = {
  login:    (b) => post('auth/login', b),
  register: (b) => post('auth/register', b),
};

export const vacancyAPI = {
  getAll: ()  => get('vacancies'),
  create: (b) => post('vacancies', b),
  update: (b) => put('vacancies', b),
  remove: (id)=> del('vacancies', { vacancy_id: id }),
};

export const applicationAPI = {
  getMine: ()  => get('applications'),
  apply:   (b) => post('applications', b),
  update:  (b) => put('applications', b),
};

export const portfolioAPI = {
  getMine: ()    => get('students/portfolio'),
  add:     (b)   => post('students/portfolio', b),
  remove:  (id)  => del('students/portfolio', { item_id: id }),
};

export const logbookAPI = {
  getMine:  ()  => get('students/logbook'),
  getAll:   ()  => get('students/logbook', { all: '1' }),
  addEntry: (b) => post('students/logbook', b),
};

export const teacherAPI = {
  getStudents:   ()   => get('teachers/validations'),
  validateSkill: (b)  => post('teachers/validations', b),
  getValidations:(sid)=> get('teachers/validations', { student_id: sid }),
  approveLogbook:(b)  => put('teachers/validations', b),
};

export const profileAPI = {
  get:    ()  => get('profile'),
  update: (b) => put('profile', b),
};

export const adminAPI = {
  getUsers:     ()  => get('users'),
  createUser:   (b) => post('users', b),
  getSchools:   ()  => get('schools'),
  createSchool: (b) => post('schools', b),
  updateSchool: (b) => put('schools', b),
};

// Upload — multipart, no usa apiFetch
export async function uploadImage(file) {
  const token    = getToken();
  const formData = new FormData();
  formData.append('image', file);
  const res  = await fetch(`${BASE}?_path=upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir imagen');
  return data.url;
}

export function calcMatchScore(student, vacancy) {
  let score = 0;
  const interests = student.interests || [];
  const tags = vacancy.tags || [];
  if (interests.some(i => tags.some(t => t.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(t.toLowerCase())))) score += 40;
  if (vacancy.orientation_required && student.orientation) {
    if (student.orientation.toLowerCase().includes(vacancy.orientation_required.toLowerCase()) ||
        vacancy.orientation_required.toLowerCase().includes(student.orientation.toLowerCase())) score += 40;
  }
  if (vacancy.location && student.location && vacancy.location.toLowerCase() === student.location.toLowerCase()) score += 20;
  return score;
}

export const STATUS_LABELS = { pending:'Pendiente', reviewed:'En revisión', interview:'Entrevista', accepted:'Aceptado', rejected:'Rechazado' };
export const STATUS_BADGE  = { pending:'badge-gold', reviewed:'badge-smoke', interview:'badge-teal', accepted:'badge-teal', rejected:'badge-wine' };
