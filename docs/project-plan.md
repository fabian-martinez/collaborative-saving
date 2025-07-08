# Plan del Proyecto: Fondo de Ahorro Comunitario

## 1. Introducción

Este documento describe el plan de desarrollo integral para la aplicación de administración del fondo de ahorro comunitario. El objetivo es construir una plataforma robusta, segura y fácil de usar, que abarque tanto la lógica de negocio del backend como una experiencia de usuario (UX) moderna e intuitiva en el frontend, especialmente diseñada para personas con baja alfabetización digital.

**Tecnologías Principales:**
- **Backend**: NestJS
- **Frontend**: Vue 3 (Composition API) con TypeScript
- **Estilos**: TailwindCSS y DaisyUI
- **Base de Datos**: Supabase (PostgreSQL)

## 2. Principios Fundamentales

- **Claridad y Simplicidad**: La interfaz debe ser fácil de entender y navegar. Se priorizará la información relevante y se evitará la sobrecarga visual.
- **Accesibilidad**: Se seguirán las mejores prácticas de accesibilidad (WCAG) para asegurar que la aplicación pueda ser utilizada por todos.
- **Consistencia**: El uso de DaisyUI garantizará una apariencia coherente en todos los componentes y vistas.
- **Enfoque en el Usuario**: Cada elemento de la interfaz debe tener un propósito claro y responder a una necesidad del usuario.
- **Seguridad y Fiabilidad**: Las operaciones del backend deben ser transaccionales, seguras y mantener la integridad de los datos.

## 3. Arquitectura y Estructura

### 3.1. Layout Principal (Frontend)

El layout constará de dos componentes principales que envolverán el contenido de las vistas:

- **Sidebar Lateral (`AppSidebar.vue`)**: Persistente, con la navegación principal organizada en grupos: **Principal**, **Financiera** y **Administración**.
- **Header Superior (`AppHeader.vue`)**: Mostrará el título de la vista actual y un indicador prominente para el estado de las reuniones (activa o inactiva).

### 3.2. Estructura de Rutas (`router/index.ts`)

La estructura de rutas se mantiene según lo planeado originalmente para organizar la navegación del usuario.
*(La definición de rutas se omite aquí por brevedad, pero sigue el plan original).*

## 4. Plan de Implementación por Módulos

### Módulo 1: Estructura y Layout Base (Completado)

-   **Frontend**:
    -   [x] Configurar Vue, Vite, TailwindCSS y DaisyUI.
    -   [x] Crear los componentes `layout/AppSidebar.vue` y `layout/AppHeader.vue`.
    -   [x] Integrar el layout principal en `App.vue`.
    -   [x] Configurar el enrutador con todas las rutas definidas (`router/index.ts`).
-   **Backend**:
    -   [x] Configurar proyecto base de NestJS.

### Módulo 2: Gestión de Socios (Completado)

-   **Frontend**:
    -   [x] `MembersView.vue`: Desarrollar tabla de socios con búsqueda y filtros.
    -   [x] `MemberDetailView.vue`: Crear vista detallada con pestañas para:
        -   Estado de Cuenta.
        -   Acciones del socio.
        -   Historial de préstamos.
-   **Backend**:
    -   [x] Implementar CRUD completo para la entidad `Member`.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas unitarias y de integración para `MembersService`.
    -   [ ] **Frontend**: Añadir pruebas de componentes para las vistas de socios.

### Módulo 3: Gestión de Acciones (Completado)

-   **Frontend**:
    -   [x] `StocksSummaryView.vue`: Crear vista con el resumen del valor actual de cada tipo de acción, un gráfico de distribución y el historial de cambios de valor.
    -   [x] `StockDetailView.vue`: Mostrar los detalles de una acción específica.
-   **Backend**:
    -   [x] Implementar CRUD para `Stock` y `StockSubscription`.
    -   [x] Crear endpoints para obtener el historial de valor (`stock_value_history`).
-   **Otras Tareas**:
    -   [ ] **Refinamiento**: En el detalle de acciones, asegurar que se muestre el **tipo de acción** (ej. Garantizada, Normal).
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para los servicios relacionados con acciones.

### Módulo 4: Proceso de Reuniones (En Progreso)

#### 4.1. Flujo General y Vista Principal

