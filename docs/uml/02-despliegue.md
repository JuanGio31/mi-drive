# Diagrama de despliegue

Despliegue del entorno validado: SPA Angular servida por el servidor de desarrollo,
API REST Node.js/Express y MongoDB local. No existen Docker, CI/CD ni despliegue
productivo configurado.

```mermaid
flowchart LR
    subgraph CLIENTE["Cliente"]
        SPA["Navegador web<br/>SPA Angular 21<br/>standalone + signals + Material"]
    end

    subgraph FRONTEND["Frontend de desarrollo"]
        DEV["Angular dev server<br/>127.0.0.1:4200"]
        PROXY["Proxy /api"]
    end

    subgraph BACKEND["Servidor de aplicación"]
        API["API REST<br/>Node.js + Express 5<br/>puerto 3000"]
        AUTH["Autenticación JWT"]
        MODULOS["Módulos de negocio<br/>auth, usuario, carpeta,<br/>archivo, actividad,<br/>reporte, búsqueda"]
        LOG["Logs técnicos<br/>Pino + pino-roll"]
        ENV[".env<br/>PORT, MONGO_URI,<br/>JWT_SECRET, LOG_*"]
    end

    DB[("MongoDB local<br/>base dms")]
    LOGS["Sistema de archivos<br/>backend/logs/"]

    DEV -->|"sirve HTML, JS y CSS"| SPA
    SPA -->|"HTTP/JSON"| DEV
    DEV --> PROXY
    PROXY -->|"/api"| API
    API --> AUTH
    API --> MODULOS
    MODULOS -->|"Mongoose"| DB
    API --> LOG
    LOG -->|"rotación diaria o 10 MB"| LOGS
    ENV -.->|"configura"| API
```

## Notas

- El frontend consume la API mediante el proxy de Angular en desarrollo.
- La API valida el token JWT en cada solicitud protegida y refresca el usuario y su
  rol desde MongoDB.
- Los logs se escriben en `backend/logs/` con rotación y sin datos sensibles.
- MongoDB es una instancia local; no hay réplica ni clúster.
- El despliegue productivo queda fuera del alcance actual.
