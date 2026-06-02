# Guía de Estilos

## Stack

- **Tailwind CSS v4** — Utility-first CSS framework
- **DaisyUI v5** — Componentes sobre Tailwind
- **Iconoir** — Iconos SVG

Configurado en `src/assets/main.css`:
```css
@import 'tailwindcss';
```

> [!NOTE]
> Para los valores exactos de colores, tipografía y tokens de diseño, ver el **[Design System Global](../design.md)**.

## Tailwind Basics

### Clases Comunes

| Categoría | Ejemplos |
|---|---|
| Espaciado | `p-4`, `m-4`, `gap-4`, `space-y-4` |
| Colores | `bg-base-100`, `text-base-content`, `border-base-300` |
| Tipografía | `text-2xl`, `font-bold`, `text-center` |
| Layout | `flex`, `grid`, `hidden`, `block` |

### Responsive (Mobile First)

```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 1 col mobile, 2 tablet, 3 desktop -->
</div>
```

Breakpoints: `sm:` 640px, `md:` 768px, `lg:` 1024px, `xl:` 1280px, `2xl:` 1536px.

## DaisyUI

### Buttons

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-error">Error</button>
<button class="btn btn-ghost">Ghost</button>
<!-- Tamaños: btn-sm, btn-md, btn-lg -->
```

### Cards

```html
<div class="card bg-base-100 shadow-lg">
  <div class="card-body">
    <h2 class="card-title">Título</h2>
    <p>Contenido</p>
    <div class="card-actions justify-end"><button class="btn btn-primary">Acción</button></div>
  </div>
</div>
```

### Forms

```html
<div class="form-control">
  <label class="label"><span class="label-text">Campo</span></label>
  <input type="text" class="input input-bordered" />
</div>
<select class="select select-bordered">...</select>
```

### Alerts

```html
<div class="alert alert-info"><span>Info</span></div>
<div class="alert alert-success"><span>Éxito</span></div>
<div class="alert alert-warning"><span>Advertencia</span></div>
<div class="alert alert-error"><span>Error</span></div>
```

### Modals

```html
<dialog class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Título</h3>
    <p>Contenido</p>
    <div class="modal-action"><button class="btn">Cerrar</button></div>
  </div>
</dialog>
```

### Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
```

## Iconoir

```vue
<script setup lang="ts">
import { User, Calendar, Plus, CheckCircle } from 'iconoir-vue/regular'
</script>

<template>
  <User class="w-6 h-6" />                     <!-- 24px -->
  <Calendar class="w-5 h-5 text-primary" />     <!-- 20px, color primary -->
</template>
```

Tamaños: `w-4 h-4` (16px), `w-5 h-5` (20px), `w-6 h-6` (24px), `w-8 h-8` (32px).

## Patrones de Layout

### Sidebar + Content

```vue
<div class="flex h-screen bg-base-300">
  <aside class="w-72 bg-base-100"><!-- Sidebar --></aside>
  <main class="flex-1 p-6"><!-- Content --></main>
</div>
```

### Grid de Cards

```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="card bg-base-100 shadow-lg" v-for="item in items" :key="item.id">...</div>
</div>
```

## Reglas

- **Mobile first**: diseñar para mobile, agregar breakpoints para desktop
- **Usar DaisyUI** en vez de recrear componentes (`btn btn-primary`, no `px-4 py-2 bg-blue-500`)
- **Colores del tema**: `bg-base-100`, `bg-primary`, `text-base-content` — no hardcodear colores
- Usar `@apply` en `<style scoped>` solo para estilos muy repetidos
- Clases inline largas → considerar extraer a componente

## Referencias

- [Tailwind CSS](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)
- [Iconoir Icons](https://iconoir.com/)
