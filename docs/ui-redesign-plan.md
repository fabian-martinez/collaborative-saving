# Plan de Rediseño de Interfaz de Usuario (UI)

## 1. Introducción

Este documento describe el plan para rediseñar la interfaz de usuario de la aplicación de administración del fondo de ahorro comunitario. El objetivo es crear una experiencia de usuario (UX) moderna, intuitiva y accesible, especialmente para personas con baja alfabetización digital.

Utilizaremos **Vue 3 (Composition API)**, **TailwindCSS** y la librería de componentes **DaisyUI** para asegurar una implementación rápida, consistente y mantenible.

## 2. Principios Fundamentales

- **Claridad y Simplicidad**: La interfaz debe ser fácil de entender y navegar. Se priorizará la información relevante y se evitará la sobrecarga visual.
- **Accesibilidad**: Se seguirán las mejores prácticas de accesibilidad (WCAG) para asegurar que la aplicación pueda ser utilizada por todos.
- **Consistencia**: El uso de DaisyUI garantizará una apariencia coherente en todos los componentes y vistas.
- **Enfoque en el Usuario**: Cada elemento de la interfaz debe tener un propósito claro y responder a una necesidad del usuario.

## 3. Arquitectura y Estructura de Rutas

La aplicación se organizará en una estructura modular, con un layout principal persistente y un sistema de rutas semántico.

### 3.1. Layout Principal

El layout constará de dos componentes principales que envolverán el contenido de las vistas:

- **Sidebar Lateral (`components/layout/Sidebar.vue`)**:
  - Será persistente en todas las vistas.
  - Contendrá la navegación principal, organizada en los tres grupos definidos: **Principal**, **Financiera** y **Administración**.
  - Utilizará íconos y texto claro para cada sección.

- **Header Superior (`components/layout/Header.vue`)**:
  - Mostrará el título de la vista actual dinámicamente.
  - Incluirá una imagen decorativa o un banner temático (ej. relacionado con eventos del mes).
  - Presentará un indicador visual prominente si hay una **reunión activa**.
    - **Ejemplo**: Un badge parpadeante con el texto "Reunión Activa" y un botón para "Ir a la Reunión".
  - Si no hay una reunión activa, mostrará un botón para **"Iniciar Nueva Reunión"**.

### 3.2. Estructura de Rutas (`router/index.ts`)

```typescript
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  // --- Grupo: Principal ---
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { title: 'Dashboard' }
  },
  {
    path: '/members',
    name: 'members-list',
    component: () => import('@/views/members/MembersListView.vue'),
    meta: { title: 'Socios' }
  },
  {
    path: '/members/:id',
    name: 'member-detail',
    component: () => import('@/views/members/MemberDetailView.vue'),
    meta: { title: 'Detalle del Socio' }
  },
  {
    path: '/stocks',
    name: 'stocks-summary',
    component: () => import('@/views/stocks/StocksSummaryView.vue'),
    meta: { title: 'Resumen de Acciones' }
  },

  // --- Grupo: Financiera ---
  {
    path: '/meetings',
    name: 'meetings-history',
    component: () => import('@/views/meetings/MeetingsHistoryView.vue'),
    meta: { title: 'Historial de Reuniones' }
  },
  {
    path: '/meetings/active',
    name: 'active-meeting',
    component: () => import('@/views/meetings/ActiveMeetingView.vue'),
    meta: { title: 'Reunión Activa' }
  },
  {
    path: '/loans',
    name: 'loans-list',
    component: () => import('@/views/loans/LoansListView.vue'),
    meta: { title: 'Préstamos' }
  },
  {
    path: '/ledger',
    name: 'ledger',
    component: () => import('@/views/ledger/LedgerView.vue'),
    meta: { title: 'Libro Contable' } // Nombre sugerido para 'Cuentas'
  },

  // --- Grupo: Administración ---
  {
    path: '/fund-info',
    name: 'fund-info',
    component: () => import('@/views/admin/FundInfoView.vue'),
    meta: { title: 'Información del Fondo' }
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('@/views/admin/DocumentsView.vue'),
    meta: { title: 'Documentación' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/admin/SettingsView.vue'),
    meta: { title: 'Configuración' }
  }
];
```

