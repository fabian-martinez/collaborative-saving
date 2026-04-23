# AGENTS.md

Guía para agentes de IA que trabajan en este repositorio. Sigue la convención [agents.md](https://agents.md).

Este archivo solo captura lo que no es obvio leyendo el código. Para arquitectura, modelo de datos, decisiones y contexto más amplio, sigue los enlaces y lee la fuente.

## Dónde encontrar las cosas

- [Negocio](./docs/business.md) — Qué es Collaborative Saving y por qué existe.
- [Arquitectura](./docs/architecture.md) — Stack técnico (NestJS, Vue 3) y patrones (Hexagonal).
- [Modelo de datos](./docs/data-model.md) — Esquema de PostgreSQL (Supabase) y contabilidad.
- [Infraestructura](./docs/infrastructure.md) — Despliegue en Supabase y CI/CD.
- [Decisiones](./docs/adrs/README.md) — Registro de decisiones arquitectónicas (ADRs).
- [Diseño](./docs/design.md) — Sistema de diseño y UI/UX.
- [Usuario objetivo](./docs/target-user.md) — Quién usa la plataforma.

Lee estos docs antes de hacer cambios estructurales.

## Comandos

```bash
# Iniciar todo el proyecto (backend + frontend)
npm run dev

# Instalar dependencias en todos los paquetes
npm run install:all

# Backend: Iniciar en modo desarrollo
cd backend && npm run start:dev

# Frontend: Iniciar en modo desarrollo
cd frontend-v2 && npm run dev

# Backend: Correr pruebas
cd backend && npm run test
```

## Reglas no obvias

- **Flujo de Trabajo (Git):** NUNCA realices push o commit directamente a la rama `main`. Sigue estrictamente el [CONTRIBUTING.md](./CONTRIBUTING.md). Siempre crea una rama de fix o feature (ej: `fix/nombre-bug`) desde la versión más reciente de `main` y abre un Pull Request para integrar los cambios.
- **Arquitectura Hexagonal Estricta:** El dominio no debe depender de la infraestructura ni de la aplicación.
- **Contabilidad de Partida Doble:** Cualquier transacción financiera debe registrar entradas en `ledger_entries` asegurando que el balance sea cero.
- **Naming de API:** Se utiliza `snake_case` para los endpoints y payloads para mantener consistencia con la base de datos.

## Pruebas

El backend utiliza Jest para pruebas unitarias e integración. Se busca una cobertura >90% en la capa de aplicación. El frontend utiliza Vitest.

## Estilo de código

Se utiliza ESLint y Prettier. Las reglas están configuradas en los paquetes `backend` y `frontend-v2`. Se prefiere el uso de TypeScript estricto.

## Seguridad

- No commitees `.env` ni archivos con credenciales. Agrega variables nuevas a `.env.example`.
- No registres secretos, tokens ni información personal en logs.
- Asume que cualquier cosa en este repo es legible por un agente de IA — nunca pegues secretos aquí.
