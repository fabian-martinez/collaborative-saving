# Capa de Dominio

> Documentación completa de la capa de dominio: entidades, value objects, domain services, eventos, invariantes y puertos.

## Estructura de directorios

```
backend/src/domain/
├── entities/           # Entidades de dominio
│   ├── member.entity.ts
│   ├── stock.entity.ts
│   ├── stock-subscription.entity.ts
│   ├── loan.entity.ts
│   ├── loan-transaction-detail.entity.ts
│   ├── meeting.entity.ts
│   ├── operation.entity.ts
│   ├── ledger-entry.entity.ts
│   ├── stock-value-history.entity.ts
│   ├── pending-member-payment.entity.ts
│   └── mandatory-contribution.entity.ts
├── value-objects/      # Value Objects
│   ├── money.vo.ts
│   ├── quantity.vo.ts
│   └── stock-value.vo.ts
├── services/           # Domain Services
│   ├── debt-capacity.service.ts
│   ├── asset-revaluation.service.ts
│   ├── operation-balance-validator.service.ts
│   ├── loan-payment-calculator.service.ts
│   ├── dues-calculation.service.ts
│   ├── insurance-calculation.service.ts
│   ├── cash-balance-calculator.service.ts
│   ├── disbursement-plan.service.ts
│   └── stock-withdrawal-calculator.service.ts
├── events/            # Domain Events
│   ├── stocks/
│   ├── loans/
│   ├── meetings/
│   ├── pending-payments/
│   └── accounting/
└── ports/             # Interfaces (Puertos) - Contratos del dominio
    ├── repositories/
    │   ├── member.repository.port.ts
    │   ├── stock.repository.port.ts
    │   ├── stock-subscription.repository.port.ts
    │   ├── loan.repository.port.ts
    │   ├── loan-transaction-detail.repository.port.ts
    │   ├── meeting.repository.port.ts
    │   ├── operation.repository.port.ts
    │   ├── ledger-entry.repository.port.ts
    │   ├── stock-value-history.repository.port.ts
    │   ├── pending-member-payment.repository.port.ts
    │   └── mandatory-contribution.repository.port.ts
    └── services/
        ├── event-bus.port.ts
        └── transaction-manager.port.ts
```

## Entidades y agregados

- **Member** (agregado): identificación del socio y límites de deuda.
- **Stock** (catálogo): tipo y valor vigente.
- **StockSubscription** (agregado): relación Member–Stock; quantity, status, purchase_date.
- **Operation** (agregado contable): transacción atómica que agrupa asientos.
- **LedgerEntry**: asiento de doble entrada (debit/credit) vinculado a Operation.
- **Meeting**: ciclo mensual que agrupa operaciones.
- **Loan**: préstamo y sus transacciones.
- **StockValueHistory**: historial de valores por Stock y Operation.

## Value Objects (VO)

- **Money**(amount, currency)
- **Quantity**(value)
- **StockValue**(value, timestamp)

## Invariantes clave

### Member
- status ∈ {active, inactive}
- email y identification_number únicos si existen
- registration_date ≤ hoy

### Stock
- type único
- value ≥ 0
- monthly_contribution ≥ 0
- is_guaranteed = true → guaranteed_yield ≥ 0

### StockSubscription
- quantity > 0 siempre (si quantity = 0 → status = inactive)
- status ∈ {pending, active, inactive}
- financing_loan_id ≠ null → loan.status ∈ {pending, active}
- member y stock deben existir y estar activos

### Operation
- date ≤ ahora
- Debe generar ≥ 2 LedgerEntry (al menos un débito y un crédito)
- **Invariante contable crítica**: sum(debits) == sum(credits) en LedgerEntries asociadas

### LedgerEntry
- amount ≠ 0
- account_type ∈ plan de cuentas válido
- operation_id obligatorio
- created_at ≤ ahora
- Solo una referencia de entidad afectada por asiento (loan_id XOR stock_id XOR stock_subscription_id XOR mandatory_contribution_id)

