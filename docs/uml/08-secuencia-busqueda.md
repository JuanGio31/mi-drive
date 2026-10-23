# Secuencia: búsqueda de recursos

Búsqueda de archivos y carpetas por nombre, incluyendo recursos propios, compartidos
directamente y descendientes de carpetas compartidas.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant SPA as SPA Angular
    participant API as API / BusquedaController
    participant BS as BusquedaService
    participant CR as CarpetaRepository
    participant AR as ArchivoRepository
    participant DB as MongoDB

    U->>SPA: Escribe el texto de búsqueda
    SPA->>API: GET /api/buscar?q=texto&limite=8
    API->>API: Valida q y limite con Zod
    API->>BS: buscar(usuarioId, q, limite)

    BS->>CR: listarCompartidasCon(usuarioId, null, true)
    CR->>DB: Consultar carpetas compartidas
    DB-->>CR: Carpetas raíz compartidas
    CR-->>BS: Raíces compartidas

    BS->>CR: obtenerDescendientesDeVarias(raíces)
    CR->>DB: Consultar descendientes
    DB-->>CR: IDs de carpetas accesibles
    CR-->>BS: IDs de carpetas

    par Búsqueda de archivos
        BS->>AR: buscarPorNombre(usuarioId, idsCarpetas, q, tope)
        AR->>DB: Buscar archivos accesibles
        DB-->>AR: Archivos
        AR-->>BS: Archivos encontrados
    and Búsqueda de carpetas
        BS->>CR: buscarPorNombre(usuarioId, q, tope, idsCarpetas)
        CR->>DB: Buscar carpetas accesibles
        DB-->>CR: Carpetas
        CR-->>BS: Carpetas encontradas
    end

    BS-->>API: { archivos, carpetas }
    API-->>SPA: HTTP 200
    SPA-->>U: Muestra los resultados
```

## Notas

- La búsqueda usa el nombre y no devuelve recursos sin acceso.
- Se incluyen recursos propios, compartidos directamente y descendientes de carpetas
  compartidas.
- El límite por defecto es 8 y el máximo permitido es 20.
- Los recursos en papelera no aparecen en los resultados.
