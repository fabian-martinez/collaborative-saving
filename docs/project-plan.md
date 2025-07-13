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

### Módulo 0: Refactor de Asientos Contables (Completado Parcial)

**Objetivo**: Mejorar la trazabilidad y auditabilidad del sistema incluyendo la entidad afectada en cada asiento contable.

-   **Backend**:
    -   [x] **Decisión de Arquitectura**: Se ha decidido implementar la **Opción A (Campos Específicos)** para incluir las entidades afectadas en cada asiento contable.
    -   [x] **Migración de Base de Datos**: Actualizar el script `supabase/migrations/0001_initial_tables.sql` para incluir los nuevos campos opcionales en la tabla `ledger_entries`:
        -   `member_id` (UUID, nullable): Referencia al socio afectado
        -   `loan_id` (UUID, nullable): Referencia al préstamo afectado
        -   `stock_id` (UUID, nullable): Referencia a la acción afectada
        -   `mandatory_contribution_id` (UUID, nullable): Referencia a la contribución obligatoria
        -   `stock_subscription_id` (UUID, nullable): Referencia a la suscripción de acción
    -   [x] **Actualización de Entidad**: Modificar `LedgerEntry` para incluir las nuevas propiedades y relaciones opcionales.
    -   [x] **Refactorización de Servicios**: Actualizar los servicios que crean asientos contables para incluir las entidades afectadas:
        -   [x] `MeetingsService` (pagos de socios)
        -   [x] `AssetRevaluationService` (revalorización de acciones)
        -   [x] `LoansService` (desembolsos y pagos de préstamos)
        -   [ ] `OperationsService` (compra de acciones)
    -   [x] **Datos de Ejemplo**: Actualizar `supabase/scripts/seed_database_data.sql` para incluir las entidades afectadas en los asientos contables existentes.

> **Nota:** La trazabilidad de entidades afectadas en los asientos contables ya está implementada para los servicios principales del sistema. Solo queda pendiente la compra de acciones en `OperationsService`.

**Beneficios Esperados**:
- **Trazabilidad Completa**: Cada asiento contable tendrá un vínculo directo con la entidad que lo origina
- **Auditoría Granular**: Posibilidad de generar reportes detallados por socio, préstamo, acción, etc.
- **Reconciliación Automática**: Verificación automática de que los saldos contables coincidan con los saldos reales
- **Reportes Especializados**: Estados de cuenta individuales, historiales de préstamos, evolución de acciones

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
    -   [ ] **Nuevo**: Modificar la entidad `Stock` y la base de datos para soportar diferentes comportamientos (ej. `CAPITAL_APPRECIATION` vs `DIVIDEND_YIELD`) y un valor base, según ADR-0006.
    -   [ ] **Nuevo**: Implementar migración de BD para cambiar `stock_subscriptions.quantity` a un tipo `NUMERIC` de alta precisión para soportar **acciones fraccionadas**.
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
    -   [ ] **Nuevo**: Modificar la lógica de cálculo de cuotas para que **no se exija contribución** sobre el capital que un socio ya ha solicitado retirar (marcado en `pending_member_payments`).
-   **Otras Tareas**:
    -   [ ] **Tarea de Validación**: Verificar que al procesar un pago de préstamo, se actualicen correctamente el `outstanding_balance` y se genere el registro de la transacción en el préstamo (`loan_transaction_detail`).
    -   [ ] **Refinamiento**: En el detalle del pago, especificar a qué crédito corresponde el interés y el abono a capital para mayor claridad.
-   **Testing**:
    -   [ ] **Backend**: Crear pruebas unitarias para la lógica de negocio de `recordTransactions`.
    -   [ ] **Frontend**: Crear pruebas para el flujo de pago en `Step1Collection.vue`.

#### 4.3. Paso 2: Revalorización de Activos

-   **Frontend**:
    -   [x] `Step2Revaluation.vue`: Al entrar a este paso, llamar automáticamente al endpoint de previsualización (`GET .../revaluation/preview`).
    -   [x] Mostrar un resumen detallado con los resultados de la previsualización:
        -   Total de intereses y contribuciones a distribuir.
        -   Tabla con el valor anterior, el crecimiento desglosado y el nuevo valor para cada tipo de acción.
    -   [x] Añadir un botón claro y visible para "Confirmar y Ejecutar Revalorización".
    -   [x] Al hacer clic, llamar al endpoint de ejecución (`POST .../revaluation`) y manejar los estados de carga/éxito/error.

