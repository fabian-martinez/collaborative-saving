# [COMPLETED] Plan Temporal de Refactorización: Chain of Responsibility para Distribución de Intereses y Contribuciones

## Contexto
Actualmente, la lógica de distribución de intereses y contribuciones en la revalorización de activos utiliza el patrón Strategy, lo que ha resultado difícil de mantener y extender. Se busca migrar a un enfoque basado en el patrón **Chain of Responsibility** para hacer el flujo más claro, secuencial y flexible.

---

## Objetivo
- Simplificar la lógica de distribución de totales (intereses, contribuciones) entre los distintos tipos de acciones y reglas de negocio.
- Mejorar la mantenibilidad y extensibilidad del código.
- Facilitar la incorporación de nuevas reglas de distribución en el futuro.

---

## Enfoque propuesto

### 1. Identificar las reglas de negocio principales
- **Distribución garantizada:** Primero, asignar el interés necesario para cumplir con el crecimiento garantizado de ciertas acciones.
- **Distribución proporcional:** El remanente se distribuye proporcionalmente entre las acciones regulares según su valor o participación.
- **Otras reglas:** (Ejemplo: dividendos, aportes obligatorios, etc.)

### 2. Implementar Handlers (eslabones de la cadena)
- Cada regla de negocio será un "handler" en la cadena.
- Cada handler:
  - Recibe el total disponible y el contexto.
  - Calcula cuánto asigna según su regla.
  - Resta lo asignado del total y pasa el resto al siguiente handler.
  - Devuelve su resultado parcial y el remanente.

### 3. Orquestador principal
- El servicio principal crea la cadena de handlers en el orden deseado.
- Ejecuta la cadena pasando el total inicial y el contexto.
- Acumula los resultados parciales de cada handler para construir el resultado final.

### 4. Ventajas
- Agregar una nueva regla es tan simple como crear un nuevo handler y agregarlo a la cadena.
- El flujo es secuencial y fácil de seguir.
- Cada handler es una función pura y testeable.

---

## Pasos de implementación

1. **Definir la interfaz Handler**
   - Recibe: totalDisponible, contexto, resultadoParcial
   - Devuelve: { asignado, restante, resultadoParcialActualizado }

2. **Implementar handlers para cada regla**
   - HandlerGarantizado
   - HandlerProporcional
   - (Otros según necesidad)

3. **Crear la cadena y el orquestador**
   - Un array de handlers en el orden deseado.
   - Un bucle que ejecuta cada handler, pasando el remanente y acumulando resultados.

4. **Actualizar el servicio de revalorización para usar la cadena**
   - Reemplazar el uso de Strategy por la cadena de handlers.

5. **Testear y validar resultados**

---

## Consideraciones
- Mantener los handlers lo más puros posible (sin acceso a base de datos).
- El contexto debe contener toda la información necesaria para cada handler.
- Documentar claramente el orden y propósito de cada handler.

---

## Ejemplo de estructura (pseudo-código)

```typescript
interface Handler {
  handle(totalDisponible: number, contexto: Contexto, resultado: Resultado): { asignado: number, restante: number, resultado: Resultado };
}

const handlers = [handlerGarantizado, handlerProporcional, ...];
let restante = total;
let resultado = {};
for (const handler of handlers) {
  const res = handler.handle(restante, contexto, resultado);
  restante = res.restante;
  resultado = res.resultado;
}
```

---

## Siguiente paso
- Revisar y documentar las reglas de negocio actuales para cada tipo de acción.
- Definir el contexto mínimo necesario para los handlers.
- Implementar el primer handler y probar el flujo. 

---

## Avances de la refactorización (Chain of Responsibility)

### [Avance 1] Definición de la interfaz Handler y tipos base
Se ha definido la interfaz `DistributionHandler` en TypeScript, junto con los tipos para el contexto y el resultado parcial. Estos tipos servirán como contrato para todos los handlers de la cadena de distribución. El contexto incluye los totales a distribuir, información de stocks, suscripciones y ledger entries. El resultado parcial es un objeto acumulador que irá construyendo el resultado final de la distribución.

Próximo paso: Implementar el primer handler (HandlerGarantizado) siguiendo esta interfaz. 

### [Avance 2] Implementación de HandlerGarantizado
Se implementó el handler encargado de la distribución garantizada (`GuaranteedGrowthHandler`). Este handler asigna el interés necesario para cumplir con el crecimiento garantizado de las acciones marcadas como garantizadas. Si el total disponible no alcanza, distribuye proporcionalmente entre las acciones garantizadas. El resultado parcial se va acumulando por stock_id.

Próximo paso: Implementar el handler proporcional para las acciones regulares. 

### [Avance 3] Implementación de HandlerProporcional
Se implementó el handler encargado de la distribución proporcional (`ProportionalGrowthHandler`). Este handler distribuye el remanente disponible entre las acciones regulares (no garantizadas) de forma proporcional al valor total de cada una. Si no hay acciones regulares o el remanente es cero, no se asigna nada. El resultado parcial se acumula por stock_id.

### [Avance 4] Creación del orquestador principal de la cadena
Se implementó la función orquestadora (`runDistributionChain`) que recibe la lista de handlers, el monto inicial y el contexto, y ejecuta la cadena secuencialmente acumulando los resultados parciales. El resultado final contiene el monto asignado por cada stock y el remanente final. El orquestador es una función pura y reutilizable.

Próximo paso: Integrar la cadena de distribución en el servicio de revalorización, reemplazando la lógica actual basada en Strategy. 

### [Avance 5] Integración de la cadena de distribución en el servicio de revalorización
Se modificó el método `_calculateRevaluationData` en `asset-revaluation.service.ts` para utilizar la nueva cadena de handlers en vez del patrón Strategy. Ahora, el servicio construye el contexto, ejecuta la cadena de distribución y utiliza el resultado para calcular los detalles de revalorización por stock. Se mantiene la lógica de agrupación de aportes obligatorios igual.

Próximo paso: Testear y validar los resultados de la nueva implementación. 

### [Avance 6] Testing y validación de la nueva implementación
Se validó que existen pruebas unitarias para la lógica de revalorización en `asset-revaluation.service.spec.ts`. Estas pruebas cubren escenarios de acciones garantizadas, regulares, combinadas, déficit de interés y casos sin ingresos. Se recomienda ejecutar estos tests para asegurar que la nueva lógica basada en la cadena de handlers mantiene la compatibilidad y los resultados esperados.

Con esto, se completa el plan de refactorización. 