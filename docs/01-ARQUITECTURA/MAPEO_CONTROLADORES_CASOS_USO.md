# Mapeo: Controladores → Casos de Uso

**Fecha**: 2025-01-20  
**Objetivo**: Mapear cada endpoint de controladores actuales a casos de uso de la arquitectura hexagonal v2

## 📋 Resumen Ejecutivo

Este documento mapea **50+ endpoints** de **11 controladores** a **21 casos de uso** identificados en la arquitectura v2, además de endpoints de consulta que requieren Query Handlers.

### Clasificación de Endpoints

- **Comandos (Write)**: Mapean directamente a casos de uso
- **Consultas (Read)**: Requieren Query Handlers (CQRS pattern)
- **Migración**: Priorizada por complejidad y dependencias

## 🗺️ Mapeo por Controlador

### 1. MembersController (13 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /members` | Read | Query | `GetMembersQueryHandler` | ⏳ Pendiente | Media |
| `GET /members/:id` | Read | Query | `GetMemberDetailQueryHandler` | ⏳ Pendiente | Alta |
| `GET /members/:id/stocks` | Read | Query | `GetMemberStocksQueryHandler` | ⏳ Pendiente | Media |
| `GET /members/:id/loans` | Read | Query | `GetMemberLoansQueryHandler` | ⏳ Pendiente | Media |
| `GET /members/:id/debt-capacity` | Read | Query | `GetMemberDebtCapacityQueryHandler` | ⏳ Pendiente | Alta |
| `GET /members/:id/summary` | Read | Query | `GetMemberSummaryQueryHandler` | ⏳ Pendiente | Alta |
| `GET /members/:id/stocks/:stockId/history` | Read | Query | `GetMemberStockHistoryQueryHandler` | ⏳ Pendiente | Baja |
| `GET /members/:id/loans/:loanId/installments` | Read | Query | `GetMemberLoanInstallmentsQueryHandler` | ⏳ Pendiente | Media |
| `GET /members/:id/payments` | Read | Query | `GetMemberPaymentsQueryHandler` | ⏳ Pendiente | **Alta** |
| `GET /members/:id/dues` | Read | Query | `GetMemberDuesForActiveMeetingQueryHandler` | ⏳ Pendiente | **Alta** |
| `GET /members/debt-capacity/summary` | Read | Query | `GetOrganizationDebtCapacityQueryHandler` | ⏳ Pendiente | Baja |
| `GET /members/debt-capacity/organization-stats` | Read | Query | `GetOrganizationDebtStatsQueryHandler` | ⏳ Pendiente | Baja |
| `POST /members` | Write | Command | ✅ `CreateMemberUseCase` | ⏳ Pendiente | **Alta** |
| `POST /members/:id/payments` | Write | Command | ✅ `RecordMonthlyPaymentsUseCase` | ⏳ Pendiente | **Alta** |
| `PATCH /members/:id` | Write | Command | ✅ `UpdateMemberUseCase` | ⏳ Pendiente | **Alta** |
| `DELETE /members/:id` | Write | Command | ✅ `DeleteMemberUseCase` (borrado lógico) | ⏳ Pendiente | **Alta** |

**Endpoints sin mapeo directo**: 2 (`POST /members/:id/deactivate`, `POST /members/:id/reactivate` - no se implementarán en v2)  
**Casos de uso necesarios**: 4 (Create, RecordMonthlyPayments, Update, Delete lógico)  
**Query handlers necesarios**: 12

**Notas sobre nuevos endpoints**:
- `GET /members/:id/payments` - Consulta operaciones realizadas por el miembro
  - Query params: `?operationType=MONTHLY_PAYMENT` (opcional), `?meetingId=xxx` (opcional), `?activeMeeting=true` (opcional)
  - Si no hay filtros, retorna todas las operaciones del miembro (historial completo)
  - Si `activeMeeting=true`, automáticamente busca la reunión activa y filtra
- `POST /members/:id/payments` - Registra pago mensual del miembro
  - Prioridad: **Alta** (requerido después de consultar dues)
  - El `memberId` viene del parámetro de ruta `:id`
  - Body: `{ payments: Array<{type, amount, description?, referenceId?}>, meetingId?: string }`
- `GET /members/:id/dues` - Consulta obligaciones pendientes del miembro (solo para reunión activa)
  - Prioridad: **Alta** (requerido antes de registrar pagos mensuales)

---

