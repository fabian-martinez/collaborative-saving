# 0006: Gestión Avanzada de Efectivo, Desembolsos y Dividendos

**Fecha**: 2024-07-30
**Estado**: Aceptado

## Contexto

El proceso de desembolso actual, definido como el último paso de una reunión, es demasiado simplista. Asume que siempre hay suficiente efectivo para cubrir todos los préstamos aprobados. Sin embargo, en un escenario real, el efectivo es un recurso limitado y su asignación debe seguir reglas de negocio claras para manejar:

1.  **Insuficiencia de Efectivo**: Los préstamos aprobados y los retiros de capital pueden exceder el efectivo disponible.
2.  **Prioridad de Pagos**: Los pagos pendientes de reuniones anteriores (préstamos no desembolsados completamente, retiros de acciones) deben tener prioridad.
3.  **Comportamientos de Acciones Diferenciados**: Algunas acciones están diseñadas para generar dividendos en efectivo en lugar de acumular valor (apreciación de capital), lo que requiere un mecanismo de distribución.
4.  **Fondos Destinados (Earmarked Funds)**: Parte del efectivo podría estar restringido para usarse solo en ciertos tipos de crédito.

Es necesario un rediseño del proceso para que sea robusto, transparente y modele con precisión las restricciones del mundo real.

## Decisión

Se ha decidido implementar un sistema de desembolso multifacético y basado en prioridades, que se ejecutará en el paso final de la reunión. Este sistema gestionará la asignación del efectivo disponible de manera ordenada y registrará cualquier pago parcial.

### Endpoints del Proceso de Desembolso

-   **Previsualización del Plan de Desembolso**: `GET /meetings/:id/disbursement-plan/preview`
    -   Calcula y devuelve un plan de desembolso recomendado siguiendo la cola de prioridad (deudas antiguas, dividendos, préstamos, retiros, etc.).
    -   No realiza ningún cambio en la base de datos.
-   **Ejecución Atómica del Plan de Desembolso**: `POST /meetings/:id/disbursement-plan/execute`
    -   Recibe el plan final (puede ser el recomendado o uno ajustado por el administrador).
    -   Valida que el plan no exceda el efectivo disponible y ejecuta todas las operaciones de desembolso de forma atómica (en una sola transacción):
        -   Actualiza entidades (`Loan.disbursed_amount`, `pending_member_payments`, etc.).
        -   Genera los asientos contables correspondientes.
        -   Actualiza los estados de préstamos, retiros y dividendos según corresponda.
    -   Si ocurre un error, la transacción se revierte y no se aplican cambios parciales.
-   **Nota**: No se separan endpoints por tipo de operación (retiros, préstamos, dividendos) para garantizar que la lógica de prioridad y la integridad de los fondos se mantengan centralizadas y atómicas, evitando inconsistencias y errores de negocio.

### 1. Nuevos Comportamientos para las Acciones

Para manejar diferentes tipos de rendimiento, se introduce una nueva propiedad en la entidad `Stock`:

-   **`behavior` (enum)**: Define cómo la acción genera valor para el socio.
    -   `CAPITAL_APPRECIATION`: El valor de la acción crece con las ganancias del fondo. Los socios ganan al vender la acción a un precio mayor. (Comportamiento por defecto y actual).
    -   `DIVIDEND_YIELD`: La acción mantiene un valor base. Las ganancias que genera se distribuyen como dividendos en efectivo a los socios suscriptores.

### 2. Modificación del Proceso de Revalorización (Paso 2)

El servicio `AssetRevaluationService` se adaptará para tener en cuenta el `behavior` de la acción:

-   Para acciones `DIVIDEND_YIELD`, el servicio calculará las ganancias generadas. En lugar de sumarlas al `current_value` de la acción, creará registros de "pago de dividendo pendiente" que serán procesados durante la fase de desembolso. El valor de la acción puede volver a su valor base o a un nuevo valor base según reglas específicas.

### 3. Modelo de Desembolso por Prioridades

El paso final de la reunión (`POST /meetings/:id/complete`) ejecutará un algoritmo de asignación de efectivo.

**A. Fuente de Fondos:** El `efectivo_disponible` total de la reunión. La lógica debe poder filtrar este efectivo si se implementan los fondos destinados.

**B. Cola de Prioridad de Pagos:** El sistema procesará los desembolsos en el siguiente orden estricto:

1.  **Prioridad 1: Deuda Antigua con Socios**: Pagos pendientes a socios de reuniones anteriores (retiros de acciones o dividendos no completados), consultados desde la nueva tabla `pending_member_payments`.
2.  **Prioridad 2: Deuda Antigua de Préstamos**: Desembolsos pendientes de préstamos aprobados en reuniones anteriores (`approved_amount > disbursed_amount`).
3.  **Prioridad 3: Dividendos del Período Actual**: Pagos de dividendos generados por acciones `DIVIDEND_YIELD` en la revalorización de la reunión actual.
4.  **Prioridad 4: Préstamos Nuevos**: Desembolsos de préstamos aprobados en la reunión actual.
5.  **Prioridad 5: Retiros de Acciones Nuevos**: Desembolsos por retiros de acciones realizados en la reunión actual.

**C. Gestión de Pagos Parciales:**

-   **Préstamos**: La entidad `Loan` se modificará para tener `approved_amount` y `disbursed_amount`. Si el efectivo no es suficiente, se desembolsa una parte y se actualiza `disbursed_amount`. El préstamo queda en estado `PARTIALLY_DISBURSED`.
-   **Retiros y Dividendos**: Si un pago a un socio no puede completarse, se registrará el monto pendiente en una nueva tabla `pending_member_payments`, creando una deuda del fondo hacia el socio.

### 4. Cambios en la Base de Datos

-   **Tabla `stocks`**:
    -   Añadir columna `behavior TEXT NOT NULL DEFAULT 'CAPITAL_APPRECIATION'`.
    -   Añadir columna `base_value NUMERIC`.
-   **Tabla `loans`**:
    -   Considerar renombrar `amount` a `approved_amount`.
    -   Añadir columna `disbursed_amount NUMERIC NOT NULL DEFAULT 0`.
-   **Nueva Tabla `pending_member_payments`**:
    -   `id` (PK), `member_id` (FK), `meeting_id` (FK a la reunión que originó la deuda), `amount` (monto pendiente), `reason` (dividendo, retiro), `status`