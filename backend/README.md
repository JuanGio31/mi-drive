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
- Logs técnicos con Pino y rotación de archivos

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
| `LOG_LEVEL` | No | `info` | Nivel mínimo de log técnico |
| `LOG_DIR` | No | `logs` | Carpeta de archivos de log, relativa al directorio de ejecución |
| `LOG_MAX_DAYS` | No | `14` | Cantidad de archivos rotados que se conservan |
| `LOG_TO_FILE` | No | `true` | Activa la escritura en archivo |

El nombre correcto de la variable de base de datos es `MONGO_URI`.

## Scripts

```bash
npm run dev        # Servidor en modo desarrollo
npm run seed       # Reinicia la base de datos y crea usuarios, carpetas y archivos
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
│   ├── config/       # Variables de entorno y conexión
│   ├── container/    # Inyección de dependencias
│   ├── logger/       # Logger técnico con Pino
│   ├── middlewares/  # Autenticación, validación, request ID y errores
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
- Cada respuesta incluye `X-Request-Id`; los errores también devuelven
  `requestId` en el JSON para correlacionarlos con el log técnico.
- Los controladores son `async` y no usan `try/catch`: Express 5 reenvía
  automáticamente los rechazos de promesas al middleware de errores.

## Logs y diagnóstico

La **actividad** (`/api/actividad`) es auditoría de negocio y se guarda en
MongoDB. Los **logs técnicos** son diagnóstico operativo y se escriben en
`logs/` dentro del directorio desde el que se ejecuta el backend.

- En desarrollo se imprimen en consola de forma legible y también en JSON.
- En producción se emiten como JSON por stdout y en archivo.
- Los archivos rotan diariamente y al alcanzar 10 MB; se conservan
  `LOG_MAX_DAYS` archivos rotados.
- Se registran todas las peticiones con método, ruta sin query, estado,
  duración, IP, user-agent, usuario autenticado y `requestId`.
- Los errores `4xx` se registran como `warn` y los `5xx` como `error` con stack.
- Nunca se registran bodies, contraseñas, tokens, cookies ni contenido de
  archivos. El serializador de errores también evita volcar `body`.
- Los logs técnicos no se muestran en el frontend. La carpeta `logs/` está
  excluida de Git.

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
