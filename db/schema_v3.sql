-- ═══════════════════════════════════════════════════════
-- Vínculo Mendoza — Schema v3.0 (sobre v2.1)
-- 10 funcionalidades nuevas del Sistema Integral de Pasantías
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. CONVENIOS Y ACTAS (3 niveles)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agreements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            VARCHAR(30) NOT NULL CHECK (type IN ('marco','convenio_empresa','acta_individual')),
  -- Partes
  company_id      UUID REFERENCES companies(id),
  student_id      UUID REFERENCES students(id),
  teacher_id      UUID REFERENCES teachers(id),
  pasantia_id     UUID REFERENCES pasantias(id),
  -- Datos del acuerdo
  title           VARCHAR(500),
  start_date      DATE,
  end_date        DATE,
  schedule_days   TEXT,              -- ej: "Lunes a Viernes"
  schedule_hours  VARCHAR(50),       -- ej: "08:00 a 12:00"
  instructor_name VARCHAR(255),
  instructor_dni  VARCHAR(20),
  stimulus_amount DECIMAL(10,2) DEFAULT 0,
  clauses         JSONB DEFAULT '[]', -- Cláusulas personalizadas
  -- Estado y firmas
  status          VARCHAR(20) DEFAULT 'borrador'
                  CHECK (status IN ('borrador','pendiente_firma','firmado','vigente','vencido','rescindido')),
  sig_director    VARCHAR(255),
  sig_director_at TIMESTAMPTZ,
  sig_company     VARCHAR(255),
  sig_company_at  TIMESTAMPTZ,
  sig_student     VARCHAR(255),
  sig_student_at  TIMESTAMPTZ,
  sig_parent      VARCHAR(255),
  sig_parent_at   TIMESTAMPTZ,
  sig_teacher     VARCHAR(255),
  sig_teacher_at  TIMESTAMPTZ,
  -- Meta
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. AUTORIZACIONES FAMILIARES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_authorizations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  parent_name         VARCHAR(255) NOT NULL,
  parent_dni          VARCHAR(20) NOT NULL,
  parent_relationship VARCHAR(50) DEFAULT 'madre/padre',
  parent_phone        VARCHAR(30),
  -- Declaración
  authorized          BOOLEAN DEFAULT false,
  legal_text_accepted BOOLEAN DEFAULT false,
  -- Estado
  status              VARCHAR(20) DEFAULT 'pendiente'
                      CHECK (status IN ('pendiente','completada','validada')),
  validated_by        UUID REFERENCES users(id),
  validated_at        TIMESTAMPTZ,
  signed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 4. EVALUACIÓN EMPRESARIAL DEL PASANTE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_evaluations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasantia_id     UUID REFERENCES pasantias(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id),
  student_id      UUID REFERENCES students(id),
  evaluator_name  VARCHAR(255),
  evaluator_role  VARCHAR(100),
  -- 10 criterios (1=Insuficiente · 2=Regular · 3=Bueno · 4=Muy bueno · 5=Excelente)
  crit_puntualidad      SMALLINT CHECK (crit_puntualidad      BETWEEN 1 AND 5),
  crit_presentacion     SMALLINT CHECK (crit_presentacion     BETWEEN 1 AND 5),
  crit_responsabilidad  SMALLINT CHECK (crit_responsabilidad  BETWEEN 1 AND 5),
  crit_actitud          SMALLINT CHECK (crit_actitud          BETWEEN 1 AND 5),
  crit_comunicacion     SMALLINT CHECK (crit_comunicacion     BETWEEN 1 AND 5),
  crit_trabajo_equipo   SMALLINT CHECK (crit_trabajo_equipo   BETWEEN 1 AND 5),
  crit_iniciativa       SMALLINT CHECK (crit_iniciativa       BETWEEN 1 AND 5),
  crit_aprendizaje      SMALLINT CHECK (crit_aprendizaje      BETWEEN 1 AND 5),
  crit_normas           SMALLINT CHECK (crit_normas           BETWEEN 1 AND 5),
  crit_calidad_trabajo  SMALLINT CHECK (crit_calidad_trabajo  BETWEEN 1 AND 5),
  -- Texto libre
  fortalezas      TEXT,
  areas_mejora    TEXT,
  comentarios     TEXT,
  recomendaria    BOOLEAN,
  -- Estado
  status          VARCHAR(20) DEFAULT 'pendiente'
                  CHECK (status IN ('pendiente','completada')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 5. LISTA DE COTEJO / GRILLA DOCENTE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_checklists (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasantia_id     UUID REFERENCES pasantias(id) ON DELETE CASCADE,
  teacher_id      UUID REFERENCES teachers(id),
  student_id      UUID REFERENCES students(id),
  week_number     INTEGER NOT NULL,        -- Semana 1, 2, etc.
  week_start      DATE,
  -- Indicadores (S=Sí, N=No, P=Parcialmente)
  ind_asiste_regularmente    VARCHAR(1) CHECK (ind_asiste_regularmente    IN ('S','N','P')),
  ind_cumple_horario         VARCHAR(1) CHECK (ind_cumple_horario         IN ('S','N','P')),
  ind_vestimenta_adecuada    VARCHAR(1) CHECK (ind_vestimenta_adecuada    IN ('S','N','P')),
  ind_respeta_normas         VARCHAR(1) CHECK (ind_respeta_normas         IN ('S','N','P')),
  ind_muestra_interes        VARCHAR(1) CHECK (ind_muestra_interes        IN ('S','N','P')),
  ind_cumple_tareas          VARCHAR(1) CHECK (ind_cumple_tareas          IN ('S','N','P')),
  ind_se_integra_equipo      VARCHAR(1) CHECK (ind_se_integra_equipo      IN ('S','N','P')),
  ind_comunicacion_adecuada  VARCHAR(1) CHECK (ind_comunicacion_adecuada  IN ('S','N','P')),
  ind_aplica_saberes         VARCHAR(1) CHECK (ind_aplica_saberes         IN ('S','N','P')),
  ind_autonomia              VARCHAR(1) CHECK (ind_autonomia              IN ('S','N','P')),
  observations    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pasantia_id, week_number)
);

