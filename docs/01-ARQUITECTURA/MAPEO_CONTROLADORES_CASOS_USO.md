# Mapeo: Controladores → Casos de Uso

**Fecha**: 2025-01-20  
**Última actualización**: 2025-11-20  
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
| `GET /members` | Read | Query | `GetMembersQueryHandler` | ✅ Implementado | Media |
| `GET /members/:id` | Read | Query | `GetMemberDetailQueryHandler` | ✅ Implementado | Alta |
| `GET /members/:id/stocks` | Read | Query | `GetMemberStocksQueryHandler` | ⏳ Pendiente | Baja |
| `GET /members/:id/loans` | Read | Query | `GetMemberLoansQueryHandler` | ⏳ Pendiente | Alta |
| `GET /members/:id/debt-capacity` | Read | Query | `GetMemberDebtCapacityQueryHandler` | ⏳ Pendiente | Baja |
| `GET /members/:id/summary` | Read | Query | `GetMemberSummaryQueryHandler` | ⏳ Pendiente | Baja |
| `GET /members/:id/stocks/:stockId/history` | Read | Query | `GetMemberStockHistoryQueryHandler` | ⏳ Pendiente | Baja |
| `GET /members/:id/loans/:loanId/installments` | Read | Query | `GetMemberLoanInstallmentsQueryHandler` | ⏳ Pendiente | Baja |
| `GET /members/:id/payments` | Read | Query | `GetMemberPaymentsQueryHandler` | ✅ Implementado | **Alta** |
| `GET /members/:id/dues` | Read | Query | `GetMemberDuesForActiveMeetingQueryHandler` | ✅ Implementado | **Alta** |
| `GET /members/:id/insurance` | Read | Query | `CalculateMemberInsuranceUseCase` | ✅ Implementado | Media |
| `GET /members/:id/purchases` | Read | Query | `GetMemberPurchasesQueryHandler` | ✅ Implementado | Media |
| `GET /members/debt-capacity/summary` | Read | Query | `GetOrganizationDebtCapacityQueryHandler` | ⏳ Pendiente | Baja |
| `GET /members/debt-capacity/organization-stats` | Read | Query | `GetOrganizationDebtStatsQueryHandler` | ⏳ Pendiente | Baja |
| `POST /members` | Write | Command | ✅ `CreateMemberUseCase` | ✅ Implementado | **Alta** |
| `POST /members/:id/payments` | Write | Command | ✅ `RecordMonthlyPaymentsUseCase` | ✅ Implementado | **Alta** |
| `POST /members/:id/purchase` | Write | Command | ✅ `PurchaseStockUseCase` | ✅ Implementado | **Alta** |
| `POST /members/:id/purchase/exchange` | Write | Command | ✅ `ProcessStockExchangeUseCase` | ✅ Implementado | Media |
| `POST /members/:id/purchase/transfer` | Write | Command | ✅ `ProcessStockTransferUseCase` | ✅ Implementado | Media |
| `POST /members/:id/purchase/loan-payment` | Write | Command | ✅ `ProcessStockLoanPaymentUseCase` | ✅ Implementado | Media |
| `PATCH /members/:id` | Write | Command | ✅ `UpdateMemberUseCase` | ✅ Implementado | **Alta** |
| `DELETE /members/:id` | Write | Command | ✅ `DeleteMemberUseCase` (borrado lógico) | ✅ Implementado | **Alta** |

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
| `GET /meetings` | Read | Query | `GetMeetingsQueryHandler` | ✅ Implementado | Baja |
| `GET /meetings/active` | Read | Query | `GetActiveMeetingQueryHandler` | ✅ Implementado | Alta |
| `GET /meetings/:id` | Read | Query | `GetMeetingQueryHandler` | ✅ Implementado | Alta |
| `GET /meetings/:id/summary` | Read | Query | `GetMeetingSummaryQueryHandler` | ⏳ Pendiente | Baja |
| `GET /meetings/:id/payments` | Read | Query | `GetMeetingMonthlyPaymentsQueryHandler` | ✅ Implementado | Media |
| `GET /meetings/:id/purchases` | Read | Query | `GetMeetingPurchasesQueryHandler` | ✅ Implementado | Media |
| `GET /meetings/:id/transfers` | Read | Query | `GetMeetingStockTransfersQueryHandler` | ✅ Implementado | Media |
| `GET /meetings/:id/exchanges` | Read | Query | `GetMeetingStockExchangesQueryHandler` | ✅ Implementado | Media |
| `GET /meetings/:id/stock-loan-payments` | Read | Query | `GetMeetingStockLoanPaymentsQueryHandler` | ✅ Implementado | Media |
| `GET /meetings/:id/revaluation` | Read | Query | `GetRevaluationQueryHandler` | ✅ Implementado | Media |
| `PATCH /meetings/:id/revaluation/confirm` | Write | Command | ✅ `RecordRevaluationUseCase` | ✅ Implementado | Media |
| `GET /meetings/:id/disbursement-plan` | Read | Query | ✅ `PreviewDisbursementPlanUseCase` | ✅ Implementado | **Alta** |
| `POST /meetings/:id/disbursement-plan` | Write | Command | ✅ `ExecuteDisbursementPlanUseCase` | ✅ Implementado | **Alta** |
| `POST /meetings` | Write | Command | ✅ `OpenMeetingUseCase` | ✅ Implementado | **Alta** |
| `PATCH /meetings/:id/close` | Write | Command | ✅ `CloseMeetingUseCase` | ✅ Implementado | **Alta** |

