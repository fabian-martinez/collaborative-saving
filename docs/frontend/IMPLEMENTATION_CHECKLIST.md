# Checklist de Implementación

## Nueva Feature

- [ ] Carpetas: `src/features/[name]/{components,stores,views}`
- [ ] Store: `defineStore` con state, actions, getters, loading/error
- [ ] Vista principal: loading/error/empty states
- [ ] Rutas: lazy loading en `router/index.ts`
- [ ] API Client + mocks (si aplica)
- [ ] Componentes tipados con props y emits
- [ ] Testing manual + sin errores en consola

> Detalle: [Features](./FEATURES_GUIDE.md), [Stores](./STORES_GUIDE.md), [API](./API_GUIDE.md)

## Nuevo Componente

- [ ] Ubicación correcta (shared vs feature)
- [ ] PascalCase, orden: template → script → style
- [ ] Props tipadas con `withDefaults` si aplica
- [ ] Emits tipados
- [ ] Responsive y accesible
- [ ] Probado en diferentes estados y props

> Detalle: [Componentes](./COMPONENTS_GUIDE.md), [Estilos](./STYLING_GUIDE.md)

## Nuevo Store

- [ ] `defineStore` con setup syntax
- [ ] Nombre `useFeatureStore`
- [ ] State (`ref`), actions (async), getters (`computed`)
- [ ] Loading y error states
- [ ] Return con state + actions + getters

> Detalle: [Stores](./STORES_GUIDE.md)

## Nuevo API Client

- [ ] `src/api/[module].api.ts` usando `apiClient` base
- [ ] Funciones tipadas (CRUD)
- [ ] Tipos Request/Response en `types.ts`
- [ ] Mocks con datos realistas y delay

> Detalle: [API](./API_GUIDE.md)

## Nuevo Formulario

- [ ] Validación antes de submit
- [ ] Errores por campo + error general
- [ ] Loading durante submit, disabled en botón
- [ ] Manejo de errores del servidor (`ApiException.errors`)
- [ ] Reset después de éxito

> Detalle: [Formularios](./FORMS_GUIDE.md), [Errores](./ERROR_HANDLING.md)

## Nueva Ruta

- [ ] En `router/index.ts` con lazy loading
- [ ] Nombre descriptivo
- [ ] Vista creada y conectada a store
- [ ] Links de navegación agregados

> Detalle: [Routing](./ROUTING_GUIDE.md)

## Pre-Commit

- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin errores
- [ ] Sin `console.log` de debug
- [ ] Sin código comentado
- [ ] Funciona como se espera + no rompe nada
- [ ] Responsive y consistente con diseño

## Pre-PR

- [ ] Branch `feature/` o `fix/` desde `main`
- [ ] Commits con prefijo semántico (`feat:`, `fix:`, etc.)
- [ ] PR pequeño, enfocado, con descripción
- [ ] Sin errores ni warnings en consola
