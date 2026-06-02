# Mapa de Asientos Contables (Double-Entry Ledger)

Este documento define las reglas fundamentales de contabilidad de partida doble para el sistema de Collaborative Saving.

Toda transacción financiera en el sistema (registrada en `operations`) debe generar múltiples asientos contables (`ledger_entries`) que en conjunto sumen exactamente cero (`0.00`).

## 🧠 Regla Mental (Perspectiva del Fondo)
El fondo es la entidad central. Toda la contabilidad se lleva desde la perspectiva del fondo, **no** del socio.

* **Activos (Assets):** Lo que el fondo tiene en efectivo o le deben. Aumentan con **Débitos (+)**.
* **Pasivos (Liabilities):** Lo que el fondo le debe a alguien. Aumentan con **Créditos (-)**.
* **Patrimonio e Ingresos (Equity & Income):** El capital de los socios y las ganancias. Aumentan con **Créditos (-)**.

---

## 🗺️ Patrones de Asientos por Operación

### 1. Aporte Inicial / Compra de Acciones (`STOCK_PURCHASE`)
Cuando un socio entrega dinero para capitalizarse en el fondo.
* **Débito (+):** `CASH` (Ingresa el efectivo al fondo)
* **Crédito (-):** `STOCK_CAPITAL` (Aumenta el patrimonio/capital de los socios)

### 2. Cuota de Administración (`MANDATORY_CONTRIBUTION`)
Cuando un socio paga su cuota obligatoria periódica.
* **Débito (+):** `CASH` (Ingresa el efectivo)
* **Crédito (-):** `MANDATORY_CONTRIBUTION_INCOME` (Ingreso operativo)

### 3. Desembolso de Préstamo (`LOAN_DISBURSEMENT`)
Cuando se le entrega dinero a un socio en calidad de préstamo.
* **Débito (+):** `LOANS_RECEIVABLE` (Aumenta la deuda que el socio tiene con el fondo)
* **Crédito (-):** `CASH` (Sale el efectivo del banco)
* *Nota: Se cambia un activo (efectivo) por otro activo (promesa de pago).*

### 4. Pago de Cuota de Préstamo (`LOAN_PAYMENT`)
Cuando un socio paga su cuota mensual que incluye capital, interés y seguro.
* **Débito (+):** `CASH` (Por el monto total recibido)
* **Crédito (-):** `LOANS_RECEIVABLE` (Por el monto de abono a capital)
* **Crédito (-):** `INTEREST_INCOME` (Por el monto de los intereses cobrados)
* **Crédito (-):** `INSURANCE_INCOME` (Por el monto del seguro)

### 5. Multas o Novedades (`FEE` / `NOVELTY`)
Cuando se cobra una penalidad por atraso o una deducción operativa.
* **Débito (+):** `CASH`
* **Crédito (-):** `FEE_INCOME` (Si es un ingreso por multa)
* *(Si es una pérdida, se debitaría de `NOVELTY_LOSS` y se acreditaría `CASH` o `LOANS_RECEIVABLE`)*.

### 6. Transferencia de Acciones entre Socios (`STOCK_TRANSFER`)
Cuando un socio le cede o vende su acción a otro internamente, sin mover efectivo del fondo.
* **Débito (+):** `STOCK_CAPITAL` (Socio Vendedor - Se le resta el capital)
* **Crédito (-):** `STOCK_TRANSFER` (Cuenta puente temporal)
* **Débito (+):** `STOCK_TRANSFER` (Cuenta puente temporal)
* **Crédito (-):** `STOCK_CAPITAL` (Socio Comprador - Se le suma el capital)
* *Resultado: La cuenta puente `STOCK_TRANSFER` queda en 0.00 al finalizar la transacción.*

### 7. Reparto de Dividendos (`DIVIDEND_PAYMENT`)
Cuando el fondo reparte las ganancias del periodo a los socios.
* **Débito (+):** `DIVIDEND_EXPENSE` (Gasto por distribución)
* **Crédito (-):** `CASH` (Si se paga en efectivo) o `DIVIDENDS_PAYABLE` (Si se deja abonado).

### 8. Revalorización de Acciones (`ASSET_REVALUATION`)
Ajuste contable cuando el valor de las acciones incrementa debido a las utilidades.
* **Débito (+):** `INVESTMENT_IN_STOCKS` (Aumenta el valor del activo financiero)
* **Crédito (-):** `REVALUATION_SURPLUS` (Aumenta la ganancia no realizada en el patrimonio)

### 9. Gastos de Actividad Social (`OTHER_EXPENSES`)
Cuando el fondo utiliza dinero propio para realizar una integración o actividad para los socios (esto es un gasto para el fondo, no un préstamo ni devolución).
* **Débito (+):** `OTHER_EXPENSES` (Gasto operativo del fondo)
* **Crédito (-):** `CASH` (Sale el efectivo del banco)

### 10. Cambio o Reestructuración de Acciones (`STOCK_MODIFICATION`)
Cuando un socio cambia acciones de un tipo por otro, y los valores no son iguales. Todo se hace en una sola operación atómica.

#### Caso A: Sobra dinero a favor del socio (Ej: Cambia $1000 por $800)
El fondo debe devolverle `$200` al socio.
* **Débito (+):** `STOCK_CAPITAL` ($1000 - El socio entrega su acción original)
* **Crédito (-):** `STOCK_CAPITAL` ($800 - Se crea la nueva acción)
* *Si se le da la diferencia en efectivo:*
  * **Crédito (-):** `CASH` ($200 - Sale dinero del fondo)
* *Si la diferencia se usa para pagar un préstamo del socio:*
  * **Crédito (-):** `LOANS_RECEIVABLE` ($200 - Se abona a la deuda del socio)

#### Caso B: Falta dinero a favor del fondo (Ej: Cambia $800 por $1000)
El socio necesita poner `$200` adicionales.
* **Débito (+):** `STOCK_CAPITAL` ($800 - El socio entrega su acción original)
* **Crédito (-):** `STOCK_CAPITAL` ($1000 - Se crea la nueva acción)
* *Si el socio paga la diferencia en efectivo:*
  * **Débito (+):** `CASH` ($200 - Entra dinero al fondo)
* *Si se le presta la diferencia al socio:*
  * **Débito (+):** `LOANS_RECEIVABLE` ($200 - El socio adquiere una nueva deuda con el fondo)

---

## ⚠️ Reglas de Auditoría
1. **Balance Cero:** La suma de `amount` en `ledger_entries` agrupada por `operation_id` debe ser SIEMPRE `0.00`.
2. **Sin cuentas huérfanas:** Las cuentas que dejen de usarse por cambios de reglas de negocio, deben saldarse reclasificando sus montos hacia las cuentas actuales correspondientes para no dejar saldos abandonados.
