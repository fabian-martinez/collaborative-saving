# Dashboard de Reunión Cerrada

## Contexto del Sistema

Sistema de gestión de fondo familiar (ahorro colaborativo) con contabilidad de doble entrada. Las reuniones pueden estar en estado 'active' o 'closed'. Este dashboard muestra el resumen de una reunión cerrada.

## Estructura de Datos de la Base de Datos

### Tablas Principales:
- `meetings`: id (uuid), date (timestamp), status ('active' | 'closed'), notes (text)
- `operations`: id (uuid), meeting_id (uuid), member_id (uuid), type (text), date (timestamp), description (text)
- `ledger_entries`: id (uuid), operation_id (uuid), account_type (text), amount (numeric), description (text)
- `members`: id (uuid), name (text), status ('active' | 'inactive')
- `loans`: id (uuid), member_id (uuid), loan_type (text), approved_amount, disbursed_amount, outstanding_balance, status
- `stocks`: id (uuid), type (text), value (numeric), monthly_contribution (numeric)
- `stock_subscriptions`: id (uuid), member_id (uuid), stock_id (uuid), quantity (numeric), status ('active' | 'inactive')
- `pending_member_payments`: id (uuid), member_id (uuid), meeting_id (uuid), type ('dividend' | 'stock_withdrawal' | 'loan' | 'other'), amount (numeric), status ('pending' | 'approved' | 'rejected' | 'paid')

### Tipos de Operaciones (OperationType):
- `MONTHLY_PAYMENT`: Pagos mensuales de socios (aportes)
- `LOAN_PAYMENT`: Pagos de préstamos
- `LOAN_DISBURSEMENT`: Desembolsos de préstamos
- `STOCK_PURCHASE`: Compra de acciones
- `STOCK_WITHDRAWAL`: Retiro de acciones
- `MANDATORY_CONTRIBUTION`: Contribuciones obligatorias
- `ASSET_REVALUATION`: Revaluación de activos
- `DIVIDEND_PAYMENT`: Pago de dividendos
- `FEE`: Multas y tarifas
- `INSURANCE_PAYMENT`: Pagos de seguro

### Tipos de Cuentas Contables (AccountType):
- **Activos**: `CASH`, `LOANS_RECEIVABLE`, `INVESTMENT_IN_STOCKS`, `DIVIDENDS_PAYABLE`
- **Patrimonio**: `STOCK_CAPITAL`, `REVALUATION_SURPLUS`, `MEMBER_EQUITY`, `ACCUMULATED_SURPLUS`
- **Ingresos**: `INTEREST_INCOME`, `FEE_INCOME`, `MANDATORY_CONTRIBUTION_INCOME`, `INSURANCE_INCOME`
- **Gastos**: `DIVIDEND_EXPENSE`, `OTHER_EXPENSES`, `NOVELTY_LOSS`

## Diseño del Dashboard

### Layout General
- **Header**: Título "Reunión #[número]" con fecha formateada (ej: "jueves, 14 de diciembre 2025")
- **Banner de Estado**: Si status = 'closed', mostrar banner con texto "Reunión Cerrada" y nota "Esta reunión está cerrada. Los datos son de solo lectura" (fondo gris claro, texto gris)
- **Tabs de Navegación**: "Resumen" (activo), "Aportes", "Pagos", "Préstamos", "Acciones", "Asientos"

### Sección Superior: Cards de Resumen (4 cards en fila)

#### 1. Total Recaudado
- **Icono**: Flecha verde hacia arriba
- **Título**: "Total Recaudado"
- **Valor**: Suma de todos los ingresos de efectivo (CASH) con amount > 0 para esta reunión
- **Cálculo**: `SELECT SUM(amount) FROM ledger_entries WHERE operation_id IN (SELECT id FROM operations WHERE meeting_id = ?) AND account_type = 'CASH' AND amount > 0`
- **Formato**: Moneda colombiana (COP) con separadores de miles

