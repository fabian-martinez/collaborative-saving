# 📝 Plan de Implementación Detallado: Módulo de Transacciones por Reunión

Este documento desglosa el plan para refactorizar y construir la lógica de negocio principal de la aplicación, centrada en el concepto de "reuniones".

**Estado actual:** Todos los flujos iniciales (1-6) han sido implementados. Pendiente implementar la gestión de catálogos.

---

## 📋 Lista de Flujos de Implementación

### Flujo 1: Ajustar el Modelo de Datos para las Reuniones (✅ Completado)
El objetivo es integrar el concepto de "reunión" y "suscripción de acciones" en el corazón de la base de datos.

-   **1.1. Crear tabla `meetings`:** Almacena el registro de cada reunión.
-   **1.2. Modificar tabla `operations`:** Se añade `meeting_id` para vincular cada operación a una reunión.
-   **1.3. Crear tabla `stock_subscriptions`:** Registra las acciones que cada socio ha adquirido y a las que está "suscrito".
-   **1.4. Poblar tablas de configuración:** Se cargan los 6 tipos de acciones en `stocks` y los 2 aportes obligatorios en `fund_assets`.

---

### Flujo 2: Gestión de Reuniones (Admin) (✅ Completado)
Se ha creado la interfaz para que el administrador controle el ciclo de vida de las reuniones.

-   **2.1. Crear vista "Admin: Reuniones":** Página en `/admin/meetings` que muestra el historial y permite iniciar nuevas reuniones.
-   **2.2. Implementar "Iniciar/Cerrar Reunión":** Lógica para controlar el estado de las reuniones.

---

### Flujo 3: Lógica de Negocio para Pagos Precalculados (✅ Completado)
La lógica para calcular las obligaciones de un socio se implementó inicialmente en la base de datos. Ahora debe migrarse al backend de NestJS para centralizar las reglas de negocio.

-   **3.1. Definir Reglas de Negocio:**
    -   **Aportes Obligatorios:** Definidos en `fund_assets` (`actividad`, `administracion`).
    -   **Cuotas de Acciones:** Se pagan las cuotas de todas las acciones suscritas en `stock_subscriptions`.
    -   **Pago de Préstamo:** Lógica pendiente para futuras fases.

-   **3.2. Migrar Lógica de `get_member_dues(member_id)` a un Servicio en NestJS:** La función de base de datos será eliminada. Su lógica se reimplementará en un servicio del backend que será consumido por el endpoint definido en el Flujo 4.

---

### Flujo 4: Rediseñar la Página de Registro de Transacciones (Backend y Frontend)
La vista de administrador se convertirá en la interfaz de trabajo para la reunión activa. La lógica de negocio se moverá al backend.

-   **4.1. Crear Endpoint en API `GET /meetings/active/member-dues?memberId=<id>`:**
    -   **Lógica Backend (NestJS):** Crear un servicio que **reimplementa y reemplaza** la lógica de la antigua función de base de datos `get_member_dues`. Calculará las obligaciones pendientes de un socio para la reunión activa, basándose en sus aportes obligatorios, suscripciones de acciones y préstamos.
    -   **Respuesta:** Devolverá un objeto JSON con los pagos esperados (ej: `{ "mandatory_contributions": [...], "stock_installments": [...] }`).

-   **4.2. Crear vista "Admin: Reunión Activa" (Frontend):**
    -   **Ruta:** `/admin/meetings/active`
    -   **Descripción:** La interfaz principal para registrar las transacciones de los socios durante la reunión en curso.
    -   **Implementación:**
        -   Un administrador seleccionará a un socio.
        -   La interfaz llamará al nuevo endpoint `GET /meetings/active/member-dues` para obtener los pagos esperados.
        -   El administrador podrá confirmar o ajustar los montos en la UI.

---

### Flujo 5: Implementar el Registro Contable Centralizado en el Backend
Se creará un endpoint en la API de NestJS para registrar de forma atómica todas las transacciones de un socio en una reunión. Este endpoint reemplazará cualquier lógica que se hubiera planeado implementar directamente en la base de datos (como una función `record_meeting_transactions`).

-   **5.1. Crear Endpoint en API `POST /meetings/active/record-transactions`:**
    -   **Lógica Backend (NestJS):** Esta será una de las lógicas más críticas del sistema.
        -   **Parámetros:** Recibirá en el body un objeto JSON con `member_id`, `meeting_id` y los detalles de los pagos.
        -   **Transaccionalidad:** Debe ejecutarse dentro de una transacción de base de datos para garantizar que todas las operaciones se completen con éxito o ninguna lo haga.
        -   **Proceso:**
            1.  Crear una única `operation` para el socio en esa reunión.
            2.  Iterar sobre los pagos recibidos y generar todos los asientos contables (`ledger_entries`) necesarios (débitos y créditos correspondientes para cada tipo de pago).
    -   **Entregable:** Un endpoint robusto, transaccional y con pruebas unitarias que garantice la integridad del libro contable.

---

### Flujo 6: Administración de Socios del Fondo (✅ Completado)
Se creará la interfaz de administración para gestionar el ciclo de vida de los socios.

-   **6.1. Crear Vista "Admin: Socios" (Frontend):** (✅ Completado)
    -   **Ruta:** `/admin/members`
    -   **Descripción:** Una página para listar, crear y, eventualmente, editar/eliminar socios.

-   **6.2. Implementar Listado de Socios:** (✅ Completado)
    -   **Lógica Frontend:** Al cargar la vista, llamar al endpoint `GET /members` para obtener y mostrar la lista de todos los socios en una tabla.

-   **6.3. Implementar Creación de Nuevos Socios:** (✅ Completado)
    -   **Lógica Frontend:** Añadir un formulario o modal en la vista para capturar los datos de un nuevo socio (nombre, email, etc.). Al enviarlo, se llamará al endpoint `POST /members` y se actualizará la lista.

---

### Flujo 7: Administración del Catálogo de Acciones (Admin)
Se creará una interfaz para que el administrador gestione los tipos de acciones que el fondo puede emitir.

-   **7.1. Crear Vista "Admin: Acciones" (Frontend):**
    -   **Ruta:** `/admin/stocks`
    -   **Descripción:** Una página para listar, crear, editar y eliminar los tipos de acciones disponibles en el fondo (ej: "Acción Grande", "Bono Navideño").
    -   **Lógica Frontend:** Se conectará a los endpoints CRUD del backend para gestionar las acciones.

-   **7.2. Implementar CRUD para Acciones:**
    -   **Lógica Backend:** Utilizar los endpoints existentes en `StocksController` (`GET /stocks`, `POST /stocks`, `PATCH /stocks/:id`, `DELETE /stocks/:id`).

---

### Flujo 8: Administración de Contribuciones Obligatorias (Admin)
Se creará una interfaz para que el administrador defina y gestione los aportes que todos los socios deben realizar periódicamente.

-   **8.1. Crear Vista "Admin: Contribuciones" (Frontend):**
    -   **Ruta:** `/admin/contributions`
    -   **Descripción:** Una página para listar, crear, editar y eliminar los tipos de aportes obligatorios (ej: "Aporte Administrativo").
    -   **Lógica Frontend:** Se conectará a los endpoints CRUD del backend.

-   **8.2. Implementar CRUD para Contribuciones:**
    -   **Lógica Backend:** Utilizar los endpoints existentes en `MeetingsController` (`GET /meetings/mandatory-contributions`, `POST /meetings/mandatory-contributions`, etc.).