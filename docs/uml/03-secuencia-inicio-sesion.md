# Secuencia: inicio de sesión

Flujo de autenticación con correo y contraseña, emisión del JWT y registro de la
actividad de inicio de sesión.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant SPA as SPA Angular
    participant API as API / AuthController
    participant AS as AuthService
    participant DB as MongoDB
    participant BC as bcrypt
    participant JWT as JWT
    participant ACT as ActividadService

    U->>SPA: Ingresa correo y contraseña
    SPA->>API: POST /api/auth/sign-in
    API->>API: Valida el body con Zod
    API->>AS: signIn(dto)
    AS->>DB: Buscar usuario por correo
    DB-->>AS: Usuario y passwordHash

    alt Usuario inexistente o inactivo
        Note over AS: 401 si no existe o la contraseña es inválida<br/>403 si el usuario está desactivado
        AS-->>API: Error de autenticación
        API-->>SPA: HTTP 401 o 403
        SPA-->>U: Muestra el error
    else Usuario activo
        AS->>BC: compare(password, passwordHash)
        BC-->>AS: Resultado

        alt Contraseña incorrecta
            AS-->>API: 401 credenciales inválidas
            API-->>SPA: HTTP 401
            SPA-->>U: Muestra el error
        else Contraseña correcta
            AS->>JWT: sign(payload, JWT_SECRET, 7d)
            JWT-->>AS: token
            AS->>ACT: registrar inicio de sesión
            ACT->>DB: Insertar actividad
            DB-->>ACT: Actividad creada
            AS-->>API: { token, usuario }
            API-->>SPA: HTTP 200 { token, usuario }
            SPA->>SPA: Guarda token y usuario en localStorage
            SPA-->>U: Redirige a /home
        end
    end
```

## Notas

- El token se envía después en la cabecera `Authorization: Bearer <token>`.
- El middleware de autenticación vuelve a consultar el usuario y su rol en MongoDB.
- Un usuario inactivo o un token inválido produce `401`; las credenciales
  incorrectas también producen `401`.
