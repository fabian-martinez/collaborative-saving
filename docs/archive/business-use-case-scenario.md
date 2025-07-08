# Caso de Uso Detallado: Simulación de una Reunión Completa

Este documento describe un escenario de negocio completo, desde el inicio hasta el final de una reunión, y sirve como un caso de prueba de referencia para validar la implementación del sistema.

## 1. Estado Inicial (Antes de la Reunión)

### 1.1. Socios

*   **Socio 1:** (ID: `member_1`)
*   **Socio 2:** (ID: `member_2`)

### 1.2. Catálogo de Activos (Acciones)

| Tipo de Acción    | Valor Inicial | Tabla   |
| ----------------- | ------------- | ------- |
| Acción Grande     | 10,000        | `Stocks`|
| Acción Mediana    | 5,000         | `Stocks`|
| Acción Pequeña    | 2,000         | `Stocks`|
| Bono Navideño     | 500           | `Stocks`|

### 1.3. Catálogo de Contribuciones Obligatorias

| Tipo de Contribución     | Monto | Tabla                     |
| ------------------------ | ----- | ------------------------- |
| Aporte Acción Grande     | 100   | `mandatory_contributions` |
| Aporte Acción Mediana    | 100   | `mandatory_contributions` |
| Aporte Bono Navideño     | 50    | `mandatory_contributions` |
| Aporte Administrativo    | 5     | `mandatory_contributions` |

### 1.4. Tenencia de Acciones por Socio (`StockSubscriptions`)

*   **Socio 1:**
    *   2 x Acción Grande
    *   1 x Bono Navideño
*   **Socio 2:**
    *   1 x Acción Grande
    *   1 x Acción Mediana

### 1.5. Estado de los Créditos (`Loans` y `LoanTransactionDetails`)

*   **Socio 1:**
    *   **Crédito Corriente 1:**
        *   `loan_id`: `loan_1`
        *   `approved_amount`: 3,000
        *   `interest_rate`: 1% mensual
        *   `status`: 'activo'
        *   **Historial:** Saldo pendiente antes de esta reunión: 2,000.

*   **Socio 2:**
    *   **Crédito Ágil 1:**
        *   `loan_id`: `loan_2`
        *   `approved_amount`: 300
        *   `interest_rate`: 2% mensual
        *   `status`: 'activo'
        *   **Historial:** Sin abonos previos.
    *   **Crédito Corriente 2 (Parcialmente Desembolsado):**
        *   `loan_id`: `loan_3`
        *   `approved_amount`: 5,000
        *   `interest_rate`: 1% mensual (sobre saldo desembolsado)
        *   `status`: 'activo'
        *   **Historial:** Se ha registrado un `LoanTransactionDetails` de tipo `desembolso` por 2,500.

---

## 2. Fase 1: Recaudación y Cálculo de Intereses

Se crea una `Operation` por socio para registrar el recaudo.

### 2.1. Pagos Realizados

*   **Socio 1 (Total Pagado: 355):**
    *   Aporte 2 Acciones Grandes: `2 * 100 = 200`
    *   Aporte 1 Bono Navideño: `50`
    *   Abono a Crédito Corriente 1: `100`
    *   Aporte Administrativo: `5`
*   **Socio 2 (Total Pagado: 240):**
    *   Aporte 1 Acción Grande: `100`
    *   Aporte 1 Acción Mediana: `100`
    *   Abono a Crédito Ágil 1: `10`
    *   Pago Intereses Crédito Corriente 2: `1% de 2,500 = 25`
    *   Aporte Administrativo: `5`

### 2.2. Resumen de Flujos

*   **Total Recaudado en Efectivo:** `355 + 240 = 595`
*   **Total Intereses Generados (Ganancia):**
    *   Socio 1 (Crédito `loan_1`): `1% de 2,000 = 20`. Del abono de 100, 20 son interés, 80 capital.
    *   Socio 2 (Crédito `loan_2`): `2% de 300 = 6`. Del abono de 10, 6 son interés, 4 capital.
    *   Socio 2 (Crédito `loan_3`): `25` de interés pagado.
    *   **Total Intereses = 20 + 6 + 25 = 51`
*   **Total Aportes a Capital:** `(200+50) + (100+100) = 450`

---

## 3. Fase 2: Revalorización de Activos

### 3.1. Cálculo del Rendimiento

*   **Capital Base Total:** `(2*10000 + 1*500) + (1*10000 + 1*5000) = 20500 + 15000 = 35,500`
*   **Masa a Distribuir:** `450 (aportes) + 51 (intereses) = 501`
*   **Tasa de Rendimiento:** `501 / 35,500 = 0.014112 (1.4112%)`

### 3.2. Nuevos Valores de las Acciones

| Tipo de Acción    | Cálculo                      | Nuevo Valor |
| ----------------- | ---------------------------- | ----------- |
| Acción Grande     | `10,000 * (1 + 0.014112)`    | **10,141.12** |
| Acción Mediana    | `5,000 * (1 + 0.014112)`     | **5,070.56**  |
| Bono Navideño     | `500 * (1 + 0.014112)`       | **507.06**    |

**Acción en el sistema:**
1. `UPDATE` la tabla `Stocks` con los nuevos `current_value`.
2. `INSERT` en `StockValueHistory` para cada tipo de acción.

---

## 4. Fase 3: Nuevas Operaciones y Desembolsos

### 4.1. Venta de Acción a Socio 1

*   **Transacción:** Socio 1 compra 1 Acción Grande a su nuevo valor (`10,141.12`).
*   **Pago:**
    *   Efectivo: `1,000`
    *   Crédito: `9,141.12`
*   **Acción en el sistema:**
    *   Se crea 1 `Operation` para el Socio 1.
    *   Se crea 1 `Loan` nuevo por `9,141.12`.
    *   Se crea 1 `StockSubscription` nueva.
    *   Se generan múltiples `LedgerEntries` para reflejar el pago en efectivo, la compra de la acción y la originación del crédito.

### 4.2. Flujo de Caja y Desembolsos

*   **Caja Inicial (de esta reunión):** `595 (recaudación) + 1,000 (abono acción) = 1,595`
*   **Salidas de Dinero:**
    *   **Desembolso Socio 2:** `500` para su crédito `loan_3`.
        *   **Acción:** `LedgerEntry` y `LoanTransactionDetails` de tipo `desembolso`.
    *   **Nuevo Crédito Ágil Socio 1:** `595 - 500 = 95`.
        *   **Acción:** Se crea un `Loan` nuevo por `95` y su respectivo `LedgerEntry/LoanTransactionDetails` de desembolso.

---

## 5. Estado Final (Después de la Reunión)

### 5.1. Saldo en Caja

*   **Caja Final:** `1,595 (entradas) - 595 (salidas) = 1,000`

### 5.2. Resumen de Cambios para Pruebas

*   El **Socio 1** ahora tiene 3 Acciones Grandes y 1 Bono Navideño.
*   El **Socio 1** tiene 2 créditos corrientes y 1 crédito ágil nuevo.
*   El **Socio 2** tiene su crédito `loan_3` con un desembolso total de `2,500 + 500 = 3,000`.
*   La tabla `Stocks` tiene los valores actualizados.
*   La tabla `StockValueHistory` tiene 3 nuevos registros.
*   Se han creado múltiples `Operations`, `LedgerEntries`, `Loans`, y `LoanTransactionDetails`. 