-- ═══════════════════════════════════════════════════════
-- Vínculo Mendoza — Schema v2.0 (migración sobre v1)
-- DGE Mendoza · Res. 1850/2022 · Decreto 1374/11
-- ═══════════════════════════════════════════════════════

-- Ampliar roles de usuarios
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('student','company','teacher','admin','preceptor'));

-- ─────────────────────────────────────────
-- PASANTIAS (vínculo central)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pasantias (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID REFERENCES students(id) ON DELETE CASCADE,
  company_id        UUID REFERENCES companies(id),
  teacher_id        UUID REFERENCES teachers(id),
  vacancy_id        UUID REFERENCES vacancies(id),
  application_id    UUID REFERENCES applications(id),
  start_date        DATE NOT NULL,
  end_date          DATE,
  status            VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active','completed','suspended','blocked')),
  is_simulation     BOOLEAN DEFAULT false,   -- Proyecto de simulación (escolaridad protegida)
  simulation_reason TEXT,
  total_hours       DECIMAL(6,1) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ATTENDANCE (asistencia alumno)
-- Reglas: max 4hs/día · 20hs/semana · 08:00-18:00
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasantia_id           UUID REFERENCES pasantias(id) ON DELETE CASCADE,
  student_id            UUID REFERENCES students(id),
  entry_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in              TIME NOT NULL,
  clock_out             TIME,
  hours_worked          DECIMAL(4,2) GENERATED ALWAYS AS (
    CASE WHEN clock_out IS NOT NULL
    THEN EXTRACT(EPOCH FROM (clock_out - clock_in))/3600.0
    ELSE NULL END
  ) STORED,
  verified_by_instructor BOOLEAN DEFAULT false,
  instructor_name       VARCHAR(255),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_clock_in  CHECK (clock_in  >= '08:00' AND clock_in  <= '18:00'),
  CONSTRAINT valid_clock_out CHECK (clock_out IS NULL OR (clock_out >= '08:00' AND clock_out <= '18:00')),
  CONSTRAINT clock_order     CHECK (clock_out IS NULL OR clock_out > clock_in)
);

