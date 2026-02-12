---
name: Accounting Operation Builder
description: Generates correct accounting operation code using RecordOperationUseCase, preventing the anti-pattern of creating operations directly with TypeORM.
---

# Accounting Operation Builder

Use this skill when the user asks to "register an accounting operation", "add a financial transaction", or any task that involves creating ledger entries or operations in the system.

## Context

The project has a **mandatory** transversal system for recording accounting operations documented in:
- `.cursor/rules/AGENTS.md` (section 8.1)
- `docs/01-ARQUITECTURA/GUIA_REGISTRO_OPERACIONES.md`

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
  meetingId: meetingId,      // string
  type: OperationType.XXX,  // from @common/enums/operation-type.enum
  description: 'Description of the operation',
  date: new Date(),          // optional, defaults to now
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

## How to Use

When generating code that involves financial transactions:

### Step 1: Identify the Operation Type

Common operation types from `OperationType` enum:
- `MONTHLY_PAYMENT` — Monthly member contributions
- `STOCK_PURCHASE` — Stock purchases with cash
- `LOAN_DISBURSEMENT` — Loan money disbursed
- `LOAN_PAYMENT` — Loan payment received
- `INTEREST_INCOME` — Interest earned
- `INITIAL_CASH_BALANCE` — Initial setup

### Step 2: Define Entries (Debits = Credits)

**Rules:**
- Positive amounts = Debits
- Negative amounts = Credits
- Sum of all entries MUST equal zero (auto-validated)
- Minimum 2 entries per operation

### Step 3: Import Constants

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

```typescript
export class YourUseCase {
  constructor(
    private readonly recordOperationUseCase: RecordOperationUseCase,
    // ... other dependencies
  ) {}
}
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

- **Automatic balance validation** (debits = credits)
- **Guaranteed transactionality** (all or nothing)
- **~1,300 lines of duplicated code eliminated**
- **Consistent behavior across all services**