-   **Frontend**:
    -   [x] `MeetingsView.vue`: Implementar historial de reuniones.
    -   [x] `ActiveMeetingView.vue`: Crear la vista principal con un flujo de 4 pasos (Stepper de DaisyUI): Recaudo, Revalorización, Nuevas Operaciones y Desembolsos.
    -   [x] `activeMeeting.ts`: Crear un store de Pinia para gestionar el estado de la reunión activa.
    -   [x] Implementar resumen financiero superior (`Recaudo Total`, `Intereses Generados`, `Efectivo Disponible`).
-   **Backend**:
    -   [x] Implementar endpoint para crear una nueva reunión (`POST /meetings`).
    -   [x] Implementar endpoint para obtener la reunión activa.

#### 4.2. Paso 1: Recaudo de Fondos

-   **Frontend**:
    -   [x] `Step1Collection.vue`: Implementar la vista para el recaudo.
    -   [x] Visualizar las deudas pendientes de cada socio.
    -   [x] Permitir registrar el pago de cuotas, multas, seguros y abonos a préstamos.
    -   [x] Mostrar un resumen del pago antes de confirmar.
    -   [x] Deshabilitar el botón de pago para un socio después de que haya pagado en la reunión actual para evitar duplicados.
-   **Backend**:
    -   [x] `POST /meetings/:id/transactions`: Implementar el endpoint para registrar los pagos de un socio.
    -   [x] Implementar lógica para validar que un socio solo puede realizar su contribución obligatoria una vez por reunión.
-   **Otras Tareas**:
    -   [ ] **Tarea de Validación**: Verificar que al procesar un pago de préstamo, se actualicen correctamente el `outstanding_balance` y se genere el registro de la transacción en el préstamo (`loan_transaction_detail`).
    -   [ ] **Refinamiento**: En el detalle del pago, especificar a qué crédito corresponde el interés y el abono a capital para mayor claridad.
-   **Testing**:
    -   [ ] **Backend**: Crear pruebas unitarias para la lógica de negocio de `recordTransactions`.
    -   [ ] **Frontend**: Crear pruebas para el flujo de pago en `Step1Collection.vue`.

#### 4.3. Paso 2: Revalorización de Activos

-   **Frontend**:
    -   [ ] `Step2Revaluation.vue`: Añadir botón para iniciar el proceso de revalorización.
    -   [ ] Llamar al endpoint del backend y manejar los estados de carga/error.
    -   [ ] Al recibir la respuesta, mostrar un resumen claro con los nuevos valores de las acciones.
-   **Backend**:
    -   [x] `POST /asset-revaluation/:meetingId`: Crear el endpoint para ejecutar la revalorización.
    -   [ ] **Refinar**: Ejecutar toda la lógica dentro de una **transacción atómica** para garantizar la integridad de los datos (BEGIN/COMMIT/ROLLBACK).
    -   [ ] Modificar `AssetRevaluationService` para separar intereses de "préstamos ágiles" y "préstamos normales".
    -   [ ] Implementar la lógica de cobertura donde los intereses de "préstamos ágiles" cubren el rendimiento de acciones garantizadas.
    -   [ ] Calcular y aplicar correctamente el costo de oportunidad (déficit) o el sobrante de los intereses.
    -   [ ] Distribuir los intereses restantes entre las acciones no garantizadas.
    -   [ ] La lógica debe actualizar `stocks` y registrar en `stock_value_history`.
    -   [ ] **Refinar**: Generar los asientos contables de partida doble en `ledger_entries` usando las cuentas `INVERSIONES_EN_ACCIONES` (Débito) y `SUPERAVIT_POR_REVALUACION` (Crédito).
-   **Testing**:
    -   [ ] **Backend**: Crear pruebas unitarias exhaustivas para `AssetRevaluationService`, cubriendo todos los escenarios (con y sin déficit).

#### 4.4. Paso 3: Nuevas Operaciones

-   **Frontend**:
    -   [ ] `Step3Operations.vue`: Implementar la interfaz para solicitar nuevos préstamos o comprar acciones.
-   **Backend**:
    -   [ ] Implementar los endpoints correspondientes para registrar estas nuevas operaciones.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para los servicios de creación de préstamos y compra de acciones.

#### 4.5. Paso 4: Desembolsos

-   **Frontend**:
    -   [ ] `Step4Disbursements.vue`: Mostrar un resumen de los desembolsos a realizar (préstamos aprobados).
