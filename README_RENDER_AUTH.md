# Backend multiusuario para Render

Este proyecto ya incluye autenticación y tareas por usuario con PostgreSQL.

## Variables de entorno requeridas

- `DATABASE_URL`: URL interna de PostgreSQL en Render.
- `JWT_SECRET`: secreto para firmar tokens.
- `FRONTEND_ORIGIN` (opcional): dominio del frontend para restringir CORS.

## Endpoints

### Salud
- `GET /api/health`

### Autenticación
- `POST /api/auth/register`
  - body JSON:
    - `name` (string)
    - `email` (string)
    - `password` (string, mínimo 6)
- `POST /api/auth/login`
  - body JSON:
    - `email` (string)
    - `password` (string)

Responden con:
- `user`: `{ id, name, email }`
- `token`: JWT

### Tareas (requieren token)
Enviar header:
- `Authorization: Bearer <token>`

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

Campos de tarea:
- `title` (string)
- `completed` (boolean)
- `completedAt` (ISO string o null)
- `important` (boolean)
- `estimatedTime` (ISO string o null)
- `categories` (array de strings)

## Render

El archivo `render.yaml` ya está listo para el Web Service.

Falta vincular una base de datos PostgreSQL en Render y colocar su `DATABASE_URL` en las variables del servicio.

## Nota sobre frontend

Actualmente el frontend sigue usando `localStorage`. El siguiente paso es conectar estos endpoints para que login/register y tareas queden persistentes por usuario.
