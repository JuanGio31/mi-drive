# Sistema de Gestión Documental (DMS)

Aplicación web académica para centralizar, organizar, compartir y auditar documentos
`.txt` y `.md` entre los usuarios de una organización.

![Angular](https://img.shields.io/badge/Angular-21-dd0031)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933)
![MongoDB](https://img.shields.io/badge/MongoDB-7%2B-47A248)
![Licencia](https://img.shields.io/badge/licencia-acad%C3%A9mica-lightgrey)

## Descripción

El sistema ofrece un repositorio centralizado con carpetas jerárquicas, edición de
archivos de texto y Markdown, compartición con permisos y un registro completo de
actividad. Incluye papelera con restauración, búsqueda global y un panel de
administración con usuarios, reportes y auditoría.

## Características

- Autenticación mediante JWT y rutas protegidas.
- Roles de administrador y usuario.
- Carpetas anidadas y archivos `.txt`/`.md` almacenados en MongoDB.
- Permisos de compartición: lectura, escritura y comentar (este último aún sin
  módulo de comentarios).
- Editor de texto y visor con vista previa para Markdown.
- Papelera con eliminación lógica y restauración.
- Historial de actividad y búsqueda global.
- Inicio con carpetas y archivos vistos recientemente.
- Recursos destacados y compartidos por usuario.
- Panel administrativo con usuarios, reportes y actividad.
- Vista de archivos en lista o cuadrícula.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21, Angular Material, signals |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Base de datos | MongoDB, Mongoose |
| Autenticación | JWT |
| Pruebas frontend | Vitest |

## Requisitos

- Node.js 20.19+ (recomendado 22)
- npm 10+ (el frontend requiere 11.6+)
- MongoDB 7+ local o remoto

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/JuanGio31/mi-drive.git
cd mi-drive
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` con tus valores:

```env
PORT=3000
NODE_ENV=dev
MONGO_URI=mongodb://localhost:27017/dms
JWT_SECRET=un_secreto_de_al_menos_32_caracteres
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:4200
LOG_LEVEL=info
LOG_DIR=logs
LOG_MAX_DAYS=14
LOG_TO_FILE=true
```

Inicializa la base de datos y arranca la API:

```bash
npm run seed
npm run dev
```

> `npm run seed` es destructivo: elimina y vuelve a crear los datos de prueba.

El backend queda disponible en `http://localhost:3000`.

### 3. Configurar el frontend

En otra terminal:

```bash
cd frontend
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200`. El archivo
`proxy.conf.json` redirige las peticiones `/api` al backend en el puerto 3000.

### 4. Verificar el servicio

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{"status":"ok","timestamp":"2026-10-20T..."}
```

### Logs técnicos

El backend escribe logs de diagnóstico en `backend/logs/`, con rotación diaria y
retención configurable. No se mezclan con la actividad de negocio ni se muestran
en el frontend. Cada respuesta incluye `X-Request-Id` para correlacionar un error
visible con su entrada en el archivo de log.

## Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `ana@dms.local` | `password123` |
| Usuario | `carlos@dms.local` | `password123` |
| Usuario | `lucia@dms.local` | `password123` |

## Estructura

```text
mi-drive/
├── backend/       # API REST, validaciones, persistencia y seed
│   └── README.md
├── frontend/      # Aplicación Angular
│   └── README.md
├── docs/          # Manuales en Markdown, capturas y PDF
└── README.md      # Instalación y presentación general
```

## Documentación

- [Manual técnico](./docs/manual-tecnico.md) ([PDF](./docs/pdf/manual-tecnico.pdf)):
  arquitectura, modelo documental, API, seguridad y operación.
- [Manual de usuario](./docs/manual-usuario.md) ([PDF](./docs/pdf/manual-usuario.pdf)):
  guía de uso con capturas de la interfaz.
- [Backend](./backend/README.md): estructura, scripts, variables y rutas de la API.
- [Frontend](./frontend/README.md): estructura, rutas y convenciones de la aplicación.

Para regenerar los PDF después de editar los manuales:

```bash
cd docs/pdf
node generar.mjs
```

Requiere Google Chrome o Chromium y las dependencias del frontend instaladas.

## Estado

| Componente | Estado |
|---|---|
| Backend REST | Implementado |
| Autenticación, permisos y papelera | Implementado |
| Frontend principal | Implementado |
| Panel de administración | Implementado |
| Rutas Recientes, Destacados y Compartidos | Implementado |
| Manual técnico y de usuario | Implementado |

## Autor

**Giovan** — [@JuanGio31](https://github.com/JuanGio31)

Proyecto académico — Manejo e Implementación de Archivos — CUNOC — 2026.

## Licencia

Este proyecto es de uso académico.
