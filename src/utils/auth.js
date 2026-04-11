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

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error desconocido');
  return data;
}

export const authAPI = {
  login:    (body) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
};

export const vacancyAPI = {
  getAll:  () => apiFetch('/vacancies'),
  create:  (body) => apiFetch('/vacancies', { method: 'POST', body: JSON.stringify(body) }),
  update:  (body) => apiFetch('/vacancies', { method: 'PUT',  body: JSON.stringify(body) }),
  remove:  (id)  => apiFetch('/vacancies', { method: 'DELETE', body: JSON.stringify({ vacancy_id: id }) }),
};

export const applicationAPI = {
  getMine: () => apiFetch('/applications'),
  apply:   (body) => apiFetch('/applications', { method: 'POST', body: JSON.stringify(body) }),
  update:  (body) => apiFetch('/applications', { method: 'PUT',  body: JSON.stringify(body) }),
};

export const portfolioAPI = {
  getMine: () => apiFetch('/students/portfolio'),
  add:     (body) => apiFetch('/students/portfolio', { method: 'POST', body: JSON.stringify(body) }),
  remove:  (item_id) => apiFetch('/students/portfolio', { method: 'DELETE', body: JSON.stringify({ item_id }) }),
};

export const logbookAPI = {
  getMine:  () => apiFetch('/students/logbook'),
  addEntry: (body) => apiFetch('/students/logbook', { method: 'POST', body: JSON.stringify(body) }),
};

export const teacherAPI = {
  getStudents:   () => apiFetch('/users'),
  validateSkill: (body) => apiFetch('/teachers/validations', { method: 'POST', body: JSON.stringify(body) }),
  getValidations:(student_id) => apiFetch(`/teachers/validations?student_id=${student_id}`),
  approveLogbook:(body) => apiFetch('/teachers/validations', { method: 'PUT', body: JSON.stringify(body) }),
  getLogbook:    () => apiFetch('/students/logbook?all=1'),
};

export const profileAPI = {
  get:    () => apiFetch('/profile'),
  update: (body) => apiFetch('/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

export const adminAPI = {
  getUsers:    () => apiFetch('/users'),
  createUser:  (body) => apiFetch('/users', { method: 'POST', body: JSON.stringify(body) }),
  getSchools:  () => apiFetch('/schools'),
  createSchool:(body) => apiFetch('/schools', { method: 'POST', body: JSON.stringify(body) }),
  updateSchool:(body) => apiFetch('/schools', { method: 'PUT',  body: JSON.stringify(body) }),
};

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
