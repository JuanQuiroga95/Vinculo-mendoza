# TASKS.md — Vínculo Mendoza: Evolución v2.0
## Separación: Asistencia vs Evaluación

### BLOQUE A — Lógica de Asistencia (independiente)
- [ ] A1. Tabla `pasantias` (alumno, empresa, docente_tutor, fechas)
- [ ] A2. Tabla `attendance` (clock-in/out, verificación instructor)
- [ ] A3. Tabla `visit_logs` (planilla docente 8 aspectos)
- [ ] A4. Validación: max 4hs/día, 20hs/semana, franja 08-18hs
- [ ] A5. Cálculo automático horas acumuladas → alerta 100hs
- [ ] A6. Log GEM docente al guardar visita

### BLOQUE B — Lógica de Evaluación (depende de A)
- [ ] B1. Tabla `final_grades` (rubric_scores JSON, total, calificación)
- [ ] B2. Guard: bloquear carga nota si visit_count < 2
- [ ] B3. Función scoreToGrade: 12→10, 8→7, 4→3 (interpolación lineal resto)
- [ ] B4. Informe final alumno (8 preguntas + saberes)

### BLOQUE C — Módulos por rol
- [ ] C1. TeacherDashboard: tabs Visitas + Rúbrica + Registro GEM
- [ ] C2. StudentDashboard: tabs Asistencia + Informe + Carpeta
- [ ] C3. AdminDashboard: Control ICE + Siniestros

### BLOQUE D — Schema DB (adiciones al MVP)
- [ ] D1. Ampliar `users.role` → agregar 'admin', 'preceptor'
- [ ] D2. Ejecutar migration SQL (schema_v2.sql)
- [ ] D3. Seed de prueba con alumnos y visitas

### REGLAS INNEGOCIABLES
1. visit_count >= 2 → condición para POST /api/grades
2. hours_per_day <= 4, hours_per_week <= 20
3. clock_in y clock_out deben estar en 08:00–18:00
4. Alumnos ICE → status 'blocked', no pueden postular
5. Denuncia siniestro → alerta si han pasado > 48hs sin enviar
