# Checklist de Implementación

## Introducción

Este documento proporciona checklists para diferentes tareas de desarrollo, asegurando que nada se olvide durante la implementación.

## Checklist: Crear Nueva Feature

### Setup Inicial

- [ ] Crear estructura de carpetas
  - [ ] `src/features/[feature-name]/api/`
  - [ ] `src/features/[feature-name]/components/`
  - [ ] `src/features/[feature-name]/stores/`
  - [ ] `src/features/[feature-name]/views/`

### API Client

- [ ] Crear o usar API client existente
- [ ] Definir tipos TypeScript (Request/Response)
- [ ] Implementar funciones CRUD necesarias
- [ ] Agregar mocks en `src/api/mocks/index.ts`
- [ ] Integrar mocks en API client con `USE_MOCKS`

### Store

- [ ] Crear store con `defineStore`
- [ ] Definir state (refs)
- [ ] Implementar actions (async functions)
- [ ] Crear getters (computed) si es necesario
- [ ] Manejar estados de loading y error
- [ ] Retornar state, actions y getters

### Views

- [ ] Crear vista principal
- [ ] Usar store para obtener datos
- [ ] Mostrar LoadingSpinner durante carga
- [ ] Mostrar ErrorMessage si hay error
- [ ] Manejar estado vacío
- [ ] Implementar navegación si es necesario

### Componentes

- [ ] Crear componentes específicos si es necesario
- [ ] Usar componentes compartidos cuando sea posible
- [ ] Tipar props y emits
- [ ] Documentar props complejas

### Routing

- [ ] Agregar rutas en `src/router/index.ts`
- [ ] Usar lazy loading (`() => import(...)`)
- [ ] Nombrar rutas descriptivamente
- [ ] Agregar meta información si es necesario

### Testing Manual

- [ ] Feature funciona correctamente
- [ ] Estados de loading/error se muestran
- [ ] Navegación funciona
- [ ] Responsive funciona
- [ ] No hay errores en consola
- [ ] Funciona con mocks
- [ ] Funciona con API real (si es posible)

### Documentación

- [ ] Comentarios en código complejo
- [ ] Actualizar documentación si es necesario

## Checklist: Crear Componente

### Estructura

- [ ] Archivo en ubicación correcta (shared o feature)
- [ ] Nombre en PascalCase
- [ ] Estructura: template, script, style

### Props y Emits

- [ ] Props tipadas con TypeScript
- [ ] Props con defaults si es necesario (`withDefaults`)
- [ ] Emits tipados
- [ ] Documentar props complejas

### Funcionalidad

- [ ] Componente funciona correctamente
- [ ] Maneja estados (loading, error, empty)
- [ ] Slots implementados si es necesario
- [ ] Eventos emitidos correctamente

### Estilos

- [ ] Usa Tailwind/DaisyUI
- [ ] Responsive funciona
- [ ] Accesible (labels, ARIA si es necesario)

### Testing

- [ ] Probado en diferentes estados
- [ ] Probado con diferentes props
- [ ] No hay errores en consola

## Checklist: Crear Store

### Estructura

- [ ] Usa `defineStore` con setup syntax
- [ ] Nombre descriptivo (`useFeatureStore`)
- [ ] Ubicado en `src/features/[feature]/stores/`

### State

- [ ] State definido con `ref`
- [ ] Tipos TypeScript explícitos
- [ ] Estados de loading y error incluidos

### Actions

- [ ] Actions son async cuando es necesario
- [ ] Manejan errores correctamente
- [ ] Actualizan loading state
- [ ] Actualizan error state
- [ ] Nombres descriptivos

### Getters

- [ ] Getters son computed
- [ ] No mutan estado
- [ ] Nombres descriptivos

### Return

- [ ] Retorna state, actions y getters
- [ ] Orden consistente

## Checklist: Crear API Client

### Estructura

- [ ] Archivo en `src/api/[module].api.ts`
- [ ] Usa `apiClient` base
- [ ] Funciones tipadas

### Funciones

- [ ] GET para listar
- [ ] GET para obtener por ID
- [ ] POST para crear
- [ ] PATCH para actualizar
- [ ] DELETE para eliminar
- [ ] Query parameters manejados correctamente

### Tipos

- [ ] Tipos Request definidos
- [ ] Tipos Response definidos
- [ ] Tipos compartidos en `types.ts` si es necesario

### Mocks

- [ ] Mocks agregados en `mocks/index.ts`
- [ ] Mocks integrados con `USE_MOCKS`
- [ ] Datos mock realistas
- [ ] Delay simulado

## Checklist: Antes de Commit

### Código

- [ ] Código compila (`npm run build`)
- [ ] Lint pasa (`npm run lint`)
- [ ] TypeScript sin errores
- [ ] Sin console.logs de debug
- [ ] Sin código comentado
- [ ] Imports organizados

### Funcionalidad

- [ ] Funciona como se espera
- [ ] No rompe funcionalidad existente
- [ ] Maneja errores correctamente
- [ ] Estados de loading funcionan

### Estilos

- [ ] Responsive funciona
- [ ] No hay estilos rotos
- [ ] Consistente con diseño existente

## Checklist: Antes de Pull Request

### Código

- [ ] Todos los commits siguen convenciones
- [ ] Branch name sigue convenciones
- [ ] PR title sigue formato
- [ ] PR description completa

### Testing

- [ ] Probado manualmente
- [ ] Funciona con mocks
- [ ] Funciona con API real (si es posible)
- [ ] No hay errores en consola
- [ ] No hay warnings

### Documentación

- [ ] README actualizado (si aplica)
- [ ] Comentarios en código complejo
- [ ] Documentación de desarrollo actualizada (si aplica)

### Review

- [ ] PR es pequeño y enfocado
- [ ] Fácil de revisar
- [ ] Listo para review

## Checklist: Crear Formulario

### Estructura

- [ ] Componente de formulario creado
- [ ] Campos con labels
- [ ] Validación implementada
- [ ] Estados de error por campo

### Funcionalidad

- [ ] Submit funciona
- [ ] Validación funciona
- [ ] Mensajes de error claros
- [ ] Loading state durante submit
- [ ] Success state después de submit

### Integración

- [ ] Conectado con API
- [ ] Maneja errores de API
- [ ] Muestra errores de validación del servidor

## Checklist: Agregar Nueva Ruta

### Configuración

- [ ] Ruta agregada en `router/index.ts`
- [ ] Lazy loading usado
- [ ] Nombre descriptivo
- [ ] Path correcto

### Vista

- [ ] Vista creada
- [ ] Conectada a store si es necesario
- [ ] Maneja parámetros de ruta si aplica
- [ ] Maneja query params si aplica

### Navegación

- [ ] Links agregados donde sea necesario
- [ ] Navegación programática funciona
- [ ] Breadcrumbs si es necesario

## Referencias

- [Guía de Features](./FEATURES_GUIDE.md)
- [Guía de Componentes](./COMPONENTS_GUIDE.md)
- [Guía de Stores](./STORES_GUIDE.md)
- [Guía de API](./API_GUIDE.md)
- [Guía de Contribución](./CONTRIBUTING.md)

