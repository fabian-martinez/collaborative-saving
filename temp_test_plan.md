# Plan de Pruebas para el Backend

Este documento detalla las pruebas unitarias y de integración que faltan en el backend del proyecto. El objetivo es asegurar la robustez, fiabilidad y correctitud de la lógica de negocio.

## Enfoque General

1.  **Priorización**: Se priorizarán los módulos con lógica de negocio compleja y crítica para el funcionamiento del sistema.
    -   `asset-revaluation`: Crítico para la integridad financiera.
    -   `meetings`: Orquesta gran parte del flujo de la aplicación.
    -   `loans`: Lógica de negocio esencial.
    -   `operations`: Transacciones complejas que afectan múltiples entidades.
2.  **Tipos de Pruebas**:
    -   **Pruebas Unitarias**: Aislan y prueban una sola unidad de código (ej. un método en un servicio). Se usarán `mocks` para las dependencias externas (ej. repositorios).
    -   **Pruebas de Integración (E2E)**: Prueban el flujo completo de una funcionalidad a través de múltiples componentes (controladores, servicios, base de datos). El archivo `business-use-case.e2e-spec.ts` es un buen ejemplo y se expandirá.
3.  **Cobertura**: El objetivo es cubrir los "caminos felices" (happy paths), los casos borde (edge cases) y los escenarios de error para cada funcionalidad.

---

## Módulo 1: `asset-revaluation` (Prioridad Alta)

Este módulo es fundamental para el cálculo del valor de las acciones y la distribución de rendimientos.

### Pruebas Unitarias para `AssetRevaluationService` (`asset-revaluation.service.spec.ts`)

-   **`getRevaluationPreview`**:
    -   [x] **Test 1: Escenario base.** Debería calcular correctamente la vista previa de la revalorización con acciones garantizadas y no garantizadas.
    -   [x] **Test 2: Solo acciones no garantizadas.** Verificar el cálculo cuando no hay acciones con rendimiento garantizado.
    -   [x] **Test 3: Solo acciones garantizadas.** Verificar que el cálculo es correcto y no distribuye más de lo disponible.
    -   [x] **Test 4: Déficit de intereses.** Escenario donde el rendimiento de las acciones garantizadas es mayor que los intereses totales recolectados. Se espera que el `interestAvailableToDistribute` sea negativo.
    -   [x] **Test 5: Sin ingresos.** Probar el comportamiento cuando `total_interest` y `total_contributions` son cero.
    -   [x] **Test 6: No se encuentra la reunión.** Debería lanzar una `NotFoundException`.

-   **`executeRevaluation`**:
    -   [x] **Test 1: Transacción exitosa.** Verificar que se llama a `createQueryRunner`, se inicia una transacción, se confirma (`commitTransaction`) y se liberan los recursos (`release`).
    -   [x] **Test 2: Creación de entidades.** Asegurar que se creen correctamente la `Operation` maestra, los registros en `StockValueHistory` y se actualicen los valores en `Stock`.
    -   [x] **Test 3: Creación de asientos contables.** Verificar que se generen los asientos contables correctos en `ledger_entries` para `INVESTMENT_IN_STOCKS_ACCOUNT` y `REVALUATION_SURPLUS_ACCOUNT`, tanto para aportes como para intereses.
    -   [x] **Test 4: Rollback en caso de error.** Simular un error durante el proceso (ej. al guardar en la base de datos) y verificar que se llame a `rollbackTransaction`.

---

## Módulo 2: `meetings` (Prioridad Alta)

El corazón de las operaciones del fondo.

### Pruebas Unitarias para `MeetingsService` (`meetings.service.spec.ts`)

-   **`recordMonthlyPayment`**:
    -   [ ] **Test 1: Pago exitoso.** Verificar que se crea una `Operation` y se procesan correctamente los pagos a través del `PaymentStrategyFactory`.
    -   [ ] **Test 2: No hay reunión activa.** Debería lanzar una `NotFoundException`.
    -   [ ] **Test 3: El socio ya ha pagado.** Debería lanzar una `BadRequestException` si el socio intenta pagar dos veces en la misma reunión.
    -   [ ] **Test 4: Rollback en caso de error.** Simular un error en una de las estrategias de pago y verificar que la transacción se revierta.

-   **`close`**:
    -   [ ] **Test 1: Cierre exitoso.** Verificar que el estado de la reunión cambia a `closed`.
    -   [ ] **Test 2: Reunión no encontrada.** Debería lanzar `NotFoundException`.
    -   [ ] **Test 3: Reunión ya cerrada.** Debería lanzar `BadRequestException`.

-   **`create`**:
    -   [ ] **Test 1: Creación exitosa.** Verificar que se crea una nueva reunión cuando no hay ninguna activa.
    -   [ ] **Test 2: Reunión activa existente.** Debería lanzar `BadRequestException` si ya existe una reunión activa.

### Pruebas Unitarias para Estrategias de Pago (`/strategies`)

-   **`LoanPaymentStrategy.spec.ts`**:
    -   [ ] **Test 1: Pago completo (interés + capital).** Verificar que se crean los asientos contables correctos para `INTEREST_INCOME_ACCOUNT` y `LOANS_RECEIVABLE_ACCOUNT`.
    -   [ ] **Test 2: Pago parcial (solo cubre intereses).**
    -   [ ] **Test 3: Pago mayor a los intereses.**
    -   [ ] **Test 4: Falta `referenceId`.** Debería lanzar `BadRequestException`.
    -   [ ] **Test 5: Se crean los `LoanTransactionDetail` correctamente.**