## 4. Diseño de Vistas y Componentes

### 4.1. Dashboard (`/dashboard`)
- **Componentes**: `dashboard/MetricCard.vue`, `dashboard/UpcomingPayments.vue`, `shared/SimpleChart.vue`.
- **Contenido**:
  - Tarjetas (DaisyUI `stats`) para métricas clave: Total en Caja, Nº Socios Activos, Préstamos Activos.
  - Una visualización simple (gráfico de barras o líneas) del crecimiento del fondo.
  - Un panel con los próximos pagos de préstamos.

### 4.2. Socios (`/members` y `/members/:id`)
- **Componentes**: `members/MembersTable.vue`, `members/MemberSummary.vue`, `shared/DataTable.vue`.
- **Contenido**:
  - **`/members`**: Tabla de socios con búsqueda y filtros. La tabla mostrará nombre, estado y un botón para ver detalles.
  - **`/members/:id`**: Vista detallada con el perfil del socio. Se usarán pestañas (DaisyUI `tabs`) para mostrar:
    - **Estado de Cuenta**: Resumen de todos sus aportes y deudas.
    - **Acciones**: Cantidad y tipo de acciones que posee.
    - **Préstamos**: Historial de préstamos solicitados.

### 4.3. Acciones (`/stocks`)
- **Componentes**: `stocks/StockDistributionChart.vue`, `stocks/StockValueHistory.vue`.
- **Contenido**:
  - Un resumen del valor actual de cada tipo de acción.
  - Un gráfico que muestre la distribución de acciones entre los socios.
  - Una tabla con el historial de cambios en el valor de las acciones.

### 4.4. Libro Contable (`/ledger`)
- **Componentes**: `ledger/TransactionsTable.vue`, `shared/FilterControls.vue`.
- **Contenido**:
  - Una tabla completa con todas las transacciones del fondo (ingresos y egresos).
  - Filtros por fecha, tipo de transacción (aporte, préstamo, multa, etc.) y socio.
  - La vista debe ser clara, similar a un extracto bancario.

### 4.5. Administración (`/settings`)
- **Componentes**: `settings/ParameterForm.vue`.
- **Contenido**:
  - Formularios para editar parámetros globales del fondo, como:
    - Valor de la acción.
    - Tasa de interés para préstamos.
    - Monto de cuotas obligatorias (ej. fondo social).
  - Cada parámetro debe tener una descripción clara de su función.

## 5. Plan de Implementación (Checklist)

1.  [x] **Fase 1: Estructura y Layout Base**
    - [x] Configurar TailwindCSS y DaisyUI en el proyecto.
    - [x] Crear los componentes `layout/Sidebar.vue` y `layout/Header.vue`.
    - [x] Integrar el layout principal en `App.vue`.
    - [x] Configurar el enrutador con todas las rutas definidas (`router/index.ts`).

2.  [x] **Fase 2: Módulo Principal**
    - [x] Desarrollar la vista `DashboardView.vue` con sus componentes de métricas.
    - [x] Implementar la vista de lista de socios (`MembersListView.vue`) con una tabla de datos.
    - [x] Crear la vista de detalle de socio (`MemberDetailView.vue`) con pestañas.
    - [x] Construir la vista de resumen de acciones (`StocksSummaryView.vue`).
    - [x] Crear la vista de detalle de acción (`StockDetailView.vue`).