-   **Backend**:
    -   [ ] Implementar endpoint para marcar la reunión como completada y registrar los desembolsos.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para el proceso de cierre y desembolso de la reunión.

### Módulo 5: Gestión de Préstamos (Pendiente)

-   **Frontend**:
    -   [ ] `LoansListView.vue`: Crear vista para listar todos los préstamos con su estado.
    -   [ ] `LoanDetailView.vue`: Vista para ver el detalle de un préstamo, incluyendo su historial de pagos.
-   **Backend**:
    -   [ ] Implementar CRUD completo para `Loan`.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas unitarias para `LoansService`.
    -   [ ] **Frontend**: Añadir pruebas para las vistas de lista y detalle de préstamos.

### Módulo 6: Libro Contable (Pendiente)

-   **Frontend**:
    -   [ ] `LedgerView.vue`: Desarrollar una tabla completa con todas las transacciones del fondo.
    -   [ ] Implementar filtros avanzados por fecha, tipo de transacción y socio.
-   **Backend**:
    -   [ ] Implementar endpoint para consultar `ledger_entries` con opciones de filtrado.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para la consulta y filtrado de asientos contables.

### Módulo 7: Administración (Pendiente)

-   **Frontend**:
    -   [ ] `SettingsView.vue`: Formularios para editar parámetros globales (tasa de interés, valor de acción, etc.).
    -   [ ] `FundInfoView.vue`, `DocumentsView.vue`: Desarrollar vistas administrativas.
-   **Backend**:
    -   [ ] Implementar endpoints para gestionar la configuración global del fondo.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para el guardado y recuperación de la configuración.

### Módulo 8: Revisiones Finales (Pendiente)

-   **Otras Tareas**:
    -   [ ] Realizar una revisión completa de la responsividad en dispositivos móviles.
    -   [ ] Realizar pruebas de accesibilidad (navegación por teclado, contraste de colores).
    -   [ ] Refinar la experiencia de usuario basándose en feedback.

### Módulo 9: Validación de Caso de Uso (Pendiente)

-   **Otras Tareas**:
    -   [ ] **Prueba de Aceptación**: Ejecutar y validar el escenario de negocio completo descrito en `docs/business-use-case-scenario.md` para asegurar que todos los cálculos, transacciones y cambios de estado se comportan como se espera de principio a fin.

### Módulo 10: Despliegue a Producción y Estrategia a Futuro (Pendiente)

#### 10.1. Estrategia de Entornos y Autenticación

-   **Backend/DevOps**:
    -   [ ] Definir y documentar la estrategia de entornos (Desarrollo Local vs. Producción en Supabase).
    -   [ ] Crear scripts o un `docker-compose.yml` para levantar una instancia de PostgreSQL local para facilitar el desarrollo.
-   **Backend**:
    -   [ ] Implementar un sistema de autenticación robusto (ej. JWT) para proteger los endpoints.
    -   [ ] Definir e implementar un sistema de roles y permisos (ej. `admin`, `tesorero`, `socio`).
-   **Frontend**:
    -   [ ] Implementar el flujo de login/logout en la UI.
    -   [ ] Crear guardias de ruta (`route guards`) para restringir el acceso a vistas basado en el rol del usuario.

#### 10.2. Plan de Despliegue (Opción Cloud)

-   **Investigación**:
    -   [ ] Investigar y decidir la mejor plataforma de hosting para el backend de NestJS (ej. Fly.io, Render, Heroku, etc.), considerando costo, escalabilidad y facilidad de mantenimiento.
-   **DevOps**:
    -   [ ] Configurar un pipeline de CI/CD (ej. GitHub Actions) para el despliegue automático del frontend a **Firebase Hosting**.
    -   [ ] Documentar el proceso de despliegue y mantenimiento del backend en la plataforma elegida.

#### 10.3. Investigación de Alternativa (Opción Local-First)

-   **Investigación**:
    -   [ ] Investigar arquitecturas y stacks tecnológicos para una versión "offline-first" o "local-first" de la aplicación (ej. Electron, Tauri para el empaquetado; SQLite, PouchDB para la base de datos local).
    -   [ ] Evaluar la viabilidad, ventajas y desventajas (ej. sincronización de datos, mantenimiento) de una versión local en comparación con el modelo cloud.
    -   [ ] Crear un **ADR (Architecture Decision Record)** que resuma los hallazgos y la decisión final sobre la estrategia a largo plazo.









