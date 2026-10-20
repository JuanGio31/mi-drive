# Contexto: Módulos exclusivos del Administrador — DMS

## 1. Estado actual del frontend

**Ya implementado y funcionando:**
- ✅ Login (`/auth/login`)
- ✅ Búsqueda global
- ✅ Vista de archivos (listado, detalle, descarga)
- ✅ Perfil de usuario
- ✅ **Layout base** (toolbar + sidenav condicional por rol)
- ✅ Interceptor JWT (`auth.interceptor.ts`)
- ✅ Guards: `authGuard`, `guestGuard`, `adminGuard`
- ✅ `AuthService` con signals (`usuario()`, `esAdmin()`, `estaAutenticado()`)
- ✅ `ApiService` como wrapper HTTP (`get`, `post`, `patch`, `delete`)
- ✅ Angular Material 21 configurado (M3, tema aplicado)

**Pendiente (objetivo de este contexto):**
- 🎯 Dashboard global del admin (`/admin/dashboard`)
- 🎯 Gestión de usuarios (`/admin/usuarios`)
- 🎯 Reportes globales (`/admin/reportes`)
- 🎯 Actividad del sistema (`/admin/actividad`)

**NO tocar:** layout, sidenav, toolbar, guards, interceptores, servicios base. Ya funcionan.

## 2. Stack y convenciones (NO cambiar)

| Elemento | Valor |
|---|---|
| Angular | 21 (standalone, signals, `@if`/`@for`) |
| UI | Angular Material 21 (M3) |
| HTTP | `ApiService` + `authInterceptor` |
| Estado | Signals (no `BehaviorSubject` salvo justificación) |
| Formularios | Reactive Forms con `fb.nonNullable` |
| Rutas | Lazy loading con `loadComponent` / `loadChildren` |
| Guards | `authGuard`, `adminGuard` (ya existen) |

**Reglas:**
- Standalone components, sin NgModules.
- `@if` / `@for` en lugar de `*ngIf` / `*ngFor`.
- Signals para estado reactivo local (`cargando`, `error`, `datos`).
- Angular Material para UI (mat-card, mat-table, mat-dialog, mat-form-field, mat-select, mat-datepicker, mat-chip, mat-icon, mat-snack-bar, mat-paginator, mat-tab-group).
- Nombres en español: `usuarios`, `reportes`, `actividad`.
- Métodos en español: `cargar()`, `filtrar()`, `eliminar()`, `guardar()`.

## 3. Backend disponible (endpoints del admin)

**Base URL:** `http://localhost:3000/api` (dev, vía proxy `/api`)
**Auth:** `Authorization: Bearer <JWT>` (lo añade el interceptor automáticamente)

### Dashboard global (datos agregados)

```
GET /api/reportes/usuarios/top-archivos?limite=5
  → [{ usuarioId, nombre, email, rol, totalArchivos, tamañoTotal }]

GET /api/reportes/archivos/por-tipo
  → [{ tipo: 'txt'|'md', total, tamañoTotal }]

GET /api/reportes/compartidos/mas-compartidos?limite=5
  → [{ archivoId, nombre, tipo, numUsuarios, propietario: { id, nombre } }]

GET /api/reportes/usuarios/mas-compartidos?limite=5
  → [{ usuarioId, nombre, email, archivosCompartidos, carpetasCompartidas, totalCompartidos }]

GET /api/actividad?limit=10
  → [{ _id, usuario, usuarioNombre, accion, recursoTipo, recursoNombre, createdAt }]
```

### Gestión de usuarios

```
GET /api/usuarios?rol=&activo=&page=&limit=
  → [{ _id, nombre, email, rol, activo, fechaRegistro, fechaDesactivacion }]

GET /api/usuarios/:id

POST /api/usuarios
  Body: { nombre, email, password, rol? }

PATCH /api/usuarios/:id
  Body: { nombre?, email?, activo? }

DELETE /api/usuarios/:id
  → Soft delete (activo: false)
```

**Notas:**
- `POST /api/usuarios` requiere rol administrador (lo valida el backend).
- Para **reactivar** un usuario: `PATCH /api/usuarios/:id` con `{ activo: true }`.
- El backend rechaza con 409 si el email ya existe.
- El backend rechaza con 400 si intentas desactivarte a ti mismo.

### Reportes globales

```
GET /api/reportes/archivos/por-tipo
GET /api/reportes/archivos/por-rango?desde=ISO&hasta=ISO
GET /api/reportes/archivos/mas-operaciones?limite=10
GET /api/reportes/usuarios/top-archivos?limite=10
GET /api/reportes/usuarios/mas-compartidos?limite=10
GET /api/reportes/compartidos/mas-compartidos?limite=10
GET /api/reportes/compartidos/por-usuario/:usuarioId
GET /api/reportes/compartidos/recibidos/:usuarioId
GET /api/reportes/actividad/por-tipo
GET /api/reportes/actividad/por-periodo?unidad=dia|mes|año
```

