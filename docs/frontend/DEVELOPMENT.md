# Guía de Desarrollo

## Setup

### Requisitos
- Node.js 18+
- npm 9+

### Instalación

```bash
cd frontend-v2
npm install
```

### Variables de Entorno

```bash
cp .env.example .env.local
```

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCKS=true       # true para desarrollo sin backend
```

### Iniciar Dev Server

```bash
npm run dev       # Inicia en http://localhost:5173
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Dev server con HMR |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Lint check |
| `npm run lint:fix` | Lint autofix |

## Aliases

```typescript
import { useApi } from '@/shared/composables/useApi'     // @/ = src/
```

Configurado en `vite.config.ts` y `tsconfig.json`.

## Troubleshooting

| Problema | Solución |
|---|---|
| Cambios no reflejan | Reiniciar dev server |
| Error `@/` no resuelve | Verificar `tsconfig.json` paths |
| CORS en API | Verificar `VITE_API_BASE_URL` |
| Estilos DaisyUI no aplican | Verificar `main.css` imports |
| Build falla con types | Correr `npm run lint` primero |

## Git Workflow

> Ver [CONTRIBUTING.md](../../CONTRIBUTING.md) para el flujo completo de branches y PRs.

Resumen: crear branch `feature/nombre` o `fix/nombre` desde `main`, abrir PR para integrar. **Nunca push directo a `main`.**

## Referencias

- [Arquitectura](./ARCHITECTURE.md)
- [Convenciones de Código](./CODING_CONVENTIONS.md)