**Endpoints sin mapeo directo**: 0  
**Casos de uso necesarios**: 5 (Open, CreateStockSubscription, ModifyStockSubscription, Preview/ExecuteDisbursement, Close)  
**Query handlers necesarios**: 4

**Nota**: `buy/stocks` y `withdraw/stocks` son variantes del mismo caso de uso con diferentes parámetros.

---

### 3. StocksController (7 endpoints)

| Endpoint | Método | Tipo | Caso de Uso / Query Handler | Estado | Prioridad |
|----------|--------|------|------------------------------|--------|-----------|
| `GET /stocks` | Read | Query | `GetStocksQueryHandler` | ✅ Implementado | Baja |
| `GET /stocks/:id` | Read | Query | `GetStockDetailQueryHandler` | ✅ Implementado | Media |
| `GET /stocks/member/:memberId/summary` | Read | Query | `GetMemberStocksSummaryQueryHandler` | ⏳ Pendiente | Baja |
| `GET /stocks/organization/summary` | Read | Query | `GetOrganizationStocksSummaryQueryHandler` | ⏳ Pendiente | Baja |
| `GET /stocks/performance/analysis` | Read | Query | `GetStocksPerformanceAnalysisQueryHandler` | ⏳ Pendiente | Baja |
| `GET /stocks/history` | Read | Query | `GetStocksHistoryQueryHandler` | ⏳ Pendiente | Baja |
| `POST /stocks` | Write | Command | ✅ `CreateStockUseCase` | ✅ Implementado | **Alta** |
| `PATCH /stocks/:id` | Write | Command | ✅ `UpdateStockUseCase` | ✅ Implementado | **Alta** |
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
| `GET /loans/:id` | Read | Query | `GetLoanDetailQueryHandler` | ⏳ Pendiente | **Alta** |
| `GET /loans/member/:memberId` | Read | Query | `GetMemberLoansQueryHandler` | ⏳ Pendiente | **Alta** |
| `GET /loans/member/:memberId/active` | Read | Query | `GetMemberActiveLoansQueryHandler` | ⏳ Pendiente | **Alta** |
| `GET /loans/member/:memberId/capacity` | Read | Query | `GetMemberDebtCapacityQueryHandler` | ⏳ Pendiente | **Alta** |
| `GET /loans/member/:memberId/summary` | Read | Query | `GetMemberLoansSummaryQueryHandler` | ⏳ Pendiente | Baja |
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
| `GET /operations` | Read | Query | `GetOperationsQueryHandler` | ⏳ Pendiente | **Alta** |
| `GET /operations/:id` | Read | Query | `GetOperationDetailQueryHandler` | ⏳ Pendiente | **Alta** |
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
| `GET /dividends/pending` | Read | Query | `GetDividendsQueryHandler` | ⏳ Pendiente | Baja |
| `GET /dividends/history` | Read | Query | `GetDividendsHistoryQueryHandler` | ⏳ Pendiente | Baja |
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

### Fase 7: Endpoints Críticos Faltantes (Sprint 12-13) - NUEVO

**Objetivo**: Implementar endpoints críticos identificados en análisis del frontend

14. **Operations (Consultas)**
    - `GetOperationsQueryHandler` - `GET /v2/operations`
    - `GetOperationDetailQueryHandler` - `GET /v2/operations/:id`
    - Prioridad: **Alta** (usado frecuentemente en frontend)