### Meeting
- status ∈ {active, closed}
- Si status = closed → no admite nuevas Operation
- date ≤ hoy

### Loan
- approved_amount > 0
- 0 ≤ disbursed_amount ≤ approved_amount
- outstanding_balance ≥ 0
- outstanding_balance ≤ approved_amount - total_paid
- interest_rate ∈ [0, 1]
- term ≥ 1
- status ∈ {pending, active, paid, defaulted}
- guaranteed_stock_id ≠ null → stock.is_guaranteed = true

### LoanTransactionDetail
- transaction_type ∈ {disbursement, principal_payment, interest_payment}
- amount > 0
- transaction_date ≤ hoy
- Si type = disbursement → loan.status ∈ {pending, active}
- Si type = principal_payment → reduce outstanding_balance; no puede ser negativo

### StockValueHistory
- previous_value ≥ 0, new_value ≥ 0
- new_value = previous_value + growth_from_contributions + growth_from_interest
- operation_id y stock_id obligatorios
- created_at ≤ ahora

### MandatoryContribution
- asset_type único
- value ≥ 0

### PendingMemberPayment
- type ∈ {dividend, stock_withdrawal, loan, other, partial_settlement}
- status ∈ {pending, approved, rejected, paid}
- amount > 0
- member_id y meeting_id obligatorios

## Estados y transiciones

- **StockSubscription**: pending → active → inactive; active → transferred/adjusted → active.
- **Meeting**: active → closed.
- **Loan**: pending → active → paid/defaulted.

## Domain Services

### DebtCapacityService
- **Propósito**: Calcula capacidad de endeudamiento de un socio
- **Cruza agregados**: Member, StockSubscription, Loan
- **Método principal**: `calculateDebtCapacity(memberId: string)`
- **Reglas de negocio**:
  - Capacidad total = valor total de acciones × 2
  - Capacidad disponible = capacidad total - deudas activas
  - Utilización = (deudas / capacidad) × 100
  - Estado crediticio: excellent (≤25%), good (≤50%), moderate (≤75%), high (>75%)

### AssetRevaluationService
- **Propósito**: Calcula revalorización mensual de acciones aplicando contribuciones e intereses
- **Cruza agregados**: Stock, StockSubscription, LedgerEntry, MandatoryContribution
- **Método principal**: `calculateRevaluationData(meetingId: string)`
- **Reglas de negocio**:
  - Crecimiento por aportes = total aportado a la acción / total de acciones
  - Distribución de intereses: prioridad 1) acciones garantizadas, 2) proporcional por cantidad
  - Nuevo valor = valor anterior + crecimiento por aportes + crecimiento por intereses
  - Maneja acciones con comportamiento DIVIDEND_YIELD (asignación a dividendos vs crecimiento)

### OperationBalanceValidator
- **Propósito**: Valida que una operación contable mantenga balance (débitos = créditos)
- **Cruza agregados**: Operation, LedgerEntry
- **Método principal**: `validateBalance(ledgerEntries: LedgerEntry[]): boolean`
- **Reglas de negocio**:
  - Suma de débitos (amount > 0) == Suma de créditos (amount < 0)
  - Debe haber al menos 2 LedgerEntry por Operation
  - Lanza excepción si no balancea

### LoanPaymentCalculator
- **Propósito**: Calcula desglose de pago de préstamo (principal vs intereses)
- **Cruza agregados**: Loan, LoanTransactionDetail
- **Método principal**: `calculatePaymentBreakdown(loanId, amount)`
- **Reglas de negocio**:
  - Intereses no reducen outstanding_balance
  - Principal reduce outstanding_balance
  - Actualiza `disbursed_amount` y `outstanding_balance` según tipo de transacción

### DuesCalculationService
- **Propósito**: Calcula cuotas mensuales que debe pagar un socio
- **Cruza agregados**: MandatoryContribution, StockSubscription, Loan, LoanTransactionDetail, Meeting
- **Método principal**: `getMemberDuesForActiveMeeting(memberId: string)`

