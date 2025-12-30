# Collaborative Saving - Frontend V2

Frontend moderno para Collaborative Saving construido con Vue 3, TypeScript, y Tailwind CSS. Este frontend utiliza exclusivamente la API V2 y está diseñado siguiendo principios de arquitectura limpia y buenas prácticas.

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+ y npm
- Backend API V2 corriendo (opcional para desarrollo con mocks)

### Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
VITE_API_URL=http://localhost:3000
VITE_USE_MOCKS=true  # Usar mocks para desarrollo sin backend
```

3. **Ejecutar en desarrollo:**
```bash
npm run dev
```

4. **Compilar para producción:**
```bash
npm run build
```

5. **Preview de producción:**
```bash
npm run preview
```

## 📚 Documentación

### Guías Principales

- **[Arquitectura](./docs/ARCHITECTURE.md)** - Arquitectura general, principios y decisiones de diseño
- **[Estructura de Carpetas](./docs/FOLDER_STRUCTURE.md)** - Organización del proyecto y convenciones
- **[Convenciones de Código](./docs/CODING_CONVENTIONS.md)** - Estándares de código y naming

### Guías de Implementación

- **[Guía de Features](./docs/FEATURES_GUIDE.md)** - Cómo crear nuevas features
- **[Guía de Componentes](./docs/COMPONENTS_GUIDE.md)** - Creación y uso de componentes
- **[Guía de Stores](./docs/STORES_GUIDE.md)** - State management con Pinia
- **[Guía de API](./docs/API_GUIDE.md)** - API clients y mocks
- **[Guía de Routing](./docs/ROUTING_GUIDE.md)** - Configuración de rutas
- **[Guía de Composables](./docs/COMPOSABLES_GUIDE.md)** - Lógica reutilizable
- **[Guía de Formularios](./docs/FORMS_GUIDE.md)** - Manejo de formularios

### Guías de Herramientas

- **[Guía de Estilos](./docs/STYLING_GUIDE.md)** - Tailwind CSS, DaisyUI e Iconoir
- **[Guía de Desarrollo](./docs/DEVELOPMENT.md)** - Workflow y setup

### Guías de Calidad

- **[Guía de Testing](./docs/TESTING_GUIDE.md)** - Estrategia de testing
- **[Manejo de Errores](./docs/ERROR_HANDLING.md)** - Estrategia de errores
- **[Performance](./docs/PERFORMANCE.md)** - Optimización y performance

### Proceso

- **[Contribución](./docs/CONTRIBUTING.md)** - Proceso de contribución y PRs
- **[Checklist de Implementación](./docs/IMPLEMENTATION_CHECKLIST.md)** - Checklists para desarrollo

## 🏗️ Estructura del Proyecto

```
frontend-v2/
├── src/
│   ├── api/              # Clientes API (V2)
│   │   ├── client.ts     # Cliente base con interceptores
│   │   ├── *.api.ts      # Clientes por módulo
│   │   └── mocks/        # Datos mock para desarrollo
│   ├── features/         # Features organizadas por dominio
│   │   └── [feature]/
│   │       ├── api/      # API client específico (opcional)
│   │       ├── components/ # Componentes específicos
│   │       ├── stores/    # Stores de Pinia
│   │       └── views/     # Vistas/Pages
│   ├── shared/           # Recursos compartidos
│   │   ├── components/   # Componentes reutilizables
│   │   ├── composables/  # Composables reutilizables
│   │   ├── layout/       # Componentes de layout
│   │   ├── utils/        # Utilidades
│   │   └── types/        # Tipos compartidos
│   ├── router/           # Configuración de rutas
│   ├── App.vue           # Componente raíz
│   └── main.ts           # Entry point
├── docs/                 # Documentación de desarrollo
└── package.json
```

## 🛠️ Tecnologías

- **Vue 3** - Framework con Composition API
- **TypeScript** - Tipado estático
- **Pinia** - State management
- **Vue Router** - Routing con lazy loading
- **Vite** - Build tool y dev server
- **Tailwind CSS v4** - Utility-first CSS
- **DaisyUI** - Componentes sobre Tailwind
- **Iconoir** - Iconos SVG
- **Chart.js + vue-chartjs** - Gráficos
- **Axios** - HTTP client

## ✨ Características Principales

- ✅ **API V2 Only** - Usa exclusivamente endpoints V2
- ✅ **snake_case** - Trabaja directamente con snake_case (sin normalización)
- ✅ **TypeScript** - Tipado completo
- ✅ **Feature-based** - Organización por dominio/feature
- ✅ **Mocks** - Sistema de mocks para desarrollo sin backend
- ✅ **Componentes Reutilizables** - Biblioteca de componentes compartidos
- ✅ **Responsive** - Diseño mobile-first
- ✅ **Accesible** - Componentes accesibles con DaisyUI

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Build
npm run build        # Compila para producción
npm run preview      # Preview de build de producción

# Calidad
npm run lint         # Ejecuta ESLint y corrige errores
```

## 🔌 Endpoints API

El frontend consume los siguientes endpoints:

- **Members**: `/v2/members/*`
- **Meetings**: `/v2/meetings/*`
- **Loans**: `/v2/loans/*`
- **Stocks**: `/v2/stocks/*`
- **Contributions**: `/v2/mandatory-contributions/*`
- **Ledger**: `/ledger-entries/*` (sin V2)

## 🎯 Principios de Diseño

1. **Feature-based Architecture** - Organización por dominio de negocio
2. **Composition over Inheritance** - Uso extensivo de composables
3. **Type Safety** - TypeScript en todo el código
4. **Separation of Concerns** - API, Store, View separados
5. **Reusability** - Componentes y composables reutilizables
6. **Consistency** - Convenciones claras y documentadas

## 🚦 Estado del Proyecto

Este frontend está en desarrollo activo. Consulta la [documentación de desarrollo](./docs/) para más detalles sobre cómo contribuir.

## 📖 Recursos Adicionales

- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [DaisyUI Documentation](https://daisyui.com/)