15. **Loans (Consultas)**
    - `GetLoanDetailQueryHandler` - `GET /v2/loans/:id`
    - `GetMemberLoansQueryHandler` - `GET /v2/members/:id/loans` o `GET /v2/loans/member/:id`
    - `GetMemberActiveLoansQueryHandler` - `GET /v2/members/:id/loans/active` o `GET /v2/loans/member/:id/active`
    - `GetMemberDebtCapacityQueryHandler` - `GET /v2/members/:id/debt-capacity` o `GET /v2/loans/member/:id/capacity`
    - Prioridad: **Alta** (usado en flujos principales)

16. **Stock Subscriptions (Consultas)**
    - `GetMemberStockSubscriptionsQueryHandler` - `GET /v2/members/:id/stock-subscriptions`
    - Prioridad: **Alta** (necesario para vista de acciones)

### Fase 8: Endpoints de Historial y Reportes (Sprint 14) - NUEVO

**Objetivo**: Implementar endpoints de historial y reportes

17. **Stocks History**
    - `GetStocksHistoryQueryHandler` - `GET /v2/stocks/history`
    - Prioridad: Media

18. **Dividends**
    - `GetDividendsQueryHandler` - `GET /v2/dividends/pending`
    - `GetDividendsHistoryQueryHandler` - `GET /v2/dividends/history`
    - Prioridad: Media

### Fase 9: Endpoints de Vista de Detalle (Sprint 15+) - NUEVO

**Objetivo**: Implementar endpoints de resumen para mejorar rendimiento (opcional, pueden construirse en frontend)

19. **Member Detail Endpoints**
    - `GetMemberSummaryQueryHandler` - `GET /v2/members/:id/summary`
    - `GetMemberStocksQueryHandler` - `GET /v2/members/:id/stocks`
    - `GetMemberStockHistoryQueryHandler` - `GET /v2/members/:id/stocks/:stockId/history`
    - `GetMemberLoanInstallmentsQueryHandler` - `GET /v2/members/:id/loans/:loanId/installments`
    - Prioridad: Baja (pueden construirse combinando otros endpoints V2)

20. **Organization Stats**
    - `GetOrganizationDebtCapacityQueryHandler` - `GET /v2/members/debt-capacity/summary`
    - `GetOrganizationDebtStatsQueryHandler` - `GET /v2/members/debt-capacity/organization-stats`
    - Prioridad: Baja (reportes ejecutivos)

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
- **Input**: `RecordOperationDto` (operation data)
- **Output**: `RecordOperationResponseDto` (operationId, ledgerEntryIds[])
- **Puertos**: `OperationRepository`, `LedgerEntryRepository`
- **Endpoints mapeados**: `POST /operations`

---

## 🔍 Análisis de Endpoints Faltantes en V2 (2025-11-20)

### Resumen del Análisis

Se realizó un análisis exhaustivo del código del frontend para identificar todos los endpoints V1 que se están llamando directamente, comparándolos con los endpoints V2 disponibles en el backend. Este análisis reveló **23 endpoints críticos** que aún no tienen equivalente V2.

### Endpoints Críticos Faltantes (Prioridad Alta)

#### 1. Operations (2 endpoints)
| Endpoint V1 | Estado V2 | Prioridad | Query Handler Necesario |
|-------------|-----------|-----------|------------------------|
| `GET /operations/:id` | ⏳ Falta | **Alta** | `GetOperationDetailQueryHandler` |
| `GET /operations?meetingId=X&operationType=Y` | ⏳ Falta | **Alta** | `GetOperationsQueryHandler` |

**Uso actual**: `operationsService.ts` - Usado para consultar operaciones con filtros y detalles específicos.

#### 2. Loans (4 endpoints)
| Endpoint V1 | Estado V2 | Prioridad | Query Handler Necesario |
|-------------|-----------|-----------|------------------------|
| `GET /loans/:id` | ⏳ Falta | **Alta** | `GetLoanDetailQueryHandler` |
| `GET /loans/member/:memberId` | ⏳ Falta | **Alta** | `GetMemberLoansQueryHandler` |
| `GET /loans/member/:memberId/active` | ⏳ Falta | **Alta** | `GetMemberActiveLoansQueryHandler` |
| `GET /loans/member/:memberId/capacity` | ⏳ Falta | **Alta** | `GetMemberDebtCapacityQueryHandler` |

