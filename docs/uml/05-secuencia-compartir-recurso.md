# Secuencia: compartir recurso

El propietario comparte un archivo o carpeta con otro usuario y define el nivel de
permiso: lectura, escritura o comentar.

```mermaid
sequenceDiagram
    autonumber
    actor P as Propietario
    participant SPA as SPA Angular
    participant API as API / CompartidosController
    participant CS as CompartidosService
    participant PS as Permisos
    participant UR as UsuarioRepository
    participant RR as RecursoRepository
    participant DB as MongoDB
    participant A as ActividadService

    P->>SPA: Abre "Compartir" y elige usuario y permiso
    SPA->>API: POST /api/archivos/:id/compartir
    API->>API: Valida el body con Zod
    API->>CS: compartir(id, dto, usuarioId)
    CS->>PS: obtenerComoPropietario(id, usuarioId)
    PS->>DB: Consultar recurso y acceso
    DB-->>PS: Recurso

    alt Sin acceso o no es propietario
        Note over PS: 404 si no tiene acceso<br/>403 si tiene acceso pero no es propietario
        PS-->>CS: 404 o 403
        CS-->>API: Error
        API-->>SPA: HTTP 404 o 403
    else Es propietario
        CS->>CS: Valida que el destino no sea el mismo usuario
        CS->>UR: buscarPorId(usuarioDestinoId)
        UR->>DB: Consultar usuario destino
        DB-->>UR: Usuario

        alt Destino inexistente o inactivo
            CS-->>API: 404
            API-->>SPA: HTTP 404
        else Destino válido
            CS->>RR: agregar o actualizar compartición
            RR->>DB: Actualizar documento del recurso
            DB-->>RR: Recurso actualizado
            CS->>A: registrar compartición
            A->>DB: Insertar actividad
            CS-->>API: Recurso actualizado
            API-->>SPA: HTTP 200
            SPA-->>P: Muestra confirmación
        end
    end

    Note over API: El mismo flujo aplica para<br/>POST /api/carpetas/:id/compartir
```

## Notas

- Un usuario no puede compartir un recurso consigo mismo.
- Solo el propietario directo puede modificar la compartición.
- Compartir o actualizar un permiso queda registrado en la actividad.
- El permiso `comentar` existe en el modelo, pero hoy se comporta como lectura
  porque el módulo de comentarios no está implementado.
