# Capa de Aplicación

Este documento detalla el diseño de la capa de aplicación siguiendo los principios de arquitectura hexagonal.

## Estructura de directorios

```
backend/src/application/
├── use-cases/
│   ├── stocks/
│   │   ├── create-stock-subscription.use-case.ts
│   │   ├── modify-stock-subscription.use-case.ts
│   │   ├── transfer-stock-subscription.use-case.ts
│   │   ├── preview-monthly-revaluation.use-case.ts
│   │   ├── approve-monthly-revaluation.use-case.ts
│   │   └── record-monthly-revaluation.use-case.ts
│   ├── loans/
│   │   ├── create-loan.use-case.ts
│   │   ├── disburse-loan.use-case.ts
│   │   ├── record-loan-payment.use-case.ts
│   │   ├── mark-loan-defaulted.use-case.ts
│   │   └── merge-loans.use-case.ts
│   ├── meetings/
│   │   ├── open-meeting.use-case.ts
│   │   ├── record-monthly-payments.use-case.ts
│   │   ├── preview-disbursement-plan.use-case.ts
│   │   ├── execute-disbursement-plan.use-case.ts
│   │   └── close-meeting.use-case.ts
│   ├── pending-payments/
│   │   ├── create-pending-member-payment.use-case.ts
│   │   └── settle-pending-member-payment.use-case.ts
│   ├── accounting/
│   │   └── record-operation.use-case.ts
│   └── members/
│       ├── create-member.use-case.ts
│       ├── update-member.use-case.ts
└── dto/
    ├── stocks/
    ├── loans/
    ├── meetings/
    ├── pending-payments/
    ├── accounting/
    └── members/
```

**Nota**: Los puertos (interfaces) están en `domain/ports/`, no en `application/`. Ver [DOMINIO.md](./DOMINIO.md).

## Patrón de Use Case

Cada caso de uso implementa una interfaz común y sigue el patrón:

```typescript
interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}

class CreateStockSubscriptionUseCase implements UseCase<CreateStockSubscriptionDto, CreateStockSubscriptionResponseDto> {
  constructor(
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly memberRepository: MemberRepository,
    private readonly stockRepository: StockRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly stockValueHistoryRepository: StockValueHistoryRepository,
    private readonly operationBalanceValidator: OperationBalanceValidator,
    private readonly eventBus: EventBus,
    private readonly transactionManager: TransactionManager
  ) {}

  async execute(input: CreateStockSubscriptionDto): Promise<CreateStockSubscriptionResponseDto> {
    // Validar pre-condiciones
    // Ejecutar lógica de dominio
    // Persistir cambios
    // Emitir eventos
    // Retornar resultado
  }
}
```

## DTOs por dominio

### Stocks

**CreateStockSubscriptionDto**
```typescript
{
  memberId: string;
  stockId: string;
  quantity: number;
  meetingId: string;
  paymentMethod: 'cash' | 'financing';
}
```

**CreateStockSubscriptionResponseDto**
```typescript
{
  subscriptionId: string;
  operationId: string;
  ledgerEntryIds: string[];
  historyId?: string;
}
```

**ModifyStockSubscriptionDto**
```typescript
{
  memberId: string;
  meetingId: string;
  fromSubscriptionId: string;
  fromQuantity: number;
  toStockId?: string;
  toQuantity?: number;
  transferSubscriptionId?: string;
  toMemberId?: string;
  notes?: string;
}
```

**TransferStockSubscriptionDto**
```typescript
{
  fromMemberId: string;
  toMemberId: string;
  stockId: string;
  quantity: number;
  meetingId: string;
  fromSubscriptionId?: string;
}
```

**PreviewMonthlyRevaluationDto**
```typescript
{
  meetingId: string;
}
```

**PreviewMonthlyRevaluationResponseDto**
```typescript
{
  total_contributions: number;
  total_interest: number;
  total_to_distribute: number;
  details: Array<{
    stockId: string;
    stockType: string;
    previousValue: number;
    growthFromContributions: number;
    growthFromInterest: number;
    newValue: number;
  }>;
}
```

**ApproveMonthlyRevaluationDto**
```typescript
{
  meetingId: string;
  approvalBy: string;
  notes?: string;
}
```

### Loans

**CreateLoanDto**
```typescript
{
  memberId: string;
  loanType: string;
  approvedAmount: number;
  monthlyPaymentAmount: number;
  interestRate: number;
  term: number;
  guaranteedStockId?: string;
}
```

