# 0006: Gestión Avanzada de Efectivo, Desembolsos y Dividendos

**Fecha**: 2024-07-30
**Estado**: Aceptado

## Contexto

El proceso de desembolso actual, definido como el último paso de una reunión, es demasiado simplista. Asume que siempre hay suficiente efectivo para cubrir todos los préstamos aprobados. Sin embargo, en un escenario real, el efectivo es un recurso limitado y su asignación debe seguir reglas de negocio claras para manejar:

1.  **Insuficiencia de Efectivo**: Los préstamos aprobados y los retiros de capital pueden exceder el efectivo disponible.
2.  **Prioridad de Pagos**: Los pagos pendientes de reuniones anteriores (préstamos no desembolsados completamente, retiros de acciones) deben tener prioridad.
3.  **Composición de los Desembolsos**: Dividendos, retiros de acciones, préstamos nuevos y pagos parciales deben poder coexistir en un mismo plan de desembolso.

## Decisión Arquitectónica

Se adopta la **Opción A**: los préstamos nuevos se crean y desembolsan de forma atómica durante la ejecución del plan de desembolso, no antes.

## Proceso de Desembolso

- El plan de desembolso debe contemplar las 5 fuentes de salida de efectivo:
  1. Deuda antigua con socios (pending_member_payments de reuniones anteriores)
  2. Deuda antigua de préstamos (préstamos aprobados pero no desembolsados completamente)
  3. Dividendos del período actual
  4. Préstamos nuevos (creados y desembolsados en este paso)
  5. Retiros de acciones nuevos (reunión actual)

- El cálculo de dividendos se realizará usando el valor actual de la acción (`value`), no un valor base.

- El endpoint de previsualización (`previewDisbursementPlan`) debe mostrar todas las obligaciones y permitir agregar préstamos nuevos.

- El endpoint de ejecución (`executeDisbursementPlan`) debe:
  - Crear préstamos nuevos y desembolsarlos
  - Actualizar préstamos existentes con desembolsos parciales
  - Marcar pagos pendientes como pagados
  - Registrar retiros de acciones
  - Registrar dividendos
  - Generar los asientos contables correspondientes

## Consideraciones Técnicas

- No se requiere agregar un campo `valor_base` o `base_value` adicional en la entidad de acciones.
- Los dividendos se calculan siempre sobre el valor actual de la acción.

### 1. Nuevos Comportamientos para las Acciones

Para manejar diferentes tipos de rendimiento, se introduce una nueva propiedad en la entidad `Stock`:

-   **`behavior` (enum)**: Define cómo la acción genera valor para el socio.
    -   `CAPITAL_APPRECIATION`: El valor de la acción crece con las ganancias del fondo. Los socios ganan al vender la acción a un precio mayor. (Comportamiento por defecto y actual).
    -   `DIVIDEND_YIELD`: La acción mantiene un valor base. Las ganancias que genera se distribuyen como dividendos en efectivo a los socios suscriptores.

### 2. Modificación del Proceso de Revalorización (Paso 2)

El servicio `AssetRevaluationService` se adaptará para tener en cuenta el `behavior` de la acción:

-   Para acciones `DIVIDEND_YIELD`, el servicio calculará las ganancias generadas. En lugar de sumarlas al `current_value` de la acción, creará registros de "pago de dividendo pendiente" que serán procesados durante la fase de desembolso. El valor de la acción puede volver a su valor base o a un nuevo valor base según reglas específicas.

### 3. Modelo de Desembolso por Prioridades

El paso final de la reunión (`POST /meetings/:id/disbursement-plan/execute`) ejecutará un algoritmo de asignación de efectivo.

**A. Fuente de Fondos:** El `efectivo_disponible` total de la reunión. La lógica debe poder filtrar este efectivo si se implementan los fondos destinados.

**B. Cola de Prioridad de Pagos:** El sistema procesará los desembolsos en el siguiente orden estricto:

1.  **Prioridad 1: Deuda Antigua con Socios**: Pagos pendientes a socios de reuniones anteriores (retiros de acciones o dividendos no completados), consultados desde la nueva tabla `pending_member_payments`.
2.  **Prioridad 2: Deuda Antigua de Préstamos**: Desembolsos pendientes de préstamos aprobados en reuniones anteriores (`approved_amount > disbursed_amount`).
3.  **Prioridad 3: Dividendos del Período Actual**: Pagos de dividendos generados por acciones `DIVIDEND_YIELD` en la revalorización de la reunión actual.
4.  **Prioridad 4: Préstamos Nuevos (Opción A)**: **Creación y desembolso** de préstamos nuevos basados en datos del formulario de la interfaz de desembolso.
5.  **Prioridad 5: Retiros de Acciones Nuevos**: Desembolsos por retiros de acciones realizados en la reunión actual.