#### 2. Total Desembolsado
- **Icono**: Flecha naranja hacia arriba-derecha
- **Título**: "Total Desembolsado"
- **Valor**: Suma de todos los desembolsos (CASH con amount < 0) para esta reunión
- **Cálculo**: `SELECT ABS(SUM(amount)) FROM ledger_entries WHERE operation_id IN (SELECT id FROM operations WHERE meeting_id = ?) AND account_type = 'CASH' AND amount < 0`
- **Formato**: Moneda colombiana (COP)

#### 3. Valor Acción
- **Icono**: Reloj
- **Título**: "Valor Acción"
- **Valor**: Mostrar el valor promedio o el valor más reciente de las acciones después de la revaluación
- **Cálculo**: Si hay operación `ASSET_REVALUATION` en esta reunión, mostrar el nuevo valor. Si no, mostrar el valor actual de la acción más común o el promedio
- **Query**: `SELECT s.value FROM stocks s JOIN stock_value_history svh ON s.id = svh.stock_id JOIN operations o ON svh.operation_id = o.id WHERE o.meeting_id = ? AND o.type = 'ASSET_REVALUATION' ORDER BY svh.created_at DESC LIMIT 1`
- **Formato**: Moneda colombiana (COP)

#### 4. Participantes
- **Icono**: Grupo de personas
- **Título**: "Participantes"
- **Valor**: Número de miembros únicos que tienen operaciones en esta reunión
- **Cálculo**: `SELECT COUNT(DISTINCT member_id) FROM operations WHERE meeting_id = ? AND member_id IS NOT NULL`

### Sección Principal: Dos Columnas

#### Columna Izquierda: "Recaudos" (Collections)

**Título**: "Recaudos"

Lista de ingresos con iconos y valores:

1. **Aportes de socios**
   - **Icono**: Usuario con signo de más
   - **Valor**: Suma de `MONTHLY_PAYMENT` donde CASH amount > 0
   - **Cantidad**: `COUNT(DISTINCT o.id) WHERE o.type = 'MONTHLY_PAYMENT' AND o.meeting_id = ?`
   - **Monto**: `SELECT SUM(le.amount) FROM ledger_entries le JOIN operations o ON le.operation_id = o.id WHERE o.meeting_id = ? AND o.type = 'MONTHLY_PAYMENT' AND le.account_type = 'CASH' AND le.amount > 0`

2. **Pagos de préstamos**
   - **Icono**: Billete con flecha
   - **Valor**: Suma de `LOAN_PAYMENT` donde CASH amount > 0
   - **Cantidad**: `COUNT(DISTINCT o.id) WHERE o.type = 'LOAN_PAYMENT' AND o.meeting_id = ?`
   - **Monto**: `SELECT SUM(le.amount) FROM ledger_entries le JOIN operations o ON le.operation_id = o.id WHERE o.meeting_id = ? AND o.type = 'LOAN_PAYMENT' AND le.account_type = 'CASH' AND le.amount > 0`

3. **Intereses cobrados**
   - **Icono**: Gráfico de barras
   - **Valor**: Suma de `INTEREST_INCOME` para esta reunión
   - **Monto**: `SELECT ABS(SUM(amount)) FROM ledger_entries WHERE operation_id IN (SELECT id FROM operations WHERE meeting_id = ?) AND account_type = 'INTEREST_INCOME'`
   - **Nota**: Los intereses en contabilidad de doble entrada pueden ser negativos, usar ABS()

4. **Moras recaudadas**
   - **Icono**: Reloj de alarma
   - **Valor**: Suma de `FEE_INCOME` para esta reunión
   - **Monto**: `SELECT ABS(SUM(amount)) FROM ledger_entries WHERE operation_id IN (SELECT id FROM operations WHERE meeting_id = ?) AND account_type = 'FEE_INCOME'`

5. **Total Recaudado** (línea separadora, texto en negrita)
   - Suma de todos los recaudos anteriores
   - Debe coincidir con el card superior

