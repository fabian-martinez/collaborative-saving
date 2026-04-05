# Roadmap del Proyecto Collaborative Saving

Este documento describe la hoja de ruta estratégica para la evolución de la aplicación, priorizando la estabilidad financiera, la flexibilidad operativa y la escalabilidad multi-fondo.

## 🟢 Corto Plazo (Mes 1-2): Flexibilidad y Estabilización

**Objetivo:** Consolidar el núcleo financiero permitiendo configuraciones dinámicas y puliendo la experiencia del usuario actual.

### 1. Configuración Dinámica (Prioridad Alta)
*   **Finalizar Rama Actual:** Completar la implementación de tipos de préstamos y acciones configurables.
    *   *Backend:* Validar que los nuevos tipos se reflejen correctamente en `CreateStockUseCase` y `CreateLoanUseCase`.
    *   *Frontend:* Terminar la UI de administración para crear/editar estos tipos.
*   **Mejora en Detalles de Acciones:** Implementar la faltante funcionalidad para "entrar los detalles de acciones" (probablemente refiriéndose a metadatos o desglose histórico).

### 2. Roles y Documentación
*   **Rol de Secretario:** Crear un permiso específico que permita subir y gestionar actas de reunión sin acceso total a la tesorería.
*   **Gestión de Archivos:** Implementar subida de PDFs para actas vinculadas a `Meeting` (o su equivalente futuro).

### 3. Refinamiento Operativo
*   **Transición a "Periodos Contables":** Empezar a desacoplar la lógica de "Reunión Física" hacia "Cierre de Periodo" para soportar el modelo asíncrono.
    *   Renombrar conceptualmente en el UI (ej: "Ciclo de Recaudo" en lugar de solo "Reunión").

---

## 🔵 Mediano Plazo (Mes 3-5): Preparación para Escala y Multi-tenancy

**Objetivo:** Preparar la arquitectura para soportar múltiples fondos y mejorar la robustez de los datos.

### 1. Estrategia Multi-tenancy (Crítico)
*   **Diseño de Migración:** Definir estrategia para aislar los datos existentes (ej: asignarles un `fundId` por defecto).
*   **Refactorización de Entidades:** Inyectar `fundId` en todas las entidades principales (`Member`, `Account`, `Operation`, `Loan`, `Stock`).
*   **Middleware de Contexto:** Implementar un interceptor en NestJS que extraiga el fondo activo del token/request y filtre automáticamente las consultas.

### 2. Gestión de Retiros Compleja
*   **Lógica de Liquidación:** Implementar el caso de uso "Retiro Parcial" o "Retiro Diferido" para socios que salen cuando no hay flujo de caja suficiente.
*   **Bloqueo de Fondos:** Asegurar que un socio no pueda retirarse si tiene deuda activa superior a sus ahorros remanentes.

### 3. Mejoras en Tesorería
*   **Arqueo de Caja Digital:** Una vista simple para que el tesorero ingrese "lo que hay en la caja física" y el sistema muestre la diferencia contra el libro mayor.

---

## 🟣 Largo Plazo (Mes 6+): SaaS y Valor Agregado

**Objetivo:** Convertir la aplicación en un servicio gestionado (SaaS) y agregar inteligencia.

### 1. Multi-tenancy Completo (SaaS)
*   **Onboarding de Nuevos Fondos:** Flujo automatizado para crear un nuevo fondo, su primer admin y configuración base.
*   **Panel Super-Admin:** Para gestión global de la plataforma (ver estadísticas de uso de todos los fondos).

### 2. Notificaciones y Automatización
*   **Recordatorios Inteligentes:** Emails/WhatsApp automáticos antes de fechas de corte.
*   **Generación de Extractos:** PDF mensual enviado automáticamente a cada socio.

### 3. Funcionalidades Financieras Avanzadas
*   **Simulador de Crédito:** Herramienta para que el socio vea su tabla de amortización antes de pedir.
*   **Scoring:** Calcular capacidad de endeudamiento basada en historial de ahorro y pago.
