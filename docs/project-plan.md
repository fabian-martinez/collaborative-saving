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
    -   [ ] Al recibir la respuesta, mostrar un resumen claro con los nuevos valores de las acciones y el superávit o déficit generado.
-   **Backend**:
    -   [x] `POST /asset-revaluation/:meetingId`: Crear el endpoint para ejecutar la revalorización.
    -   [ ] **Detalle de Tareas de Implementación**:
        -   [ ] Envolver toda la lógica de `AssetRevaluationService` en una **transacción de base de datos** para asegurar la atomicidad (ej. usando `@Transactional()` de TypeORM o similar).
        -   [ ] Modificar la consulta de intereses para obtener por separado los generados por "préstamos ágiles" y "préstamos normales".
        -   [ ] Implementar la lógica de cobertura: los intereses de "préstamos ágiles" deben cubrir el rendimiento esperado de las acciones de tipo "Garantizada".
        -   [ ] Calcular el déficit (costo de oportunidad) si los intereses no son suficientes, o el sobrante si exceden la cobertura.
        -   [ ] Distribuir los intereses restantes (o el déficit) de forma ponderada entre las acciones no garantizadas ("Normales").
        -   [ ] Por cada tipo de acción cuyo valor cambie, actualizar su `current_value` en la tabla `stocks` y crear un nuevo registro en `stock_value_history`.
        -   [ ] Generar los asientos contables de partida doble en `ledger_entries` para reflejar la revalorización total, usando las cuentas `INVERSIONES_EN_ACCIONES` (Débito por el aumento de valor) y `SUPERAVIT_POR_REVALUACION` (Crédito).
-   **Testing**:
    -   [ ] **Backend**: Crear pruebas unitarias exhaustivas para `AssetRevaluationService`, cubriendo:
        -   [ ] Escenario con superávit (intereses cubren y sobran).
        -   [ ] Escenario con déficit (intereses no alcanzan a cubrir).
        -   [ ] Escenario exacto (intereses cubren justo lo necesario).

#### 4.4. Paso 3: Nuevas Operaciones

-   **Frontend**:
    -   [ ] `Step3Operations.vue`: Implementar formularios para solicitar nuevos préstamos o comprar acciones.
    -   [ ] Validar las solicitudes en la UI (ej. que no se pida más del efectivo disponible).
-   **Backend**:
    -   [ ] **Detalle de Tareas de Implementación**:
        -   [ ] Crear DTOs específicos: `RequestLoanDto` y `BuyStockDto`.
        -   [ ] Implementar endpoint `POST /meetings/:id/operations/loans` que cree un nuevo préstamo con estado `PENDING_DISBURSEMENT`.
        -   [ ] Implementar endpoint `POST /meetings/:id/operations/stocks` que cree una nueva suscripción de acciones para el socio.
        -   [ ] Realizar validaciones de negocio: el socio debe tener capacidad de endeudamiento, el fondo debe tener liquidez, etc.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para los servicios de creación de préstamos y compra de acciones durante la reunión.

#### 4.5. Paso 4: Desembolsos

-   **Frontend**:
    -   [ ] `Step4Disbursements.vue`: Mostrar un resumen de los desembolsos a realizar y un botón para finalizar la reunión.
-   **Backend**:
    -   [ ] **Detalle de Tareas de Implementación**:
        -   [ ] Implementar endpoint `POST /meetings/:id/complete` para cerrar la reunión.
        -   [ ] El servicio debe cambiar el estado de la reunión a `COMPLETED`.
        -   [ ] Actualizar el estado de los préstamos de `PENDING_DISBURSEMENT` a `ACTIVE`.
        -   [ ] Generar los asientos contables en `ledger_entries` para la salida de efectivo por los desembolsos de préstamos.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para el proceso de cierre y desembolso de la reunión.

### Módulo 5: Gestión de Préstamos (Pendiente)

-   **Frontend**:
    -   [ ] `LoansListView.vue`: Crear vista para listar todos los préstamos con filtros por estado y socio.
    -   [ ] `LoanDetailView.vue`: Vista para ver el detalle de un préstamo, su tabla de amortización y el historial de pagos.
-   **Backend**:
    -   [ ] **Detalle de Tareas de Implementación**:
        -   [ ] Implementar `GET /loans` con filtrado y paginación.
        -   [ ] Implementar `GET /loans/:id` que devuelva el detalle completo.
        -   [ ] Implementar `PATCH /loans/:id` para ajustes administrativos (ej. condonar intereses, reestructurar).
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas unitarias para `LoansService`.
    -   [ ] **Frontend**: Añadir pruebas para las vistas de lista y detalle de préstamos.

### Módulo 6: Libro Contable (Pendiente)

-   **Frontend**:
    -   [ ] `LedgerView.vue`: Desarrollar una tabla completa con todas las transacciones, con paginación.
    -   [ ] Implementar filtros por rango de fechas, tipo de cuenta, socio y tipo de transacción.
-   **Backend**:
    -   [ ] **Detalle de Tareas de Implementación**:
        -   [ ] Implementar `GET /ledger-entries` con parámetros de consulta para `startDate`, `endDate`, `accountId`, `memberId`.
        -   [ ] Optimizar la consulta para manejar grandes volúmenes de datos de forma eficiente.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para la consulta y filtrado de asientos contables.

### Módulo 7: Administración (Pendiente)