#### Columna Derecha: "Desembolsos" (Disbursements)

**Título**: "Desembolsos"

Lista de desembolsos con iconos y valores:

1. **Nuevos préstamos**
   - **Icono**: Mano dando dinero
   - **Valor**: Suma de `LOAN_DISBURSEMENT` donde CASH amount < 0
   - **Cantidad**: `COUNT(DISTINCT o.id) WHERE o.type = 'LOAN_DISBURSEMENT' AND o.meeting_id = ?`
   - **Monto**: `SELECT ABS(SUM(le.amount)) FROM ledger_entries le JOIN operations o ON le.operation_id = o.id WHERE o.meeting_id = ? AND o.type = 'LOAN_DISBURSEMENT' AND le.account_type = 'CASH' AND le.amount < 0`

2. **Liquidación acciones**
   - **Icono**: Gráfico descendente
   - **Valor**: Suma de `STOCK_WITHDRAWAL` donde CASH amount < 0
   - **Cantidad**: `COUNT(DISTINCT o.id) WHERE o.type = 'STOCK_WITHDRAWAL' AND o.meeting_id = ?`
   - **Monto**: `SELECT ABS(SUM(le.amount)) FROM ledger_entries le JOIN operations o ON le.operation_id = o.id WHERE o.meeting_id = ? AND o.type = 'STOCK_WITHDRAWAL' AND le.account_type = 'CASH' AND le.amount < 0`

3. **Pago de dividendos**
   - **Icono**: Moneda con signo de división
   - **Valor**: Suma de `DIVIDEND_PAYMENT` donde CASH amount < 0
   - **Cantidad**: `COUNT(DISTINCT o.id) WHERE o.type = 'DIVIDEND_PAYMENT' AND o.meeting_id = ?`
   - **Monto**: `SELECT ABS(SUM(le.amount)) FROM ledger_entries le JOIN operations o ON le.operation_id = o.id WHERE o.meeting_id = ? AND o.type = 'DIVIDEND_PAYMENT' AND le.account_type = 'CASH' AND le.amount < 0`

4. **Total Desembolsado** (línea separadora, texto en negrita)
   - Suma de todos los desembolsos anteriores
   - Debe coincidir con el card superior

### Sección Inferior: Cuatro Paneles Pequeños (2x2)

#### Panel 1 (Izquierda Superior): Asistencia
- **Título**: "Asistencia"
- **Valor**: `COUNT(DISTINCT o.member_id) / [número esperado de participantes]` o simplemente `COUNT(DISTINCT o.member_id)`
- **Barra de progreso**: Azul, mostrar porcentaje
- **Texto**: Mostrar "X/Y participantes" o "X participantes"

#### Panel 2 (Derecha Superior): Revalorización
- **Título**: "Revalorización"
- **Valor**: Si hay operación `ASSET_REVALUATION`, calcular el porcentaje de cambio
- **Cálculo**:
  ```sql
  SELECT
    svh.previous_value,
    svh.new_value,
    ((svh.new_value - svh.previous_value) / svh.previous_value * 100) as percentage_change
  FROM stock_value_history svh
  JOIN operations o ON svh.operation_id = o.id
  WHERE o.meeting_id = ? AND o.type = 'ASSET_REVALUATION'
  ORDER BY svh.created_at DESC
  LIMIT 1
  ```
- **Mostrar**: "+X.XX%" o "-X.XX%" con color verde/rojo según sea positivo o negativo
- **Valor acción**: Mostrar "$X.XXX → $Y.YYY"

#### Panel 3 (Izquierda Inferior): Pagos al día
- **Título**: "Pagos al día"
- **Icono**: Checkmark verde
- **Valor**: Contar préstamos activos donde el último pago está al día (sin mora)
- **Cálculo**: Préstamos con `status = 'active'` y sin pagos pendientes vencidos
- **Nota**: Esto puede requerir lógica de negocio adicional para determinar "al día"