**⚠️ Pendiente en backend:** los endpoints de actividad (`por-tipo`, `por-periodo`)
hoy filtran por el usuario autenticado. Para reportes **globales** (sin filtro de
usuario) el backend necesita:

```
GET /api/reportes/admin/actividad/por-tipo
GET /api/reportes/admin/actividad/por-periodo?unidad=dia|mes|año
GET /api/reportes/admin/archivos/por-rango?desde=ISO&hasta=ISO
```

**Antes de implementar la pestaña "Actividad" de Reportes globales:** verificar si
estos endpoints existen. Si no, proponer al usuario implementarlos primero en el backend.

### Actividad del sistema

```
GET /api/actividad?usuarioId=&accion=&recursoTipo=&desde=&hasta=&page=&limit=
  → Solo admin

GET /api/actividad/recurso/:tipo/:id
  → tipo ∈ { 'archivo', 'carpeta', 'usuario' }
```

**Nota:** `GET /api/actividad` con `authorize('administrador')` ya está protegido en el backend.

## 4. Módulos a implementar

### 📊 Módulo: Dashboard (`/admin/dashboard`)

**Objetivo:** vista de un vistazo con KPIs globales.

**KPIs (mat-card en grid responsive):**
| Card | Endpoint | Icono Material |
|---|---|---|
| Total archivos | `/reportes/archivos/por-tipo` (sumar `total`) | `description` |
| Almacenamiento total | `/reportes/archivos/por-tipo` (sumar `tamañoTotal`, formatear a KB/MB) | `storage` |
| Archivos .txt vs .md | `/reportes/archivos/por-tipo` | `pie_chart` |
| Total compartidos | `/reportes/compartidos/mas-compartidos` (o count) | `share` |

**Secciones:**
- Top 5 usuarios con más archivos (`mat-table` compacta o lista con avatares).
- Top 5 archivos más compartidos (`mat-table` compacta).
- Actividad reciente (últimas 10 operaciones, timeline simple con `mat-icon` por acción).

**Componentes:**
```
features/admin/dashboard/
├── dashboard.component.ts
├── dashboard.component.html
└── dashboard.component.scss
```

**Carga de datos:** usar `forkJoin` de RxJS para hacer las 4 peticiones en paralelo.

### 👥 Módulo: Gestión de usuarios (`/admin/usuarios`)

**Objetivo:** CRUD completo de usuarios.

**Vista principal:**
- `mat-table` con columnas: nombre, email, rol (chip), estado (chip activo/inactivo), acciones.
- Paginación (`mat-paginator`).
- Filtros: `mat-select` por rol, `mat-slide-toggle` para mostrar solo activos.
- Botón "Nuevo usuario" → abre `mat-dialog` con formulario.
- Acciones por fila: editar (abre dialog), desactivar/reactivar (con confirmación).

**Componentes:**
```
features/admin/usuarios/
├── usuarios.component.ts               (lista)
├── usuarios.component.html
├── usuarios.component.scss
├── usuario-form-dialog/
│   ├── usuario-form-dialog.component.ts   (crear/editar)
│   └── usuario-form-dialog.component.html
└── confirm-dialog/
    └── confirm-dialog.component.ts         (reutilizable)
```

**Lógica clave:**
- Al crear: `POST /api/usuarios` con `{ nombre, email, password, rol }`.
- Al editar: `PATCH /api/usuarios/:id` con `{ nombre, email, activo }` (NO password).
- Al desactivar: `DELETE /api/usuarios/:id` (soft delete).
- Al reactivar: `PATCH /api/usuarios/:id` con `{ activo: true }`.
- Refrescar tabla tras cada operación.
- Manejar errores 409 (email duplicado) mostrando `mat-snack-bar`.

### 📈 Módulo: Reportes globales (`/admin/reportes`)

**Objetivo:** todos los reportes del sistema con filtros y opcionalmente gráficos.

**Estructura:** `mat-tab-group` con 4 pestañas:

| Pestaña | Contenido |
|---|---|
| **Archivos** | Por tipo (pie chart + tabla), por rango de fechas (datepicker + tabla), más operaciones (tabla) |
| **Usuarios** | Top 10 con más archivos (tabla), usuarios con más compartidos (tabla) |
| **Compartición** | Archivos más compartidos (tabla), selector de usuario + recursos compartidos/recibidos |
| **Actividad** | Operaciones por tipo (bar chart + tabla), por período (line chart con selector día/mes/año) |

**Gráficos (opcional pero impactante):**
- `ngx-charts` o `ng2-charts` (instalar con `npm install @swimlane/ngx-charts`).
- Si no quieres dependencias extra, usar solo `mat-table` + `mat-progress-bar` para visualizar proporciones.

**Componentes:**
```
features/admin/reportes/
├── reportes.component.ts                (contenedor con mat-tab-group)
├── reportes.component.html
├── tabs/
│   ├── reportes-archivos.component.ts
│   ├── reportes-usuarios.component.ts
│   ├── reportes-compartidos.component.ts
│   └── reportes-actividad.component.ts
└── reportes.service.ts                  (opcional: cache + transformaciones)
```

