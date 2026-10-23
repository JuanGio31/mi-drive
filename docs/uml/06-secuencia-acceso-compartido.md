# Secuencia: acceso a recurso compartido

Resolución del permiso efectivo cuando un usuario abre un archivo o carpeta que
recibió directamente o que está dentro de una carpeta compartida.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant SPA as SPA Angular
    participant API as API / ArchivoController
    participant S as ArchivoService
    participant PS as Permisos
    participant AR as ArchivoRepository
    participant CR as CarpetaRepository
    participant DB as MongoDB

    U->>SPA: Abre un archivo compartido
    SPA->>API: GET /api/archivos/:id
    API->>S: buscarPorId(id, usuarioId)
    S->>PS: obtenerConAcceso(id, usuarioId)
    PS->>AR: buscarPorId(id)
    AR->>DB: Consultar archivo
    DB-->>AR: Archivo

    alt Archivo inexistente, en papelera o sin permiso
        PS-->>S: 404 no encontrado
        S-->>API: 404
        API-->>SPA: HTTP 404
        SPA-->>U: Muestra recurso no disponible
    else Archivo accesible
        PS->>PS: Buscar compartición directa

        alt Compartición directa o propietario
            PS->>PS: Usar permiso directo
        else Sin compartición directa
            PS->>CR: Obtener ancestros de carpetaPadre
            CR->>DB: Consultar cadena de carpetas
            DB-->>CR: Ancestros
            PS->>PS: Usar el permiso del ancestro más cercano
        end

        alt Sin permiso efectivo
            PS-->>S: 404 no encontrado
            S-->>API: 404
            API-->>SPA: HTTP 404
        else Con permiso efectivo
            S->>PS: obtenerPermiso([archivo], usuarioId)
            PS-->>S: Permiso efectivo
            S-->>API: archivo + miPermiso
            API-->>SPA: HTTP 200
            SPA-->>U: Muestra archivo y acciones permitidas
        end
    end

    Note over API: Para GET /api/carpetas/:id se usa el flujo equivalente<br/>con CarpetaService y CarpetaPermisosService
```

## Notas

- La compartición directa tiene prioridad sobre la herencia de carpeta.
- Si no hay compartición directa, se busca el ancestro más cercano con permiso.
- La ausencia de acceso se oculta con `404`; no se revela la existencia del recurso.
- El permiso efectivo se devuelve como `miPermiso` para que el frontend habilite o
  deshabilite acciones.