**DisburseLoanDto**
```typescript
{
  loanId: string;
  amount: number;
  meetingId: string;
  notes?: string;
}
```

**RecordLoanPaymentDto**
```typescript
{
  loanId: string;
  principal?: number;
  interest?: number;
  meetingId: string;
}
```

**MarkLoanDefaultedDto**
```typescript
{
  loanId: string;
  reason?: string;
  occurredAt?: Date;
}
```

**MergeLoansDto**
```typescript
{
  memberId: string;
  loanIds: string[];
  policy: 'combine_balances' | 'weighted_average';
}
```

### Meetings

**OpenMeetingDto**
```typescript
{
  date?: Date;
}
```

**RecordMonthlyPaymentsDto**
```typescript
{
  meetingId: string;
  memberId: string;
  payments: Array<{
    type: 'mandatory_contribution' | 'stock' | 'loan';
    amount: number;
    referenceId: string; // stockId, loanId, o asset_type
    notes?: string;
  }>;
}
```

**PreviewDisbursementPlanDto**
```typescript
{
  meetingId: string;
  newLoanRequests?: Array<{
    memberId: string;
    amount: number;
    loanType: string;
  }>;
}
```

**PreviewDisbursementPlanResponseDto**
```typescript
{
  plan: Array<{
    pendingId?: string;
    memberId: string;
    type: 'dividend' | 'loan' | 'stock_withdrawal' | 'other';
    amount: number;
    priority: number;
    status: 'pending' | 'approved';
  }>;
  availableCash: number;
  totalToDisburse: number;
}
```

**ExecuteDisbursementPlanDto**
```typescript
{
  meetingId: string;
  plan: Array<{
    pendingId?: string;
    memberId: string;
    type: 'dividend' | 'loan' | 'stock_withdrawal' | 'other';
    amount: number;
    priority: number;
  }>;
}
```

**CloseMeetingDto**
```typescript
{
  meetingId: string;
}
```

### Pending Member Payments

**CreatePendingMemberPaymentDto**
```typescript
{
  memberId: string;
  meetingId: string;
  type: 'dividend' | 'stock_withdrawal' | 'loan' | 'other';
  amount: number;
  notes?: string;
  loanId?: string;
  stockId?: string;
  stockSubscriptionId?: string;
  referenceMeetingId?: string;
  disbursementType?: 'partial' | 'full';
}
```

**SettlePendingMemberPaymentDto**
```typescript
{
  originalPendingId: string;
  amountOrQuantity: number;
  meetingId: string;
}
```

### Accounting

**RecordOperationDto**
```typescript
{
  memberId?: string;
  meetingId: string;
  type: OperationType;
  description?: string;
  ledgerEntries: Array<{
    amount: number;
    accountType: string;
    loanId?: string;
    stockId?: string;
    stockSubscriptionId?: string;
    mandatoryContributionId?: string;
  }>;
}
```

### Members

**CreateMemberDto**
```typescript
{
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  registrationDate: Date;
}
```

**UpdateMemberDto**
```typescript
{
  memberId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}
```

## Contratos de repositorios (Puertos)

### MemberRepository
```typescript
interface MemberRepository {
  findById(id: string): Promise<Member | null>;
  findByEmail(email: string): Promise<Member | null>;
  findByIdentificationNumber(identificationNumber: string): Promise<Member | null>;
  save(member: Member): Promise<Member>;
  findAll(): Promise<Member[]>;
  findActive(): Promise<Member[]>;
}
```

### StockRepository
```typescript
interface StockRepository {
  findById(id: string): Promise<Stock | null>;
  findByType(type: string): Promise<Stock | null>;
  findAll(): Promise<Stock[]>;
  findActive(): Promise<Stock[]>;
  save(stock: Stock): Promise<Stock>;
  findGuaranteed(): Promise<Stock[]>;
}
```

### StockSubscriptionRepository
```typescript
interface StockSubscriptionRepository {
  findById(id: string): Promise<StockSubscription | null>;
  findByMemberAndStock(memberId: string, stockId: string): Promise<StockSubscription[]>;
  findByMember(memberId: string): Promise<StockSubscription[]>;
  findActiveByMember(memberId: string): Promise<StockSubscription[]>;
  findFreeOfFinancing(memberId: string, stockId: string): Promise<StockSubscription[]>;
  save(subscription: StockSubscription): Promise<StockSubscription>;
  saveMany(subscriptions: StockSubscription[]): Promise<StockSubscription[]>;
  findByStock(stockId: string): Promise<StockSubscription[]>;
}
```

