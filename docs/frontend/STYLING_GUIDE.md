# Guía de Estilos

## Introducción

Esta guía explica cómo usar Tailwind CSS, DaisyUI e Iconoir en el proyecto para crear interfaces consistentes y modernas.

## Stack de Estilos

- **Tailwind CSS v4**: Utility-first CSS framework
- **DaisyUI v5**: Componentes sobre Tailwind
- **Iconoir**: Librería de iconos SVG

## Tailwind CSS

### Configuración

Tailwind está configurado en `src/assets/main.css`:

```css
@import 'tailwindcss';
```

### Uso Básico

```vue
<template>
  <div class="p-4 bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold text-gray-800">Título</h1>
    <p class="text-gray-600 mt-2">Contenido</p>
  </div>
</template>
```

### Clases Comunes

**Espaciado:**
- `p-4` - padding
- `m-4` - margin
- `gap-4` - gap en flex/grid
- `space-y-4` - espacio vertical entre hijos

**Colores:**
- `bg-white` - fondo blanco
- `text-gray-800` - texto gris oscuro
- `border-gray-300` - borde gris

**Tipografía:**
- `text-2xl` - tamaño de texto
- `font-bold` - peso de fuente
- `text-center` - alineación

**Layout:**
- `flex` - display flex
- `grid` - display grid
- `hidden` - display none
- `block` - display block

### Responsive Design

```vue
<template>
  <!-- Mobile first -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- 1 columna en mobile, 2 en tablet, 3 en desktop -->
  </div>
</template>
```

**Breakpoints:**
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+
- `2xl:` - 1536px+

## DaisyUI

### Componentes Disponibles

DaisyUI proporciona componentes pre-estilizados sobre Tailwind.

#### Buttons

```vue
<template>
  <button class="btn btn-primary">Primary</button>
  <button class="btn btn-secondary">Secondary</button>
  <button class="btn btn-accent">Accent</button>
  <button class="btn btn-error">Error</button>
  <button class="btn btn-ghost">Ghost</button>
  <button class="btn btn-outline">Outline</button>
  
  <!-- Tamaños -->
  <button class="btn btn-sm">Small</button>
  <button class="btn btn-md">Medium</button>
  <button class="btn btn-lg">Large</button>
</template>
```

#### Cards

```vue
<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title">Título</h2>
      <p>Contenido</p>
      <div class="card-actions justify-end">
        <button class="btn btn-primary">Acción</button>
      </div>
    </div>
  </div>
</template>
```

#### Forms

```vue
<template>
  <div class="form-control">
    <label class="label">
      <span class="label-text">Nombre</span>
    </label>
    <input type="text" class="input input-bordered" />
  </div>
  
  <select class="select select-bordered">
    <option>Opción 1</option>
    <option>Opción 2</option>
  </select>
  
  <textarea class="textarea textarea-bordered"></textarea>
</template>
```

#### Alerts

```vue
<template>
  <div class="alert alert-info">
    <span>Mensaje informativo</span>
  </div>
  
  <div class="alert alert-success">
    <span>Operación exitosa</span>
  </div>
  
  <div class="alert alert-warning">
    <span>Advertencia</span>
  </div>
  
  <div class="alert alert-error">
    <span>Error</span>
  </div>
</template>
```

#### Tables

```vue
<template>
  <table class="table table-zebra">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Email</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Juan</td>
        <td>juan@example.com</td>
      </tr>
    </tbody>
  </table>
</template>
```

#### Modals

```vue
<template>
  <dialog class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Título</h3>
      <p>Contenido del modal</p>
      <div class="modal-action">
        <button class="btn">Cerrar</button>
      </div>
    </div>
  </dialog>
</template>
```

#### Badges

```vue
<template>
  <span class="badge badge-primary">Primary</span>
  <span class="badge badge-secondary">Secondary</span>
  <span class="badge badge-success">Success</span>
  <span class="badge badge-warning">Warning</span>
  <span class="badge badge-error">Error</span>
</template>
```

### Tema Personalizado

El tema está configurado en `src/assets/main.css`:

```css
@plugin "daisyui/theme" {
  name: "mytheme";
  default: true;
  --color-primary: oklch(30% 0.1442 303.77);
  --color-secondary: oklch(72% 0.1574 55);
  /* ... más colores ... */
}
```

> [!NOTE]
> Para consultar los valores exactos de los colores primarios, secundarios, neutros y las decisiones de tipografía a nivel global, asegúrate de revisar el **[Design System Global](../design.md)**. No dupliques los colores a menos que estén definidos allí.

## Iconoir

### Instalación y Uso

