# [COMPLETED] Plan de Refactorización de Enums y Tipos en el Backend

## Objetivo
Centralizar y estandarizar el uso de enums y tipos en el backend para mejorar la mantenibilidad, robustez y consistencia del código.

---

## Pasos a Seguir

1. **Crear carpeta común para enums y tipos**
   - Ubicación sugerida: `backend/src/common/enums/` y `backend/src/common/types/`.

2. **Identificar todos los enums y tipos usados como string literal o arrays de strings**
   - Ejemplos: `loan_type`, `OperationTypeEnum`, `PaymentType`, etc.
   - Buscar en DTOs, entidades y servicios.

3. **Definir los enums como TypeScript enums en la carpeta común**
   - Ejemplo:
     ```typescript
     // backend/src/common/enums/loan-type.enum.ts
     export enum LoanType {
       CORRIENTE = 'corriente',
       AGIL = 'agil',
       ACCION = 'accion',
     }
     ```

4. **Reemplazar los arrays de strings y type alias por enums**
   - En DTOs, entidades y servicios, importar y usar el enum correspondiente.
   - Ejemplo en DTO:
     ```typescript
     import { LoanType } from '@/common/enums/loan-type.enum';
     @ApiProperty({ enum: LoanType })
     @IsEnum(LoanType)
     loan_type: LoanType;
     ```

5. **Actualizar las entidades para usar el enum**
   - Cambiar el tipo de columna a `LoanType` en vez de `string` si aplica.
   - Ejemplo:
     ```typescript
     @Column({ type: 'text' })
     loan_type: LoanType;
     ```

6. **Actualizar validaciones y decoradores Swagger**
   - Usar `@ApiProperty({ enum: ... })` y `@IsEnum(...)` en los DTOs.

7. **Revisar y actualizar todos los lugares donde se usen strings sueltos para tipos**
   - Cambiar comparaciones, asignaciones y validaciones para usar el enum.

8. **Probar la aplicación y los tests**
   - Ejecutar los tests para asegurar que no se rompe nada.
   - Probar los endpoints que usan estos enums.

9. **Documentar los enums principales en el README o en un archivo de referencia**
   - Opcional: agregar una tabla de enums y sus valores posibles para consulta rápida.

---

## Notas
- Si algún enum se usa también en el frontend, considerar crear un paquete compartido o exportar los valores de forma sincronizada.
- Si hay enums que solo se usan en un módulo, pueden quedarse ahí, pero los globales deben ir en `common/enums`.

---

## Cambios realizados hasta ahora

- Se crearon las carpetas `backend/src/common/enums/` y `backend/src/common/types/` para centralizar enums y tipos globales.
- Se centralizaron los siguientes enums en archivos individuales dentro de `common/enums`:
  - `OperationType`
  - `PaymentType`
  - `TransactionType`
  - `LoanStatus`
  - `StockBehavior`
  - `MeetingStatus`
  - `MemberRole`
  - `DisbursementType`
- Se decidió que `loan_type` y `asset_type` seguirán siendo campos dinámicos (tipo `string`), ya que sus valores pueden variar y no son un conjunto cerrado.
- Los demás tipos globales serán migrados a enums TypeScript para mayor robustez y mantenibilidad.

---

## Cambios realizados en el paso 4: Reemplazo de arrays de strings y type alias por enums centralizados

Durante este paso se migraron los siguientes casos:

### 1. PaymentType
- Archivo: `backend/src/meetings/dto/create-transaction-payment.dto.ts`
- Se eliminó el array de strings y se importó el enum `PaymentType` desde `common/enums/payment-type.enum.ts`.
- Se actualizó el decorador `@IsIn` por `@IsEnum` y el tipo del campo a `PaymentType`.

### 2. OperationType
- Archivos:
  - `backend/src/operations/entities/operation.entity.ts`
  - `backend/src/operations/dto/find-operations.dto.ts`
  - `backend/src/asset-revaluation/asset-revaluation.service.ts`
  - `backend/src/meetings/meetings.service.ts`
  - `backend/src/loans/loans.service.ts`
  - `backend/src/meetings/strategies/dividend-disbursement.strategy.ts`
  - `backend/src/meetings/strategies/other-disbursement.strategy.ts`
  - `backend/src/meetings/strategies/stock-withdrawal.strategy.ts`
  - `backend/src/stocks/stocks.service.ts`
  - `backend/src/loan-transactions/loan-transactions.service.ts`
- Se eliminó el type alias y array de strings, usando solo el enum `OperationType` importado desde `common/enums/operation-type.enum.ts`.
- Se actualizaron todas las asignaciones y validaciones para usar el enum en vez de strings sueltos.
- Se corrigieron los tipos en los servicios y estrategias para cumplir con la nueva definición.

### 3. TransactionType
- Archivos:
  - `backend/src/loan-transactions/dto/create-loan-transaction.dto.ts`
  - `backend/src/loans/entities/loan-transaction-detail.entity.ts`
  - `backend/src/loan-transactions/loan-transactions.service.ts`
  - `backend/src/loans/loans.service.ts`
  - `backend/src/dues/dues.service.ts`
- Se migró el uso de `transaction_type` a usar el enum `TransactionType` centralizado en todos los lugares relevantes.
- **Se cambió el idioma de los valores del enum a inglés:**
  - `'disbursement'`, `'principal_payment'`, `'interest_payment'`.
- Se actualizó la consulta en `dues.service.ts` para usar el enum y mantener la consistencia.

### 4. Decisión sobre idioma de los enums globales
- Se decidió que los valores de los enums globales deben estar en inglés para mantener consistencia y facilitar la integración futura.
- Se revisarán y migrarán otros enums globales a inglés si aplica en los siguientes pasos del refactor.

**Notas:**
- Se corrigieron errores de compilación y linter derivados de la migración.
- Se mantuvieron los strings en campos que no corresponden a enums globales (por ejemplo, entidades específicas o campos dinámicos).

---

**Fin del plan.** 