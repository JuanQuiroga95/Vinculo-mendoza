# Vínculo Mendoza 🍇

**Super-app de empleabilidad juvenil de Mendoza**  
Stack: React + Vite · Vercel Serverless Functions · Vercel Postgres

---

## Estructura del proyecto

```
vinculo-mendoza/
├── api/                    # Serverless Functions (backend)
│   ├── _lib/               # Helpers: db.js, auth.js
│   ├── auth/               # login.js, register.js
│   ├── vacancies/          # index.js (GET vacantes, POST crear)
│   ├── applications/       # index.js (GET, POST, PUT)
│   ├── students/           # portfolio.js, logbook.js
│   └── teachers/           # validations.js
├── src/                    # Frontend React
│   ├── pages/              # Landing, Login, Register, dashboards
│   ├── components/         # Sidebar compartido
│   └── utils/auth.js       # API client + helpers
├── db/
│   ├── schema.sql          # Esquema completo de la DB
│   └── seed.js             # Usuarios demo
└── vercel.json             # Config de Vercel
```

---

## Deploy paso a paso

### 1. Cloná el repositorio y subilo a GitHub

```bash
git init
git add .
git commit -m "init: Vínculo Mendoza"
git remote add origin https://github.com/TU_USER/vinculo-mendoza.git
git push -u origin main
```

### 2. Creá el proyecto en Vercel

1. Entrá a [vercel.com](https://vercel.com) y conectá tu repo de GitHub
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output dir: `dist`

### 3. Creá la base de datos Vercel Postgres

1. En el dashboard de Vercel → **Storage** → **Create Database** → **Postgres**
2. Conectala a tu proyecto (esto inyecta las variables de entorno automáticamente)
3. En la consola de la DB, ejecutá el contenido de `db/schema.sql`

### 4. Variables de entorno en Vercel

Agregá estas en **Settings → Environment Variables**:

| Variable | Valor |
|----------|-------|
| `JWT_SECRET` | Una cadena aleatoria larga (ej: `openssl rand -base64 32`) |
| `POSTGRES_URL` | Inyectada automáticamente por Vercel Postgres |

### 5. Seed de usuarios demo (opcional)

```bash
POSTGRES_URL="tu_url_de_vercel_postgres" node db/seed.js
```

Esto crea:
- **alumno@demo.com** / demo1234
- **empresa@demo.com** / demo1234
- **docente@demo.com** / demo1234

---

## Desarrollo local

```bash
npm install
# Creá un archivo .env con:
# POSTGRES_URL=tu_url
# JWT_SECRET=secreto_local
npm run dev
```

---

## Funcionalidades por rol

### 👨‍🎓 Alumno
- Dashboard con vacantes recomendadas (algoritmo de match)
- Explorar y postularse a pasantías
- Portafolio de proyectos escolares
- Bitácora digital de horas y actividades
- Ver estado de sus postulaciones

### 🏢 Empresa
- Panel con métricas del embudo de selección
- Publicar vacantes (con validación de max 20h/sem)
- Gestionar postulantes: revisar → entrevista → aceptar/rechazar
- Ver portafolio de cada candidato

### 👩‍🏫 Docente / Tutor
- Panel con todos los alumnos de su escuela
- Validar habilidades blandas con observaciones
- Seguimiento de postulaciones y bitácoras

---

## Algoritmo de Match

```
Score = (Interés_Alumno × 0.4) + (Orientación_Escolar × 0.4) + (Cercanía_Geográfica × 0.2)
```

Implementado en `src/utils/auth.js → calcMatchScore()`

---

## Seguridad

- Contraseñas hasheadas con **bcryptjs** (12 rounds)
- Autenticación con **JWT** (7 días)
- Validación de roles en cada endpoint de la API
- Límite de horas semanales validado a nivel de UI y DB

---

## Roadmap

- [ ] Firma digital integrada con sistema de Mendoza
- [ ] Integración con credenciales GEM para verificar alumnos
- [ ] Notificaciones por email (Resend / Nodemailer)
- [ ] Carga de archivos al portafolio (Vercel Blob)
- [ ] Panel admin provincial
- [ ] Conexión con programa "Enlace" para asignación estímulo
