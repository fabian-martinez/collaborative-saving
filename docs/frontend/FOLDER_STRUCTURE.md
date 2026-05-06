# Estructura de Carpetas

## Introducción

Este documento explica la organización del proyecto, el propósito de cada directorio y las convenciones para mantener una estructura consistente.

## Estructura General

```
frontend-v2/
├── src/                    # Código fuente
├── docs/                   # Documentación de desarrollo
├── public/                 # Archivos estáticos
├── index.html              # HTML entry point
├── package.json            # Dependencias y scripts
├── tsconfig.json           # Configuración TypeScript
├── vite.config.ts          # Configuración Vite
├── postcss.config.js       # Configuración PostCSS
└── .env.local              # Variables de entorno (gitignored)
```

## Directorio `src/`

### `src/api/`

**Propósito**: Clientes API y configuración HTTP.

```
src/api/
├── client.ts              # Cliente Axios base con interceptores
├── types.ts               # Tipos compartidos para API
├── members.api.ts         # Cliente API de Members
├── meetings.api.ts        # Cliente API de Meetings
├── loans.api.ts           # Cliente API de Loans
├── stocks.api.ts          # Cliente API de Stocks
├── contributions.api.ts    # Cliente API de Contributions
├── ledger.api.ts          # Cliente API de Ledger
└── mocks/                 # Sistema de mocks
    └── index.ts           # Implementación de mocks
```

**Convenciones:**
- Un archivo `.api.ts` por módulo del backend
- Todos usan el cliente base de `client.ts`
- Mocks en `mocks/index.ts` con funciones que simulan respuestas

### `src/features/`

**Propósito**: Features organizadas por dominio de negocio.

Cada feature es autocontenida y sigue esta estructura:

```
src/features/
└── [feature-name]/        # Nombre en kebab-case
    ├── api/               # API client específico (opcional)
    │   └── [feature].api.ts
    ├── components/        # Componentes específicos de la feature
    │   └── [Component].vue
    ├── stores/            # Stores de Pinia
    │   └── [feature].ts
    └── views/             # Vistas/Páginas
        └── [Feature]View.vue
```

**Ejemplo: Members Feature**

```
src/features/members/
├── api/                   # (opcional, usa src/api/ si es suficiente)
├── components/
│   └── MemberForm.vue    # Formulario específico de members
├── stores/
│   ├── members.ts        # Store principal
│   └── memberDetail.ts   # Store para detalle (si es complejo)
└── views/
    ├── MembersView.vue   # Lista de members
    └── MemberDetailView.vue # Detalle de un member
```

**Cuándo crear una nueva feature:**
- Nuevo dominio de negocio
- Conjunto de funcionalidades relacionadas
- Múltiples vistas y componentes
- Estado global específico

**Cuándo NO crear una nueva feature:**
- Solo un componente reutilizable → `src/shared/components/`
- Solo utilidades → `src/shared/utils/`
- Solo tipos → `src/shared/types/`

### `src/shared/`

**Propósito**: Recursos compartidos entre múltiples features.

```
src/shared/
├── components/            # Componentes reutilizables
│   ├── DataTable.vue
│   ├── LoadingSpinner.vue
│   ├── ErrorMessage.vue
│   ├── Modal.vue
│   └── Pagination.vue
├── composables/          # Composables reutilizables
│   ├── useApi.ts
│   ├── usePagination.ts
│   └── useFilters.ts
├── layout/               # Componentes de layout
│   ├── AppSidebar.vue
│   └── AppHeader.vue
├── utils/                # Funciones utilitarias
│   ├── formatters.ts
│   └── validators.ts
└── types/                # Tipos TypeScript compartidos
    └── index.ts
```

**Convenciones:**
- **components/**: Componentes sin dependencias de features
- **composables/**: Lógica reutilizable sin estado
- **layout/**: Componentes de estructura de la app
- **utils/**: Funciones puras, sin dependencias de Vue
- **types/**: Interfaces y tipos compartidos

### `src/router/`

**Propósito**: Configuración de rutas.

```
src/router/
└── index.ts              # Definición de todas las rutas
```

**Convenciones:**
- Lazy loading para todas las rutas
- Rutas organizadas por feature
- Meta información cuando sea necesario

### `src/assets/`

**Propósito**: Assets estáticos.

```
src/assets/
└── main.css              # Estilos globales y configuración Tailwind
```

## Convenciones de Organización

### Naming de Carpetas

- **Features**: `kebab-case` (ej: `member-detail`, `active-meeting`)
- **Componentes**: `PascalCase.vue` (ej: `MemberCard.vue`)
- **Stores**: `camelCase.ts` (ej: `members.ts`, `memberDetail.ts`)
- **Utils**: `camelCase.ts` (ej: `formatters.ts`)

### Estructura de Features

**Mínima (simple):**
```
feature/
├── stores/
│   └── feature.ts
└── views/
    └── FeatureView.vue
```

**Completa (compleja):**
```
feature/
├── api/
│   └── feature.api.ts
├── components/
│   ├── FeatureForm.vue
│   ├── FeatureList.vue
│   └── FeatureCard.vue
├── stores/
│   ├── feature.ts
│   └── featureDetail.ts
└── views/
    ├── FeatureView.vue
    └── FeatureDetailView.vue
```

### Cuándo Crear Subcarpetas

**En `components/`:**
- Solo si hay 5+ componentes
- Agrupar por funcionalidad (ej: `forms/`, `cards/`)

**En `stores/`:**
- Un store por feature es suficiente normalmente
- Crear stores adicionales si la lógica es muy diferente (ej: `members.ts` y `memberDetail.ts`)

**En `views/`:**
- Una vista por ruta normalmente
- No crear subcarpetas a menos que haya 5+ vistas

## Archivos de Configuración

### `vite.config.ts`
Configuración de Vite, plugins y aliases.

### `tsconfig.json`
Configuración TypeScript, paths y compilación.

### `postcss.config.js`
Configuración PostCSS para Tailwind.

### `.env.local`
Variables de entorno (no versionado).

## Ejemplos de Estructura

### Feature Simple: Contributions

```
contributions/
├── stores/
│   └── contributions.ts
└── views/
    └── ContributionsView.vue
```

### Feature Compleja: Members

```
members/
├── components/
│   └── MemberForm.vue
├── stores/
│   ├── members.ts
│   └── memberDetail.ts
└── views/
    ├── MembersView.vue
    └── MemberDetailView.vue
```

### Feature con API Específica: Dashboard

```
dashboard/
├── api/
│   └── dashboard.api.ts
├── components/
│   ├── MetricCard.vue
│   ├── ActivityItem.vue
│   └── QuickActionButton.vue
├── stores/
│   └── dashboard.ts
└── views/
    └── DashboardView.vue
```

## Reglas de Oro

1. **Una feature = un dominio de negocio**
2. **Shared = usado por 2+ features**
3. **Si dudas, empieza simple y refactoriza después**
4. **Mantén la estructura plana cuando sea posible**
5. **Documenta decisiones de estructura compleja**

## Referencias

- [Guía de Features](./FEATURES_GUIDE.md)
- [Convenciones de Código](./CODING_CONVENTIONS.md)
- [Arquitectura](./ARCHITECTURE.md)

