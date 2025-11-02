# Guía de Uso: Sistema Transversal de Registro de Operaciones

## Introducción

Este documento explica cómo usar el sistema transversal de registro de operaciones contables implementado siguiendo arquitectura hexagonal. Este sistema centraliza la creación de operaciones y ledger entries, eliminando duplicación de código y garantizando validación automática de balances.

## Componente Principal: RecordOperationUseCase

El componente principal para registrar operaciones contables es el `RecordOperationUseCase`, ubicado en:

```
backend/src/application/use-cases/accounting/record-operation.use-case.ts
```

## Inyección de Dependencias

Para usar el use case en un servicio o controlador, inyéctalo en el constructor:

```typescript
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly recordOperationUseCase: RecordOperationUseCase,
    // ... otras dependencias
  ) {}
}
```

## Ejemplos de Uso

### Ejemplo 1: Registro de Pago Mensual

```typescript
import { OperationType } from '@common/enums/operation-type.enum';
import { CASH_ACCOUNT, STOCK_CAPITAL_ACCOUNT, LOANS_RECEIVABLE_ACCOUNT } from '@common/constants/account-types';

const result = await this.recordOperationUseCase.execute({
  memberId: 'uuid-del-miembro',
  meetingId: 'uuid-de-la-reunion',
  type: OperationType.MONTHLY_PAYMENT,
  description: 'Pago mensual de cuotas',
  date: new Date(),
  entries: [
    {
      accountType: CASH_ACCOUNT,
      amount: -1000, // Crédito: disminución de efectivo
      description: 'Efectivo recibido',
    },
    {
      accountType: STOCK_CAPITAL_ACCOUNT,
      amount: 500, // Débito: aumento de capital de acciones
      description: 'Cuota de acciones',
    },
    {
      accountType: LOANS_RECEIVABLE_ACCOUNT,
      amount: 500, // Débito: aumento de capital de préstamo
      description: 'Cuota de préstamo',
    },
  ],
});

// result.operationId contiene el ID de la operación creada
// result.ledgerEntryIds contiene los IDs de los ledger entries creados
```

### Ejemplo 2: Compra de Acciones con Efectivo

```typescript
const result = await this.recordOperationUseCase.execute({
  memberId: memberId,
  meetingId: meetingId,
  type: OperationType.STOCK_PURCHASE,
  description: `Compra de ${quantity} acciones de ${stockType}`,
  entries: [
    {
      accountType: STOCK_CAPITAL_ACCOUNT,
      amount: totalValue, // Débito: aumento de capital
      stockId: stockId,
      stockSubscriptionId: subscriptionId,
      description: `Capital de ${quantity} acciones`,
    },
    {
      accountType: CASH_ACCOUNT,
      amount: -totalValue, // Crédito: disminución de efectivo
      description: 'Pago en efectivo',
    },
  ],
});
```

### Ejemplo 3: Pago de Préstamo

```typescript
const result = await this.recordOperationUseCase.execute({
  memberId: loan.memberId,
  meetingId: meetingId,
  type: OperationType.LOAN_PAYMENT,
  description: `Pago de préstamo ${loanId}`,
  entries: [
    {
      accountType: CASH_ACCOUNT,
      amount: principalAmount, // Débito: aumento de efectivo recibido
      description: 'Principal recibido',
    },
    {
      accountType: INTEREST_INCOME_ACCOUNT,
      amount: interestAmount, // Débito: ingreso por intereses
      description: 'Intereses recibidos',
    },
    {
      accountType: LOANS_RECEIVABLE_ACCOUNT,
      amount: -(principalAmount + interestAmount), // Crédito: disminución de deuda
      loanId: loanId,
      description: 'Reducción de deuda',
    },
  ],
});
```

### Ejemplo 4: Operación del Sistema (sin Member)

```typescript
const result = await this.recordOperationUseCase.execute({
  memberId: null, // ✅ Permitido para operaciones del sistema
  meetingId: meetingId,
  type: OperationType.INITIAL_CASH_BALANCE,
  description: 'Balance inicial de efectivo',
  entries: [
    {
      accountType: CASH_ACCOUNT,
      amount: 5000, // Débito: aumento de efectivo inicial
    },
    {
      accountType: REVALUATION_SURPLUS_ACCOUNT,
      amount: -5000, // Crédito: capital inicial
    },
  ],
});
```

## Reglas de Uso Obligatorias

### ✅ OBLIGATORIO usar RecordOperationUseCase

- **TODAS las operaciones contables** deben registrarse usando `RecordOperationUseCase`
- **NO crear** operaciones directamente con TypeORM (`queryRunner.manager.create(Operation, ...)`)
- **NO crear** ledger entries directamente con TypeORM (`queryRunner.manager.create(LedgerEntry, ...)`)
- **NO duplicar** lógica de validación de balance
- **NO gestionar** transacciones manualmente (`queryRunner.startTransaction()`, `commit()`, `rollback()`)

### ✅ Validación Automática

