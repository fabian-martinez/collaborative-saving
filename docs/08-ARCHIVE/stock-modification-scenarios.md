# Escenarios de Modificación de Acciones

Este documento describe la implementación de los tres escenarios principales de modificación de acciones en el sistema de fondos de ahorro.

## Escenario 1: Cruce de Acción Única con Crédito Existente

**Descripción:** Una socia cruza su única acción con el crédito que tiene actualmente para reducir el monto que está pagando.

**Implementación:**
```typescript
// Usar el método processStockLoanPayment
const response = await stocksService.processStockLoanPayment({
  memberId: 'member-id',
  meetingId: 'meeting-id',
  loanPaymentSubscriptionId: 'subscription-id', // ID de la suscripción de la acción
  loanPaymentQuantity: 1, // Cantidad de acciones a usar
  loanId: 'loan-id', // ID del crédito a pagar
  notes: 'Cruce de acción única con crédito existente'
});
```

**Flujo del backend:**
1. Valida que la suscripción pertenezca al socio
2. Verifica que la acción no tenga crédito asociado
3. Calcula el valor de la acción y lo aplica al crédito
4. Reduce la cantidad de acciones en la suscripción
5. Actualiza el saldo del crédito
6. Crea los asientos contables correspondientes

## Escenario 2: Conversión de Acciones Grandes a Super + Cruce con Crédito

**Descripción:** Una socia convierte dos acciones grandes de 29 millones a dos super de 2 super y cruza una de ellas con el crédito de acción que tiene.

**Implementación:**
```typescript
// Paso 1: Convertir acciones grandes a super
const exchangeResponse = await stocksService.processStockExchange({
  memberId: 'member-id',
  meetingId: 'meeting-id',
  fromSubscriptionId: 'large-stock-subscription-id',
  fromQuantity: 2, // 2 acciones grandes
  toStockId: 'super-stock-id',
  toQuantity: 2, // 2 acciones super
  differenceHandling: 'cash', // La diferencia se maneja en efectivo
  notes: 'Conversión de 2 acciones grandes a 2 super'
});

// Paso 2: Usar una acción super para pagar crédito
const paymentResponse = await stocksService.processStockLoanPayment({
  memberId: 'member-id',
  meetingId: 'meeting-id',
  loanPaymentSubscriptionId: 'new-super-subscription-id', // ID de la nueva suscripción super
  loanPaymentQuantity: 1, // 1 acción super
  loanId: 'action-loan-id', // ID del crédito de acción
  notes: 'Pago de crédito con acción super'
});
```

**Flujo del backend:**
1. **Intercambio:** Reduce acciones grandes y crea suscripción de acciones super
2. **Pago:** Usa una acción super para reducir el saldo del crédito

## Escenario 3: Cambio de Acción Mediana por Super + Financiamiento del Excedente

**Descripción:** Cambia una acción mediana de 15 millones por una super de 30 y para completar el excedente y que tener una completa paga lo demás a crédito.

**Implementación:**
```typescript
// Intercambio con financiamiento del excedente
const response = await stocksService.processStockExchange({
  memberId: 'member-id',
  meetingId: 'meeting-id',
  fromSubscriptionId: 'medium-stock-subscription-id',
  fromQuantity: 1, // 1 acción mediana
  toStockId: 'super-stock-id',
  toQuantity: 1, // 1 acción super
  differenceHandling: 'credit', // El excedente se financia con crédito
  targetLoanId: 'new_action_loan', // Crear nuevo crédito de acción
  notes: 'Cambio de acción mediana por super con financiamiento del excedente'
});
```

**Flujo del backend:**
1. Calcula la diferencia: 30M (super) - 15M (mediana) = 15M excedente
2. Reduce la acción mediana
3. Crea suscripción de acción super
4. Crea nuevo crédito de acción por 15M (2% interés)
5. Crea los asientos contables correspondientes

## Manejo de Diferencias en Intercambios

### Diferencias Positivas (A favor del socio)
Cuando el valor de las acciones origen es mayor que el destino:
- **Efectivo:** El socio recibe la diferencia en efectivo; el sistema registra un `PendingMemberPayment` a favor del socio para que pueda cobrarse en caja o aplicar posteriormente. Alternativamente, el socio puede decidir abonarla a un crédito existente.
- **Crédito:** Se abona la diferencia directamente a un crédito existente del socio.

### Diferencias Negativas (Debe pagar el socio)
Cuando el valor de las acciones destino es mayor que el origen:
- **Efectivo:** El socio paga la diferencia en efectivo
  - `new_action_loan`: Crédito de Acción (2% interés)
  - `new_current_loan`: Crédito Corriente (2% interés)

## Estructura de Datos

