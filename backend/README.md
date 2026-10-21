# Backend — Sistema de Gestión Documental

API REST para la gestión de usuarios, carpetas, archivos, permisos, actividad,
reportes y búsqueda del sistema DMS.

## Stack

- Node.js + Express 5
- TypeScript
- MongoDB + Mongoose
- Validación con Zod
- Autenticación con JWT
- Contraseñas con bcrypt

## Requisitos

- Node.js 20+
- MongoDB 7+
- npm 10+

## Configuración

```bash
cd backend
npm install
cp .env.example .env
```

Variables disponibles:

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `PORT` | No | `3000` | Puerto de la API |
| `NODE_ENV` | No | `dev` | Entorno de ejecución |
| `MONGO_URI` | Sí | — | Cadena de conexión de MongoDB |
| `JWT_SECRET` | Sí | — | Secreto de firma, mínimo 32 caracteres |
| `JWT_EXPIRES_IN` | No | `7d` | Vigencia del token |
| `BCRYPT_ROUNDS` | No | `10` | Rondas de bcrypt |
| `CORS_ORIGIN` | No | `http://localhost:4200` | Orígenes permitidos, separados por comas |

El nombre correcto de la variable de base de datos es `MONGO_URI`.

## Scripts

```bash
npm run dev        # Servidor en modo desarrollo
npm run seed       # Reinicia y popula la base de datos
npm run build      # Compila TypeScript a dist/
npm start          # Ejecuta la versión compilada
npx tsc --noEmit   # Verificación de tipos
```

> El seed es destructivo: elimina y vuelve a crear usuarios, carpetas, archivos y
> actividad. Los identificadores cambian en cada ejecución.

## Estructura

```text
src/
├── modules/
│   ├── auth/
│   ├── usuario/
│   ├── carpeta/
│   ├── archivo/
│   ├── actividad/
│   ├── reporte/
│   └── busqueda/
├── shared/
│   ├── config/       # Variables de entorno
│   ├── container/    # Inyección de dependencias
│   ├── middlewares/  # Autenticación, validación y errores
│   ├── errors/
│   └── utils/
├── scripts/
│   └── seed.ts
├── app.ts
└── server.ts
```

Cada módulo separa DTO/Zod, controller, service, repository y routes.

## API

La API se publica bajo `/api`:

| Base | Responsabilidad |
|---|---|
| `/api/health` | Estado del servicio |
| `/api/auth` | Inicio y cierre de sesión |
| `/api/usuarios` | Perfiles, administración y contraseñas |
| `/api/carpetas` | Carpetas, compartición y papelera |
| `/api/archivos` | Archivos, contenido, compartición y papelera |
| `/api/actividad` | Historial propio y auditoría administrativa |
| `/api/reportes` | Reportes personales y globales |
| `/api/buscar` | Búsqueda de archivos y carpetas |

Convenciones generales:

- Las rutas protegidas requieren `Authorization: Bearer <token>`.
- Los errores usan respuestas JSON consistentes con el código HTTP correspondiente.
- Sin acceso a un recurso se responde `404`; con acceso pero sin permiso de acción, `403`.
- `GET /api/usuarios` y `GET /api/actividad` devuelven respuestas paginadas con
  `total`, `page` y `limit`.
- Los reportes administrativos requieren rol `administrador`.

## Verificación

```bash
curl http://localhost:3000/api/health
```

Para una revisión de tipos antes de entregar:

```bash
npx tsc --noEmit
```

La documentación detallada está en el [manual técnico](../docs/manual-tecnico.md) y en el
[manual de usuario](../docs/manual-usuario.md).