-   **Backend**:
    -   [x] `GET /asset-revaluation/:meetingId/preview`: Crear endpoint que calcula la revalorización sin persistir cambios.
    -   [x] `POST /asset-revaluation/:meetingId`: Crear el endpoint para ejecutar y persistir la revalorización.
    -   [ ] **Detalle de Tareas de Implementación**:
        -   [x] Envolver la lógica de `executeRevaluation` en una **transacción de base de datos** para asegurar la atomicidad.
        -   [ ] **Refactorizar `AssetRevaluationService`**:
            -   [ ] La lógica debe manejar diferentes comportamientos de acciones (ver ADR-0006). Para acciones `DIVIDEND_YIELD`, calcular ganancias y generar "dividendos pendientes".
            -   [ ] **Implementar lógica de revalorización justa**: La tasa de crecimiento por rendimientos se calcula sobre el capital *inicial* del período. Las ganancias se distribuyen, y solo después se suman las contribuciones de la reunión actual para obtener el capital final de cada socio.
        -   [x] Por cada tipo de acción cuyo valor cambie, actualizar su `current_value` en la tabla `stocks` y crear un nuevo registro en `stock_value_history`.
        -   [x] Generar los asientos contables de partida doble en `ledger_entries` para reflejar la revalorización total o la generación de dividendos.
-   **Testing**:
    -   [ ] **Backend**: Crear pruebas unitarias exhaustivas para `AssetRevaluationService`, cubriendo:
        -   [ ] Escenario con superávit (intereses cubren y sobran).
        -   [ ] Escenario con déficit (intereses no alcanzan a cubrir).
        -   [ ] Escenario exacto (intereses cubren justo lo necesario).

#### 4.4. Paso 3: Nuevas Operaciones

-   **Frontend**:
    -   [x] `Step3Operations.vue`: Implementar el flujo completo para la compra de acciones durante la reunión.
        -   [x] Permitir seleccionar un miembro existente o registrar un nuevo miembro en el mismo flujo (el alta de miembro se registra como operación de la reunión).
        -   [x] Mostrar todos los tipos de acción disponibles, con el valor actualizado tras la revalorización (Paso 2) y acceso al histórico de valores.
        -   [x] Formulario para ingresar la cantidad de acciones (solo números enteros) y el método de pago: efectivo, crédito o mixto (con soporte para decimales).
        -   [x] Si la compra es a crédito (total o parcial), calcular y mostrar el interés fijo (2%) y registrar el crédito asociado.
        -   [x] Validar que la suma de efectivo y crédito coincida con el total de la compra.
        -   [x] Al registrar una compra, agregarla a un resumen temporal (recibo), permitiendo editar o anular compras antes de avanzar al siguiente paso.
        -   [x] Si el usuario avanza y luego regresa, mostrar las compras ya hechas y permitir agregar nuevas o modificar existentes.
        -   [x] Actualizar en tiempo real el efectivo disponible en la reunión con las compras en efectivo.
        -   [x] El resumen de compras solo es visible para el administrador.
        -   [x] Feedback claro de éxito/error y loaders durante las operaciones.
        -   [x] Etiqueta visual "Pendiente" para miembros con compras en proceso no confirmadas.
-   **Backend**:
    -   [x] **Detalle de Tareas de Implementación**:
        -   [x] Endpoint para registrar la compra de acciones durante la reunión: `POST /meetings/:meetingId/buy/stocks`
            -   [x] Validar que la cantidad de acciones sea un número entero positivo.
            -   [x] Registrar la operación y actualizar la suscripción de acciones del socio.
            -   [x] Si la compra es a crédito (total o parcial), crear el crédito asociado con interés fijo del 2% (sin plazo/cuota mínima).
            -   [x] Registrar los asientos contables correspondientes (compra de acciones y, si aplica, creación del crédito).
            -   [x] Actualizar el efectivo disponible en la reunión con los pagos en efectivo.
        -   [x] Endpoint para consultar el resumen de compras realizadas en la reunión actual, agrupadas por socio.
-   **Testing**:
    -   [ ] **Backend**: Añadir pruebas para la lógica de compra de acciones, registro de nuevos miembros y generación de créditos asociados.
    -   [ ] **Frontend**: Añadir pruebas de componentes para el flujo de compra, edición y anulación de operaciones en `Step3Operations.vue`.

#### 4.5. Proceso de Desembolso: Previsualización y Ejecución Atómica

