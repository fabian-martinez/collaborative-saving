# Arquitectura Objetivo (Hexagonal + TDD) – Collaborative Saving

## Resumen ejecutivo

La arquitectura objetivo adopta un enfoque hexagonal con énfasis en dominio y casos de uso, eliminando duplicación, separando responsabilidades y habilitando TDD como práctica base. La migración será por funcionalidad, manteniendo los endpoints actuales y la compatibilidad de datos.

## Principios y lineamientos

- Separación estricta de capas: `domain` (puro), `application` (use cases), `infrastructure` (adapters/repos/orm).
- Dependencias hacia adentro: `infrastructure → application → domain` (nunca al revés).
- Contratos estables en interfaces; adaptadores como puentes reversibles.
- Names en inglés para código y componentes; comentarios concisos y con intención.
- TDD: red-green-refactor por funcionalidad migrada; cobertura objetivo 90%+ en cada módulo migrado.

## Modelo de Dominio

### Entidades y agregados
- Member (agregado): identificación del socio y límites de deuda.
- Stock (catálogo): tipo y valor vigente.
- StockSubscription (agregado): relación Member–Stock; quantity, status, purchase_date.
- Operation (agregado contable): transacción atómica que agrupa asientos.
- LedgerEntry: asiento de doble entrada (debit/credit) vinculado a Operation.
- Meeting: ciclo mensual que agrupa operaciones.
- Loan: préstamo y sus transacciones.
- StockValueHistory: historial de valores por Stock y Operation.

### Value Objects (VO)
- Money(amount, currency)
- Quantity(value)
- StockValue(value, timestamp)

### Invariantes clave

#### Member
- status ∈ {active, inactive}
- email y identification_number únicos si existen
- registration_date ≤ hoy

#### Stock
- type único
- value ≥ 0
- monthly_contribution ≥ 0
- is_guaranteed = true → guaranteed_yield ≥ 0

#### StockSubscription
- quantity > 0 siempre (si quantity = 0 → status = inactive)
- status ∈ {pending, active, inactive}
- financing_loan_id ≠ null → loan.status ∈ {pending, active}
- member y stock deben existir y estar activos

#### Operation
- date ≤ ahora
- Debe generar ≥ 2 LedgerEntry (al menos un débito y un crédito)
- **Invariante contable crítica**: sum(debits) == sum(credits) en LedgerEntries asociadas

#### LedgerEntry
- amount ≠ 0
- account_type ∈ plan de cuentas válido
- operation_id obligatorio
- created_at ≤ ahora
- Solo una referencia de entidad afectada por asiento (loan_id XOR stock_id XOR stock_subscription_id XOR mandatory_contribution_id)

#### Meeting
- status ∈ {active, closed}
- Si status = closed → no admite nuevas Operation
- date ≤ hoy

#### Loan
- approved_amount > 0
- 0 ≤ disbursed_amount ≤ approved_amount
- outstanding_balance ≥ 0
- outstanding_balance ≤ approved_amount - total_paid
- interest_rate ∈ [0, 1]
- term ≥ 1
- status ∈ {pending, active, paid, defaulted}
- guaranteed_stock_id ≠ null → stock.is_guaranteed = true

#### LoanTransactionDetail
- transaction_type ∈ {disbursement, principal_payment, interest_payment}
- amount > 0
- transaction_date ≤ hoy
- Si type = disbursement → loan.status ∈ {pending, active}
- Si type = principal_payment → reduce outstanding_balance; no puede ser negativo

#### StockValueHistory
- previous_value ≥ 0, new_value ≥ 0
- new_value = previous_value + growth_from_contributions + growth_from_interest
- operation_id y stock_id obligatorios
- created_at ≤ ahora

#### MandatoryContribution
- asset_type único
- value ≥ 0

#### PendingMemberPayment (Estrategia sin modificar BD)
- type ∈ {dividend, stock_withdrawal, loan, other, partial_settlement}
- status ∈ {pending, approved, rejected, paid}
- amount > 0
- member_id y meeting_id obligatorios

### Estados y transiciones (ejemplos)
- StockSubscription: pending → active → inactive; active → transferred/adjusted → active.
- Meeting: active → closed.
- Loan: pending → active → paid/defaulted.