### StockModificationRequest
```typescript
interface StockModificationRequest {
  memberId: string;
  meetingId: string;
  modificationType: 'STOCK_MODIFICATION' | 'STOCK_TRANSFER' | 'STOCK_LOAN_PAYMENT';

  // Para intercambios
  fromSubscriptionId?: string;
  fromQuantity?: number;
  toStockId?: string;
  toQuantity?: number;

  // Para transferencias
  transferSubscriptionId?: string;
  transferQuantity?: number;
  toMemberId?: string;

  // Para pagos de crédito
  loanPaymentSubscriptionId?: string;
  loanPaymentQuantity?: number;
  loanId?: string;

  // Para manejo de diferencias
  differenceHandling?: 'cash' | 'credit';
  targetLoanId?: string;

  notes?: string;
}
```

### StockModificationResponse
```typescript
interface StockModificationResponse {
  operationId: string;
  message: string;
  details: any;
}
```

## Validaciones Implementadas

### Para Intercambios (STOCK_MODIFICATION)
- ✅ Validar que la suscripción origen pertenezca al socio
- ✅ Verificar cantidad suficiente en la suscripción origen
- ✅ Calcular y manejar diferencias de valor
- ✅ Aplicar diferencias a créditos existentes si se especifica

### Para Transferencias (STOCK_TRANSFER)
- ✅ Validar que la suscripción origen pertenezca al socio
- ✅ Verificar cantidad suficiente en la suscripción origen
- ⚠️ ~~Validar que la acción no tenga crédito asociado~~ (Restricción removida temporalmente)
- ✅ Crear suscripción en el socio destino

### Para Pagos de Crédito (STOCK_LOAN_PAYMENT)
- ✅ Validar que la suscripción pertenezca al socio
- ✅ Verificar cantidad suficiente en la suscripción
- ⚠️ ~~Validar que la acción no tenga crédito asociado~~ (Restricción removida temporalmente)
- ✅ Verificar que el crédito pertenezca al socio
- ✅ Calcular nuevo saldo del crédito

## Asientos Contables

### Intercambio de Acciones
```
Débito:  Capital de Acciones Origen (reducción)
Crédito: Capital de Acciones Destino (aumento)
Débito:  Efectivo o Crédito (si hay diferencia)
```

### Transferencia de Acciones
```
Débito:  Capital de Acciones Socio Origen (reducción)
Crédito: Capital de Acciones Socio Destino (aumento)
```

### Pago de Crédito con Acciones
```
Débito:  Capital de Acciones (reducción)
Crédito: Créditos por Cobrar (reducción)
```

## Endpoints de API

### POST /stocks/modify
Procesa cualquier tipo de modificación de acciones según el `modificationType` especificado.

**Parámetros:** `StockModificationRequest`
**Respuesta:** `StockModificationResponse`

## Consideraciones Técnicas

1. **Transacciones:** Todas las operaciones se ejecutan dentro de transacciones de base de datos para garantizar consistencia.

2. **Validaciones:** Se implementan validaciones exhaustivas antes de procesar cualquier modificación.

3. **Asientos Contables:** Cada operación genera los asientos contables correspondientes siguiendo el modelo de libro contable.

4. **Historial:** Todas las operaciones quedan registradas en la tabla `operations` con su tipo correspondiente.

5. **Actualización de Estado:** Después de cada operación, se actualizan las suscripciones y saldos de créditos afectados.

## Validación de targetLoanId

**Valores Aceptados:**
- **UUIDs válidos:** Para aplicar diferencias a créditos existentes
- **Valores especiales:** Para crear nuevos créditos automáticamente
  - `new_action_loan`: Crear nuevo crédito de acción (2% interés)
  - `new_current_loan`: Crear nuevo crédito corriente (2% interés)

**Implementación:**
- Se ha creado un decorador de validación personalizado `@IsValidTargetLoanId()`
- Permite tanto UUIDs como valores especiales predefinidos
- Valida automáticamente el formato según el contexto de uso

## Nota Importante sobre Restricciones

**Restricción de Crédito Asociado Removida:**
- Se ha removido temporalmente la validación que impedía usar acciones con crédito asociado para pagos o transferencias.
- Esto permite mayor flexibilidad en los escenarios de modificación de acciones.
- La restricción puede ser reactivada en el futuro si se considera necesario por políticas del negocio.

## Próximos Pasos

1. **Testing:** Implementar pruebas unitarias y de integración para cada escenario.
2. **UI/UX:** Mejorar la interfaz de usuario para hacer más intuitivos los flujos de modificación.
3. **Reportes:** Generar reportes de modificaciones realizadas en cada reunión.
4. **Auditoría:** Implementar logs detallados para auditoría de cambios.