3.  [ ] **Fase 3: Módulo Financiero**
    - [x] Crear la vista de historial de reuniones (`MeetingsView.vue`).
    - [x] Implementar la vista de reunión activa (`ActiveMeetingView.vue`) con un flujo de pasos (Stepper).
        - [x] La vista guiará al usuario a través de 4 etapas: Recaudo, Revalorización, Nuevas Operaciones y Desembolsos.
        - [x] Se mostrará un resumen financiero en la parte superior, incluyendo "Recaudo Total", "Intereses Generados" y un nuevo indicador de "Efectivo Disponible". Este último se actualizará dinámicamente a lo largo de los pasos de la reunión para reflejar el dinero real en caja.
        - [x] Se crearán componentes dedicados para cada etapa (e.g., `Step1Collection.vue`, `Step2Revaluation.vue`, etc.).
        - [x] Se utilizará un store de Pinia (`activeMeeting.ts`) para gestionar el estado de la reunión activa a través de los pasos.
    - [X] Implementar la vista de recaudo de fondos (`Step1Collection.vue`).
      - [x] Implementar la visualización de las deudas por pagar de los socios.
      - [x] Implementar la edición abono a capital y incluir multa.
      - [x] Implementar el pago de las obligaciones de los socios.
      - [x] Implementar resumen del pago de las obligaciones de los socios.
      - [x] Limitar a un pago por socio por reunión.
    - [ ] Implementar la vista de revalorización de activos (`Step2Revaluation.vue`).
      - [ ] **Backend**: Crear endpoint `POST /meetings/active/revaluate-assets`.
      - [ ] **Backend**: Implementar la lógica de cálculo de revalorización en `MeetingsService` dentro de una transacción de base de datos.
      - [ ] **Backend**: La lógica debe actualizar `stocks`, registrar en `stock_value_history` y crear los asientos en `ledger_entries`.
      - [ ] **Frontend**: Añadir botón en `Step2Revaluation.vue` para iniciar el proceso.
      - [ ] **Frontend**: Llamar al nuevo endpoint y manejar estados de carga y error.
      - [ ] **Frontend**: Mostrar un resumen con los resultados (nuevos valores de acciones) al recibir la respuesta.
    - [ ] Implementar la vista de nuevas operaciones (`Step3NewOperations.vue`).
    - [ ] Implementar la vista de desembolsos (`Step4Disbursements.vue`).
    - [x] Crear la vista de detalle de reunión (`MeetingDetailView.vue`) como un resumen de solo lectura para reuniones completadas.
    - [ ] Implementar la vista de préstamos (`LoansListView.vue`).
    - [ ] Crear la vista del libro contable (`LedgerView.vue`) con filtros avanzados.

4.  [ ] **Fase 4: Módulo de Administración y Revisiones Finales**
    - [ ] Desarrollar las vistas de `FundInfoView`, `DocumentsView` y `SettingsView`.
    - [ ] Realizar una revisión completa de la responsividad en dispositivos móviles.
    - [ ] Realizar pruebas de accesibilidad (navegación por teclado, contraste de colores).
    - [ ] Refinar la experiencia de usuario basándose en feedback inicial.

## 6. Plan de Implementación de Validación de Recaudo Único

Para asegurar que un socio solo pueda realizar su contribución obligatoria una vez por reunión, se deben implementar cambios tanto en el backend como en el frontend.

### Backend (API - NestJS)

1.  **Modificar `MeetingsService`:** En el archivo `backend/src/meetings/meetings.service.ts`, dentro del método `recordTransactions`.
2.  **Añadir Lógica de Validación:** Antes de procesar y guardar las transacciones, se debe verificar si ya existe una contribución para el `memberId` en la reunión activa (`meetingId`).
3.  **Consulta de Verificación:** Realizar una consulta a la base de datos para buscar un `LedgerEntry` con la cuenta `MANDATORY_CONTRIBUTION_INCOME_ACCOUNT` que esté asociado a una `Operation` del socio en la reunión actual.
4.  **Manejo de Duplicados:** Si la consulta encuentra un registro, el servicio debe lanzar una excepción `BadRequestException` (HTTP 400) con un mensaje claro, por ejemplo: "El socio ya ha realizado la contribución obligatoria para esta reunión."

### Frontend (UI - Vue.js)

1.  **Manejo de Errores:** El componente encargado de realizar el pago (probablemente en `app/src/features/meetings/views/`) debe ser capaz de capturar y manejar el error 400 que la API devolverá en caso de un pago duplicado.
2.  **Notificación al Usuario:** Al recibir este error, la interfaz debe mostrar un mensaje informativo y amigable al usuario (ej: "Este socio ya ha realizado el pago de la cuota obligatoria.").
3.  **Prevención Visual:** Después de que un socio realice un pago de forma exitosa, la interfaz debería deshabilitar el botón de pago o proveer una indicación visual clara (ej: un checkmark o un texto "Pagado") para evitar que el usuario intente registrar el pago nuevamente en la misma sesión. 