#### Panel 4 (Derecha Inferior): En mora
- **Título**: "En mora"
- **Icono**: Triángulo de advertencia rojo
- **Valor**: Contar préstamos o pagos pendientes que están en mora
- **Cálculo**:
  ```sql
  SELECT COUNT(*)
  FROM pending_member_payments
  WHERE meeting_id = ?
  AND status IN ('pending', 'approved')
  AND [lógica de mora basada en fechas]
  ```
  O contar préstamos con pagos vencidos

### Sección Inferior: Observaciones
- **Título**: "Observaciones"
- **Contenido**: Mostrar `meetings.notes` si existe
- **Estilo**: Texto en cursiva, color gris

## Endpoints/Consultas Necesarias

### 1. GET /api/meetings/:id/summary
Retorna el resumen completo de la reunión:
```typescript
{
  meeting: {
    id: string;
    date: string;
    status: 'active' | 'closed';
    notes: string | null;
  };
  summary: {
    totalCollected: number;
    totalDisbursed: number;
    shareValue: number;
    participants: number;
  };
  collections: {
    memberContributions: { count: number; amount: number };
    loanPayments: { count: number; amount: number };
    interestCollected: number;
    feesCollected: number;
  };
  disbursements: {
    newLoans: { count: number; amount: number };
    stockLiquidations: { count: number; amount: number };
    dividendPayments: { count: number; amount: number };
  };
  metrics: {
    attendance: { current: number; expected?: number; percentage: number };
    revaluation: { previousValue: number; newValue: number; percentage: number } | null;
    paymentsUpToDate: number;
    overduePayments: number;
  };
}
```

## Componentes React/Vue Sugeridos

1. **MeetingHeader**: Header con título, fecha y banner de estado
2. **SummaryCards**: Grid de 4 cards con iconos
3. **CollectionsPanel**: Panel izquierdo con lista de recaudos
4. **DisbursementsPanel**: Panel derecho con lista de desembolsos
5. **MetricsGrid**: Grid 2x2 con los 4 paneles inferiores
6. **ObservationsSection**: Sección de observaciones
7. **MeetingTabs**: Componente de tabs para navegación

## Estilos y Diseño

- **Colores**:
  - Verde: Para valores positivos, ingresos
  - Naranja: Para desembolsos
  - Rojo: Para alertas, moras
  - Azul: Para información general
  - Gris: Para texto secundario, reunión cerrada

- **Tipografía**:
  - Títulos: Bold, tamaño grande
  - Valores monetarios: Monospace o fuente numérica, tamaño mediano-grande
  - Texto secundario: Regular, tamaño pequeño, color gris

- **Espaciado**:
  - Cards: Padding generoso, sombras sutiles
  - Paneles: Separación clara entre secciones
  - Listas: Espaciado vertical entre items

- **Iconos**:
  - Usar librería de iconos (Heroicons, Lucide, etc.)
  - Tamaño consistente (24px o 20px)
  - Colores según contexto

## Validaciones y Casos Especiales

1. **Reunión sin datos**: Mostrar mensaje "No hay datos disponibles para esta reunión"
2. **Valores cero**: Mostrar "0" o "-" según el contexto
3. **Reunión activa**: Si status = 'active', no mostrar banner de "cerrada" y permitir edición
4. **Formato de moneda**: Usar formato colombiano: $1.234.567,89 o $1.234.567
5. **Fechas**: Formatear en español: "jueves, 14 de diciembre 2025"

## Funcionalidad de Click en Socio - Recibo de Operaciones

### Descripción
Al hacer click en el nombre de un socio en cualquier parte del dashboard (especialmente en las listas de recaudos o desembolsos), se debe abrir un modal que muestre un recibo detallado con todas las operaciones de ese socio en la reunión.

### Componente: MemberReceiptModal

#### Estructura del Modal:
- **Header del Modal**:
  - Título: "Recibo de Operaciones - [Nombre del Socio]"
  - Fecha de la reunión
  - Botón de cerrar (X)
  - Botón de imprimir (icono de impresora)