**Uso actual**: `loansService.ts` - Usado para consultar préstamos de miembros, activos y capacidad de deuda.

#### 3. Stock Subscriptions (1 endpoint)
| Endpoint V1 | Estado V2 | Prioridad | Query Handler Necesario |
|-------------|-----------|-----------|------------------------|
| `GET /stock-subscriptions/member/:memberId` | ⏳ Falta | **Alta** | `GetMemberStockSubscriptionsQueryHandler` |

**Uso actual**: `stocksService.ts` - Usado para consultar suscripciones de acciones de un miembro.

**Nota**: Los endpoints V2 de members ya tienen `/v2/members/:id/purchases` pero falta el equivalente para suscripciones completas.

### Endpoints de Prioridad Media

#### 4. Stocks History (1 endpoint)
| Endpoint V1 | Estado V2 | Prioridad | Query Handler Necesario |
|-------------|-----------|-----------|------------------------|
| `GET /stocks/history` | ⏳ Falta | Media | `GetStocksHistoryQueryHandler` |

**Uso actual**: `stocksService.ts` - Usado para consultar historial de acciones.

#### 5. Dividends (2 endpoints)
| Endpoint V1 | Estado V2 | Prioridad | Query Handler Necesario |
|-------------|-----------|-----------|------------------------|
| `GET /dividends/pending` | ⏳ Falta | Media | `GetDividendsQueryHandler` |
| `GET /dividends/history` | ⏳ Falta | Media | `GetDividendsHistoryQueryHandler` |

**Uso actual**: `dividendsService.ts` - Usado para consultar dividendos pendientes e historial.

### Endpoints de Prioridad Baja (Vista de Detalle del Miembro)

Estos endpoints se usan principalmente en `useMemberDetail.ts` para mostrar información consolidada del miembro. Pueden construirse en el frontend combinando otros endpoints V2, pero sería más eficiente tener endpoints dedicados.

#### 6. Member Detail Endpoints (6 endpoints)
| Endpoint V1 | Estado V2 | Prioridad | Query Handler Necesario |
|-------------|-----------|-----------|------------------------|
| `GET /members/:id/summary` | ⏳ Falta | Baja | `GetMemberSummaryQueryHandler` |
| `GET /members/:id/stocks` | ⏳ Falta | Baja | `GetMemberStocksQueryHandler` |
| `GET /members/:id/loans` | ⏳ Falta | Baja | `GetMemberLoansQueryHandler` |
| `GET /members/:id/debt-capacity` | ⏳ Falta | Baja | `GetMemberDebtCapacityQueryHandler` |
| `GET /members/:id/stocks/:stockId/history` | ⏳ Falta | Baja | `GetMemberStockHistoryQueryHandler` |
| `GET /members/:id/loans/:loanId/installments` | ⏳ Falta | Baja | `GetMemberLoanInstallmentsQueryHandler` |

**Uso actual**: `membersService.ts` y `useMemberDetail.ts` - Usados en la vista de detalle del miembro.

**Alternativa**: Estos endpoints pueden construirse combinando:
- `/v2/members/:id/purchases` para stocks
- `/v2/members/:id/payments` para transacciones
- Endpoints de loans cuando estén disponibles

#### 7. Organization Stats (2 endpoints)
| Endpoint V1 | Estado V2 | Prioridad | Query Handler Necesario |
|-------------|-----------|-----------|------------------------|
| `GET /members/debt-capacity/summary` | ⏳ Falta | Baja | `GetOrganizationDebtCapacityQueryHandler` |
| `GET /members/debt-capacity/organization-stats` | ⏳ Falta | Baja | `GetOrganizationDebtStatsQueryHandler` |

**Uso actual**: `membersService.ts` - Posiblemente usado en dashboards o reportes ejecutivos.

#### 8. Legacy Endpoints (1 endpoint)
| Endpoint V1 | Estado V2 | Prioridad | Notas |
|-------------|-----------|-----------|-------|
| `POST /members/:memberId/contributions` | ⏳ Falta | Baja | Legacy, considerar deprecar |

**Uso actual**: `membersService.ts` - Marcado como legacy, mantener por compatibilidad si se usa.

### Endpoints Duplicados (No requieren migración)

Estos endpoints tienen funcionalidad duplicada con otros endpoints ya migrados:

