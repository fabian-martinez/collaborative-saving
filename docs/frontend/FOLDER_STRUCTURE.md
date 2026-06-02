# Estructura de Carpetas

## Estructura General

```
frontend-v2/
├── src/                    # Código fuente
├── public/                 # Archivos estáticos
├── index.html              # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
└── .env.local              # Variables de entorno (gitignored)
```

## `src/api/`

Clientes API y configuración HTTP.

```
src/api/
├── client.ts              # Cliente Axios base con interceptores
├── types.ts               # Tipos compartidos para API
├── [module].api.ts        # Un cliente por módulo del backend
└── mocks/
    └── index.ts           # Datos y funciones mock
```

## `src/features/`

Features organizadas por dominio de negocio. Cada feature es autocontenida:

```
src/features/[feature-name]/     # kebab-case
├── api/                         # (opcional) API client específico
│   └── [feature].api.ts
├── components/                  # Componentes específicos
│   └── [Component].vue          # PascalCase
├── stores/
│   └── [feature].ts             # camelCase
├── views/
│   └── [Feature]View.vue
└── types.ts                     # (opcional) Tipos específicos
```

**Estructura mínima** (feature simple):
```
feature-name/
├── stores/
│   └── featureName.ts
└── views/
    └── FeatureNameView.vue
```

### Cuándo crear una nueva feature
- Nuevo dominio de negocio con múltiples vistas/componentes
- Conjunto de funcionalidades relacionadas con estado global propio

### Cuándo NO crear una feature
- Solo un componente reutilizable → `src/shared/components/`
- Solo utilidades → `src/shared/utils/`

## `src/shared/`

Recursos compartidos entre múltiples features.

```
src/shared/
├── components/            # Componentes reutilizables (sin deps de features)
├── composables/           # Lógica reutilizable (useApi, usePagination, etc.)
├── layout/                # Estructura de la app (AppSidebar, AppHeader)
├── utils/                 # Funciones puras (formatters, validators)
└── types/                 # Interfaces y tipos compartidos
```

## `src/router/`

```
src/router/
└── index.ts              # Todas las rutas, lazy loading, organizadas por feature
```

## `src/assets/`

```
src/assets/
└── main.css              # Estilos globales y configuración Tailwind
```

## Reglas de Oro

1. **Una feature = un dominio de negocio**
2. **Shared = usado por 2+ features**
3. **Si dudas, empieza simple y refactoriza después**
4. **Mantén la estructura plana cuando sea posible**

> Ver [Convenciones de Código](./CODING_CONVENTIONS.md) para naming detallado.

## Referencias

- [Guía de Features](./FEATURES_GUIDE.md)
- [Arquitectura](./ARCHITECTURE.md)