### Eventos de dominio

#### Stocks
- StockSubscriptionCreated
  - Trigger: creación de suscripción
  - Payload: { subscriptionId, memberId, stockId, quantity, meetingId, operationId, occurredAt }
  - Handlers: generar LedgerEntries; actualizar resúmenes FE
- StockSubscriptionModified
  - Trigger: modificación/transferencia/ajuste de cantidad
  - Payload: { subscriptionId, deltas: Array<{type: 'transfer'|'adjust'|'exchange', quantity}>, meetingId, operationId, occurredAt }
  - Handlers: ajustar asientos; registrar en histórico
- StockValueRevalued
  - Trigger: revalorización mensual ejecutada
  - Payload: { stockId, previousValue, newValue, growthFromContributions, growthFromInterest, meetingId, operationId, historyId, occurredAt }
  - Handlers: actualizar vistas; disparar dividendos si aplica

#### Loans
- LoanApproved
  - Trigger: aprobación de préstamo (estado pending)
  - Payload: { loanId, memberId, approvedAmount, interestRate, term, meetingId?, occurredAt }
  - Handlers: notificar; preparar plan de desembolsos
- LoanDisbursed
  - Trigger: desembolso (parcial o total)
  - Payload: { loanId, amount, disbursedAmount, outstandingBalance, meetingId, operationId, loanTransactionDetailId, occurredAt }
  - Handlers: asientos contables; recalcular capacidad de deuda
- LoanPaymentRecorded
  - Trigger: registro de pago (capital/interés)
  - Payload: { loanId, principal, interest, outstandingBalance, meetingId, operationId, loanTransactionDetailId, occurredAt }
  - Handlers: asientos; métricas; alertas de riesgo
- LoanDefaulted
  - Trigger: marcado en mora
  - Payload: { loanId, outstandingBalance, occurredAt }
  - Handlers: alertas; provisiones; bloqueo de nuevos desembolsos

#### Meetings
- MeetingOpened
  - Trigger: creación de reunión activa
  - Payload: { meetingId, date }
  - Handlers: inicializar tableros y totales
- MeetingClosed
  - Trigger: cierre de reunión
  - Payload: { meetingId, totals: { cash, income, expenses }, date }
  - Handlers: bloquear nuevas operaciones; snapshot para reportes

#### Pending Payments
- PendingMemberPaymentCreated
  - Trigger: creación de lote pendiente
  - Payload: { pendingId, memberId, type, amountOrQuantity, meetingId, referenceMeetingId?, occurredAt }
  - Handlers: incluir en plan de desembolsos
- PendingMemberPaymentSettled
  - Trigger: saldo total del pendiente
  - Payload: { pendingId, settledByOperationId, date }
  - Handlers: actualizar estado y vistas

#### Contabilidad
- OperationRecorded
  - Trigger: persistencia de Operation + LedgerEntries
  - Payload: { operationId, meetingId, memberId?, type, totals: { debit, credit }, occurredAt }
  - Handlers: validación de balance; auditoría; proyecciones

### Domain Services (lógica que cruza múltiples agregados)

#### DebtCapacityService
- **Propósito**: Calcula capacidad de endeudamiento de un socio
- **Cruza agregados**: Member, StockSubscription, Loan
- **Método principal**: `calculateDebtCapacity(memberId: string)`
- **Reglas de negocio**:
  - Capacidad total = valor total de acciones × 2
  - Capacidad disponible = capacidad total - deudas activas
  - Utilización = (deudas / capacidad) × 100
  - Estado crediticio: excellent (≤25%), good (≤50%), moderate (≤75%), high (>75%)

#### AssetRevaluationService (StockValuationService)
- **Propósito**: Calcula revalorización mensual de acciones aplicando contribuciones e intereses
- **Cruza agregados**: Stock, StockSubscription, LedgerEntry, MandatoryContribution
- **Método principal**: `calculateRevaluationData(meetingId: string)`
- **Reglas de negocio**:
  - Crecimiento por aportes = total aportado a la acción / total de acciones
  - Distribución de intereses: prioridad 1) acciones garantizadas, 2) proporcional por cantidad
  - Nuevo valor = valor anterior + crecimiento por aportes + crecimiento por intereses
  - Maneja acciones con comportamiento DIVIDEND_YIELD (asignación a dividendos vs crecimiento)