### LoanRepository
```typescript
interface LoanRepository {
  findById(id: string): Promise<Loan | null>;
  findByMember(memberId: string): Promise<Loan[]>;
  findActiveByMember(memberId: string): Promise<Loan[]>;
  findPendingByMember(memberId: string): Promise<Loan[]>;
  save(loan: Loan): Promise<Loan>;
  findByIds(ids: string[]): Promise<Loan[]>;
}
```

### LoanTransactionDetailRepository
```typescript
interface LoanTransactionDetailRepository {
  findById(id: string): Promise<LoanTransactionDetail | null>;
  findByLoan(loanId: string): Promise<LoanTransactionDetail[]>;
  findByLoanAndMeeting(loanId: string, meetingId: string): Promise<LoanTransactionDetail[]>;
  save(transaction: LoanTransactionDetail): Promise<LoanTransactionDetail>;
  saveMany(transactions: LoanTransactionDetail[]): Promise<LoanTransactionDetail[]>;
}
```

### MeetingRepository
```typescript
interface MeetingRepository {
  findById(id: string): Promise<Meeting | null>;
  findActive(): Promise<Meeting | null>;
  findAll(): Promise<Meeting[]>;
  save(meeting: Meeting): Promise<Meeting>;
  findLatestClosed(): Promise<Meeting | null>;
}
```

### OperationRepository
```typescript
interface OperationRepository {
  findById(id: string): Promise<Operation | null>;
  findByMeeting(meetingId: string): Promise<Operation[]>;
  save(operation: Operation): Promise<Operation>;
  saveWithEntries(operation: Operation, entries: LedgerEntry[]): Promise<{ operation: Operation; entries: LedgerEntry[] }>;
}
```

### LedgerEntryRepository
```typescript
interface LedgerEntryRepository {
  findById(id: string): Promise<LedgerEntry | null>;
  findByOperation(operationId: string): Promise<LedgerEntry[]>;
  findByMeeting(meetingId: string): Promise<LedgerEntry[]>;
  findByAccountType(accountType: string, meetingId: string): Promise<LedgerEntry[]>;
  save(entry: LedgerEntry): Promise<LedgerEntry>;
  saveMany(entries: LedgerEntry[]): Promise<LedgerEntry[]>;
  sumByAccountType(accountType: string, meetingId: string): Promise<number>;
}
```

### StockValueHistoryRepository
```typescript
interface StockValueHistoryRepository {
  findById(id: string): Promise<StockValueHistory | null>;
  findByStock(stockId: string): Promise<StockValueHistory[]>;
  findLatestByStock(stockId: string): Promise<StockValueHistory | null>;
  findByStockBeforeDate(stockId: string, date: Date): Promise<StockValueHistory | null>;
  save(history: StockValueHistory): Promise<StockValueHistory>;
  saveMany(histories: StockValueHistory[]): Promise<StockValueHistory[]>;
}
```

### PendingMemberPaymentRepository
```typescript
interface PendingMemberPaymentRepository {
  findById(id: string): Promise<PendingMemberPayment | null>;
  findByMember(memberId: string): Promise<PendingMemberPayment[]>;
  findByMeeting(meetingId: string): Promise<PendingMemberPayment[]>;
  findPendingByMeeting(meetingId: string): Promise<PendingMemberPayment[]>;
  findByReference(referenceMeetingId: string): Promise<PendingMemberPayment[]>;
  save(pending: PendingMemberPayment): Promise<PendingMemberPayment>;
  saveMany(pendings: PendingMemberPayment[]): Promise<PendingMemberPayment[]>;
  calculateRemainingAmount(originalPendingId: string): Promise<number>;
}
```

### MandatoryContributionRepository
```typescript
interface MandatoryContributionRepository {
  findById(id: string): Promise<MandatoryContribution | null>;
  findByAssetType(assetType: string): Promise<MandatoryContribution | null>;
  findAll(): Promise<MandatoryContribution[]>;
  save(contribution: MandatoryContribution): Promise<MandatoryContribution>;
}
```

## Puertos de servicios transversales

### EventBus
```typescript
interface EventBus {
  publish<T>(event: DomainEvent<T>): Promise<void>;
  subscribe<T>(eventType: string, handler: (event: DomainEvent<T>) => Promise<void>): void;
}
```

### TransactionManager
```typescript
interface TransactionManager {
  execute<T>(operation: (trx: Transaction) => Promise<T>): Promise<T>;
}
```