#### Contenido del Recibo:
El recibo debe mostrar todas las operaciones del socio en esta reunión, agrupadas por tipo de operación.

**Estructura del Recibo:**

1. **Encabezado del Recibo**:
   ```
   RECIBO DE OPERACIONES
   Socio: [Nombre Completo del Socio]
   Reunión: #[número] - [Fecha formateada]
   Fecha de emisión: [Fecha actual]
   ```

2. **Lista de Operaciones**:
   Cada operación debe mostrar:
   - **Tipo de operación** (con icono según el tipo)
   - **Fecha y hora** de la operación
   - **Descripción** de la operación
   - **Desglose contable** (asientos relacionados):
     - Para cada `ledger_entry` relacionado:
       - Cuenta contable afectada
       - Monto (positivo o negativo)
       - Descripción del asiento
   - **Total de la operación** (suma de los montos relevantes)

3. **Resumen al Final**:
   - **Total de ingresos** (suma de CASH con amount > 0)
   - **Total de egresos** (suma de CASH con amount < 0)
   - **Saldo neto** (ingresos - egresos)

#### Tipos de Operaciones y su Visualización:

1. **MONTHLY_PAYMENT** (Pago Mensual):
   - Icono: Usuario con signo de más
   - Mostrar: Monto pagado, tipo de contribución
   - Asientos: CASH (positivo), MANDATORY_CONTRIBUTION_INCOME (negativo)

2. **LOAN_PAYMENT** (Pago de Préstamo):
   - Icono: Billete con flecha
   - Mostrar: Monto pagado, préstamo relacionado, capital e intereses
   - Asientos: CASH (positivo), LOANS_RECEIVABLE (negativo), INTEREST_INCOME (negativo)

3. **LOAN_DISBURSEMENT** (Desembolso de Préstamo):
   - Icono: Mano dando dinero
   - Mostrar: Monto desembolsado, tipo de préstamo, saldo pendiente
   - Asientos: CASH (negativo), LOANS_RECEIVABLE (positivo)

4. **STOCK_PURCHASE** (Compra de Acciones):
   - Icono: Gráfico ascendente
   - Mostrar: Tipo de acción, cantidad, valor unitario, total
   - Asientos: STOCK_CAPITAL (positivo), CASH (negativo) o LOANS_RECEIVABLE (negativo si fue financiado)

5. **STOCK_WITHDRAWAL** (Retiro de Acciones):
   - Icono: Gráfico descendente
   - Mostrar: Tipo de acción, cantidad, valor unitario, total
   - Asientos: STOCK_CAPITAL (negativo), CASH (positivo)

6. **DIVIDEND_PAYMENT** (Pago de Dividendos):
   - Icono: Moneda con signo de división
   - Mostrar: Monto del dividendo, acciones relacionadas
   - Asientos: CASH (negativo), DIVIDENDS_PAYABLE (positivo)

7. **ASSET_REVALUATION** (Revaluación):
   - Icono: Gráfico de barras
   - Mostrar: Valor anterior, valor nuevo, diferencia
   - Asientos: INVESTMENT_IN_STOCKS, REVALUATION_SURPLUS

8. **FEE** (Multa):
   - Icono: Reloj de alarma
   - Mostrar: Concepto de la multa, monto
   - Asientos: CASH (positivo), FEE_INCOME (negativo)

### Endpoints Existentes a Utilizar

**No es necesario crear un nuevo endpoint.** La API ya proporciona los endpoints necesarios:

#### 1. GET /v2/accounting/operations (Principal)
Este endpoint permite filtrar operaciones por `member_id` y `meeting_id`, y devuelve todas las operaciones con sus ledger entries completos.