### 2. MeetingsController (11 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /meetings` | Read | Query | `GetMeetingsQueryHandler` | ⏳ Pendiente | Baja |
| `GET /meetings/active` | Read | Query | `GetActiveMeetingQueryHandler` | ⏳ Pendiente | Alta |
| `GET /meetings/:id/summary` | Read | Query | `GetMeetingSummaryQueryHandler` | ⏳ Pendiente | Alta |
| `GET /meetings/:id/monthly-payments` | Read | Query | `GetMeetingMonthlyPaymentsQueryHandler` | ⏳ Pendiente | Media |
| `POST /meetings` | Write | Command | ✅ `OpenMeetingUseCase` | ⏳ Pendiente | **Alta** |
| `POST /meetings/:meetingId/buy/stocks` | Write | Command | ✅ `CreateStockSubscriptionUseCase` | ⏳ Pendiente | **Alta** |
| `POST /meetings/:meetingId/withdraw/stocks` | Write | Command | ✅ `ModifyStockSubscriptionUseCase` (con withdraw) | ⏳ Pendiente | **Alta** |
| `GET /meetings/:id/disbursement-plan/preview` | Read | Query | ✅ `PreviewDisbursementPlanUseCase` | ⏳ Pendiente | **Alta** |
| `POST /meetings/:id/disbursement-plan/execute` | Write | Command | ✅ `ExecuteDisbursementPlanUseCase` | ⏳ Pendiente | **Alta** |
| `PATCH /meetings/:id/close` | Write | Command | ✅ `CloseMeetingUseCase` | ⏳ Pendiente | **Alta** |

**Endpoints sin mapeo directo**: 0  
**Casos de uso necesarios**: 5 (Open, CreateStockSubscription, ModifyStockSubscription, Preview/ExecuteDisbursement, Close)  
**Query handlers necesarios**: 4

**Nota**: `buy/stocks` y `withdraw/stocks` son variantes del mismo caso de uso con diferentes parámetros.

---

### 3. StocksController (7 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /stocks` | Read | Query | `GetStocksQueryHandler` | ⏳ Pendiente | Baja |
| `GET /stocks/:id` | Read | Query | `GetStockDetailQueryHandler` | ⏳ Pendiente | Media |
| `GET /stocks/member/:memberId/summary` | Read | Query | `GetMemberStocksSummaryQueryHandler` | ⏳ Pendiente | Media |
| `GET /stocks/organization/summary` | Read | Query | `GetOrganizationStocksSummaryQueryHandler` | ⏳ Pendiente | Baja |
| `GET /stocks/performance/analysis` | Read | Query | `GetStocksPerformanceAnalysisQueryHandler` | ⏳ Pendiente | Baja |
| `POST /stocks` | Write | Command | ✅ `CreateStockUseCase` | ⏳ Pendiente | **Alta** |
| `PATCH /stocks/:id` | Write | Command | ✅ `UpdateStockUseCase` | ⏳ Pendiente | **Alta** |
| `POST /stocks/:id/revaluation/preview` | Write | Query | ✅ `PreviewMonthlyRevaluationUseCase` | ⏳ Pendiente | Media |
| `POST /stocks/:id/revaluation/approve` | Write | Command | ✅ `ApproveMonthlyRevaluationUseCase` | ⏳ Pendiente | Media |
| `POST /stocks/:id/revaluation/record` | Write | Command | ✅ `RecordMonthlyRevaluationUseCase` | ⏳ Pendiente | Media |

**Endpoints sin mapeo directo**: 0  
**Casos de uso necesarios**: 5 (Create, Update, Preview, Approve, Record revaluation)  
**Query handlers necesarios**: 5

---

### 4. LoansController (6 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /loans` | Read | Query | `GetLoansQueryHandler` | ⏳ Pendiente | Baja |
| `GET /loans/:id` | Read | Query | `GetLoanDetailQueryHandler` | ⏳ Pendiente | Alta |
| `GET /loans/member/:memberId/summary` | Read | Query | `GetMemberLoansSummaryQueryHandler` | ⏳ Pendiente | Media |
| `GET /loans/organization/summary` | Read | Query | `GetOrganizationLoansSummaryQueryHandler` | ⏳ Pendiente | Baja |
| `GET /loans/performance/analysis` | Read | Query | `GetLoansPerformanceAnalysisQueryHandler` | ⏳ Pendiente | Baja |
| `GET /loans/risk/assessment` | Read | Query | `GetLoansRiskAssessmentQueryHandler` | ⏳ Pendiente | Media |
| `POST /loans` | Write | Command | ✅ `CreateLoanUseCase` | ⏳ Pendiente | **Alta** |
| `POST /loans/:id/disburse` | Write | Command | ✅ `DisburseLoanUseCase` | ⏳ Pendiente | **Alta** |
| `POST /loans/:id/payment` | Write | Command | ✅ `RecordLoanPaymentUseCase` | ⏳ Pendiente | **Alta** |
| `POST /loans/:id/default` | Write | Command | ✅ `MarkLoanDefaultedUseCase` | ⏳ Pendiente | Media |
| `POST /loans/merge` | Write | Command | ✅ `MergeLoansUseCase` | ⏳ Pendiente | Baja |

