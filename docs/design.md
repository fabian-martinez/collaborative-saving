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