-- ─────────────────────────────────────────
-- VISIT_LOGS (visitas del docente tutor)
-- Mínimo 2 visitas obligatorias por alumno
-- 8 aspectos de observación: 1-3 cada uno
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasantia_id     UUID REFERENCES pasantias(id) ON DELETE CASCADE,
  teacher_id      UUID REFERENCES teachers(id),
  visit_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_number    INTEGER,                     -- 1, 2, 3...
  -- 8 aspectos (1=Básico · 2=Esperado · 3=Destacado)
  asp_puntualidad    SMALLINT CHECK (asp_puntualidad    BETWEEN 1 AND 3),
  asp_uniforme       SMALLINT CHECK (asp_uniforme       BETWEEN 1 AND 3),
  asp_actitud        SMALLINT CHECK (asp_actitud        BETWEEN 1 AND 3),
  asp_comunicacion   SMALLINT CHECK (asp_comunicacion   BETWEEN 1 AND 3),
  asp_responsabilidad SMALLINT CHECK (asp_responsabilidad BETWEEN 1 AND 3),
  asp_adaptabilidad  SMALLINT CHECK (asp_adaptabilidad  BETWEEN 1 AND 3),
  asp_aprendizaje    SMALLINT CHECK (asp_aprendizaje    BETWEEN 1 AND 3),
  asp_reglamentos    SMALLINT CHECK (asp_reglamentos    BETWEEN 1 AND 3),
  observations    TEXT,
  -- Firmas (simuladas: nombre + timestamp)
  sig_student     VARCHAR(255),
  sig_instructor  VARCHAR(255),
  sig_teacher     VARCHAR(255),
  sig_student_at  TIMESTAMPTZ,
  sig_instructor_at TIMESTAMPTZ,
  sig_teacher_at  TIMESTAMPTZ,
  gem_logged      BOOLEAN DEFAULT false,       -- ¿volcado al GEM?
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FINAL_GRADES (calificación por rúbrica)
-- Requiere visit_count >= 2 (enforced en API)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS final_grades (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasantia_id       UUID REFERENCES pasantias(id) ON DELETE CASCADE UNIQUE,
  teacher_id        UUID REFERENCES teachers(id),
  -- 4 criterios de rúbrica (1=Básico · 2=Esperado · 3=Destacado)
  crit_asistencia   SMALLINT NOT NULL CHECK (crit_asistencia   BETWEEN 1 AND 3),
  crit_presentacion SMALLINT NOT NULL CHECK (crit_presentacion BETWEEN 1 AND 3),
  crit_conocimientos SMALLINT NOT NULL CHECK (crit_conocimientos BETWEEN 1 AND 3),
  crit_informe      SMALLINT NOT NULL CHECK (crit_informe      BETWEEN 1 AND 3),
  -- Calculados
  total_score       SMALLINT GENERATED ALWAYS AS (
    crit_asistencia + crit_presentacion + crit_conocimientos + crit_informe
  ) STORED,
  -- total_score: 12→10 · 8→7 · 4→3 (interpolación lineal)
  final_grade       DECIMAL(3,1) GENERATED ALWAYS AS (
    CASE
      WHEN (crit_asistencia+crit_presentacion+crit_conocimientos+crit_informe) = 12 THEN 10.0
      WHEN (crit_asistencia+crit_presentacion+crit_conocimientos+crit_informe) >= 8  THEN
        7.0 + (((crit_asistencia+crit_presentacion+crit_conocimientos+crit_informe) - 8.0) / 4.0) * 3.0
      ELSE
        3.0 + (((crit_asistencia+crit_presentacion+crit_conocimientos+crit_informe) - 4.0) / 4.0) * 4.0
    END
  ) STORED,
  teacher_comments  TEXT,
  locked            BOOLEAN DEFAULT false,     -- No editable tras firma
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FINAL_REPORTS (informe reflexivo del alumno)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS final_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasantia_id     UUID REFERENCES pasantias(id) ON DELETE CASCADE UNIQUE,
  student_id      UUID REFERENCES students(id),
  -- 8 preguntas de reflexión
  q_expectativas  TEXT,
  q_sentimientos  TEXT,
  q_aprendizajes  TEXT,
  q_conflictos    TEXT,
  q_saberes       TEXT,     -- saberes escolares aplicados (IVA, ficha stock, etc.)
  q_mejoras       TEXT,
  q_relaciones    TEXT,
  q_recomendacion TEXT,
  -- Saberes específicos (array de tags)
  saberes_tags    TEXT[],
  -- Estado
  status          VARCHAR(20) DEFAULT 'draft'
                  CHECK (status IN ('draft','submitted','reviewed')),
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ICE_STATUS (control preceptoría)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ice_status (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  is_blocked  BOOLEAN DEFAULT true,
  reason      TEXT,
  set_by      UUID REFERENCES users(id),
  set_at      TIMESTAMPTZ DEFAULT NOW(),
  lifted_at   TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- ACCIDENT_REPORTS (siniestros — max 72hs)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accident_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasantia_id     UUID REFERENCES pasantias(id),
  student_id      UUID REFERENCES students(id),
  occurred_at     TIMESTAMPTZ NOT NULL,
  reported_at     TIMESTAMPTZ DEFAULT NOW(),
  report_type     VARCHAR(40) CHECK (report_type IN
                  ('accidente_trabajo','accidente_in_itinere','enfermedad_profesional')),
  description     TEXT NOT NULL,
  sent_to_dge     BOOLEAN DEFAULT false,
  sent_at         TIMESTAMPTZ,
  -- Alerta si han pasado > 48hs sin enviar (72hs es el límite legal)
  is_overdue      BOOLEAN GENERATED ALWAYS AS (
    NOT sent_to_dge AND (NOW() - occurred_at) > INTERVAL '48 hours'
  ) STORED,
  created_by      UUID REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pasantias_student  ON pasantias(student_id);
CREATE INDEX IF NOT EXISTS idx_pasantias_teacher  ON pasantias(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pasantias_status   ON pasantias(status);
CREATE INDEX IF NOT EXISTS idx_attendance_pasantia ON attendance(pasantia_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date    ON attendance(entry_date);
CREATE INDEX IF NOT EXISTS idx_visitlogs_pasantia ON visit_logs(pasantia_id);
CREATE INDEX IF NOT EXISTS idx_visitlogs_teacher  ON visit_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_finalgrades_pasantia ON final_grades(pasantia_id);
CREATE INDEX IF NOT EXISTS idx_ice_student        ON ice_status(student_id);

-- ─────────────────────────────────────────
-- VIEWS útiles
-- ─────────────────────────────────────────

-- Resumen por pasantía: horas, visitas, nota
CREATE OR REPLACE VIEW pasantia_summary AS
SELECT
  p.id,
  s.full_name AS student_name,
  c.company_name,
  t.full_name AS teacher_name,
  p.status,
  p.is_simulation,
  COALESCE(SUM(a.hours_worked),0)::DECIMAL(6,1) AS total_hours,
  COUNT(DISTINCT v.id) AS visit_count,
  COUNT(DISTINCT v.id) >= 2 AS visits_complete,
  fg.total_score,
  fg.final_grade,
  COALESCE(SUM(a.hours_worked),0) >= 100 AS hours_complete,
  EXISTS(SELECT 1 FROM ice_status i WHERE i.student_id=s.id AND i.is_blocked) AS is_blocked
FROM pasantias p
JOIN students s ON s.id = p.student_id
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN teachers t ON t.id = p.teacher_id
LEFT JOIN attendance a ON a.pasantia_id = p.id
LEFT JOIN visit_logs v ON v.pasantia_id = p.id
LEFT JOIN final_grades fg ON fg.pasantia_id = p.id
GROUP BY p.id, s.full_name, c.company_name, t.full_name, p.status,
         p.is_simulation, fg.total_score, fg.final_grade, s.id;

-- ── NUEVAS TABLAS v2.1 ────────────────────────────────────────────────────────

-- Informes finales de alumnos
CREATE TABLE IF NOT EXISTS final_reports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasantia_id      UUID REFERENCES pasantias(id) ON DELETE CASCADE,
  student_id       UUID REFERENCES students(id)  ON DELETE CASCADE,
  status           VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','submitted','reviewed')),
  q_expectativas   TEXT DEFAULT '',
  q_sentimientos   TEXT DEFAULT '',
  q_aprendizajes   TEXT DEFAULT '',
  q_conflictos     TEXT DEFAULT '',
  q_saberes        TEXT DEFAULT '',
  q_mejoras        TEXT DEFAULT '',
  q_relaciones     TEXT DEFAULT '',
  q_recomendacion  TEXT DEFAULT '',
  saberes_tags     JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pasantia_id, student_id)
);

-- Siniestros laborales (obligatorio DGE, límite 72hs)
CREATE TABLE IF NOT EXISTS accident_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  report_type     VARCHAR(40) DEFAULT 'accidente_trabajo'
                    CHECK (report_type IN ('accidente_trabajo','accidente_in_itinere','enfermedad_profesional')),
  occurred_at     TIMESTAMPTZ NOT NULL,
  reported_at     TIMESTAMPTZ DEFAULT NOW(),
  description     TEXT NOT NULL,
  reported_by     UUID REFERENCES users(id),
  sent_to_dge     BOOLEAN DEFAULT false,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accident_reports_student ON accident_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_final_reports_pasantia ON final_reports(pasantia_id);
