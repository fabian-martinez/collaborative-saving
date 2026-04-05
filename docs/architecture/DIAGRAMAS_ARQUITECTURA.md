# Diagramas de Arquitectura – C4 (Mermaid)

> Referencia oficial: https://mermaid.js.org/syntax/c4.html

## 1) System Context (C4Context)

```mermaid
C4Context
  title System Context – Collaborative Saving
  Enterprise_Boundary(org, "Organization") {

    Boundary(usersB, "Users") {
      Person(treasurer, "Treasurer", "Administra el fondo y registra operaciones.")
      Person_Ext(member, "Member", "Socio que consulta estado y solicita operaciones.")
    }

    Boundary(feB, "Web App") {
      System(fe, "Web App", "Vue 3 + Tailwind + DaisyUI")
    }

    Boundary(apiB, "API Backend") {
      System(be, "API Backend", "NestJS REST API")
    }

    Boundary(dbB, "Database") {
      SystemDb(db, "PostgreSQL", "Base de datos relacional del sistema")
    }
  }

  Rel(treasurer, fe, "Usa")
  Rel(member, fe, "Consulta/solicita")
  Rel(fe, be, "REST/JSON")
  Rel(be, db, "SQL (ORM)")

  UpdateElementStyle(treasurer, $bgColor="#0f172a", $fontColor="#ffffff", $borderColor="#0f172a")
  UpdateElementStyle(member, $bgColor="#374151", $fontColor="#ffffff", $borderColor="#374151")
  UpdateElementStyle(fe, $bgColor="#1e293b", $fontColor="#ffffff", $borderColor="#1e293b")
  UpdateElementStyle(be, $bgColor="#0f766e", $fontColor="#ffffff", $borderColor="#0f766e")
  UpdateElementStyle(db, $bgColor="#7c2d12", $fontColor="#ffffff", $borderColor="#7c2d12")

  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

## 2) Container Diagram (C4Container)

```mermaid
C4Container

  title Container Diagram – Collaborative Saving

  Boundary(usersB2, "Users") {
    Person(treasurer, "Treasurer")
    Person_Ext(member, "Member")
  }

  System_Boundary(app, "Collaborative Saving") {
    Container(fe, "Web App", "Vue 3", "UI de tesorero y socios")
    Container(be, "API Backend", "NestJS", "APIs REST y casos de uso")
    ContainerDb(db, "PostgreSQL", "RDBMS", "Persistencia de datos")
  }

  Rel(treasurer, fe, "Usa")
  Rel(member, fe, "Consulta/solicita")
  Rel(fe, be, "REST/JSON")
  Rel(be, db, "SQL (ORM)")

  UpdateElementStyle(fe, $bgColor="#1e293b", $fontColor="#ffffff")
  UpdateElementStyle(be, $bgColor="#0f766e", $fontColor="#ffffff")
  UpdateElementStyle(db, $bgColor="#7c2d12", $fontColor="#ffffff")
  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

## 3) Component Diagram (C4Component)

