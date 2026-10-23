# Secuencia: crear y editar archivo

Creación de archivos en Mi Unidad o dentro de una carpeta, y edición de contenido
con validación de permisos.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant SPA as SPA Angular
    participant API as API / ArchivoController
    participant S as ArchivoService
    participant P as Permisos
    participant V as Validaciones
    participant R as ArchivoRepository
    participant DB as MongoDB
    participant A as ActividadService

    alt Crear archivo
        U->>SPA: Completa nombre y tipo de archivo
        SPA->>API: POST /api/archivos
        API->>API: Valida el body con Zod
        API->>S: crear(dto, usuarioId)

        opt Hay carpeta padre
            S->>P: validarCarpetaDestino(carpetaId, usuarioId)
            P->>DB: Consultar carpeta y permiso efectivo
            DB-->>P: Carpeta
            P-->>S: Propietario del árbol
        end

        S->>V: validarNombreUnico(nombre, carpetaPadre)
        V->>DB: Consultar duplicado
        DB-->>V: Resultado

        alt Nombre duplicado
            S-->>API: 409 conflicto
            API-->>SPA: HTTP 409
            SPA-->>U: Muestra el error
        else Nombre disponible
            S->>R: crear(archivo)
            R->>DB: Insertar archivo
            DB-->>R: Documento creado
            S->>A: registrar creación
            A->>DB: Insertar actividad
            S-->>API: Archivo creado
            API-->>SPA: HTTP 201
            SPA-->>U: Abre o muestra el archivo
        end
    else Editar contenido
        U->>SPA: Modifica el contenido y guarda
        SPA->>API: PUT /api/archivos/:id/contenido
        API->>API: Valida el body con Zod
        API->>S: actualizarContenido(id, contenido, usuarioId)
        S->>P: obtenerConPermisoEdicion(id, usuarioId)
        P->>DB: Consultar archivo y permiso efectivo
        DB-->>P: Archivo y permiso

        alt Sin acceso al recurso
            P-->>S: 404 no encontrado
            S-->>API: 404
            API-->>SPA: HTTP 404
        else Con acceso pero sin permiso de edición
            P-->>S: 403 prohibido
            S-->>API: 403
            API-->>SPA: HTTP 403
        else Permiso de edición
            S->>R: actualizar(contenido, tamanio)
            R->>DB: Actualizar archivo
            DB-->>R: Documento actualizado
            S->>A: registrar actualización de contenido
            A->>DB: Insertar actividad
            S-->>API: Archivo actualizado
            API-->>SPA: HTTP 200
            SPA-->>U: Confirma el guardado
        end
    end
```

## Notas

- El tamaño se recalcula con `Buffer.byteLength` a partir del contenido.
- El nombre se valida contra la carpeta padre y el propietario del árbol.
- Sin acceso al recurso se responde `404`; con acceso pero sin permiso de edición se
  responde `403`.
- La edición requiere permiso de escritura, ser propietario directo o ser propietario
  del árbol de carpetas.
