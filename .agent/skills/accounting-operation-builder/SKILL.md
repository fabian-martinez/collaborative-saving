---
name: Accounting Operation Builder
description: Generates correct accounting operation code using RecordOperationUseCase, preventing the anti-pattern of creating operations directly with TypeORM.
---

# Accounting Operation Builder

## When to Use

Invoke this skill when the user requests:
- "Register an accounting operation"
- "Add a financial transaction"
- "Record a ledger entry"
- Any task involving creating operations or ledger entries

## Context

This project has a **mandatory transversal system** for recording accounting operations:
- Documented in `.cursor/rules/AGENTS.md` (section 8.1)
- Detailed guide in `docs/01-ARQUITECTURA/GUIA_REGISTRO_OPERACIONES.md`

## Critical Rule

> **NEVER** create operations or ledger entries directly with TypeORM.  
> **ALWAYS** use `RecordOperationUseCase.execute()`.

### ❌ Anti-Pattern (FORBIDDEN)

```typescript
// NEVER DO THIS
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();
try {
  const operation = queryRunner.manager.create(Operation, { ... });
  await queryRunner.manager.save(operation);
  const entries = queryRunner.manager.create(LedgerEntry, [...]);
  await queryRunner.manager.save(entries);
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
}
```

### ✅ Correct Pattern (ALWAYS USE)

```typescript
const result = await this.recordOperationUseCase.execute({
  memberId: memberId,       // string | null (null for system operations)
  meetingId: meetingId,     // string
  type: OperationType.XXX,  // from @common/enums/operation-type.enum
  description: 'Description of the operation',
  date: new Date(),         // optional, defaults to now
  entries: [
    {
      accountType: CASH_ACCOUNT,           // from @common/constants/account-types
      amount: -1000,                        // negative = credit
      description: 'Cash outflow',
    },
    {
      accountType: STOCK_CAPITAL_ACCOUNT,  // from @common/constants/account-types
      amount: 1000,                         // positive = debit
      description: 'Capital increase',
    },
  ],
});
```

## Step-by-Step Guide

### Step 1: Identify the Operation Type

Common operation types from `OperationType` enum:
- `MONTHLY_PAYMENT` — Monthly member contributions
- `STOCK_PURCHASE` — Stock purchases with cash
- `LOAN_DISBURSEMENT` — Loan money disbursed
- `LOAN_PAYMENT` — Loan payment received
- `INTEREST_INCOME` — Interest earned
- `INITIAL_CASH_BALANCE` — Initial setup

### Step 2: Define Entries (Debits = Credits)

**Accounting rules**:
- Positive amounts = **Debits** (increases assets/expenses)
- Negative amounts = **Credits** (increases liabilities/income)
- Sum of all entries MUST equal zero (auto-validated)
- Minimum 2 entries per operation

**Example**: Monthly payment of $1000
```typescript
entries: [
  { accountType: CASH_ACCOUNT, amount: 1000, description: 'Cash received' },      // Debit
  { accountType: STOCK_CAPITAL_ACCOUNT, amount: -1000, description: 'Capital' },  // Credit
]
```

### Step 3: Import Required Constants

```typescript
import { OperationType } from '@common/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
} from '@common/constants/account-types';
```

### Step 4: Inject the Use Case

In your use case constructor:
```typescript
export class YourUseCase {
  constructor(
    private readonly recordOperationUseCase: RecordOperationUseCase,
    // ... other dependencies
  ) {}
}
```

In the NestJS module:
```typescript
@Module({
  providers: [
    YourUseCase,
    RecordOperationUseCase,
    // ... other providers
  ],
})
```

## Entry References

When a ledger entry affects a specific entity, include the reference:

```typescript
{
  accountType: STOCK_CAPITAL_ACCOUNT,
  amount: 1000,
  stockId: 'uuid-of-stock',                    // Reference to stock
  stockSubscriptionId: 'uuid-of-subscription', // Reference to subscription
  loanId: 'uuid-of-loan',                      // Reference to loan
  description: 'Stock capital increase',
}
```

## Error Handling

```typescript
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { BadRequestException } from '@nestjs/common';

try {
  const result = await this.recordOperationUseCase.execute(dto);
  return result;
} catch (error) {
  if (error instanceof BusinessRuleError) {
    // Balance validation failed (debits ≠ credits)
    throw new BadRequestException(error.message);
  }
  throw error;
}
```

## Benefits

- ✅ **Automatic balance validation** (debits = credits)
- ✅ **Guaranteed transactionality** (all or nothing)
- ✅ **~1,300 lines of duplicated code eliminated**
- ✅ **Consistent behavior across all services**
- ✅ **Centralized testing** (test once, works everywhere)

## Common Patterns

### Pattern 1: Monthly Payment
```typescript
await this.recordOperationUseCase.execute({
  memberId,
  meetingId,
  type: OperationType.MONTHLY_PAYMENT,
  description: 'Monthly contribution',
  entries: [
    { accountType: CASH_ACCOUNT, amount: 1000, description: 'Cash in' },
    { accountType: STOCK_CAPITAL_ACCOUNT, amount: -1000, description: 'Capital' },
  ],
});
```

### Pattern 2: Loan Disbursement
```typescript
await this.recordOperationUseCase.execute({
  memberId,
  meetingId,
  type: OperationType.LOAN_DISBURSEMENT,
  description: `Loan disbursement`,
  entries: [
    { accountType: CASH_ACCOUNT, amount: -5000, description: 'Cash out' },
    { accountType: LOANS_RECEIVABLE_ACCOUNT, amount: 5000, loanId, description: 'Loan created' },
  ],
});
```

### Pattern 3: Stock Purchase
```typescript
await this.recordOperationUseCase.execute({
  memberId,
  meetingId,
  type: OperationType.STOCK_PURCHASE,
  description: `Purchase of ${quantity} stocks`,
  entries: [
    { accountType: CASH_ACCOUNT, amount: -totalAmount, description: 'Payment' },
    { accountType: STOCK_CAPITAL_ACCOUNT, amount: totalAmount, stockId, description: 'Stock acquired' },
  ],
});
```