```mermaid
C4Component

  title Component Diagram – Backend (Hexagonal)

  Boundary(usersB3, "Users") {
    Person(treasurer, "Treasurer")
    Person_Ext(member, "Member")
  }

  Boundary(feB3, "Web App") {
    Container(fe, "Web App", "Vue 3", "UI de tesorero y socios")
  }

  Boundary(httpB3, "HTTP Adapter") {
    Component(controller, "HTTP Controllers", "NestJS Controllers", "Adaptadores HTTP")
  }

  Boundary(coreB3, "Application Core") {
    Component(appsvc, "Application Services", "Use Cases", "Orquestación de casos de uso")
    Component(domain, "Domain", "Entities + VOs + Domain Services", "Reglas de negocio puras")
    Component(repo, "Repository Ports", "Interfaces", "Puertos de acceso a datos")
  }

  Boundary(persistB3, "Persistence Adapter (PostgreSQL)") {
    Component(repoImpl, "PostgreSQL Repositories (Impl)", "ORM", "Implementación de ports")
  }

  Boundary(dbB3, "Database") {
    ContainerDb(db, "PostgreSQL", "RDBMS", "Persistencia")
  }

  Rel(treasurer, fe, "Usa")
  Rel(member, fe, "Consulta/solicita")
  Rel(fe, controller, "Invoca endpoints")
  Rel(controller, appsvc, "DTO ↔ UseCases")
  Rel(appsvc, domain, "Invoca reglas de dominio")
  Rel(appsvc, repo, "Acceso a datos (ports)")
  Rel(repoImpl, repo, "Implements")
  Rel(repoImpl, db, "SQL (ORM)")

  UpdateElementStyle(controller, $bgColor="#1e293b", $fontColor="#ffffff")
  UpdateElementStyle(appsvc, $bgColor="#0f766e", $fontColor="#ffffff")
  UpdateElementStyle(domain, $bgColor="#0f172a", $fontColor="#ffffff")
  UpdateElementStyle(repo, $bgColor="#334155", $fontColor="#ffffff")
  UpdateElementStyle(repoImpl, $bgColor="#14532d", $fontColor="#ffffff")
  UpdateElementStyle(db, $bgColor="#7c2d12", $fontColor="#ffffff")
  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

## 4) ERD del Dominio (simplificado)

```mermaid
erDiagram
  MEMBER ||--o{ STOCK_SUBSCRIPTION : tiene
  MEMBER ||--o{ OPERATION : realiza
  MEMBER ||--o{ LOAN : solicita
  MEMBER ||--o{ PENDING_MEMBER_PAYMENT : solicita

  MEETING ||--o{ OPERATION : "contiene"
  MEETING ||--o{ PENDING_MEMBER_PAYMENT : genera

  OPERATION ||--o{ LEDGER_ENTRY : genera
  OPERATION ||--o{ STOCK_VALUE_HISTORY : afecta

  STOCK ||--o{ STOCK_SUBSCRIPTION : "se suscribe"
  STOCK ||--o{ STOCK_VALUE_HISTORY : "tiene historial"
  STOCK ||--o{ LOAN : garantiza

  LOAN ||--o{ LOAN_TRANSACTION_DETAIL : "tiene transacciones"
  LOAN ||--o{ LEDGER_ENTRY : afecta

  MANDATORY_CONTRIBUTION ||--o{ LEDGER_ENTRY : afecta

  PENDING_MEMBER_PAYMENT ||--o{ LEDGER_ENTRY : "se liquida con"

  MEMBER {
    uuid id
    text name
    text email
  }
  STOCK {
    uuid id
    text type
    numeric value
    numeric monthly_contribution
    boolean is_guaranteed
    numeric guaranteed_yield
    text behavior
  }
  STOCK_SUBSCRIPTION {
    uuid id
    uuid member_id
    uuid stock_id
    numeric quantity
    date purchase_date
    text status
    uuid financing_loan_id
  }
  OPERATION {
    uuid id
    uuid member_id
    uuid meeting_id
    text type
    timestamp date
    text description
  }
  LEDGER_ENTRY {
    uuid id
    uuid operation_id
    text account_type
    decimal amount
    timestamp created_at
    uuid loan_id
    uuid stock_id
    uuid mandatory_contribution_id
    uuid stock_subscription_id
  }
  STOCK_VALUE_HISTORY {
    uuid id
    uuid stock_id
    uuid operation_id
    decimal previous_value
    decimal growth_from_contributions
    decimal growth_from_interest
    decimal total_growth_per_share
    decimal new_value
    timestamp created_at
  }
  LOAN {
    uuid id
    uuid member_id
    text loan_type
    decimal approved_amount
    decimal disbursed_amount
    decimal outstanding_balance
    decimal monthly_payment_amount
    decimal interest_rate
    integer term
    text status
    date creation_date
    uuid guaranteed_stock_id
  }
  LOAN_TRANSACTION_DETAIL {
    uuid id
    uuid loan_id
    uuid operation_id
    text transaction_type
    decimal amount
    date transaction_date
    text notes
  }
  MANDATORY_CONTRIBUTION {
    uuid id
    text asset_type
    numeric value
  }
  PENDING_MEMBER_PAYMENT {
    uuid id
    uuid member_id
    uuid meeting_id
    text type
    numeric amount
    text status
    text notes
    uuid stock_id
    uuid loan_id
    uuid stock_subscription_id
    uuid reference_meeting_id
    text disbursement_type
    timestamp created_at
  }
  MEETING {
    uuid id
    timestamp date
    text status
  }
```

## 7) State Diagram – StockSubscription

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> active: confirmPurchase
  active --> inactive: deactivate
  active --> transferred: transferToMember
  active --> adjusted: modifyQuantity
  transferred --> active: acceptTransfer
  adjusted --> active: confirmAdjustment
  inactive --> [*]
```

## 8) State Diagram – Loan

```mermaid
stateDiagram-v2
  [*] --> pending: createLoan
  pending --> active: disburseLoan(firstDisbursement)
  active --> active: recordPayment(if outstanding > 0)
  active --> paid: recordPayment(if outstanding = 0)
  active --> defaulted: markAsDefaulted
  paid --> [*]
  defaulted --> [*]
  note right of pending
    Préstamo aprobado pero
    sin desembolsar
  end note
  note right of active
    Desembolsado parcial o total,
    con deuda pendiente
  end note
  note right of paid
    outstanding_balance = 0,
    préstamo completado
  end note
  note right of defaulted
    En mora,
    requiere intervención
  end note
```

## 9) State Diagram – Meeting

```mermaid
stateDiagram-v2
  [*] --> active: createMeeting
  active --> closed: closeMeeting
  closed --> [*]
  note right of active
    Permite crear operaciones,
    registrar pagos mensuales,
    ejecutar desembolsos
  end note
  note right of closed
    No admite nuevas operaciones,
    puede consultarse pero no modificarse
  end note
```

## 10) State Diagram – PendingMemberPayment

```mermaid
stateDiagram-v2
  [*] --> pending: createPendingPayment
  pending --> approved: approvePayment
  pending --> rejected: rejectPayment
  approved --> paid: executeDisbursement
  rejected --> [*]
  paid --> [*]
  note right of pending
    Solicitud inicial de pago
    pendiente (dividendo, retiro,
    préstamo parcial, etc.)
  end note
  note right of approved
    Aprobado para incluir
    en plan de desembolso
  end note
  note right of paid
    Desembolsado completamente
    o saldado por parciales
  end note
  note right of rejected
    Rechazado por tesorero,
    fin del ciclo
  end note
```

## 11) State Diagram – Member

```mermaid
stateDiagram-v2
  [*] --> active: registerMember
  active --> inactive: deactivateMember
  inactive --> active: reactivateMember
  note right of active
    Socio activo, puede:
    - Realizar operaciones
    - Solicitar préstamos
    - Tener suscripciones
  end note
  note right of inactive
    Socio inactivo,
    solo consulta históricos,
    no nuevas operaciones
  end note
```

## 12) Secuencia – Revaluación Mensual (Preview → Approve)

```mermaid
sequenceDiagram
  autonumber
  participant User as Treasurer (FE)
  participant FE as Web App
  participant API as RevaluationController
  participant SVC as AssetRevaluationService
  participant OR as OperationRepository
  participant HV as StockValueHistoryRepository
  participant LS as LedgerService
  participant LR as LedgerEntryRepository

  Note over FE,API: PREVIEW (no persiste)
  User->>FE: Solicitar vista previa de revaluación
  FE->>API: GET /revaluation/preview?meetingId={id}
  API->>SVC: calculateRevaluationData(meetingId)
  SVC-->>API: { total_contributions, total_interest, total_to_distribute, details[] }
  API-->>FE: 200 OK + preview

  Note over FE,API: APPROVE (persiste y emite eventos)
  User->>FE: Aprobar revaluación
  FE->>API: POST /revaluation/approve { meetingId, approvalBy, notes }
  API->>SVC: getLatestPreviewOrRecalculate(meetingId)
  API->>OR: createOperation(REVALUATION)
  API->>LS: generateLedgerEntries(operation, details)
  LS-->>API: ledgerEntries[]
  API->>LR: saveAll(ledgerEntries)
  loop por cada stock en details
    API->>HV: create({ stockId, previous_value, growths, new_value, operationId })
  end
  API-->>FE: { operationId, historyIds[] }
```

- Notas:
  - Preview no crea `Operation` ni `StockValueHistory`.
  - Approve persiste `Operation + LedgerEntries` y `StockValueHistory` por acción, y emite `StockValueRevalued`.

## 13) Secuencia – TransferStockSubscription (fromMemberId / fromLots / FIFO)

```mermaid
sequenceDiagram
  autonumber
  participant User as Treasurer (FE)
  participant FE as Web App
  participant API as StocksController
  participant SSR as StockSubscriptionRepository
  participant OR as OperationRepository
  participant LS as LedgerService
  participant LR as LedgerEntryRepository

  User->>FE: Transferir suscripción
  FE->>API: POST /stock-subscriptions/transfer { fromMemberId, toMemberId, stockId, quantity, meetingId, fromSubscriptionId?, fromLots?, selectionPolicy? }
  alt fromLots provisto
    API->>SSR: validateLotsOwnership(fromMemberId, fromLots)
  else fromSubscriptionId provisto
    API->>SSR: findById(fromSubscriptionId)
  else sin selección explícita
    API->>SSR: selectLotsByPolicy(fromMemberId, stockId, quantity, policy=FIFO)
  end
  API->>OR: createOperation(STOCK_TRANSFER)
  API->>LS: generateLedgerEntries(operation)
  LS-->>API: ledgerEntries[]
  API->>LR: saveAll(ledgerEntries)
  API->>SSR: decrementFromOriginLots(...)
  API->>SSR: incrementOrCreateDestination(toMemberId, stockId, quantity)
  API-->>FE: { operationId, fromMemberId, toMemberId, fromLotsUsed[], toSubscriptionId }
```

- Notas:
  - `fromMemberId` siempre requerido; `fromSubscriptionId` o `fromLots[]` son opcionales.
  - Si no se especifica lote(s), aplicar `selectionPolicy` (por defecto FIFO, solo suscripciones sin crédito).
  - En transferencias multi-lote, devolver `fromLotsUsed[]` para trazabilidad.

---

Estos diagramas complementan el modelo textual y ayudan a discutir reglas e invariantes antes de implementar.