### InsuranceCalculationService
- **Propósito**: Calcula seguro de vida a partir de deudas vs ahorros
- **Cruza agregados**: StockSubscription, Loan

### CashBalanceCalculator
- **Propósito**: Calcula efectivo disponible en una reunión
- **Cruza agregados**: LedgerEntry, Operation, Meeting

### DisbursementPlanService
- **Propósito**: Genera y ejecuta plan de desembolsos priorizados por efectivo disponible
- **Cruza agregados**: PendingMemberPayment, Loan, StockSubscription, Operation, LedgerEntry, Meeting

### StockWithdrawalCalculator
- **Propósito**: Calcula retiro de acciones usando método FIFO
- **Cruza agregados**: StockSubscription, Stock, Loan

## Eventos de dominio

### Stocks
- **StockSubscriptionCreated**: Trigger: creación de suscripción
- **StockSubscriptionModified**: Trigger: modificación/transferencia/ajuste
- **StockValueRevalued**: Trigger: revalorización mensual ejecutada

### Loans
- **LoanApproved**: Trigger: aprobación de préstamo
- **LoanDisbursed**: Trigger: desembolso (parcial o total)
- **LoanPaymentRecorded**: Trigger: registro de pago
- **LoanDefaulted**: Trigger: marcado en mora

### Meetings
- **MeetingOpened**: Trigger: creación de reunión activa
- **MeetingClosed**: Trigger: cierre de reunión

### Pending Payments
- **PendingMemberPaymentCreated**: Trigger: creación de lote pendiente
- **PendingMemberPaymentSettled**: Trigger: saldo total del pendiente

### Contabilidad
- **OperationRecorded**: Trigger: persistencia de Operation + LedgerEntries

Ver detalles completos en [PLAN_MEJORAS_ARQUITECTURA.md](./PLAN_MEJORAS_ARQUITECTURA.md#eventos-de-dominio).

## Puertos (Interfaces del dominio)

Los puertos definen los contratos que el dominio necesita. Están ubicados en `domain/ports/` porque son parte del contrato del dominio.

### Repositorios

- **MemberRepository**: `findById`, `findByEmail`, `findByIdentificationNumber`, `save`, `findAll`, `findActive`
- **StockRepository**: `findById`, `findByType`, `findAll`, `findActive`, `save`, `findGuaranteed`
- **StockSubscriptionRepository**: `findById`, `findByMemberAndStock`, `findByMember`, `findActiveByMember`, `findFreeOfFinancing`, `save`, `saveMany`, `findByStock`
- **LoanRepository**: `findById`, `findByMember`, `findActiveByMember`, `findPendingByMember`, `save`, `findByIds`
- **LoanTransactionDetailRepository**: `findById`, `findByLoan`, `findByLoanAndMeeting`, `save`, `saveMany`
- **MeetingRepository**: `findById`, `findActive`, `findAll`, `save`, `findLatestClosed`
- **OperationRepository**: `findById`, `findByMeeting`, `save`, `saveWithEntries`
- **LedgerEntryRepository**: `findById`, `findByOperation`, `findByMeeting`, `findByAccountType`, `save`, `saveMany`, `sumByAccountType`
- **StockValueHistoryRepository**: `findById`, `findByStock`, `findLatestByStock`, `findByStockBeforeDate`, `save`, `saveMany`
- **PendingMemberPaymentRepository**: `findById`, `findByMember`, `findByMeeting`, `findPendingByMeeting`, `findByReference`, `save`, `saveMany`, `calculateRemainingAmount`
- **MandatoryContributionRepository**: `findById`, `findByAssetType`, `findAll`, `save`

Ver contratos completos en [APLICACION.md](./APLICACION.md#contratos-de-repositorios-puertos).

### Servicios transversales

- **EventBus**: `publish`, `subscribe` - Para publicación de eventos de dominio
- **TransactionManager**: `execute` - Para manejo de transacciones de base de datos

Ver contratos completos en [APLICACION.md](./APLICACION.md#puertos-de-servicios-transversales).

