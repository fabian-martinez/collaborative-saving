---
name: FondoAhorro Design System
colors:
  light:
    surface: '#fcf8fa'
    surface-dim: '#dcd9db'
    surface-bright: '#fcf8fa'
    surface-container-lowest: '#ffffff'
    surface-container-low: '#f6f3f5'
    surface-container: '#f0edef'
    surface-container-high: '#eae7e9'
    surface-container-highest: '#e4e2e4'
    on-surface: '#1b1b1d'
    on-surface-variant: '#45464d'
    inverse-surface: '#303032'
    inverse-on-surface: '#f3f0f2'
    outline: '#76777d'
    outline-variant: '#c6c6cd'
    surface-tint: '#565e74'
    primary: '#000000'
    on-primary: '#ffffff'
    primary-container: '#131b2e'
    on-primary-container: '#7c839b'
    inverse-primary: '#bec6e0'
    secondary: '#006a61'
    on-secondary: '#ffffff'
    secondary-container: '#86f2e4'
    on-secondary-container: '#006f66'
    tertiary: '#000000'
    on-tertiary: '#ffffff'
    tertiary-container: '#271901'
    on-tertiary-container: '#98805d'
    error: '#F87272'
    on-error: '#ffffff'
    error-container: '#ffdad6'
    on-error-container: '#93000a'
    primary-fixed: '#dae2fd'
    primary-fixed-dim: '#bec6e0'
    on-primary-fixed: '#131b2e'
    on-primary-fixed-variant: '#3f465c'
    secondary-fixed: '#89f5e7'
    secondary-fixed-dim: '#6bd8cb'
    on-secondary-fixed: '#00201d'
    on-secondary-fixed-variant: '#005049'
    tertiary-fixed: '#fcdeb5'
    tertiary-fixed-dim: '#dec29a'
    on-tertiary-fixed: '#271901'
    on-tertiary-fixed-variant: '#574425'
    background: '#fcf8fa'
    on-background: '#1b1b1d'
    surface-variant: '#e4e2e4'
    surface-100: '#FFFFFF'
    surface-200: '#F8FAFC'
    surface-300: '#F1F5F9'
    info: '#3ABFF8'
    success: '#36D399'
    warning: '#FBBD23'
  dark:
    surface: '#131315'
    surface-dim: '#131315'
    surface-bright: '#39393b'
    surface-container-lowest: '#0e0e10'
    surface-container-low: '#1b1b1d'
    surface-container: '#1f1f21'
    surface-container-high: '#2a2a2b'
    surface-container-highest: '#353436'
    on-surface: '#e4e2e4'
    on-surface-variant: '#c6c6cd'
    inverse-surface: '#e4e2e4'
    inverse-on-surface: '#303032'
    outline: '#909097'
    outline-variant: '#45464d'
    surface-tint: '#bec6e0'
    primary: '#bec6e0'
    on-primary: '#283044'
    primary-container: '#0f172a'
    on-primary-container: '#798098'
    inverse-primary: '#565e74'
    secondary: '#6bd8cb'
    on-secondary: '#003732'
    secondary-container: '#29a195'
    on-secondary-container: '#00302b'
    tertiary: '#dec29a'
    on-tertiary: '#3e2d11'
    tertiary-container: '#231500'
    on-tertiary-container: '#957d5a'
    error: '#ffb4ab'
    on-error: '#690005'
    error-container: '#93000a'
    on-error-container: '#ffdad6'
    primary-fixed: '#dae2fd'
    primary-fixed-dim: '#bec6e0'
    on-primary-fixed: '#131b2e'
    on-primary-fixed-variant: '#3f465c'
    secondary-fixed: '#89f5e7'
    secondary-fixed-dim: '#6bd8cb'
    on-secondary-fixed: '#00201d'
    on-secondary-fixed-variant: '#005049'
    tertiary-fixed: '#fcdeb5'
    tertiary-fixed-dim: '#dec29a'
    on-tertiary-fixed: '#271901'
    on-tertiary-fixed-variant: '#574425'
    background: '#131315'
    on-background: '#e4e2e4'
    surface-variant: '#353436'
    surface-100: '#1b1b1d'
    surface-200: '#1f1f21'
    surface-300: '#2a2a2b'
    info: '#3ABFF8'
    success: '#36D399'
    warning: '#FBBD23'
typography:
  display:
    fontFamily: Work Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
  headline-lg:
    fontFamily: Work Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Work Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 1rem
  gutter: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

# Diseño

## Sistema de diseño

Se utiliza **Tailwind CSS v4** junto con **DaisyUI** para una UI consistente y rápida de desarrollar. Los iconos son provistos por **Iconoir**.

## Patrones de componentes

- **Atomic Design (Simplificado):** Shared components (botones, inputs) y feature-specific components.
- **Composables:** Toda la lógica de estado y efectos se extrae a composables de Vue para mayor reusabilidad.

## Principios de UX

- **Mobile First:** La aplicación debe ser usable en dispositivos móviles (donde los socios suelen revisar sus balances).
- **Feedback Inmediato:** Uso de estados de carga y notificaciones (toasts) para acciones del usuario.
- **Validación Proactiva:** Validaciones en el cliente antes de enviar datos al servidor.

## Docs relacionados

- [Usuario objetivo](./target-user.md)
- [Arquitectura](./architecture.md)

### Guías de UI/UX (Frontend)
- [Guía de Estilos y Tema](./frontend/STYLING_GUIDE.md) — Tailwind, DaisyUI, colores.
- [Guía de Componentes](./frontend/COMPONENTS_GUIDE.md) — Uso de componentes UI base.
- [Guía de Formularios](./frontend/FORMS_GUIDE.md) — Manejo de inputs y validaciones de usuario.
- [Manejo de Errores (UX)](./frontend/ERROR_HANDLING.md) — Feedback para acciones fallidas.
- [Convenciones de UI](./frontend/CODING_CONVENTIONS.md) — Convenciones generales en la UI.
- [Índice Frontend](./frontend/README.md) — Directorio completo de documentación frontend.
