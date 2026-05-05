# ADR 0001: Adopción del Modelo de "Libro Contable" para la Base de Datos

**Fecha:** 2025-07-04
**Estado:** Aceptado

---

## Contexto

Durante el diseño de la base de datos para la aplicación del fondo de ahorro, nos enfrentamos al desafío de modelar transacciones financieras que no son simples. Los modelos iniciales, aunque fáciles de entender, resultaron insuficientes para manejar casos de uso reales y críticos para el negocio, tales como:

- Compra de acciones pagando una parte en efectivo y otra a crédito.
- Abono al capital de un préstamo utilizando el valor de acciones existentes.
- Transferencia de acciones entre socios.
- Desembolsos de un mismo préstamo en múltiples partes y en diferentes momentos.

Un modelo simple obligaría a que la lógica para manejar estos casos complejos resida en la aplicación (frontend), lo que es propenso a errores, difícil de auditar y podría llevar a la pérdida de integridad y de datos históricos valiosos (como el valor de una acción en el momento de una transacción).

## Decisión

Se ha decidido implementar un diseño de base de datos basado en un sistema de **contabilidad de doble entrada (Libro Contable o "Ledger")**.

El núcleo de este modelo se compone de:

1. **Una tabla `Operations`**: Registra la intención del usuario (ej: "Socia Ana transfiere 2 acciones a Carlos").
2. **Una tabla `LedgerEntries`**: Registra cada uno de los movimientos atómicos de valor que la operación provoca. Cada asiento contable afecta a una "cuenta" específica (`efectivo_del_fondo`, `capital_acciones_socio`, `deuda_prestamo_socio`, etc.) y tiene un monto (positivo para aumentos, negativo para disminuciones).
3. **Tablas de Detalle**: Para capturar información específica no contable (como la cantidad de acciones en una transacción o la tasa de interés de un pago), se usarán tablas de detalle (`StockTrades`, `LoanTransactionDetails`) vinculadas a un `LedgerEntry`.

Este diseño será reflejado en el diagrama ERD oficial del documento de la Fase 2.

## Consecuencias

### Positivas

- **Máxima Flexibilidad**: El modelo es capaz de representar cualquier transacción financiera, sin importar su complejidad, combinando diferentes asientos contables bajo una misma operación.
- **Trazabilidad y Auditoría Completas**: Cada cambio de valor en el sistema es un registro inmutable. Es trivial reconstruir el historial de cualquier cuenta o socio.
- **Integridad de Datos**: La lógica financiera principal está embebida en la estructura de datos, reduciendo la posibilidad de errores de cálculo en la aplicación y garantizando que el sistema siempre esté balanceado.
- **Preservación de Datos Históricos**: Se almacena de forma natural información crítica como el valor de una acción en el momento exacto de una operación.

### Negativas

- **Mayor Complejidad Inicial**: El modelo es conceptualmente más abstracto y contiene más tablas que un diseño CRUD simple, lo que puede requerir una curva de aprendizaje inicial.
- **Consultas más Elaboradas**: Calcular un saldo (ej: total de acciones de un socio) requiere una operación de agregación (`SUM`) sobre la tabla de asientos, en lugar de leer un único campo. Es el precio a pagar por la flexibilidad y la precisión.