**Ruta:** `/admin/reportes`.

**⚠️ Si faltan los endpoints admin de actividad global:** crear un `ReportesAdminService`
que use los endpoints existentes y, si es necesario, proponer al usuario añadir los
faltantes al backend antes de continuar.

### 📜 Módulo: Actividad del sistema (`/admin/actividad`)

**Objetivo:** log de auditoría completo con filtros.

**Vista:**
- Filtros superiores:
  - `mat-select` para usuario (cargado con `GET /api/usuarios`).
  - `mat-select` para acción (`crear`, `renombrar`, `mover`, `compartir`, `enviar_papelera`, `restaurar`, `login`, etc.).
  - `mat-select` para tipo de recurso (`archivo`, `carpeta`, `usuario`).
  - `mat-date-range-picker` para rango de fechas.
- `mat-table` con columnas: fecha (formateada), usuario (nombre + email), acción (chip de color), recurso (tipo + nombre), metadata (tooltip o fila expandible).
- Paginación.

**Colores por acción (chips):**
| Acción | Color Material |
|---|---|
| crear | `primary` |
| renombrar / mover | `accent` |
| compartir | `accent` |
| enviar_papelera / eliminar_permanente | `warn` |
| restaurar | `primary` |
| login | default |
| desactivar_usuario | `warn` |

**Componentes:**
```
features/admin/actividad/
├── actividad.component.ts
├── actividad.component.html
└── actividad.component.scss
```

**Ruta:** `/admin/actividad`.

## 5. Servicios adicionales sugeridos

```
core/services/
├── usuario.service.ts      (CRUD admin de usuarios)
├── reporte.service.ts      (consumo de endpoints de reportes)
└── actividad.service.ts    (consumo de endpoints de actividad)
```

Cada uno usa `ApiService` internamente y devuelve `Observable<T>`.

Ejemplo:

```typescript
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly api = inject(ApiService);

  listar(filtros: { rol?: string; activo?: boolean; page?: number; limit?: number }) {
    return this.api.get<Usuario[]>('/usuarios', filtros);
  }
  crear(dto: CrearUsuarioDTO) { return this.api.post<Usuario>('/usuarios', dto); }
  actualizar(id: string, dto: Partial<Usuario>) { return this.api.patch<Usuario>(`/usuarios/${id}`, dto); }
  desactivar(id: string) { return this.api.delete<void>(`/usuarios/${id}`); }
  reactivar(id: string) { return this.api.patch<Usuario>(`/usuarios/${id}`, { activo: true }); }
}
```

## 6. Estilo de trabajo esperado

- **Pragmático, sin sobre-ingeniería.** Si un componente no necesita servicio propio, no lo crear.
- **Archivos completos, no fragmentos.** Dar cada archivo listo para copiar y pegar.
- **Señalar impactos cruzados.** Si un cambio afecta rutas, servicios o modelos, listarlos.
- **Usar `mat-snack-bar` para feedback** (éxito, error) en lugar de `alert()`.
- **Confirmar antes de acciones destructivas** con `mat-dialog`.
- **Cargar estado con `signal<boolean>`** (`cargando`) y `signal<string|null>` (`error`) por componente.
- **No inventar endpoints.** Si un endpoint no está en el backend, mencionarlo y proponer solución (adaptar el existente o crearlo en backend).
- **No tocar el layout, sidenav, toolbar ni guards.** Ya funcionan.

## 7. Orden sugerido de implementación

1. **Dashboard** (lo más visual, sin dependencias externas).
2. **Gestión de usuarios** (CRUD completo + dialogs).
3. **Actividad global** (filtros + tabla).
4. **Reportes globales** (el más complejo, dejar al final).

## 8. Preguntas obligatorias antes de empezar

Si el usuario no lo especifica, preguntar antes de asumir:

1. **¿Los servicios `UsuarioService`, `ReporteService`, `ActividadService` ya existen?** Si sí, reutilizarlos. Si no, crearlos.
2. **¿Los endpoints admin de reportes globales de actividad existen en el backend?** Si no, ¿se implementan primero o se adaptan los existentes?
3. **¿Quieres gráficos (ngx-charts/ng2-charts) o solo tablas?** Afecta dependencias.
4. **¿Dónde están las rutas de admin registradas?** En `admin.routes.ts` o directamente en `app.routes.ts`. Respetar la estructura existente.

## 9. Cómo usar este contexto

Pegar este documento como primer mensaje en un nuevo chat. Luego preguntar
específicamente por un módulo:

> *"Con este contexto, implementa el Dashboard admin. Archivos completos, listos para copiar."*

**Reglas para el agente:**
- Respetar standalone components, signals, `@if`, Angular Material 21.
- No proponer NgModules, `*ngIf`, `BehaviorSubject` salvo justificación explícita.
- Si un cambio requiere un endpoint del backend que no existe, señalarlo.
- Antes de crear un servicio nuevo, verificar si ya existe uno reutilizable.
- **No tocar layout, sidenav, toolbar, guards ni interceptores.**