-   **Frontend**:
    -   [ ] `SettingsView.vue`: Formularios para editar parámetros globales del fondo.
    -   [ ] `FundInfoView.vue`, `DocumentsView.vue`: Desarrollar las vistas administrativas estáticas.
-   **Backend**:
    -   [ ] **Detalle de Tareas de Implementación**:
        -   [ ] Crear una entidad `Configuration` para almacenar parámetros clave-valor.
        -   [ ] Implementar endpoints `GET /configuration` y `PATCH /configuration` para gestionar los ajustes.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para el guardado y recuperación de la configuración.

### Módulo 8: Revisiones Finales (Pendiente)

-   **Otras Tareas**:
    -   [ ] Realizar una revisión completa de la responsividad en tablets y móviles.
    -   [ ] Realizar pruebas de accesibilidad con herramientas como Lighthouse y navegación por teclado.
    -   [ ] Crear una sesión de "User Acceptance Testing" (UAT) con usuarios finales para obtener feedback.

### Módulo 9: Validación de Caso de Uso (Pendiente)

-   **Otras Tareas**:
    -   [ ] **Prueba de Aceptación End-to-End**:
        -   [ ] **Paso 1**: Seguir el documento `docs/business-use-case-scenario.md` y ejecutar cada paso manualmente en la aplicación.
        -   [ ] **Paso 2**: En cada paso (recaudo, revalorización, etc.), verificar que los saldos, estados y resúmenes en la UI coincidan con los cálculos del escenario.
        -   [ ] **Paso 3**: Al final del ciclo, comprobar que los balances de los socios y los estados financieros del fondo son los correctos.

### Módulo 10: Despliegue a Producción y Estrategia a Futuro (Pendiente)

#### 10.1. Estrategia de Entornos y Autenticación

-   **Backend/DevOps**:
    -   [ ] Crear un `docker-compose.yml` que defina los servicios `postgres` y `backend`, permitiendo levantar el entorno local con un solo comando.
-   **Backend**:
    -   [ ] **Detalle de Tareas de Implementación - Autenticación**:
        -   [ ] Integrar `passport.js` con `passport-jwt` para manejar la autenticación por token.
        -   [ ] Crear endpoints `/auth/login`, `/auth/register` (opcional) y `/auth/profile`.
        -   [ ] Implementar un sistema de roles (`admin`, `member`) en la entidad `User`.
        -   [ ] Crear un `RolesGuard` personalizado para proteger endpoints específicos según el rol del usuario.
-   **Frontend**:
    -   [ ] Implementar el formulario de login y el almacenamiento seguro del token (ej. en una cookie httpOnly).
    -   [ ] Crear guardias de ruta (`route guards`) en Vue Router para proteger vistas.

#### 10.2. Plan de Despliegue (Opción Cloud)

-   **Investigación**:
    -   [ ] Investigar y decidir la mejor plataforma de hosting para el backend de NestJS (ej. Fly.io, Render, Heroku, etc.), considerando costo, escalabilidad y facilidad de mantenimiento.
-   **DevOps**:
    -   [ ] Configurar un pipeline de CI/CD (ej. GitHub Actions) para el despliegue automático del frontend a **Firebase Hosting**.
    -   [ ] Documentar el proceso de despliegue y mantenimiento del backend en la plataforma elegida.

#### 10.3. Estrategia Futura: Opción Local-First

-   **Estrategia**:
    -   [x] Se ha diseñado un plan detallado para una versión "offline-first" o "local-first" de la aplicación, que puede ser consultada como una posible evolución futura del proyecto. Ver `docs/run-local-plan.md` para más detalles.
    -   [ ] **ADR (Architecture Decision Record)**: Cuando se decida proceder con esta versión, se creará un ADR que formalice la decisión y el plan de migración.

### Módulo 11: Preparación para Open Source (Pendiente)

Este módulo se enfoca en las tareas necesarias para que el proyecto pueda ser liberado como código abierto en el futuro, facilitando que otras comunidades puedan adoptarlo y contribuir.

#### 11.1. Documentación para la Comunidad

-   **Otras Tareas**:
    -   [ ] Crear un `README.md` de alto nivel en la raíz del proyecto que explique la misión del proyecto, cómo empezar y la estructura general.
    -   [ ] Redactar una guía para contribuidores (`CONTRIBUTING.md`) con instrucciones sobre cómo configurar el entorno de desarrollo, el flujo de trabajo para proponer cambios (pull requests) y los estándares de código.
    -   [ ] Añadir un Código de Conducta (`CODE_OF_CONDUCT.md`) para fomentar una comunidad colaborativa y respetuosa.
    -   [ ] Investigar y decidir una licencia de software de código abierto (ej. MIT, AGPL, etc.) y añadir el archivo `LICENSE` al repositorio.

#### 11.2. Facilidad de Configuración y Despliegue

-   **DevOps**:
    -   [ ] Asegurar que todas las claves (API, base de datos, JWT) se gestionen a través de variables de entorno.
    -   [ ] Crear y documentar un archivo `.env.example` para el backend y el frontend.
    -   [ ] Refinar el `docker-compose.yml` para que sea parametrizable y fácil de usar por nuevos contribuidores.

#### 11.3. Calidad del Código y Automatización

-   **Testing**:
    -   [ ] Establecer un objetivo de cobertura de pruebas (ej. >80%) para el código del backend, garantizando la fiabilidad.
    -   [ ] Configurar el pipeline de CI (GitHub Actions) para que ejecute automáticamente las pruebas y el linter en cada `pull request` para mantener la calidad del código.