**C. Gestión de Pagos Parciales:**

-   **Préstamos Existentes**: La entidad `Loan` se modificará para tener `approved_amount` y `disbursed_amount`. Si el efectivo no es suficiente, se desembolsa una parte y se actualiza `disbursed_amount`. El préstamo queda en estado `PARTIALLY_DISBURSED`.
-   **Préstamos Nuevos (Opción A)**: Si no hay efectivo suficiente para el monto solicitado:
    - Se crea el préstamo con `approved_amount` = monto solicitado
    - Se desembolsa solo el efectivo disponible: `disbursed_amount` = efectivo disponible
    - El préstamo queda en estado `PARTIALLY_DISBURSED` desde su creación
    - El resto queda como deuda pendiente para futuras reuniones
-   **Retiros y Dividendos**: Si un pago a un socio no puede completarse, se registrará el monto pendiente en una nueva tabla `pending_member_payments`, creando una deuda del fondo hacia el socio.

### 4. Cambios en la Base de Datos

-   **Tabla `stocks`**:
    -   Añadir columna `behavior TEXT NOT NULL DEFAULT 'CAPITAL_APPRECIATION'`.
    -   Añadir columna `base_value NUMERIC`.
-   **Tabla `loans`**:
    -   Considerar renombrar `amount` a `approved_amount`.
    -   Añadir columna `disbursed_amount NUMERIC NOT NULL DEFAULT 0`.
-   **Nueva Tabla `pending_member_payments`**:
    -   `id` (PK), `member_id` (FK), `meeting_id` (FK a la reunión que originó la deuda), `amount` (monto pendiente), `reason` (dividendo, retiro), `status`
    -   **Nuevo**: `loan_id` (FK opcional, para préstamos pendientes)
    -   **Nuevo**: `stock_subscription_id` (FK opcional, para retiros de acciones)
    -   **Nuevo**: `reference_meeting_id` (FK opcional, reunión que originó la deuda)
    -   **Nuevo**: `disbursement_type` (VARCHAR, tipo específico de desembolso)

### 5. Estructura de DTOs para Opción A

```typescript
export enum DisbursementType {
  DIVIDENDO = 'dividendo',
  RETIRO_ACCION = 'retiro_accion',
  PRESTAMO_NUEVO = 'prestamo_nuevo',
  PRESTAMO_PENDIENTE = 'prestamo_pendiente',
  OTRO = 'otro',
}

export class NewLoanRequestDto {
  @IsUUID()
  memberId: string;
  
  @IsNumber()
  @IsPositive()
  amount: number;
  
  @IsString()
  loanType: string; // 'corriente', 'agil'
  
  @IsNumber()
  @IsPositive()
  monthlyPaymentAmount: number;
  
  @IsNumber()
  @Min(0)
  @Max(1)
  interestRate: number;
}

export class DisbursementPlanItemDto {
  @IsUUID()
  memberId: string;
  
  @IsEnum(DisbursementType)
  type: DisbursementType;
  
  @IsNumber()
  @IsPositive()
  amount: number;
  
  @IsNumber()
  @Min(1)
  @Max(5)
  priority: number; // 1-5 según prioridades
  
  // Para préstamos/retiros existentes
  @IsOptional()
  @IsUUID()
  loanId?: string;
  
  @IsOptional()
  @IsUUID()
  stockSubscriptionId?: string;
  
  @IsOptional()
  @IsUUID()
  referenceMeetingId?: string;
  
  // Solo para PRESTAMO_NUEVO (Opción A)
  @IsOptional()
  @ValidateNested()
  @Type(() => NewLoanRequestDto)
  newLoanData?: NewLoanRequestDto;
}
```

### 6. Flujo de Interfaz de Usuario (Opción A)

**Step 4 (Modificación de Acciones)**:
- Solo maneja modificaciones reales de acciones existentes
- Retiros de acciones (crea `pending_member_payments`)
- NO incluye creación de préstamos

**Step 5 (Desembolsos)**:
- **Sección 1**: Mostrar efectivo disponible
- **Sección 2**: Obligaciones automáticas (prioridades 1-3)
- **Sección 3**: Formulario para nuevos préstamos:
  - Selector de socio
  - Monto, tipo, cuota, tasa de interés
  - Botón "Agregar al plan"
- **Sección 4**: Plan completo de desembolso
- **Confirmación**: Ejecuta creación y desembolso atómico