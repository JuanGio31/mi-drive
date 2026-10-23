# Frontend — Sistema de Gestión Documental

Aplicación Angular para explorar, editar, compartir y administrar los documentos
del sistema DMS.

## Stack

- Angular 21 con componentes standalone
- Signals y change detection zoneless
- Angular Material
- Vitest para pruebas unitarias
- Markdown renderizado con `marked`

## Requisitos

- Node.js 20.19+ o 22.12+
- npm 11.6+
- Backend disponible en `http://localhost:3000`

## Ejecución

```bash
cd frontend
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200`.

El archivo `proxy.conf.json` redirige `/api` al backend local. Si el backend no
está iniciado, las peticiones de autenticación y datos fallarán.

## Scripts

```bash
npm start        # Servidor de desarrollo
npm run build    # Build de producción
npm run watch    # Build en modo observación
npm test         # Pruebas unitarias con Vitest
```

## Estructura

```text
src/app/
├── core/
│   ├── models/      # Modelos e interfaces
│   ├── services/    # Acceso a la API y sesión
│   ├── guards/      # Protección de rutas
│   ├── interceptors/
│   └── utils/
├── features/
│   ├── auth/        # Inicio de sesión y registro
│   ├── layout/      # Sidebar, topbar y contenedor
│   ├── home/
│   ├── mi-unidad/   # Explorador de carpetas
│   ├── destacados/  # Carpetas y archivos marcados por el usuario
│   ├── explorador/  # Lista y cuadrícula reutilizable
│   ├── contextual/  # Menús y diálogos de acciones
│   ├── editor/
│   ├── visor/
│   ├── papelera/
│   ├── perfil/
│   └── admin/       # Dashboard, usuarios, reportes y actividad
├── app.routes.ts
└── app.config.ts
```

## Rutas principales

| Ruta                  | Descripción                                 |
| --------------------- | ------------------------------------------- |
| `/auth/sign-in`       | Inicio de sesión                            |
| `/auth/sign-up`       | Registro de usuario                         |
| `/home`               | Inicio con carpetas y vistos recientemente  |
| `/mi-unidad`          | Raíz de archivos del usuario                |
| `/destacados`         | Carpetas y archivos marcados por el usuario |
| `/recientes`          | Actividad reciente de archivos y carpetas   |
| `/compartidos`        | Recursos compartidos con el usuario         |
| `/mi-unidad/:id`      | Contenido de una carpeta                    |
| `/archivo/:id`        | Visor de archivo                            |
| `/archivo/:id/editar` | Editor de archivo                           |
| `/papelera`           | Elementos eliminados en lista o cuadrícula  |
| `/perfil`             | Datos personales y contraseña               |
| `/admin/dashboard`    | Panel administrativo                        |
| `/admin/usuarios`     | Administración de usuarios                  |
| `/admin/reportes`     | Reportes globales                           |
| `/admin/actividad`    | Auditoría global                            |

## Sesión y permisos

- El token y el usuario se guardan en `localStorage` (`dms_token` y `dms_user`).
- `authGuard` protege el layout; `guestGuard` evita volver al login con sesión activa.
- `adminGuard` restringe `/admin/*` al rol administrador.
- El menú administrativo solo aparece para usuarios con rol `administrador`.

## Convenciones de interfaz

- Identificadores, rutas y textos visibles en español.
- Estado con signals y servicios inyectados con `inject()`.
- Componentes standalone y rutas cargadas de forma lazy.
- Las vistas de Mi Unidad y Papelera se conservan en `localStorage`
  (`dms_vista_mi_unidad` y `dms_vista_papelera`: `lista` o `cuadricula`).
- Los formularios usan Reactive Forms y validaciones alineadas con el backend.

## Verificación

```bash
npx ng build
npm test
```

La documentación funcional y técnica está en el [manual de usuario](../docs/manual-usuario.md)
y en el [manual técnico](../docs/manual-tecnico.md).