-- ─────────────────────────────────────────
-- 6. AUTOEVALUACIÓN DEL ALUMNO
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS self_evaluations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasantia_id     UUID REFERENCES pasantias(id) ON DELETE CASCADE UNIQUE,
  student_id      UUID REFERENCES students(id),
  -- Criterios (1=Regular · 2=Bueno · 3=Muy bueno)
  crit_puntualidad      SMALLINT CHECK (crit_puntualidad      BETWEEN 1 AND 3),
  crit_responsabilidad  SMALLINT CHECK (crit_responsabilidad  BETWEEN 1 AND 3),
  crit_actitud          SMALLINT CHECK (crit_actitud          BETWEEN 1 AND 3),
  crit_relaciones       SMALLINT CHECK (crit_relaciones       BETWEEN 1 AND 3),
  crit_aprendizaje      SMALLINT CHECK (crit_aprendizaje      BETWEEN 1 AND 3),
  crit_comunicacion     SMALLINT CHECK (crit_comunicacion     BETWEEN 1 AND 3),
  crit_presentacion     SMALLINT CHECK (crit_presentacion     BETWEEN 1 AND 3),
  crit_normas           SMALLINT CHECK (crit_normas           BETWEEN 1 AND 3),
  -- Reflexión
  que_aprendi     TEXT,
  que_mejoraria   TEXT,
  lo_mejor        TEXT,
  lo_mas_dificil  TEXT,
  -- Estado
  status          VARCHAR(20) DEFAULT 'borrador'
                  CHECK (status IN ('borrador','enviada')),
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 9. NOTAS OFICIALES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS official_notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            VARCHAR(40) NOT NULL
                  CHECK (type IN ('presentacion_empresa','solicitud_municipio','comunicacion_dge','nota_supervision','otra')),
  recipient_name  VARCHAR(255),
  recipient_org   VARCHAR(255),
  subject         TEXT,
  body            TEXT,
  -- Datos institucionales autocompletados
  school_name     VARCHAR(255) DEFAULT 'Esc. N° 4-012 Ing. Ricardo Videla',
  director_name   VARCHAR(255) DEFAULT 'Prof. Marcela Lubelchik',
  school_address  VARCHAR(255) DEFAULT 'XX de Setiembre 132 - Luján de Cuyo',
  -- Estado
  status          VARCHAR(20) DEFAULT 'borrador'
                  CHECK (status IN ('borrador','enviada','respondida')),
  sent_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_agreements_company ON agreements(company_id);
CREATE INDEX IF NOT EXISTS idx_agreements_student ON agreements(student_id);
CREATE INDEX IF NOT EXISTS idx_agreements_type ON agreements(type);
CREATE INDEX IF NOT EXISTS idx_family_auth_student ON family_authorizations(student_id);
CREATE INDEX IF NOT EXISTS idx_company_eval_pasantia ON company_evaluations(pasantia_id);
CREATE INDEX IF NOT EXISTS idx_teacher_checklist_pasantia ON teacher_checklists(pasantia_id);
CREATE INDEX IF NOT EXISTS idx_self_eval_pasantia ON self_evaluations(pasantia_id);
CREATE INDEX IF NOT EXISTS idx_official_notes_type ON official_notes(type);