**Endpoints sin mapeo directo**: 0  
**Casos de uso necesarios**: 5 (Create, Disburse, RecordPayment, MarkDefaulted, Merge)  
**Query handlers necesarios**: 7

---

### 5. LedgerEntriesController (4 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /ledger-entries` | Read | Query | `GetLedgerEntriesQueryHandler` | ⏳ Pendiente | Media |
| `GET /ledger-entries/account-types` | Read | Query | `GetAccountTypesQueryHandler` | ⏳ Pendiente | Baja |
| `GET /ledger-entries/meeting/:meetingId` | Read | Query | `GetMeetingLedgerEntriesQueryHandler` | ⏳ Pendiente | Alta |
| `GET /ledger-entries/account-type/:accountType` | Read | Query | `GetLedgerEntriesByAccountTypeQueryHandler` | ⏳ Pendiente | Media |

**Endpoints sin mapeo directo**: 0  
**Casos de uso necesarios**: 0 (solo consultas)  
**Query handlers necesarios**: 4

**Nota**: LedgerEntries se crean indirectamente a través de `RecordOperationUseCase`, no tienen endpoints de creación directa.

---

### 6. OperationsController (2 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /operations` | Read | Query | `GetOperationsQueryHandler` | ⏳ Pendiente | Media |
| `GET /operations/:id` | Read | Query | `GetOperationDetailQueryHandler` | ⏳ Pendiente | Media |
| `POST /operations` | Write | Command | ✅ `RecordOperationUseCase` | ⏳ Pendiente | **Alta** |

**Endpoints sin mapeo directo**: 0  
**Casos de uso necesarios**: 1 (RecordOperation)  
**Query handlers necesarios**: 2

---

### 7. StockSubscriptionsController (4 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /stock-subscriptions` | Read | Query | `GetStockSubscriptionsQueryHandler` | ⏳ Pendiente | Baja |
| `GET /stock-subscriptions/:id` | Read | Query | `GetStockSubscriptionDetailQueryHandler` | ⏳ Pendiente | Media |
| `POST /stock-subscriptions` | Write | Command | ✅ `CreateStockSubscriptionUseCase` | ⏳ Pendiente | **Alta** |
| `POST /stock-subscriptions/:id/modify` | Write | Command | ✅ `ModifyStockSubscriptionUseCase` | ⏳ Pendiente | Media |
| `POST /stock-subscriptions/transfer` | Write | Command | ✅ `TransferStockSubscriptionUseCase` | ⏳ Pendiente | Media |

**Endpoints sin mapeo directo**: 0  
**Casos de uso necesarios**: 3 (Create, Modify, Transfer)  
**Query handlers necesarios**: 2

---

### 8. DuesController (1 endpoint legacy - no migrar a v2)

| Endpoint Legacy | Método | Tipo | Migración v2 | Estado | Prioridad |
|-----------------|--------|------|--------------|--------|-----------|
| `GET /dues/active-meeting/member/:memberId` | Read | Query | ✅ Migrado a `GET /members/:id/dues` | ⏳ Pendiente | **Alta** |
| `GET /dues/member/:memberId` | Read | Query | ⚠️ **No se migrará** (use `GET /members/:id/payments` para historial) | ⏳ Pendiente | - |
| `POST /dues` | Write | Command | ⚠️ **No existe en arquitectura v2** (parte de `RecordMonthlyPaymentsUseCase`) | ⏳ Pendiente | - |

**Endpoints v2 equivalentes**:
- `GET /members/:id/dues` - Obligaciones pendientes para reunión activa ✅
- `GET /members/:id/payments?operationType=MONTHLY_PAYMENT` - Pagos mensuales ya realizados ✅

