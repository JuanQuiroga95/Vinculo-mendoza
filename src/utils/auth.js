// src/utils/auth.js — API client + auth helpers

const BASE = '/api';

export function getToken() { return localStorage.getItem('vm_token'); }
export function setToken(t) { localStorage.setItem('vm_token', t); }
export function removeToken() { localStorage.removeItem('vm_token'); }

export function getUser() {
  try { return JSON.parse(localStorage.getItem('vm_user')); } catch { return null; }
}
export function setUser(u) { localStorage.setItem('vm_user', JSON.stringify(u)); }
export function removeUser() { localStorage.removeItem('vm_user'); }

export function getProfile() {
  try { return JSON.parse(localStorage.getItem('vm_profile')); } catch { return null; }
}
export function setProfile(p) { localStorage.setItem('vm_profile', JSON.stringify(p)); }
export function removeProfile() { localStorage.removeItem('vm_profile'); }

export function clearAuth() {
  removeToken(); removeUser(); removeProfile();
}

export function logout() {
  clearAuth();
  window.location.href = '/login';
}

export function isLoggedIn() { return !!getToken(); }

// ─── Core fetch helper ───
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Error desconocido');
  return data;
}

// ─── Auth ───
export const authAPI = {
  login:    (body) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Vacancies ───
export const vacancyAPI = {
  getAll:  () => apiFetch('/vacancies'),
  create:  (body) => apiFetch('/vacancies', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Applications ───
export const applicationAPI = {
  getMine:  () => apiFetch('/applications'),
  apply:    (body) => apiFetch('/applications', { method: 'POST', body: JSON.stringify(body) }),
  update:   (body) => apiFetch('/applications', { method: 'PUT',  body: JSON.stringify(body) }),
};

// ─── Portfolio ───
export const portfolioAPI = {
  getMine: () => apiFetch('/students/portfolio'),
  add:     (body) => apiFetch('/students/portfolio', { method: 'POST', body: JSON.stringify(body) }),
  remove:  (item_id) => apiFetch('/students/portfolio', { method: 'DELETE', body: JSON.stringify({ item_id }) }),
};

// ─── Logbook ───
export const logbookAPI = {
  getMine:  () => apiFetch('/students/logbook'),
  addEntry: (body) => apiFetch('/students/logbook', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Teacher ───
export const teacherAPI = {
  getStudents:  () => apiFetch('/teachers/validations'),
  validateSkill: (body) => apiFetch('/teachers/validations', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Match score helper (client-side) ───
export function calcMatchScore(student, vacancy) {
  let score = 0;
  // Interest match (40%)
  const interests = student.interests || [];
  const tags = vacancy.tags || [];
  const hasInterest = interests.some(i => tags.some(t => t.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(t.toLowerCase())));
  if (hasInterest) score += 40;
  // Orientation match (40%)
  if (vacancy.orientation_required && student.orientation) {
    if (student.orientation.toLowerCase().includes(vacancy.orientation_required.toLowerCase()) ||
        vacancy.orientation_required.toLowerCase().includes(student.orientation.toLowerCase())) {
      score += 40;
    }
  }
  // Location (20%) — simplified
  if (vacancy.location && student.location) {
    if (vacancy.location.toLowerCase() === student.location.toLowerCase()) score += 20;
  }
  return score;
}

export const STATUS_LABELS = {
  pending:   'Pendiente',
  reviewed:  'En revisión',
  interview: 'Entrevista',
  accepted:  'Aceptado',
  rejected:  'Rechazado',
};

export const STATUS_BADGE = {
  pending:   'badge-gold',
  reviewed:  'badge-smoke',
  interview: 'badge-teal',
  accepted:  'badge-teal',
  rejected:  'badge-wine',
};

// ─── v2: Attendance ───────────────────────────────────────────────────────────
export const attendanceAPI = {
  getEntries: (pasantiaId) => apiFetch(`/students?_resource=attendance&pasantia_id=${pasantiaId}`),
  register:   (body) => apiFetch('/students?_resource=attendance', { method: 'POST', body: JSON.stringify(body) }),
}

// ─── v2: Informe Final ────────────────────────────────────────────────────────
export const reportAPI = {
  get:  (pasantiaId) => apiFetch(`/students?_resource=report&pasantia_id=${pasantiaId}`),
  save: (body) => apiFetch('/students?_resource=report', { method: 'POST', body: JSON.stringify(body) }),
}

// ─── v2: Pasantía activa del alumno ──────────────────────────────────────────
export const pasantiaAPI = {
  getMine: () => apiFetch('/students?_resource=pasantia'),
}

// ─── v2: Teacher visits & grades ─────────────────────────────────────────────
export const teacherAPIv2 = {
  getVisits:   (pasantiaId) => apiFetch(`/teachers?_resource=visits&pasantia_id=${pasantiaId}`),
  getAllVisits: () => apiFetch('/teachers?_resource=visits'),
  addVisit:    (body) => apiFetch('/teachers?_resource=visits', { method: 'POST', body: JSON.stringify(body) }),
  getGrade:    (pasantiaId) => apiFetch(`/grades?pasantia_id=${pasantiaId}`),
  saveGrade:   (body) => apiFetch('/grades', { method: 'POST', body: JSON.stringify(body) }),
}

// ─── v2: Admin ICE + Siniestros ───────────────────────────────────────────────
export const adminAPIv2 = {
  toggleIce:    (body) => apiFetch('/admin?_resource=dashboard&action=toggle_ice', { method: 'POST', body: JSON.stringify(body) }),
  getAccidents: () => apiFetch('/admin?_resource=dashboard&action=get_accidents'),
  addAccident:  (body) => apiFetch('/admin?_resource=dashboard&action=add_accident', { method: 'POST', body: JSON.stringify(body) }),
  markSent:     (body) => apiFetch('/admin?_resource=dashboard&action=mark_sent', { method: 'POST', body: JSON.stringify(body) }),
}
