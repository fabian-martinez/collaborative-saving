# Guía de Desarrollo

## Introducción

Esta guía cubre el workflow de desarrollo, setup del entorno, debugging y troubleshooting común.

## Setup del Entorno

### Prerrequisitos

- Node.js 18+ y npm
- Editor de código (VS Code recomendado)
- Git

### Instalación Inicial

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd collaborative-saving/frontend-v2

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local

# 4. Editar .env.local
# VITE_API_URL=http://localhost:3000
# VITE_USE_MOCKS=true

# 5. Iniciar servidor de desarrollo
npm run dev
```

## Scripts Disponibles

### Desarrollo

```bash
npm run dev
```

Inicia el servidor de desarrollo en `http://localhost:5173` (o puerto disponible).

**Características:**
- Hot Module Replacement (HMR)
- Recarga automática en cambios
- Source maps para debugging
- Logging de requests API en consola

### Build

```bash
npm run build
```

Compila el proyecto para producción:
- Type checking con `vue-tsc`
- Build optimizado con Vite
- Output en `dist/`

### Preview

```bash
npm run preview
```

Preview del build de producción localmente.

### Lint

```bash
npm run lint
```

Ejecuta ESLint y corrige errores automáticamente.

## Variables de Entorno

### Archivo `.env.local`

```env
# URL del backend API
VITE_API_URL=http://localhost:3000

# Usar mocks en lugar de API real
VITE_USE_MOCKS=true
```

### Variables Disponibles

- `VITE_API_URL`: URL base del backend (default: `http://localhost:3000`)
- `VITE_USE_MOCKS`: Activar mocks (`true`/`false`, default: `false` en producción)

**Nota**: Variables deben empezar con `VITE_` para estar disponibles en el código.

### Acceder a Variables

```typescript
const apiUrl = import.meta.env.VITE_API_URL
const useMocks = import.meta.env.VITE_USE_MOCKS === 'true'
```

## Workflow de Desarrollo

### 1. Crear Nueva Feature

```bash
# 1. Crear estructura
mkdir -p src/features/my-feature/{api,components,stores,views}

# 2. Crear archivos base
# - Store
# - View
# - Componentes (si es necesario)

# 3. Agregar ruta en router

# 4. Agregar mocks (si es necesario)

# 5. Probar en navegador
```

Ver [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) para detalles.

### 2. Desarrollo con Mocks

```env
# .env.local
VITE_USE_MOCKS=true
```

**Ventajas:**
- Desarrollo sin backend
- Datos consistentes
- Testing más fácil

**Desventajas:**
- Datos no reales
- No prueba integración real

### 3. Desarrollo con Backend Real

```env
# .env.local
VITE_USE_MOCKS=false
VITE_API_URL=http://localhost:3000
```

**Asegúrate de:**
- Backend corriendo
- CORS configurado
- API V2 disponible

## Debugging

### Vue DevTools

Instalar extensión del navegador:
- [Chrome](https://chrome.google.com/webstore/detail/vuejs-devtools)
- [Firefox](https://addons.mozilla.org/firefox/addon/vue-js-devtools/)

**Usar:**
- Inspeccionar componentes
- Ver estado de stores
- Timeline de eventos
- Performance profiling

### Console Logging

El cliente API loggea automáticamente en desarrollo:

```typescript
// Logs automáticos en desarrollo
[API Request] GET /v2/members
[API Response] GET /v2/members - Status: 200
```

### Breakpoints

En VS Code:
1. Abrir DevTools del navegador
2. Sources tab
3. Encontrar archivo
4. Agregar breakpoint
5. Recargar página

### Debugging Stores

```typescript
// En componente
const store = useMemberStore()
console.log('Store state:', store.$state)
console.log('Members:', store.members)
```

## Hot Module Replacement (HMR)

Vite soporta HMR automático:
- Cambios en componentes → Actualización instantánea
- Cambios en stores → Recarga de componentes que los usan
- Cambios en CSS → Actualización sin recargar

**Si HMR no funciona:**
- Verificar que el archivo está guardado
- Recargar manualmente el navegador
- Verificar errores en consola

## Troubleshooting Común

### Error: Cannot find module

```bash
# Solución: Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: Port already in use

```bash
# Cambiar puerto en vite.config.ts o matar proceso
lsof -ti:5173 | xargs kill -9
```

### Error: TypeScript errors

```bash
# Verificar tipos
npm run build  # Ejecuta type checking

# Si persiste, verificar tsconfig.json
```

### Error: API connection failed

**Con mocks:**
```env
VITE_USE_MOCKS=true
```

**Sin mocks:**
- Verificar que backend está corriendo
- Verificar `VITE_API_URL` en `.env.local`
- Verificar CORS en backend
- Verificar red en DevTools

### Error: Module not found

```typescript
// ✅ Usar alias @
import Component from '@/shared/components/Component.vue'

// ❌ Evitar rutas relativas largas
import Component from '../../../shared/components/Component.vue'
```

### Error: Component not rendering

- Verificar que componente está importado correctamente
- Verificar que ruta está configurada
- Verificar consola por errores
- Verificar que componente retorna template válido

### Error: Store not reactive

```typescript
// ❌ Malo - Pierde reactividad
const { members } = useMembersStore()

// ✅ Bueno - Mantiene reactividad
const store = useMembersStore()
store.members

// ✅ También bueno - Con storeToRefs
import { storeToRefs } from 'pinia'
const { members } = storeToRefs(useMembersStore())
```

## Performance en Desarrollo

### Optimizaciones Automáticas

- Code splitting con lazy loading
- Tree shaking automático
- Minificación en build

### Verificar Bundle Size

```bash
npm run build
# Revisar output en dist/
```

## Git Workflow

### Branch Naming

```bash
feature/nombre-feature
fix/nombre-fix
refactor/nombre-refactor
```

### Commits

```bash
# Formato: tipo(scope): descripción
git commit -m "feat(members): add member creation form"
git commit -m "fix(api): handle 404 errors correctly"
git commit -m "refactor(stores): simplify member store"
```

**Tipos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `refactor`: Refactorización
- `docs`: Documentación
- `style`: Formato
- `test`: Tests

## Recursos Útiles

### Documentación

- [Vue 3 Docs](https://vuejs.org/)
- [Vite Docs](https://vitejs.dev/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Vue Router Docs](https://router.vuejs.org/)

### Herramientas

- Vue DevTools
- Browser DevTools
- VS Code Extensions:
  - Volar (Vue Language Features)
  - ESLint
  - Prettier

## Referencias

- [Guía de Features](./FEATURES_GUIDE.md)
- [Guía de API](./API_GUIDE.md)
- [Troubleshooting](./ERROR_HANDLING.md)