-   **Backend**:
    -   [x] **Migración de BD**: Crear tabla `pending_member_payments` para registrar solicitudes de liquidez de socios (dividendos, retiros de acciones incompletos).
    -   [x] **Nuevo**: Refactorizar el proceso de desembolso para separar claramente la previsualización y la ejecución atómica del plan de desembolso:
        -   [x] **Endpoint de Previsualización**: `GET /meetings/:id/disbursement-plan/preview`.
            -   Calcula y devuelve un **plan de desembolso recomendado** siguiendo la cola de prioridad definida en ADR-0006 (deudas antiguas, dividendos, préstamos, retiros, etc.).
            -   No realiza ningún cambio en la base de datos.
        -   [X] **Endpoint de Ejecución**: `POST /meetings/:id/disbursement-plan/execute`.
            -   Recibe el plan final (puede ser el recomendado o uno ajustado por el administrador).
            -   Valida que el plan no exceda el efectivo disponible y ejecuta **todas las operaciones de desembolso de forma atómica** (en una sola transacción):
                -   Actualiza entidades (`Loan.disbursed_amount`, `pending_member_payments`, etc.).
                -   Genera los asientos contables correspondientes.
                -   Actualiza los estados de préstamos, retiros y dividendos según corresponda.
            -   Si ocurre un error, la transacción se revierte y no se aplican cambios parciales.
        -   [x] **Nota**: No se separan endpoints por tipo de operación (retiros, préstamos, dividendos) para garantizar que la lógica de prioridad y la integridad de los fondos se mantengan centralizadas y atómicas, evitando inconsistencias y errores de negocio.
-   **Frontend**:
    -   [ ] Al cargar, llamar al endpoint de previsualización para mostrar el plan recomendado.
    -   [ ] **Implementar UI de Desembolso Flexible**:
        -   Mostrar claramente el efectivo disponible vs. el total a desembolsar en el plan.
        -   Permitir al administrador **editar los montos** del plan recomendado.
        -   Validar en tiempo real que las ediciones no superen el efectivo disponible.
    -   [ ] Implementar el botón "Confirmar y Finalizar Reunión" que envía el plan final (editado o no) al backend.
    -   [ ] Actualizar la navegación y el stepper para reflejar el nuevo orden de los pasos (`Step1Collection.vue`, `Step2Revaluation.vue`, `Step3BuyStocks.vue`, `Step4StockModification.vue`, `Step5Disbursements.vue`).
    -   [ ] Actualizar el servicio de API para soportar el cambio de `step`.
    -   [ ] Actualizar el store de reunión activa y la navegación para soportar el nuevo flujo.
    -   [ ] Validar reglas de negocio para avanzar entre pasos.
-   **Testing**:
    -   [ ] Añadir pruebas unitarias y de integración para la funcionalidad de desembolso y cierre de reunión en backend y frontend.

#### 4.6. Step de Modificación de Acciones (`modificacion_acciones`)

-   **Backend**:
    -   [ ] Implementar endpoints y lógica para el nuevo step `modificacion_acciones`:
        -   [ ] Registrar modificaciones/intercambios de acciones entre miembros.
        -   [ ] Permitir cruzar acciones con créditos (incluyendo lógica contable).
-   **Frontend**:
    -   [ ] Actualizar el servicio de API para soportar los nuevos endpoints de modificación de acciones.
    -   [ ] Renombrar `Step4Disbursements.vue` a `Step5Disbursements.vue`.
    -   [ ] Crear el step `modificacion_acciones` en el frontend.
    -   [ ] Crear la vista/componente para el step `modificacion_acciones`:
        -   [ ] Formulario para seleccionar miembros, acciones a intercambiar o cruzar con créditos.
        -   [ ] Resumen y confirmación de modificaciones.
-   **Testing**:
    -   [ ] Añadir pruebas unitarias y de integración para la lógica de modificación de acciones en backend y frontend.

### Módulo 5: Gestión de Préstamos (Pendiente)

-   **Front end**:
    -   [ ] `LoansListView.vue`: Crear vista para listar todos los préstamos con filtros por estado y socio.
    -   [ ] `LoanDetailView.vue`: Vista para ver el detalle de un préstamo, su tabla de amortización y el historial de pagos.
-   **Backend**:
    -   [ ] **Detalle de Tareas de Implementación**:
        -   [ ] **Nuevo**: Modificar la entidad `Loan` y la base de datos para diferenciar entre `approved_amount` y `disbursed_amount`.
        -   [ ] Implementar `GET /loans` con filtrado y paginación.
        -   [ ] Implementar `GET /loans/:id` que devuelva el detalle completo.
        -   [ ] Implementar `PATCH /loans/:id` para ajustes administrativos (ej. condonar intereses, reestructurar).
        -   [ ] **Refactorizar `LoanTransactionsService` para que todas las transacciones de préstamos (abonos, pagos de interés, etc.) se asocien a una reunión activa.**
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