#### OperationBalanceValidator
- **Propósito**: Valida que una operación contable mantenga balance (débitos = créditos)
- **Cruza agregados**: Operation, LedgerEntry
- **Método principal**: `validateBalance(ledgerEntries: LedgerEntry[]): boolean`
- **Reglas de negocio**:
  - Suma de débitos (amount > 0) == Suma de créditos (amount < 0)
  - Debe haber al menos 2 LedgerEntry por Operation
  - Lanza excepción si no balancea

#### LoanPaymentCalculator (implícito en código actual)
- **Propósito**: Calcula desglose de pago de préstamo (principal vs intereses)
- **Cruza agregados**: Loan, LoanTransactionDetail
- **Método principal**: `calculatePaymentBreakdown(loanId, amount)`
- **Reglas de negocio**:
  - Intereses no reducen outstanding_balance
  - Principal reduce outstanding_balance
  - Actualiza `disbursed_amount` y `outstanding_balance` según tipo de transacción

#### DuesCalculationService
- **Propósito**: Calcula cuotas mensuales que debe pagar un socio (contribuciones obligatorias + acciones + préstamos)
- **Cruza agregados**: MandatoryContribution, StockSubscription, Loan, LoanTransactionDetail, Meeting
- **Método principal**: `getMemberDuesForActiveMeeting(memberId: string)`
- **Reglas de negocio**:
  - Contribuciones obligatorias: monto fijo por tipo de activo
  - Cuotas de acciones: quantity × monthly_contribution por stock
  - Cuotas de préstamos: monthly_payment_amount + (outstanding_balance × interest_rate)
  - Solo incluye préstamos que no tienen pago de interés registrado en la reunión actual
  - Agrupa suscripciones por stock_id antes de calcular

#### InsuranceCalculationService
- **Propósito**: Calcula seguro de vida a partir de deudas vs ahorros
- **Cruza agregados**: StockSubscription, Loan
- **Método principal**: `calculateInsurance(memberId: string, capitalPayment?: number)`
- **Reglas de negocio**:
  - Deuda ajustada = total deudas - pago de capital - deudas de financiamiento de suscripciones
  - Ahorros = valor de suscripciones sin préstamos de financiamiento activos
  - Seguro = (deuda_ajustada - ahorros) × 0.001 si > 0, sino 0

#### CashBalanceCalculator
- **Propósito**: Calcula efectivo disponible en una reunión
- **Cruza agregados**: LedgerEntry, Operation, Meeting
- **Método principal**: `calculateCashInMeeting(meetingId: string)`
- **Reglas de negocio**:
  - Suma todos los LedgerEntry con account_type = CASH_ACCOUNT en la reunión
  - Efectivo puede ser negativo si hay retiros mayores a ingresos

#### DisbursementPlanService
- **Propósito**: Genera y ejecuta plan de desembolsos priorizados por efectivo disponible
- **Cruza agregados**: PendingMemberPayment, Loan, StockSubscription, Operation, LedgerEntry, Meeting
- **Método principal**: `previewDisbursementPlan()`, `executeDisbursementPlan()`
- **Reglas de negocio**:
  - Orden de prioridad: 1) Deuda antigua con socios, 2) Deuda antigua de préstamos, 3) Dividendos, 4) Retiros de acciones, 5) Nuevos préstamos
  - Valida que total solicitado ≤ efectivo disponible
  - Usa estrategias por tipo de desembolso (dividend, loan, withdrawal, other)
  - Todo se ejecuta en transacción atómica

#### StockWithdrawalCalculator
- **Propósito**: Calcula retiro de acciones usando método FIFO
- **Cruza agregados**: StockSubscription, Stock, Loan
- **Método principal**: `calculateWithdrawalFIFO(memberId, stockId, amount)`
- **Reglas de negocio**:
  - Solo retira suscripciones sin financing_loan_id (libres de crédito)
  - Ordena por purchase_date (más antiguas primero - FIFO)
  - Calcula quantity = amount / stock.value
  - Actualiza quantity de suscripciones afectadas

