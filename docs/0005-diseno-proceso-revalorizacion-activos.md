# 5. Diseño del Proceso de Revalorización de Activos

**Fecha**: 2024-07-27

**Estado**: Aceptado

## Contexto

El sistema de ahorro colaborativo requiere un método para ajustar periódicamente el valor de las acciones que componen el fondo. Este ajuste, o "revalorización", debe reflejar las ganancias generadas por las actividades del fondo (principalmente intereses de préstamos) y los nuevos aportes de los socios.

El proceso debe contemplar casos especiales:
1.  **Acciones "Bono"**: Un tipo de acción con un rendimiento fijo y garantizado (ej. 2% mensual), cuyo crecimiento es prioritario.
2.  **Distribución de remanente**: El resto de las acciones se reparten las ganancias restantes después de cubrir el rendimiento de las acciones "bono".
3.  **Acciones Temporales**: En la fase de desembolso, pueden crearse acciones fraccionadas si un socio no puede adquirir una completa, aunque su creación no forma parte de este proceso, el cálculo debe ser consistente.

Se planteó la duda de si realizar este cálculo de forma continua durante la fase de recaudación o como una tarea única y consolidada.

## Decisión

Se ha decidido implementar el proceso de revalorización como una **tarea única y atómica**, ejecutada en el backend.

Esta tarea será disparada desde el frontend al comenzar el **Paso 2: Revalorización** del flujo de una reunión, después de que toda la recaudación del período (Paso 1) haya finalizado. Este enfoque garantiza que los cálculos se realicen sobre totales definitivos y consistentes.

## Consecuencias

### Flujo Técnico

1.  **Disparador (Frontend)**: En el componente `Step2Revaluation.vue`, un usuario con los permisos adecuados hará clic en un botón ("Calcular Revalorización").
2.  **Llamada al API**: El frontend enviará una petición a un nuevo endpoint del backend, propuesto como `POST /meetings/active/revaluate-assets`.
3.  **Lógica de Negocio (Backend)**:
    a.  **Transacción Atómica**: Toda la lógica se ejecutará dentro de una transacción de base de datos para garantizar la integridad. Si cualquier paso falla, se revertirán todos los cambios (`ROLLBACK`).
    b.  **Cálculo de Ganancias**:
        *   Se calculan los **intereses totales** generados desde la última revalorización.
        *   Se calcula y se aparta el **incremento de las acciones "bono"** (ej. `valor_total_bonos * 0.02`).
    c.  **Distribución de Remanente**:
        *   El interés remanente (`intereses_totales - incremento_bono`) se usa para calcular la tasa de apreciación del resto de las acciones (`tasa = remanente / valor_total_acciones_regulares`).
    d.  **Actualización de Datos**:
        *   Se actualiza el `value` en la tabla `stocks` para cada tipo de acción.
        *   Se insertan registros en `stock_value_history` para mantener un histórico de la evolución del valor.
    e.  **Registro Contable**: Se crean los asientos contables correspondientes en `ledger_entries` (ver detalle abajo).
4.  **Respuesta (Backend -> Frontend)**: El API devolverá un resumen del resultado (nuevos valores, tasas aplicadas), que el frontend mostrará al usuario para su confirmación.

### Registro Contable (Partida Doble)

La revalorización representa un aumento en el valor de los activos del fondo, lo cual es una ganancia de patrimonio. Se registrará con dos asientos en `ledger_entries` para mantener el balance contable.

**Cuentas Involucradas:**
*   `INVERSIONES_EN_ACCIONES` (Activo): Representa el valor de mercado del portafolio de acciones. Aumenta con un **DÉBITO**.
*   `SUPERAVIT_POR_REVALUACION` (Patrimonio): Representa las ganancias no realizadas por el aumento de valor de los activos. Aumenta con un **CRÉDITO**.

**Ejemplo de Asiento Contable:**
Si el incremento total del valor de los activos es de `$5,200`:

1.  **Asiento de Débito:**
    ```json
    {
      "account": "INVERSIONES_EN_ACCIONES",
      "debit": 5200.00,
      "credit": 0.00,
      "description": "Revalorización de activos. Reunión del 2024-07-27."
    }
    ```
2.  **Asiento de Crédito:**
    ```json
    {
      "account": "SUPERAVIT_POR_REVALUACION",
      "debit": 0.00,
      "credit": 5200.00,
      "description": "Contrapartida de revalorización de activos. Reunión del 2024-07-27."
    }
    ```

### Beneficios de la Decisión
*   **Precisión y Justicia**: Todos los cálculos se basan en cifras finales, asegurando un trato equitativo.
*   **Rendimiento**: Se evita la sobrecarga de ejecutar cálculos complejos repetidamente.
*   **Auditabilidad**: Se genera un evento financiero único, claro y rastreable por reunión.
*   **Robustez**: El uso de transacciones de base de datos previene la corrupción de datos en caso de fallos.
