# Infraestructura

## Desarrollo local

### Prerrequisitos

- Node.js 18+
- Docker (opcional, para base de datos local)
- PostgreSQL

### Inicio rápido

```bash
# 1. Instalar todo
npm run install:all

# 2. Configurar variables de entorno (ver .env.example en backend y frontend-v2)

# 3. Iniciar proyecto
npm run dev
```

### Servicios (local)

| Servicio | URL | Propósito |
|---|---|---|
| Backend | http://localhost:3000 | API REST |
| Frontend | http://localhost:5173 | Interfaz de usuario |
| Base de Datos | localhost:5432 | PostgreSQL |

### Variables de entorno

- Cada subproyecto tiene su propio `.env.example`.
- Nunca commitees `.env`.

## Producción

### Objetivo de despliegue

Supabase (BD + Auth) y Host de Node.js (Vercel/Render/Docker).

### CI/CD

- **Herramienta:** GitHub Actions.
- **Trigger:** Push a main.
- **Pasos:** Build -> Lint -> Test -> Deploy.

## Observabilidad

Se utilizan los logs de NestJS y las herramientas de monitoreo de Supabase.

## Docs relacionados

- [Arquitectura](./architecture.md)
- [Decisiones](./adrs/)