### Puertos (interfaces del dominio)
- StockSubscriptionRepository
- StockValueHistoryRepository
- OperationRepository
- LedgerEntryRepository
- MeetingRepository
- LoanRepository
- LoanTransactionDetailRepository
- PendingMemberPaymentRepository
- MandatoryContributionRepository

## Capa de Aplicación

Ver [CAPA_APLICACION.md](./CAPA_APLICACION.md) para el diseño detallado de la capa de aplicación, incluyendo:
- Estructura de directorios
- Patrón de Use Case
- DTOs por dominio
- Contratos de repositorios (Puertos)
- Puertos de servicios transversales

## Casos de uso (contratos)

### Stocks
- CreateStockSubscription
  - Input: { memberId, stockId, quantity, meetingId, paymentMethod }
  - Pre: member/stock activos; quantity > 0; meeting activo
  - Post: subscription active; Operation + LedgerEntries; StockValueHistory
  - Output: { subscriptionId, operationId, ledgerEntryIds[], historyId }
- ModifyStockSubscription (ajuste/intercambio/transferencia)
  - Input: { memberId, meetingId, fromSubscriptionId, fromQuantity, toStockId?, toQuantity?, transferSubscriptionId?, toMemberId?, notes? }
  - Pre: fromSubscription pertenece a member; no deja quantity < 0
  - Post: subscriptions ajustadas; Operation + LedgerEntries; StockValueHistory; opcional PendingMemberPayment
  - Output: { operationId, affectedSubscriptions[], historyIds[] }
- TransferStockSubscription
  - Input: { fromMemberId, toMemberId, stockId, quantity, meetingId, fromSubscriptionId? }
  - Pre: fromMember activo y posee quantity disponible (FIFO sobre suscripciones libres de crédito); toMember activo
  - Post: decremento en origen, incremento/creación en destino; Operation + LedgerEntries
  - Output: { operationId, fromMemberId, toMemberId, fromSubscriptionId?, toSubscriptionId }
- PreviewMonthlyRevaluation
  - Input: { meetingId }
  - Pre: meeting activo
  - Post: cálculo estimado por acción (previousValue, growths, newValue); sin persistir Operation ni StockValueHistory
  - Output: { total_contributions, total_interest, total_to_distribute, details[] }
- ApproveMonthlyRevaluation
  - Input: { meetingId, approvalBy, notes? }
  - Pre: existe preview vigente; meeting activo
  - Post: persiste Operation + LedgerEntries y StockValueHistory por acción; emite StockValueRevalued
  - Output: { operationId, historyIds[] }
- RecordMonthlyRevaluation
  - Input: { meetingId, stockId, contributionsGrowth, interestGrowth }
  - Pre: meeting activo; datos de crecimiento válidos
  - Post: StockValueHistory creado; Operation + LedgerEntries
  - Output: { operationId, historyId }

### Loans
- CreateLoan (approve)
  - Input: { memberId, loanType, approvedAmount, monthlyPaymentAmount, interestRate, term, guaranteedStockId? }
  - Pre: member activo; validación DebtCapacityService
  - Post: loan pending (sin desembolso); LoanApproved event
  - Output: { loanId }
- DisburseLoan (partial/total)
  - Input: { loanId, amount, meetingId, notes? }
  - Pre: loan pending/active; no excede approvedAmount; meeting activo
  - Post: LoanTransactionDetail (disbursement); Operation + LedgerEntries; actualiza disbursed/outstanding
  - Output: { operationId, loanTransactionDetailId, loanId }
- RecordLoanPayment
  - Input: { loanId, principal?, interest?, meetingId }
  - Pre: loan active; montos > 0; meeting activo
  - Post: LoanTransactionDetail(s); Operation + LedgerEntries; outstandingBalance actualizado
  - Output: { operationId, loanTransactionDetailIds[] }
- MarkLoanDefaulted
  - Input: { loanId, reason?, occurredAt? }
  - Pre: loan active
  - Post: status = defaulted; LoanDefaulted event
  - Output: { loanId, status }
- MergeLoans (opcional)
  - Input: { memberId, loanIds[], policy }
  - Pre: loans activos del mismo member; política válida
  - Post: nuevo loan; cierre/ajuste de los anteriores; operaciones contables
  - Output: { newLoanId, closedLoanIds[] }