**Query Parameters:**
- `member_id` (UUID, opcional): Filtrar por miembro
- `meeting_id` (UUID, opcional): Filtrar por reunión
- `type` (string, opcional): Filtrar por tipo de operación
- `start_date` (ISO date, opcional): Fecha de inicio
- `end_date` (ISO date, opcional): Fecha de fin
- `page` (number, opcional, default: 1): Número de página
- `limit` (number, opcional, default: 10): Límite de resultados
- `order_by` (string, opcional): Ordenamiento

**Ejemplo de uso:**
```
GET /v2/accounting/operations?member_id={memberId}&meeting_id={meetingId}&limit=100
```

**Respuesta:**
```typescript
{
  data: Array<{
    id: string;
    member_id: string | null;
    meeting_id: string;
    type: string; // OperationType
    date: string;
    description: string | null;
    total_amount: number; // Suma de CASH con amount > 0
    entries: Array<{
      id: string;
      operation_id: string;
      account_type: string; // AccountType
      amount: number;
      created_at: string;
      description: string | null;
      loan_id: string | null;
      stock_id: string | null;
      mandatory_contribution_id: string | null;
      stock_subscription_id: string | null;
    }>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

#### 2. GET /v2/members/:id (Opcional - para datos del miembro)
Obtiene información del miembro (nombre, email, etc.)

**Respuesta:**
```typescript
{
  id: string;
  name: string;
  email: string | null;
  identification_number: string | null;
  role: string;
  status: string;
  address: string | null;
  phone: string | null;
  beneficiary: string | null;
  registration_date: string;
  created_at: string;
}
```

#### 3. GET /v2/meetings/:id (Opcional - para datos de la reunión)
Obtiene información de la reunión (fecha, estado, notas)

**Respuesta:**
```typescript
{
  id: string;
  date: string;
  status: 'active' | 'closed';
  notes: string | null;
  created_at: string;
  summary?: { ... }; // Si se incluye con include_summary=true
}
```

### Estrategia de Implementación

Para obtener el recibo completo del socio en una reunión:

1. **Obtener operaciones del socio en la reunión:**
   ```
   GET /v2/accounting/operations?member_id={memberId}&meeting_id={meetingId}&limit=100
   ```
   Esto devuelve todas las operaciones con sus `entries` (ledger entries) completos.

2. **Obtener datos del miembro (opcional, si no se tienen):**
   ```
   GET /v2/members/{memberId}
   ```

3. **Obtener datos de la reunión (opcional, si no se tienen):**
   ```
   GET /v2/meetings/{meetingId}
   ```

4. **Procesar los datos en el frontend:**
   - Agrupar operaciones por tipo
   - Calcular totales (cashIn, cashOut, netCash) desde los `entries`
   - Formatear para mostrar en el recibo

### Cálculos en el Frontend

A partir de la respuesta de `/v2/accounting/operations`, calcular:

```typescript
// Para cada operación
const cashIn = operation.entries
  .filter(e => e.account_type === 'CASH' && e.amount > 0)
  .reduce((sum, e) => sum + e.amount, 0);

const cashOut = Math.abs(operation.entries
  .filter(e => e.account_type === 'CASH' && e.amount < 0)
  .reduce((sum, e) => sum + e.amount, 0));

const netCash = cashIn - cashOut;

// Para el resumen total
const totalCashIn = operations.reduce((sum, op) => {
  const opCashIn = op.entries
    .filter(e => e.account_type === 'CASH' && e.amount > 0)
    .reduce((s, e) => s + e.amount, 0);
  return sum + opCashIn;
}, 0);

const totalCashOut = operations.reduce((sum, op) => {
  const opCashOut = Math.abs(op.entries
    .filter(e => e.account_type === 'CASH' && e.amount < 0)
    .reduce((s, e) => s + e.amount, 0));
  return sum + opCashOut;
}, 0);