```vue
<script setup lang="ts">
import { User, Calendar, Bank, Settings } from 'iconoir-vue/regular'
</script>

<template>
  <User class="w-6 h-6" />
  <Calendar class="w-5 h-5 text-primary" />
  <Bank class="w-8 h-8" />
</template>
```

### Iconos Comunes

```typescript
// Navegación
import { Home, User, Database, Calendar, Bank, Book } from 'iconoir-vue/regular'

// Acciones
import { Plus, EditPencil, Trash, Search, Eye } from 'iconoir-vue/regular'

// Estados
import { CheckCircle, WarningTriangle, InfoCircle, X } from 'iconoir-vue/regular'

// Finanzas
import { PiggyBank, Wallet, Bank, CreditCard } from 'iconoir-vue/regular'
```

### Tamaños

```vue
<template>
  <!-- Tamaños comunes -->
  <User class="w-4 h-4" />  <!-- 16px - Muy pequeño -->
  <User class="w-5 h-5" />  <!-- 20px - Pequeño -->
  <User class="w-6 h-6" />  <!-- 24px - Normal -->
  <User class="w-8 h-8" />  <!-- 32px - Grande -->
</template>
```

### Colores

```vue
<template>
  <!-- Con clases de Tailwind -->
  <User class="w-6 h-6 text-primary" />
  <User class="w-6 h-6 text-error" />
  <User class="w-6 h-6 text-base-content/60" />
</template>
```

## Patrones de Diseño

### Layout con Sidebar

```vue
<template>
  <div class="flex h-screen bg-base-300">
    <aside class="w-72 bg-base-100">
      <!-- Sidebar -->
    </aside>
    <main class="flex-1 p-6">
      <!-- Contenido -->
    </main>
  </div>
</template>
```

### Grid de Cards

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="card bg-base-100 shadow-lg" v-for="item in items" :key="item.id">
      <!-- Card content -->
    </div>
  </div>
</template>
```

### Form Layout

```vue
<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title">Formulario</h2>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Campo</span>
        </label>
        <input type="text" class="input input-bordered" />
      </div>
      <div class="card-actions justify-end mt-4">
        <button class="btn btn-primary">Enviar</button>
      </div>
    </div>
  </div>
</template>
```

## Convenciones

### Espaciado Consistente

```vue
<!-- Usar escala de Tailwind -->
<div class="p-2">   <!-- 0.5rem - Muy pequeño -->
<div class="p-4">   <!-- 1rem - Pequeño -->
<div class="p-6">   <!-- 1.5rem - Normal -->
<div class="p-8">   <!-- 2rem - Grande -->
```

### Colores del Tema

```vue
<!-- Usar colores del tema DaisyUI -->
<div class="bg-primary text-primary-content">
<div class="bg-secondary text-secondary-content">
<div class="bg-base-100">  <!-- Fondo de cards -->
<div class="bg-base-200">  <!-- Fondo alternativo -->
<div class="bg-base-300">  <!-- Fondo de página -->
```

### Estados de Componentes

```vue
<!-- Loading -->
<button class="btn btn-primary loading">Cargando</button>

<!-- Disabled -->
<button class="btn btn-primary" disabled>Deshabilitado</button>

<!-- Active -->
<button class="btn btn-active btn-primary">Activo</button>
```

## Best Practices

### 1. Mobile First

```vue
<!-- ✅ Bueno - Mobile first -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

<!-- ❌ Evitar - Desktop first -->
<div class="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
```

### 2. Usar Componentes DaisyUI

```vue
<!-- ✅ Bueno - Usar componente DaisyUI -->
<button class="btn btn-primary">Click</button>

<!-- ❌ Evitar - Crear desde cero -->
<button class="px-4 py-2 bg-blue-500 text-white rounded">Click</button>
```

### 3. Clases Agrupadas Lógicamente

```vue
<!-- ✅ Bueno - Agrupadas -->
<div class="card bg-base-100 shadow-lg p-6">

<!-- ✅ También válido - Separadas por tipo -->
<div class="
  card 
  bg-base-100 
  shadow-lg 
  p-6
">
```

### 4. Evitar Clases Inline Largas

```vue
<!-- ⚠️ Si es muy largo, considerar componente -->
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md border border-gray-200">
  <!-- ... -->
</div>

<!-- ✅ Mejor - Extraer a componente o usar @apply -->
```

### 5. Usar @apply para Estilos Repetidos

```vue
<style scoped>
.card-custom {
  @apply card bg-base-100 shadow-lg p-6;
}
</style>
```

## Custom Utilities

### Agregar Utilidades Personalizadas

Si necesitas utilidades personalizadas, agregarlas en `src/assets/main.css`:

```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

## Referencias

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)
- [Iconoir Icons](https://iconoir.com/)

