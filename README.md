# Sistema de Gestión Documental (DMS)

Centraliza, organiza y comparte documentos digitales entre los miembros de una organización de forma segura y colaborativa.

<p align="left">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/tests-17%2F17%20passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-blue?style=flat-square" alt="Node" />
  <img src="https://img.shields.io/badge/license-academic-lightgrey?style=flat-square" alt="Licencia" />
</p>

---

## 📌 Descripción

En entornos académicos y corporativos, el intercambio desordenado de archivos mediante carpetas locales compartidas o servicios de mensajería genera dificultades recurrentes: pérdida de trazabilidad, conflictos de edición, falta de control en los accesos y ausencia de visibilidad sobre los cambios efectuados.

El **Sistema de Gestión Documental (DMS)** atiende este problema al proveer un repositorio centralizado y estructurado. Facilita la organización de la información en carpetas anidadas, permite la edición de contenido en formatos planos y markdown directamente desde la plataforma, y gestiona permisos específicos de compartición bajo un control estricto de auditoría.

A diferencia del almacenamiento local convencional, la plataforma administra los documentos (`.txt` y `.md`) directamente dentro de una base de datos NoSQL, garantizando un ciclo de vida completo: papelera de reciclaje con restauración de elementos, registro cronológico de actividad y generación de reportes analíticos de uso y almacenamiento.

---

## ✨ Características principales

- 🔐 **Autenticación con JWT:** Acceso seguro mediante tokens de sesión y protección de rutas.
- 👥 **Roles y permisos:** Diferenciación operativa entre administradores y usuarios estándar.
- 📁 **Estructura jerárquica de carpetas:** Organización en árbol con soporte de anidación multinivel.
- 📄 **Gestión de archivos (.txt y .md):** Creación, edición y almacenamiento íntegro de contenido en MongoDB.
- 🤝 **Compartición colaborativa:** Asignación de permisos granulares por usuario (lectura, edición, comentarios).
- 🗑️ **Papelera de reciclaje:** Eliminación lógica con alternativas de restauración o borrado permanente.
- 📜 **Historial de actividad:** Registro cronológico de acciones sobre archivos y carpetas con propósitos de auditoría.
- 📊 **Reportes y estadísticas:** Métricas de volumen de almacenamiento, actividad reciente y uso por usuario.

---

## 💻 Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Angular 21 (próximamente) |
| **Backend** | Node.js + Express + TypeScript |
| **Base de datos** | MongoDB + Mongoose |
| **Autenticación** | JSON Web Tokens (JWT) |
| **Validación** | Zod |

---

## 🏗️ Arquitectura

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Cliente   │ ────► │   Servidor  │ ────► │   MongoDB   │
│  Angular 21 │ ◄──── │ Express/TS  │ ◄──── │  (NoSQL)    │
└─────────────┘ HTTP  └─────────────┘       └─────────────┘
```

---

## 🚀 Inicio rápido

### 1. Requisitos previos
- **Node.js:** `>= 20.0.0`
- **npm:** `>= 10.0.0`
- **MongoDB:** `>= 7.0` (instancia local o servicio remoto activo)

### 2. Instalación

Se clona el repositorio y se instalan las dependencias del backend:

```bash
git clone https://github.com/JuanGio31/mi-drive.git
cd mi-drive/backend
npm install
```

### 3. Configuración y ejecución

Se crea el archivo de variables de entorno `.env` dentro del directorio `backend/`:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dms
JWT_SECRET=tu_secreto_super_seguro
```

Se ejecuta el script de inicialización (`seed`) para poblar la base de datos con usuarios y datos de prueba:

```bash
npm run seed
```

Se inicia el servidor en modo de desarrollo:

```bash
npm run dev
```

### 4. Verificación del servicio

Para comprobar que la API se encuentra operativa, se realiza una petición al endpoint de salud:

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{"status":"ok","timestamp":"2026-10-15T..."}
```

---

## 🔑 Credenciales de prueba

El proceso de inicialización (`seed`) genera tres cuentas de usuario predeterminadas:

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `ana@dms.local` | `password123` |
| Usuario | `carlos@dms.local` | `password123` |
| Usuario | `lucia@dms.local` | `password123` |

---

## 📂 Estructura del proyecto

```
dms/
├── backend/                  # API REST con Express y TypeScript
│   ├── src/
│   │   ├── modules/          # Usuarios, autenticación, carpetas, archivos, actividad y reportes
│   │   ├── shared/           # Configuración, middlewares de autenticación, errores y contenedor
│   │   └── scripts/          # Script de inicialización de base de datos (seed)
│   ├── smoke-test.sh         # Script de pruebas de verificación de endpoints
│   └── package.json
├── frontend/                 # Aplicación cliente (en desarrollo)
├── docs/                     # Documentación técnica y funcional
└── README.md                 # Presentación del proyecto
```

---

## 📚 Documentación

Para consultar especificaciones técnicas, diseño de datos y guías de uso, están disponibles los siguientes documentos:

- 📘 [Modelo documental](./docs/01-modelo-documental.md)
- 🛠️ [Manual técnico](./docs/02-manual-tecnico.md)
- 👤 [Manual de usuario](./docs/03-manual-usuario.md)
- 🔍 [Auditoría de complejidad](./docs/04-auditoria-complejidad.md)

---

## 📊 Estado del proyecto

| Componente / Módulo | Estado |
|---|---|
| Backend completo | ✅ Completado |
| Módulo de reportes | ✅ Completado |
| Seed de datos | ✅ Completado |
| Pruebas de humo (17/17) | ✅ Pasando |
| Frontend Angular | ⏳ Próximamente |
| Diagramas UML | ⏳ En desarrollo |

---

## 👤 Autor

**Giovan**
- GitHub: [@JuanGio31](https://github.com/JuanGio31)

*Proyecto académico — Manejo e Implementación de Archivos — CUNOC — 2026*

---

## 📄 Licencia

Este proyecto es de uso académico.