**Observación**: 
- **Dues (obligaciones pendientes)**: Se consultan antes de registrar pagos mediante `GET /members/:id/dues`
- **Payments (pagos realizados)**: Se consultan después de pagar mediante `GET /members/:id/payments`
- El `POST /dues` legacy no existe en v2 porque el registro se hace mediante `RecordMonthlyPaymentsUseCase`

---

### 9. DividendsController (2 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /dividends` | Read | Query | `GetDividendsQueryHandler` | ⏳ Pendiente | Baja |
| `POST /dividends` | Write | Command | ⚠️ **Puede ser parte de** `CreatePendingMemberPaymentUseCase` | ⏳ Pendiente | Media |

**Endpoints sin mapeo directo**: 1  
**Casos de uso necesarios**: Probablemente parte de `CreatePendingMemberPaymentUseCase`  
**Query handlers necesarios**: 1

---

### 10. LoanTransactionsController (2 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /loan-transactions` | Read | Query | `GetLoanTransactionsQueryHandler` | ⏳ Pendiente | Media |
| `GET /loan-transactions/loan/:loanId` | Read | Query | `GetLoanTransactionsByLoanQueryHandler` | ⏳ Pendiente | Media |

**Endpoints sin mapeo directo**: 0  
**Casos de uso necesarios**: 0 (se crean indirectamente con `RecordLoanPaymentUseCase`)  
**Query handlers necesarios**: 2

---

### 11. AssetRevaluationController (2 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /asset-revaluation/:meetingId/preview` | Read | Query | ✅ `PreviewMonthlyRevaluationUseCase` | ⏳ Pendiente | Media |
| `POST /asset-revaluation/:meetingId/execute` | Write | Command | ✅ `RecordMonthlyRevaluationUseCase` | ⏳ Pendiente | Media |

**Endpoints sin mapeo directo**: 0  
**Casos de uso necesarios**: 2 (Preview, Record)  
**Query handlers necesarios**: 0 (Preview es query pero usa caso de uso)

---

### 12. MandatoryContributionsController (5 endpoints)

