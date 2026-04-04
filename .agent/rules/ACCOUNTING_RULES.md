# 💰 Accounting Rules (Reglas Contables)

**IMPORTANTE: Estas reglas son OBLIGATORIAS al modificar código relacionado con finanzas, dinero, transacciones o préstamos.**

## Registro de Operaciones Contables (OBLIGATORIO)
- **TODAS las operaciones contables** DEBEN registrarse usando `RecordOperationUseCase`. Para esto, DEBES usar la skill **Accounting Operation Builder**.
- **NO crear** operaciones directamente con TypeORM (`queryRunner.manager.create(Operation, ...)`).
- **NO crear** ledger entries directamente con TypeORM (`queryRunner.manager.create(LedgerEntry, ...)`).
- **NO duplicar** lógica de validación de balance (ya está centralizada en `OperationBalanceValidator`).
- **NO gestionar** transacciones manualmente para operaciones contables (el use case lo maneja automáticamente).

### Uso Correcto e Incorrecto

```typescript
// ✅ CORRECTO - Usar RecordOperationUseCase
const result = await this.recordOperationUseCase.execute({
  memberId: memberId,
  meetingId: meetingId,
  type: OperationType.MONTHLY_PAYMENT,
  description: 'Pago mensual',
  entries: [
    { accountType: CASH_ACCOUNT, amount: -1000 },
    { accountType: STOCK_CAPITAL_ACCOUNT, amount: 1000 },
  ],
});

// ❌ INCORRECTO - NO crear operaciones directamente con TypeORM
const queryRunner = this.dataSource.createQueryRunner();
const operation = queryRunner.manager.create(Operation, { ... });
```

### Beneficios y Justificación
- Validación automática de balance (débitos = créditos). Garantiza que no perdemos dinero virtual.
- Transaccionalidad garantizada (todo o nada).
- Eliminación de código duplicado (~1,300 líneas mitigadas tras el rediseño).
- Consistencia en todo el sistema.

### Documentación Completa
Ver [GUIA_REGISTRO_OPERACIONES.md](../../docs/01-ARQUITECTURA/GUIA_REGISTRO_OPERACIONES.md) para ejemplos detallados y casos de uso.