### Meetings
- OpenMeeting
  - Input: { date? }
  - Pre: no existe meeting activo
  - Post: meeting activo; Operation de balance inicial opcional; MeetingOpened event
  - Output: { meetingId }
- RecordMonthlyPayments
  - Input: { meetingId, memberId, payments: MemberDue[] }
  - Pre: meeting activo; member activo; no pago duplicado en la misma reunión
  - Post: Operation + LedgerEntries por ítem; LoanTransactionDetail para préstamos
  - Output: { operationId, loanPayments[] }
- PreviewDisbursementPlan
  - Input: { meetingId, newLoanRequests?[] }
  - Pre: meeting activo
  - Post: plan sugerido (pendientes + nuevos préstamos), cálculo de efectivo disponible
  - Output: { plan[], availableCash, totalToDisburse }
- ExecuteDisbursementPlan
  - Input: { meetingId, plan[] }
  - Pre: total solicitado ≤ efectivo disponible
  - Post: operaciones por ítem con Strategy; pending actualizados; transacción atómica
  - Output: { success: true }
- CloseMeeting
  - Input: { meetingId }
  - Pre: meeting activo
  - Post: meeting closed; bloqueo de nuevas operaciones; MeetingClosed event
  - Output: { meetingId, status }

### Pending Member Payments
- CreatePendingMemberPayment
  - Input: { memberId, meetingId, type, amount, notes?, loanId?, stockId?, stockSubscriptionId?, referenceMeetingId?, disbursementType? }
  - Pre: member/meeting activos; coherencia de referencias
  - Post: pendiente en status pending
  - Output: { pendingId }
- SettlePendingMemberPayment
  - Input: { originalPendingId, amountOrQuantity, meetingId }
  - Pre: existe lote original pending; no excede restante
  - Post: crear registro tipo partial_settlement; si resta 0 → status paid
  - Output: { partialSettlementId, fullySettled }

### Accounting
- RecordOperation
  - Input: { memberId?, meetingId, type, description?, ledgerEntries[] }
  - Pre: meeting activo; balance contable (debitos=creditos); ≥ 2 asientos
  - Post: Operation + LedgerEntries; OperationRecorded event
  - Output: { operationId, ledgerEntryIds[] }

### Members
- CreateMember / UpdateMember / DeleteMember (borrado lógico)
  - Inputs: datos del socio
  - Pre: validaciones básicas (unicidad email/identification_number)
  - Post: estado y datos actualizados; eventos opcionales (MemberCreated/Updated/StatusChanged)
  - Outputs: { memberId } / { memberId, status }

## Decisiones de implementación

### Estrategia para pagos parciales (sin modificar BD)

Para soportar múltiples pagos parciales de `PendingMemberPayment` sin modificar el esquema de base de datos:

#### Lotes originales y parciales
- **Lote original**: `status = 'pending'`, `reference_meeting_id = null` o `= meeting_id_original`
- **Pagos parciales**: registros adicionales con `status = 'paid'`, `type = 'partial_settlement'`, `reference_meeting_id = id_del_lote_original`
- **Cálculo de restante**: `amount_original - sum(amount de registros con reference_meeting_id = id_original)`
- **Retiros de acciones**: si `type = 'stock_withdrawal'`, al saldar calcular valor usando `stock_value_history` más reciente a `created_at` del lote vs valor actual (cálculo en caso de uso)

#### Crecimiento de acciones pendientes
- Si una acción pendiente de entrega parcial crece en valor (revaluación mensual), el cálculo debe usar el valor histórico correspondiente a la fecha del lote original, no el valor actual.

## Capas y módulos

- Domain: Entities, VOs, Domain Services y eventos.
- Application: Use cases y puertos.
- Infrastructure: Repositorios concretos, controladores HTTP, mappers DTO↔Domain, decoradores transaccionales.

## Estrategia de migración

1) Infraestructura base
2) Migración por funcionalidad (Members → Stocks → Loans → Meetings → Accounting)
3) Completar funcionalidades faltantes (Payment Board, Planner)

## Criterios de aceptación

- Separación de capas implementada en módulos migrados.
- Contratos de puertos estables y testeados.
- Endpoints actuales funcionando sin regresiones.
- Cobertura ≥ 90% y tests de integración pasando.