const netCash = totalCashIn - totalCashOut;
```

### Componente Vue/React Sugerido:

```vue
<template>
  <dialog :id="modalId" class="modal">
    <div class="modal-box max-w-4xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-2xl">Recibo de Operaciones</h3>
        <button class="btn btn-sm btn-circle" @click="closeModal">✕</button>
      </div>

      <div v-if="loading" class="text-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="receiptData" class="space-y-6">
        <!-- Encabezado del recibo -->
        <div class="text-center border-b pb-4">
          <h4 class="text-xl font-bold">{{ receiptData.member.name }}</h4>
          <p class="text-sm text-base-content/70">
            Reunión #{{ receiptData.meeting.number }} - {{ formatDate(receiptData.meeting.date) }}
          </p>
          <p class="text-xs text-base-content/50 mt-1">
            Emitido: {{ formatDate(new Date()) }}
          </p>
        </div>

        <!-- Lista de operaciones -->
        <div class="space-y-4">
          <div
            v-for="operation in receiptData.operations"
            :key="operation.id"
            class="border rounded-lg p-4"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <component :is="getOperationIcon(operation.type)" class="w-5 h-5" />
                <span class="font-semibold">{{ getOperationTypeLabel(operation.type) }}</span>
              </div>
              <span class="text-sm text-base-content/70">{{ formatDateTime(operation.date) }}</span>
            </div>

            <p class="text-sm text-base-content/80 mb-3">{{ operation.description }}</p>

            <!-- Desglose contable -->
            <div class="bg-base-200 rounded p-3 space-y-1">
              <div
                v-for="entry in operation.ledgerEntries"
                :key="entry.id"
                class="flex justify-between text-xs"
              >
                <span class="text-base-content/70">{{ entry.accountType }}:</span>
                <span
                  class="font-mono"
                  :class="entry.amount >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ entry.amount >= 0 ? '+' : '' }}{{ formatCurrency(entry.amount) }}
                </span>
              </div>
            </div>

            <!-- Total de la operación -->
            <div class="mt-2 pt-2 border-t flex justify-between">
              <span class="text-sm font-semibold">Total de la operación:</span>
              <span class="font-mono font-bold" :class="operation.totals.netCash >= 0 ? 'text-success' : 'text-error'">
                {{ formatCurrency(operation.totals.netCash) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Resumen final -->
        <div class="border-t-2 border-dashed pt-4 space-y-2">
          <div class="flex justify-between">
            <span class="font-semibold">Total Ingresos:</span>
            <span class="font-mono text-success">{{ formatCurrency(receiptData.summary.totalCashIn) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">Total Egresos:</span>
            <span class="font-mono text-error">{{ formatCurrency(receiptData.summary.totalCashOut) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Saldo Neto:</span>
            <span
              class="font-mono"
              :class="receiptData.summary.netCash >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(receiptData.summary.netCash) }}
            </span>
          </div>
        </div>

        <!-- Botón de imprimir -->
        <div class="flex justify-end gap-2 mt-6">
          <button class="btn btn-outline" @click="printReceipt">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/utils/formatters'

const props = defineProps<{
  memberId: string
  meetingId: string
  memberName?: string // Si ya se tiene, no es necesario hacer otra llamada
  modalId?: string
}>()

const emit = defineEmits<{
  'close': []
}>()

const loading = ref(false)
const operations = ref<any[]>([])
const member = ref<any>(null)
const meeting = ref<any>(null)

// Calcular totales desde las operaciones
const summary = computed(() => {
  const totalCashIn = operations.value.reduce((sum, op) => {
    const opCashIn = op.entries
      .filter((e: any) => e.account_type === 'CASH' && e.amount > 0)
      .reduce((s: number, e: any) => s + e.amount, 0)
    return sum + opCashIn
  }, 0)

  const totalCashOut = operations.value.reduce((sum, op) => {
    const opCashOut = Math.abs(op.entries
      .filter((e: any) => e.account_type === 'CASH' && e.amount < 0)
      .reduce((s: number, e: any) => s + e.amount, 0))
    return sum + opCashOut
  }, 0)

  return {
    totalCashIn,
    totalCashOut,
    netCash: totalCashIn - totalCashOut,
    operationCount: operations.value.length
  }
})

// Calcular totales por operación
const getOperationTotals = (operation: any) => {
  const cashIn = operation.entries
    .filter((e: any) => e.account_type === 'CASH' && e.amount > 0)
    .reduce((sum: number, e: any) => sum + e.amount, 0)

  const cashOut = Math.abs(operation.entries
    .filter((e: any) => e.account_type === 'CASH' && e.amount < 0)
    .reduce((sum: number, e: any) => sum + e.amount, 0))

  return {
    cashIn,
    cashOut,
    netCash: cashIn - cashOut
  }
}

const loadReceiptData = async () => {
  loading.value = true
  try {
    // 1. Obtener operaciones del socio en la reunión
    const operationsResponse = await fetch(
      `/api/v2/accounting/operations?member_id=${props.memberId}&meeting_id=${props.meetingId}&limit=100`
    )
    const operationsData = await operationsResponse.json()
    operations.value = operationsData.data || []

    // 2. Obtener datos del miembro (si no se proporcionaron)
    if (!props.memberName) {
      const memberResponse = await fetch(`/api/v2/members/${props.memberId}`)
      member.value = await memberResponse.json()
    }

    // 3. Obtener datos de la reunión (opcional, para mostrar número de reunión)
    const meetingResponse = await fetch(`/api/v2/meetings/${props.meetingId}`)
    meeting.value = await meetingResponse.json()
  } catch (error) {
    console.error('Error loading receipt data:', error)
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('close')
}

const printReceipt = () => {
  window.print()
}

const getOperationIcon = (type: string) => {
  // Retornar componente de icono según el tipo
  // Implementar según la librería de iconos usada
  return 'IconComponent'
}

const getOperationTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    MONTHLY_PAYMENT: 'Pago Mensual',
    LOAN_PAYMENT: 'Pago de Préstamo',
    LOAN_DISBURSEMENT: 'Desembolso de Préstamo',
    STOCK_PURCHASE: 'Compra de Acciones',
    STOCK_WITHDRAWAL: 'Retiro de Acciones',
    DIVIDEND_PAYMENT: 'Pago de Dividendos',
    ASSET_REVALUATION: 'Revaluación de Activos',
    FEE: 'Multa',
    // ... más tipos
  }
  return labels[type] || type
}

onMounted(() => {
  loadReceiptData()
})
</script>
```

### Integración en el Dashboard:

1. **En la lista de recaudos**: Hacer click en el nombre del socio abre el modal
2. **En la lista de desembolsos**: Hacer click en el nombre del socio abre el modal
3. **En cualquier mención del socio**: El nombre debe ser clickeable y abrir el modal

### Estilos del Recibo:

- **Fondo**: Blanco o base-100
- **Bordes**: Redondeados, sombras sutiles
- **Tipografía**:
  - Títulos: Bold, tamaño mediano
  - Valores monetarios: Font monoespaciada, tamaño grande
  - Descripciones: Regular, tamaño pequeño, color gris
- **Colores**:
  - Ingresos: Verde
  - Egresos: Rojo
  - Neutral: Gris
- **Impresión**: Estilos CSS para ocultar botones y ajustar layout al imprimir

### Funcionalidad de Impresión:

- Al hacer click en "Imprimir", usar `window.print()`
- Aplicar estilos de impresión que oculten botones y ajusten el layout
- Incluir encabezado y pie de página con información de la reunión

## Notas Técnicas

- Todos los cálculos deben basarse en `ledger_entries` para mantener consistencia contable
- Los montos en `ledger_entries` pueden ser positivos (débito) o negativos (crédito)
- Para CASH: amount > 0 = ingreso, amount < 0 = egreso
- Para INCOME: amount < 0 = ingreso (por convención de doble entrada)
- Usar transacciones de base de datos para consultas complejas
- Implementar caché para datos que no cambian (reunión cerrada)
- El modal debe ser responsive y funcionar bien en móviles
- Considerar lazy loading de datos del recibo si hay muchas operaciones