✅ **MIGRADO A V2**: Implementación completa con arquitectura hexagonal

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /v2/mandatory-contributions` | Read | Query | `GetMandatoryContributionsQueryHandler` | ✅ Completado | Media |
| `GET /v2/mandatory-contributions/:id` | Read | Query | `GetMandatoryContributionDetailQueryHandler` | ✅ Completado | Media |
| `POST /v2/mandatory-contributions` | Write | Command | `CreateMandatoryContributionUseCase` | ✅ Completado | Media |
| `PATCH /v2/mandatory-contributions/:id` | Write | Command | `UpdateMandatoryContributionUseCase` | ✅ Completado | Media |
| `DELETE /v2/mandatory-contributions/:id` | Write | Command | `DeleteMandatoryContributionUseCase` | ✅ Completado | Media |

**Endpoints sin mapeo directo**: 0 (todos tienen mapeo definido)  
**Casos de uso necesarios**: 3 (Create, Update, Delete) ✅  
**Query handlers necesarios**: 2 (GetAll, GetDetail) ✅  
**Estado del diseño**: ✅ Migración completada (2025-01-20)

---

## 📊 Resumen Consolidado

### Casos de Uso Mapeados (27 casos de uso definidos)

| Dominio | Casos de Uso | Endpoints Mapeados | Prioridad Alta |
|---------|--------------|-------------------|----------------|
| **Members** | 4 | 6 | ✅ 4 (Create, RecordMonthlyPayments, Update, Delete) + 2 Query Handlers (Dues, Payments) |
| **Meetings** | 5 | 5 | ✅ 5 (Open, CreateStockSubscription, ModifyStockSubscription, Preview/ExecuteDisbursement, Close) |
| **Loans** | 5 | 5 | ✅ 3 (Create, Disburse, RecordPayment) |
| **Stocks** | 7 | 6 | ✅ 1 (Create) |
| **Pending Payments** | 2 | 2 (dividends, otros) | ✅ 2 (Create, Settle) |
| **Accounting** | 1 | 1 | ✅ 1 (RecordOperation) |
| **Mandatory Contributions** | 3 | 5 | ✅ 3 (Create, Update, Delete) + 2 Query Handlers |
| **Dues** | 0 | 0 | 0 (solo Query Handlers) |
| **Total** | **27** | **29** | **18** |

**Nota**: El endpoint `POST /members/:id/payments` fue movido desde `POST /meetings/active/record-monthly-payment` para mantener consistencia con `GET /members/:id/payments` y agrupar todos los recursos relacionados con pagos bajo el miembro.

**Nota**: Las Dues no tienen casos de uso (solo consultas), tienen **1 Query Handler**:
- `GetMemberDuesForActiveMeetingQueryHandler` - **Prioridad Alta** (endpoint: `GET /members/:id/dues`)
- Los pagos realizados se consultan mediante `GetMemberPaymentsQueryHandler` (endpoint: `GET /members/:id/payments`)

### Endpoints sin Mapeo Directo

1. `POST /members/:id/deactivate` - No se implementará en v2 (usar DELETE para borrado lógico)
2. `POST /members/:id/reactivate` - No se implementará en v2
3. `POST /dues` - Registrar due (probablemente parte de RecordMonthlyPayments)

**Total**: 3 endpoints (2 de members no implementados + 1 de dues)

### Query Handlers Necesarios (≈40+)

Todos los endpoints `GET` requieren Query Handlers siguiendo el patrón CQRS.

---

## 🎯 Plan de Migración Priorizado

### Fase 1: Fundaciones (Sprint 1-2)

**Objetivo**: Establecer infraestructura base y módulos más simples

1. **Members (Create, Update, Delete lógico)**
   - `CreateMemberUseCase` ✅
   - `UpdateMemberUseCase` ✅
   - `DeleteMemberUseCase` ✅ (alias de borrado lógico: desactivación)
   - Prioridad: **Alta** (base para otros módulos)

2. **Meetings (Open, Close)**
   - `OpenMeetingUseCase` ✅
   - `CloseMeetingUseCase` ✅
   - Prioridad: **Alta** (contexto para todas las operaciones)

3. **Stocks (Create, Update)**
   - `CreateStockUseCase` ✅
   - `UpdateStockUseCase` ✅
   - Prioridad: **Alta** (necesario para crear suscripciones después)

4. **Mandatory Contributions (CRUD)**
   - `CreateMandatoryContributionUseCase` ✅
   - `UpdateMandatoryContributionUseCase` ✅
   - `DeleteMandatoryContributionUseCase` ✅
   - `GetMandatoryContributionsQueryHandler` ✅
   - `GetMandatoryContributionDetailQueryHandler` ✅
   - Prioridad: **Media** (configuración del sistema)

### Fase 2: Operaciones Core (Sprint 3-4)

**Objetivo**: Habilitar flujos principales de negocio

1. **Dues (Consultar obligaciones pendientes)** - PRIMERO
   - `GetMemberDuesForActiveMeetingQueryHandler` ⏳
   - Endpoint: `GET /members/:id/dues`
   - Prioridad: **Alta** (base para el flujo de pagos)
   - Dependencias: `DuesCalculationService` (domain service), `MandatoryContributionRepository`, `StockSubscriptionRepository`, `LoanRepository`, `MeetingRepository` (para obtener reunión activa)

2. **Payments (Registrar pago mensual)** - SEGUNDO
   - `RecordMonthlyPaymentsUseCase` ✅
   - Endpoint: `POST /members/:id/payments` ✅
   - Prioridad: **Alta**
   - Dependencias: `MeetingRepository`, `MemberRepository`, `OperationRepository`, `LedgerEntryRepository`, `MandatoryContributionRepository`
   - **Nota**: Requiere `GetMemberDuesForActiveMeetingQueryHandler` implementado previamente
   - **Input**: `{ payments: Array<{type, amount, description?, referenceId?}>, meetingId?: string }`
   - **Response**: `{ operationId, meetingId, memberId, totalAmount, ledgerEntryIds }`

3. **Payments (Consultar pagos realizados)** - TERCERO
   - `GetMemberPaymentsQueryHandler` ⏳
   - Endpoint: `GET /members/:id/payments`
   - Query params: `?operationType=MONTHLY_PAYMENT` (opcional), `?meetingId=xxx` (opcional), `?activeMeeting=true` (opcional)
   - Prioridad: **Alta** (consulta después de registrar pagos)
   - Dependencias: `OperationRepository`, `MeetingRepository` (para filtrar por reunión activa)

4. **Stocks (Create Subscription)**
   - `CreateStockSubscriptionUseCase` ✅
   - Prioridad: **Alta**

5. **Loans (Create, Disburse)**
   - `CreateLoanUseCase` ✅
   - `DisburseLoanUseCase` ✅
   - Prioridad: **Alta**

### Fase 3: Operaciones Complejas (Sprint 5-6)

6. **Stocks (Modify, Transfer)**
   - `ModifyStockSubscriptionUseCase` ✅
   - `TransferStockSubscriptionUseCase` ✅
   - Prioridad: Media

7. **Loans (Payment, Default)**
   - `RecordLoanPaymentUseCase` ✅
   - `MarkLoanDefaultedUseCase` ✅
   - Prioridad: Media

8. **Meetings (Disbursement Plan)**
   - `PreviewDisbursementPlanUseCase` ✅
   - `ExecuteDisbursementPlanUseCase` ✅
   - Prioridad: **Alta**

### Fase 4: Operaciones Financieras (Sprint 7-8)

9. **Accounting**
   - `RecordOperationUseCase` ✅
   - Prioridad: **Alta** (base para contabilidad)

10. **Pending Payments**
    - `CreatePendingMemberPaymentUseCase` ✅
    - `SettlePendingMemberPaymentUseCase` ✅
    - Prioridad: Media

### Fase 5: Revaluación y Análisis (Sprint 9-10)

11. **Stocks (Revaluation)**
    - `PreviewMonthlyRevaluationUseCase` ✅
    - `ApproveMonthlyRevaluationUseCase` ✅
    - `RecordMonthlyRevaluationUseCase` ✅
    - Prioridad: Media

12. **Loans (Merge)**
    - `MergeLoansUseCase` ✅
    - Prioridad: Baja

### Fase 6: Consultas (Sprint 11+)

13. **Query Handlers** (implementar según necesidad)
    - Prioridad: Media/Baja (según uso)

---

## 📝 Contratos por Caso de Uso

### Módulo: Members

#### CreateMemberUseCase
- **Input**: `CreateMemberDto` (identificationNumber, firstName, lastName, email?, phone?, registrationDate)
- **Output**: `CreateMemberResponseDto` (memberId)
- **Puertos**: `MemberRepository`
- **Endpoints mapeados**: `POST /members`

#### UpdateMemberUseCase
- **Input**: `UpdateMemberDto` (memberId, firstName?, lastName?, email?, phone?)
- **Output**: `UpdateMemberResponseDto` (memberId, updatedFields)
- **Puertos**: `MemberRepository`
- **Endpoints mapeados**: `PATCH /members/:id`

#### DeleteMemberUseCase (borrado lógico)
- **Input**: `DeleteMemberDto` (memberId)
- **Output**: `DeleteMemberResponseDto` (memberId, status: 'inactive')
- **Puertos**: `MemberRepository`
- **Endpoints mapeados**: `DELETE /members/:id`
- **Notas**: El borrado lógico marca el miembro como eliminado (soft delete) y lo pone en estado inactive. Los endpoints `/members/:id/deactivate` y `/members/:id/reactivate` no se implementarán en la arquitectura v2.

#### RecordMonthlyPaymentsUseCase
- **Input**: `RecordMonthlyPaymentsDto` (payments[], meetingId?)
  - `payments`: Array<{type: 'MANDATORY_CONTRIBUTION' | 'STOCK_FEE' | 'LOAN_PAYMENT' | 'FEE' | 'NOVELTY', amount: number, description?: string, referenceId?: string}>
  - `meetingId?`: string (opcional, si no viene usa reunión activa)
- **Output**: `RecordMonthlyPaymentsResponseDto` (operationId, meetingId, memberId, totalAmount, ledgerEntryIds[])
- **Puertos**: `MeetingRepository`, `MemberRepository`, `OperationRepository`, `LedgerEntryRepository`, `MandatoryContributionRepository`
- **Endpoints mapeados**: `POST /members/:id/payments`
- **Nota**: El `memberId` viene del parámetro de ruta `:id`. El endpoint es más RESTful agrupando recursos del miembro bajo `/members/:id/payments`.

### Módulo: Meetings

#### OpenMeetingUseCase
- **Input**: `OpenMeetingDto` (date?)
- **Output**: `OpenMeetingResponseDto` (meetingId, date, status)
- **Puertos**: `MeetingRepository`
- **Endpoints mapeados**: `POST /meetings`
- **Nota**: EventBus no se implementará en el corto plazo. Los eventos de dominio se pueden agregar en el futuro si se requiere.

#### PreviewDisbursementPlanUseCase
- **Input**: `PreviewDisbursementPlanDto` (meetingId, newLoanRequests?)
- **Output**: `PreviewDisbursementPlanResponseDto` (plan[], availableCash, totalToDisburse)
- **Puertos**: `MeetingRepository`, `PendingMemberPaymentRepository`, `CashBalanceCalculator` (domain service)
- **Endpoints mapeados**: `GET /meetings/:id/disbursement-plan/preview`

#### ExecuteDisbursementPlanUseCase
- **Input**: `ExecuteDisbursementPlanDto` (meetingId, plan[])
- **Output**: `ExecuteDisbursementPlanResponseDto` (executedItems[], totalDisbursed)
- **Puertos**: `MeetingRepository`, `PendingMemberPaymentRepository`, `OperationRepository`, `LedgerEntryRepository`, `LoanRepository`, `StockSubscriptionRepository`
- **Endpoints mapeados**: `POST /meetings/:id/disbursement-plan/execute`

#### CloseMeetingUseCase
- **Input**: `CloseMeetingDto` (meetingId)
- **Output**: `CloseMeetingResponseDto` (meetingId, closedAt)
- **Puertos**: `MeetingRepository`
- **Endpoints mapeados**: `PATCH /meetings/:id/close`
- **Nota**: EventBus no se implementará en el corto plazo. Los eventos de dominio se pueden agregar en el futuro si se requiere.

### Módulo: Loans

#### CreateLoanUseCase
- **Input**: `CreateLoanDto` (memberId, loanType, approvedAmount, monthlyPaymentAmount, interestRate, term, guaranteedStockId?)
- **Output**: `CreateLoanResponseDto` (loanId, status)
- **Puertos**: `LoanRepository`, `MemberRepository`, `StockRepository`, `DebtCapacityService` (domain service)
- **Endpoints mapeados**: `POST /loans`

#### DisburseLoanUseCase
- **Input**: `DisburseLoanDto` (loanId, amount, meetingId, notes?)
- **Output**: `DisburseLoanResponseDto` (loanId, disbursedAmount, operationId)
- **Puertos**: `LoanRepository`, `MeetingRepository`, `OperationRepository`, `LedgerEntryRepository`
- **Endpoints mapeados**: `POST /loans/:id/disburse`

#### RecordLoanPaymentUseCase
- **Input**: `RecordLoanPaymentDto` (loanId, principal?, interest?, meetingId)
- **Output**: `RecordLoanPaymentResponseDto` (loanId, transactionId, remainingBalance)
- **Puertos**: `LoanRepository`, `LoanTransactionDetailRepository`, `MeetingRepository`, `OperationRepository`, `LedgerEntryRepository`
- **Endpoints mapeados**: `POST /loans/:id/payment`

#### MarkLoanDefaultedUseCase
- **Input**: `MarkLoanDefaultedDto` (loanId, reason?, occurredAt?)
- **Output**: `MarkLoanDefaultedResponseDto` (loanId, status, defaultedAt)
- **Puertos**: `LoanRepository`
- **Endpoints mapeados**: `POST /loans/:id/default`
- **Nota**: EventBus no se implementará en el corto plazo. Los eventos de dominio se pueden agregar en el futuro si se requiere.

#### MergeLoansUseCase
- **Input**: `MergeLoansDto` (memberId, loanIds[], policy)
- **Output**: `MergeLoansResponseDto` (mergedLoanId, consolidatedBalance)
- **Puertos**: `LoanRepository`, `LoanTransactionDetailRepository`
- **Endpoints mapeados**: `POST /loans/merge`

### Módulo: Stocks

#### CreateStockUseCase
- **Input**: `CreateStockDto` (type, value, monthly_contribution, behavior?)
  - `type`: string - Tipo o nombre de la acción (ej: "preferential")
  - `value`: number - Valor inicial de una unidad de acción (≥ 0)
  - `monthly_contribution`: number - Contribución mensual obligatoria (≥ 0)
  - `behavior?`: StockBehavior - Comportamiento (CAPITAL_APPRECIATION | DIVIDENDS, default: CAPITAL_APPRECIATION)
- **Output**: `CreateStockResponseDto` (stockId, type, value, monthly_contribution, behavior)
- **Puertos**: `StockRepository`
- **Endpoints mapeados**: `POST /stocks`

#### UpdateStockUseCase
- **Input**: `UpdateStockDto` (stockId, type?, value?, monthly_contribution?, behavior?)
- **Output**: `UpdateStockResponseDto` (stockId, updatedFields)
- **Puertos**: `StockRepository`
- **Endpoints mapeados**: `PATCH /stocks/:id`

#### CreateStockSubscriptionUseCase
- **Input**: `CreateStockSubscriptionDto` (memberId, stockId, quantity, meetingId, paymentMethod)
- **Output**: `CreateStockSubscriptionResponseDto` (subscriptionId, operationId, ledgerEntryIds[], historyId?)
- **Puertos**: `StockSubscriptionRepository`, `MemberRepository`, `StockRepository`, `MeetingRepository`, `OperationRepository`, `LedgerEntryRepository`, `StockValueHistoryRepository`, `OperationBalanceValidator` (domain service)
- **Endpoints mapeados**: 
  - `POST /stock-subscriptions`
  - `POST /meetings/:meetingId/buy/stocks`

#### ModifyStockSubscriptionUseCase
- **Input**: `ModifyStockSubscriptionDto` (memberId, meetingId, fromSubscriptionId, fromQuantity, toStockId?, toQuantity?, transferSubscriptionId?, toMemberId?, notes?)
- **Output**: `ModifyStockSubscriptionResponseDto` (modifiedSubscriptionId, newSubscriptionId?, operationId)
- **Puertos**: `StockSubscriptionRepository`, `MemberRepository`, `StockRepository`, `MeetingRepository`, `OperationRepository`, `LedgerEntryRepository`
- **Endpoints mapeados**: 
  - `POST /stock-subscriptions/:id/modify`
  - `POST /meetings/:meetingId/withdraw/stocks`

#### TransferStockSubscriptionUseCase
- **Input**: `TransferStockSubscriptionDto` (fromMemberId, toMemberId, stockId, quantity, meetingId, fromSubscriptionId?)
- **Output**: `TransferStockSubscriptionResponseDto` (transferSubscriptionId, operationId)
- **Puertos**: `StockSubscriptionRepository`, `MemberRepository`, `StockRepository`, `MeetingRepository`, `OperationRepository`, `LedgerEntryRepository`
- **Endpoints mapeados**: `POST /stock-subscriptions/transfer`

#### PreviewMonthlyRevaluationUseCase
- **Input**: `PreviewMonthlyRevaluationDto` (meetingId)
- **Output**: `PreviewMonthlyRevaluationResponseDto` (total_contributions, total_interest, total_to_distribute, details[])
- **Puertos**: `StockRepository`, `StockSubscriptionRepository`, `StockValueHistoryRepository`, `AssetRevaluationService` (domain service)
- **Endpoints mapeados**: 
  - `GET /asset-revaluation/:meetingId/preview`
  - `POST /stocks/:id/revaluation/preview`

#### ApproveMonthlyRevaluationUseCase
- **Input**: `ApproveMonthlyRevaluationDto` (meetingId, approvalBy, notes?)
- **Output**: `ApproveMonthlyRevaluationResponseDto` (meetingId, approvedAt)
- **Puertos**: `MeetingRepository`, `StockValueHistoryRepository`
- **Endpoints mapeados**: `POST /stocks/:id/revaluation/approve`

#### RecordMonthlyRevaluationUseCase
- **Input**: `RecordMonthlyRevaluationDto` (meetingId, revaluationDetails[])
- **Output**: `RecordMonthlyRevaluationResponseDto` (historyIds[], operationId)
- **Puertos**: `MeetingRepository`, `StockValueHistoryRepository`, `StockSubscriptionRepository`, `OperationRepository`, `LedgerEntryRepository`, `AssetRevaluationService` (domain service)
- **Endpoints mapeados**: 
  - `POST /asset-revaluation/:meetingId/execute`
  - `POST /stocks/:id/revaluation/record`

### Módulo: Pending Payments

#### CreatePendingMemberPaymentUseCase
- **Input**: `CreatePendingMemberPaymentDto` (memberId, meetingId, type, amount, notes?, loanId?, stockId?, stockSubscriptionId?, referenceMeetingId?, disbursementType?)
- **Output**: `CreatePendingMemberPaymentResponseDto` (pendingId, status)
- **Puertos**: `PendingMemberPaymentRepository`, `MemberRepository`, `MeetingRepository`
- **Endpoints mapeados**: 
  - `POST /dividends` (si es tipo dividend)

#### SettlePendingMemberPaymentUseCase
- **Input**: `SettlePendingMemberPaymentDto` (originalPendingId, amountOrQuantity, meetingId)
- **Output**: `SettlePendingMemberPaymentResponseDto` (settledId, remainingAmount)
- **Puertos**: `PendingMemberPaymentRepository`, `MeetingRepository`, `OperationRepository`, `LedgerEntryRepository`
- **Endpoints mapeados**: Implícito en `ExecuteDisbursementPlanUseCase`

### Módulo: Accounting

#### RecordOperationUseCase
- **Input**: `