-   **`StockFeeStrategy.spec.ts`**, **`MandatoryContributionStrategy.spec.ts`**, etc.:
    -   [ ] **Test 1: Proceso exitoso.** Verificar que cada estrategia genera el asiento contable correcto contra la cuenta de ingresos correspondiente.

---

## Módulo 3: `loans` y `operations` (Prioridad Media)

La lógica de préstamos y compras financiadas es compleja e interconectada.

### Pruebas Unitarias para `LoansService` (`loans.service.spec.ts`)

-   **`create`**:
    -   [ ] **Test 1: Creación exitosa.** Verificar que se crea el `Loan`, la `Operation` de desembolso y los asientos contables.
    -   [ ] **Test 2: Capital insuficiente.** Debería lanzar `BadRequestException` si el monto del préstamo supera el capital del socio.
    -   [ ] **Test 3: Se ejecuta dentro de una transacción existente.** Verificar que no crea un nuevo `queryRunner` si ya se le pasa uno.

-   **`calculateDerivedFields` (en `loan.entity.ts`)**:
    -   [ ] **Test 1: Préstamo al día.** `due_installments` debería ser 0 y `payment_status_this_month` ser `PENDING`.
    -   [ ] **Test 2: Préstamo con cuotas atrasadas.** `due_installments` debe ser mayor que 0 y `payment_status_this_month` ser `OVERDUE`.
    -   [ ] **Test 3: Pago realizado en el mes actual.** `payment_status_this_month` debe ser `PAID`.
    -   [ ] **Test 4: Saldo pendiente (`outstanding_balance`) se calcula correctamente.**

### Pruebas Unitarias para `OperationsService` (`operations.service.spec.ts`)

-   **`buyStock`**:
    -   [ ] **Test 1: Compra solo con efectivo.**
    -   [ ] **Test 2: Compra 100% financiada.** Verificar que se crea un `Loan` y una `StockSubscription` con el `financing_loan_id` correcto.
    -   [ ] **Test 3: Compra mixta (efectivo + financiamiento).**
    -   [ ] **Test 4: Asientos contables correctos.** Verificar el débito a `CASH` y/o `LOANS_RECEIVABLE` y el crédito a `STOCK_CAPITAL`.
    -   [ ] **Test 5: Monto en efectivo excede el valor total.** Debería lanzar `BadRequestException`.
    -   [ ] **Test 6: Compra financiada sin `loanDetails`.** Debería lanzar `BadRequestException`.

---

## Módulo 4: `dues` (Prioridad Media)

Este servicio agrega y calcula las deudas de un socio, lo cual es fundamental para el paso de recaudo en las reuniones.

### Pruebas Unitarias para `DuesService` (`dues.service.spec.ts`)

-   **`getMemberDuesForActiveMeeting`**:
    -   [x] **Test 1: Socio con todos los tipos de deudas.** Verificar que se retornan correctamente las deudas obligatorias, de acciones y de préstamos.
    -   [x] **Test 2: Socio sin deudas.** Debería retornar un array vacío.
    -   [x] **Test 3: Préstamo ya pagado.** Un préstamo marcado como `PAID` para el mes no debería generar una deuda de `loan_payment`.
    -   [x] **Test 4: No se encuentra reunión activa.** Debería lanzar una `NotFoundException`.
    -   [x] **Test 5: No se encuentra el socio.** Debería lanzar una `NotFoundException`.

-   **`calculateInsurance`**:
    -   [x] **Test 1: Deuda mayor a los ahorros.** Verificar que el seguro se calcula correctamente (`(deuda - ahorros) * 0.001`).
    -   [x] **Test 2: Ahorros mayores a la deuda.** El monto del seguro debería ser 0.
    -   [x] **Test 3: Con abono a capital.** Un `capitalPayment` debería reducir la base del cálculo del seguro.
    -   [x] **Test 4: Excluir préstamos de financiamiento.** Los préstamos usados para financiar acciones no deben contar como deuda para el cálculo del seguro.
    -   [x] **Test 5: Excluir ahorros financiados.** Las acciones compradas con un préstamo activo no deben contar como ahorro.

---

## Módulo 5: Pruebas E2E (`business-use-case.e2e-spec.ts`)

Expandir el caso de uso existente para cubrir el ciclo de vida completo de una reunión.

-   [ ] **Fase 3: Revalorización de Activos.**
    -   Añadir un `it()` que llame al endpoint `POST /meetings/:id/revaluate-assets`.
    -   Verificar que el valor de las acciones se actualizó correctamente en la base de datos.
    -   Verificar la creación de los registros en `stock_value_history`.
    -   Validar los asientos contables generados por la revalorización.

-   [ ] **Fase 4: Nuevas Operaciones Post-Revalorización.**
    -   Añadir un `it()` para simular una compra de acciones (`POST /operations/buy-stock`) después de la revalorización, usando el nuevo valor de la acción para los cálculos.

-   [ ] **Fase 5: Cierre de Reunión.**
    -   Añadir un `it()` que cierre la reunión (`PATCH /meetings/:id/close`).
    -   Verificar que ya no se pueden registrar transacciones en esa reunión.
    -   Verificar que se puede crear una nueva reunión.

-   [ ] **Refactorización**: Modularizar el archivo de pruebas E2E para que sea más fácil de leer y mantener, posiblemente usando `describe.each` o funciones `helper` para las configuraciones repetitivas. 

---

## Módulo 6: Revisión de Pruebas Implementadas

-   [ ] Revisar a detalle las pruebas unitarias para `DuesService`.
-   [ ] Revisar a detalle las pruebas unitarias para `AssetRevaluationService`. 