| Endpoint V1 | Equivalente V2 | Estado |
|-------------|----------------|--------|
| `GET /stocks/member/:memberId/summary` | `GET /v2/members/:id/purchases` | Duplicado |
| `GET /stocks/:stockId/member/:memberId/history` | `GET /members/:memberId/stocks/:stockId/history` | Duplicado |

---

## 📋 Plan de Migración Actualizado

### Fase 7: Endpoints Críticos Faltantes (Sprint 12-13)

**Objetivo**: Implementar endpoints críticos identificados en el análisis

#### Prioridad Alta (8 endpoints)

1. **Operations**
   - `GetOperationsQueryHandler` - `GET /v2/operations`
   - `GetOperationDetailQueryHandler` - `GET /v2/operations/:id`
   - Prioridad: **Alta** (usado frecuentemente)

2. **Loans**
   - `GetLoanDetailQueryHandler` - `GET /v2/loans/:id`
   - `GetMemberLoansQueryHandler` - `GET /v2/members/:id/loans`
   - `GetMemberActiveLoansQueryHandler` - `GET /v2/members/:id/loans/active`
   - `GetMemberDebtCapacityQueryHandler` - `GET /v2/members/:id/debt-capacity` (o `/v2/loans/member/:id/capacity`)
   - Prioridad: **Alta** (usado en flujos principales)

3. **Stock Subscriptions**
   - `GetMemberStockSubscriptionsQueryHandler` - `GET /v2/members/:id/stock-subscriptions`
   - Prioridad: **Alta** (necesario para vista de acciones del miembro)

#### Prioridad Media (3 endpoints)

4. **Stocks History**
   - `GetStocksHistoryQueryHandler` - `GET /v2/stocks/history`
   - Prioridad: Media

5. **Dividends**
   - `GetDividendsQueryHandler` - `GET /v2/dividends/pending`
   - `GetDividendsHistoryQueryHandler` - `GET /v2/dividends/history`
   - Prioridad: Media

### Fase 8: Endpoints de Vista de Detalle (Sprint 14+)

**Objetivo**: Implementar endpoints de resumen y estadísticas para mejorar rendimiento

#### Prioridad Baja (8 endpoints)

6. **Member Detail Endpoints**
   - `GetMemberSummaryQueryHandler` - `GET /v2/members/:id/summary`
   - `GetMemberStocksQueryHandler` - `GET /v2/members/:id/stocks`
   - `GetMemberLoansQueryHandler` - `GET /v2/members/:id/loans` (duplicado con loans)
   - `GetMemberDebtCapacityQueryHandler` - `GET /v2/members/:id/debt-capacity` (duplicado con loans)
   - `GetMemberStockHistoryQueryHandler` - `GET /v2/members/:id/stocks/:stockId/history`
   - `GetMemberLoanInstallmentsQueryHandler` - `GET /v2/members/:id/loans/:loanId/installments`
   - Prioridad: Baja (pueden construirse en frontend)

7. **Organization Stats**
   - `GetOrganizationDebtCapacityQueryHandler` - `GET /v2/members/debt-capacity/summary`
   - `GetOrganizationDebtStatsQueryHandler` - `GET /v2/members/debt-capacity/organization-stats`
   - Prioridad: Baja (reportes ejecutivos)

---

## 📊 Resumen de Estado Actualizado

### Endpoints V2 Implementados ✅

- **Members**: 11/17 endpoints (65%)
- **Meetings**: 14/14 endpoints (100%) ✅
- **Stocks**: 4/11 endpoints (36%)
- **Loans**: 0/14 endpoints (0%) ⚠️
- **Operations**: 0/3 endpoints (0%) ⚠️
- **Dividends**: 0/3 endpoints (0%) ⚠️
- **Mandatory Contributions**: 5/5 endpoints (100%) ✅

### Endpoints Críticos Pendientes

- **Alta Prioridad**: 8 endpoints
- **Media Prioridad**: 3 endpoints
- **Baja Prioridad**: 8 endpoints

**Total pendiente**: 19 endpoints críticos + 8 endpoints de baja prioridad = 27 endpoints

---

## 🎯 Recomendaciones

1. **Implementar primero** los 8 endpoints de prioridad alta (Operations y Loans)
2. **Considerar** construir endpoints de baja prioridad en el frontend combinando otros endpoints V2
3. **Mantener** endpoints legacy solo si se usan activamente
4. **Deprecar** endpoints duplicados una vez migrados los principales

---

**Última actualización**: 2025-11-20  
**Próxima revisión**: Después de implementar Fase 7