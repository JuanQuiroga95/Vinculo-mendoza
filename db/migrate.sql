-- Agregar columnas faltantes a tablas existentes
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID;

-- Tabla de escuelas
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cue VARCHAR(20) UNIQUE,
  address VARCHAR(255),
  city VARCHAR(100),
  department VARCHAR(100),
  type VARCHAR(30) DEFAULT 'orientada' CHECK (type IN ('tecnica','orientada','mixta')),
  phone VARCHAR(30),
  email VARCHAR(255),
  website VARCHAR(255),
  logo_url VARCHAR(500),
  description TEXT,
  director_name VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar school_id a teachers y students
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Agregar columnas de perfil a students
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Agregar columnas de perfil a companies  
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Agregar columnas de perfil a teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  link VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- Mensajes internos (empresa <-> alumno)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_user_id, read);
