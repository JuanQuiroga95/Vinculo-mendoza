# Vínculo Mendoza — TASKS v2.1
_Última actualización: 2026-04-21_

## ✅ COMPLETADO

### Frontend (3 dashboards)
- [x] **TeacherDashboard**: Visitas (8 aspectos, modal, guard), Rúbrica (4 criterios, preview nota), GEM log, Alumnos + validaciones
- [x] **StudentDashboard**: Asistencia (clock-in/out, progreso 100hs), Informe Final (8 preguntas + saberes tags, submit), Carpeta (4 docs upload), Portafolio, Bitácora, Postulaciones
- [x] **AdminDashboard**: ICE real (toggle con API, optimistic update), Siniestros (48hs alert, registro, mark sent), Monitor, Docentes, Empresas, Config, Exportar GEM

### Backend (API)
- [x] `GET/POST /api/teachers?_resource=visits` — planilla de visita, 8 aspectos, gem_logged=true
- [x] `GET/POST /api/grades` — rúbrica con guard ≥2 visitas, scoreToGrade
- [x] `GET/POST /api/students?_resource=attendance` — clock-in/out, validaciones DGE
- [x] `GET/POST /api/students?_resource=report` — informe final (NUEVO v2.1)
- [x] `GET /api/students?_resource=pasantia` — pasantía activa del alumno (NUEVO v2.1)
- [x] `POST /api/admin?action=toggle_ice` — ICE real con UPDATE pasantias
- [x] `GET/POST/PUT /api/admin?action=*_accident*` — siniestros (NUEVO v2.1)

### Base de datos
- [x] `schema_v2.sql` — completo con pasantias, visit_logs, final_grades, attendance, ice_status
- [x] `final_reports` — tabla de informe final (NUEVO v2.1)
- [x] `accident_reports` — tabla de siniestros (NUEVO v2.1)
- [x] `migrate.sql` — incluye todas las tablas v2.1
- [x] Reglas innegociables DGE: guard visitas, constraints horarios, ICE block cascade, scoreToGrade

### Reglas de negocio implementadas
- [x] Máx. 4hs/día · 20hs/semana · franja 08:00–18:00 (API guard + UI)
- [x] Mínimo 2 visitas → HTTP 422 si se intenta calificar sin ellas
- [x] Rúbrica: 12pts→10 · 8pts→7 · 4pts→3 (interpolación lineal, en API y UI)
- [x] Alumnos ICE → bloqueados de pasantías + visual en todos los dashboards
- [x] Denuncia siniestro → alerta visual si >48hs sin enviar (UI, sin push notification)
- [x] Proyecto de Simulación → is_simulation flag en pasantías

## 🔧 PENDIENTE (próximas iteraciones)

### Alta prioridad
- [ ] **Seed con datos reales** — 26 alumnos 5to 3ra en DB, pasantías, 2 visit_logs por alumno, attendance
- [ ] **Email de alerta siniestros** — Cron job Vercel: si accident_report.sent_to_dge=false AND occurred_at < NOW()-48hs → email al admin
- [ ] **Carpeta documentos** — Subida real a Vercel Blob / S3 (hoy usa localStorage)

### Media prioridad
- [ ] **CompanyDashboard v2** — Panel empresas: ver postulantes, aceptar/rechazar, marcar asistencia del alumno como instructor
- [ ] **Notificaciones push** — PWA + Web Push para alertas de siniestros y visitas vencidas
- [ ] **Vista pasantia_summary en admin** — usar la vista SQL existente para stats de monitor
- [ ] **Exportar PDF individual** — planilla de visita firmada, informe final

### Baja prioridad
- [ ] **Test E2E** — Playwright: flujo completo alumno → postulación → asistencia → informe → nota
- [ ] **Landing page** — mejorar SEO, agregar sección DGE / Res. 1850

## 📐 Stack técnico
- Frontend: React + Vite, CSS custom (paleta wine/gold/teal)
- Backend: Vercel serverless (`api/` functions)
- DB: Neon PostgreSQL (neon.tech)
- Auth: JWT en localStorage, `verifyToken` en cada handler
- Deploy: vinculo-mendoza.vercel.app