- El use case valida automáticamente que **débitos = créditos**
- Lanza `BusinessRuleError` si no balancea
- Garantiza **transaccionalidad** (todo o nada)
- Valida que haya al menos 2 ledger entries

### ✅ Manejo de Errores

```typescript
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { BadRequestException } from '@nestjs/common';

try {
  const result = await this.recordOperationUseCase.execute(dto);
  return result;
} catch (error) {
  if (error instanceof BusinessRuleError) {
    throw new BadRequestException(error.message);
  }
  throw error;
}
```

## Migración de Código Existente

### ❌ Código Antiguo (NO USAR)

```typescript
// ❌ NO HACER ESTO - Código duplicado en múltiples servicios
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  const operation = queryRunner.manager.create(Operation, {
    member_id: memberId,
    meeting_id: meetingId,
    description: `Descripción de la operación...`,
    type: OperationType.SOME_TYPE,
  });
  await queryRunner.manager.save(operation);
  
  const ledgerEntries: LedgerEntry[] = [];
  ledgerEntries.push(
    queryRunner.manager.create(LedgerEntry, {
      operation_id: operation.id,
      account_type: SOME_ACCOUNT,
      amount: amount,
      description: description,
    })
  );
  // ... más código duplicado ...
  
  await queryRunner.manager.save(ledgerEntries);
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

### ✅ Código Nuevo (USAR)

```typescript
// ✅ HACER ESTO - Código limpio y centralizado
const result = await this.recordOperationUseCase.execute({
  memberId: memberId,
  meetingId: meetingId,
  type: OperationType.MONTHLY_PAYMENT,
  description: 'Pago mensual',
  entries: [
    { accountType: CASH_ACCOUNT, amount: -amount },
    { accountType: STOCK_CAPITAL_ACCOUNT, amount: amount },
  ],
});
```

## Integración con Servicios Existentes

### Patrón Recomendado

```typescript
@Injectable()
export class MeetingsService {
  constructor(
    private readonly recordOperationUseCase: RecordOperationUseCase,
    // ... otras dependencias
  ) {}

  async recordMonthlyPayment(dto: SimplifiedRecordTransactionsDto) {
    // 1. Lógica de negocio específica del servicio
    const payments = this.calculatePayments(dto);
    
    // 2. Registrar operación usando el use case
    for (const payment of payments) {
      await this.recordOperationUseCase.execute({
        memberId: dto.memberId,
        meetingId: activeMeeting.id,
        type: OperationType.MONTHLY_PAYMENT,
        description: payment.description,
        entries: payment.ledgerEntries,
      });
    }
  }
}
```

## Casos Especiales

### Operaciones con Referencias a Entidades

Cuando un ledger entry afecta a una entidad específica (stock, loan, etc.), incluye la referencia:

```typescript
{
  accountType: STOCK_CAPITAL_ACCOUNT,
  amount: 1000,
  stockId: 'uuid-de-stock', // ✅ Referencia a stock
  stockSubscriptionId: 'uuid-de-subscription', // ✅ Referencia a subscription
  description: 'Capital de acciones',
}
```

### Operaciones sin Member (System Operations)

Algunas operaciones no tienen `memberId` (operaciones del sistema):

```typescript
{
  memberId: null, // ✅ Permitido para operaciones del sistema
  meetingId: meetingId,
  type: OperationType.INITIAL_CASH_BALANCE,
  entries: [...],
}
```

## Convenciones de Débitos y Créditos

### Débitos (amount > 0)
- Aumentos de activos
- Aumentos de deudas
- Aumentos de capital
- Ingresos

### Créditos (amount < 0)
- Disminuciones de activos
- Disminuciones de deudas
- Disminuciones de capital
- Gastos

### Ejemplo de Balance

```typescript
// Compra de acción con efectivo:
// - Débito: STOCK_CAPITAL_ACCOUNT (+1000) → Aumenta capital
// - Crédito: CASH_ACCOUNT (-1000) → Disminuye efectivo
entries: [
  { accountType: STOCK_CAPITAL_ACCOUNT, amount: 1000 }, // Débito
  { accountType: CASH_ACCOUNT, amount: -1000 },         // Crédito
]
```

## Beneficios del Sistema Transversal

1. **Código Centralizado**: Una sola implementación, fácil de mantener
2. **Validación Automática**: Garantiza balance contable sin código adicional
3. **Transaccionalidad**: Operaciones atómicas (todo o nada)
4. **Consistencia**: Mismo comportamiento en todos los servicios
5. **Testabilidad**: Lógica centralizada más fácil de testear
6. **Reducción de Duplicación**: Elimina ~1,300 líneas de código duplicado

## Referencias

- **Use Case**: `backend/src/application/use-cases/accounting/record-operation.use-case.ts`
- **DTOs**: `backend/src/application/dto/accounting/`
- **Domain Service**: `backend/src/domain/services/operation-balance-validator.service.ts`
- **Transaction Manager**: `backend/src/infrastructure/services/transaction-manager/`

