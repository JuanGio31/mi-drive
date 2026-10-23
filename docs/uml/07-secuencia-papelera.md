# Secuencia: papelera

Envío de archivos o carpetas a la papelera con eliminación lógica en cascada, y
restauración posterior.

```mermaid
sequenceDiagram
    autonumber
    actor P as Propietario
    participant SPA as SPA Angular
    participant API as API / PapeleraController
    participant PS as Permisos
    participant CS as CarpetaService / ArchivoService
    participant CR as CarpetaRepository
    participant AR as ArchivoRepository
    participant DB as MongoDB
    participant A as ActividadService

    alt Enviar a papelera
        P->>SPA: Confirma el envío a papelera
        SPA->>API: DELETE /api/archivos/:id o /api/carpetas/:id
        API->>CS: enviarAPapelera(id, usuarioId)
        CS->>PS: obtenerComoPropietario(id, usuarioId, true)
        PS->>DB: Consultar recurso y acceso
        DB-->>PS: Recurso

        alt No existe, no es propietario o ya está en papelera
            Note over CS: 404 si no existe o no tiene acceso<br/>403 si no es propietario<br/>400 si ya está en papelera
            CS-->>API: Error de validación
            API-->>SPA: HTTP 400, 403 o 404
        else Propietario y recurso activo
            alt Es carpeta
                CS->>CR: obtenerDescendientesIds(id)
                CR->>DB: Consultar subárbol
                DB-->>CR: IDs de descendientes
                CS->>CR: enviarAPapeleraCascada(ids, raízId)
                CS->>AR: enviarAPapeleraPorCarpetas(ids, raízId)
                CR->>DB: Actualizar carpetas
                AR->>DB: Actualizar archivos
            else Es archivo
                CS->>AR: enviarAPapelera(id)
                AR->>DB: Actualizar archivo
            end

            CS->>A: registrar envío a papelera
            A->>DB: Insertar actividad
            CS-->>API: Operación completada
            API-->>SPA: HTTP 204
            SPA-->>P: Recarga la vista de papelera
        end
    else Restaurar
        P->>SPA: Confirma la restauración
        SPA->>API: POST /api/archivos/:id/restaurar o /api/carpetas/:id/restaurar
        API->>CS: restaurar(id, usuarioId)
        CS->>PS: obtenerComoPropietario(id, usuarioId, true)
        PS->>DB: Consultar recurso y acceso
        DB-->>PS: Recurso

        alt No es raíz de papelera o el padre no está disponible
            CS-->>API: 400 solicitud inválida
            API-->>SPA: HTTP 400
        else Restauración válida
            alt Es carpeta
                CS->>CR: restaurarCascada(id)
                CS->>AR: restaurarPorCarpetaRaiz(id)
                CR->>DB: Restaurar carpetas
                AR->>DB: Restaurar archivos
            else Es archivo
                CS->>AR: restaurar(id)
                AR->>DB: Restaurar archivo
            end

            CS->>A: registrar restauración
            A->>DB: Insertar actividad
            CS-->>API: Recurso restaurado
            API-->>SPA: HTTP 200
            SPA-->>P: Recarga la vista
        end
    end
```

## Notas

- Solo el propietario puede enviar a papelera o restaurar.
- En carpetas, la operación se aplica en cascada a todo el subárbol.
- Un elemento solo se restaura si es la raíz enviada a papelera y su carpeta padre
  sigue disponible.
- La eliminación es lógica; no se borra el documento de MongoDB.
