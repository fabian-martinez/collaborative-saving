# Plan temporal: Servicio de Resumen de Reunión

## 1. Definición general
Implementar un endpoint flexible para obtener un resumen de la reunión, calculando solo los totales solicitados mediante un parámetro `fields`.

- **Endpoint:** `GET /meetings/:id/summary?fields=...`
- **Campos soportados:**
  - `totalCash` — Total de efectivo en la reunión
  - `totalInterest` — Total de intereses generados
  - `totalLoans` — Total de préstamos realizados
  - `totalCollected` — Total recaudado (CASH positivos - NOVELTY_LOSS)
  - `totalDividends` — Total de dividendos pagados
  - `totalStockInvestment` — Total invertido en acciones

## 2. Pasos para la implementación

### 2.1. DTO y tipos
- Crear un DTO para parsear el query param `fields` (array de strings).
- Definir un tipo para los posibles campos de resumen.

### 2.2. Service
- Crear método en `MeetingsService` que reciba el ID de la reunión y un array de campos a calcular.
- Por cada campo solicitado, ejecutar la consulta correspondiente sobre `ledger_entries` filtrando por operaciones de la reunión.
- Retornar un objeto solo con los campos solicitados.

### 2.3. Controller
- Agregar endpoint `GET /meetings/:id/summary` en `MeetingsController`.
- Parsear el query param `fields` y pasarlo al service.
- Documentar el endpoint con Swagger.

### 2.4. Tests
- Test unitarios del service:
  - Cada campo individual (mockeando el repositorio)
  - Combinaciones de campos
- Test de integración del controller:
  - Respuesta correcta según los campos solicitados
  - Manejo de errores (reunión no existe, campo inválido, etc)

### 2.5. Actualización de Frontend (`ActiveMeetingView.vue`)
- Crear función en el servicio frontend para llamar al nuevo endpoint `/meetings/:id/summary`.
- Reemplazar la lógica de cálculo local de totales por la obtención desde el backend usando el parámetro `fields` según los datos requeridos en la vista.
- Actualizar los bindings de la UI para mostrar los valores recibidos.
- Manejar loading y errores en la consulta.

### 2.6. Sugerencias de mejora
- Permitir breakdown por operación o por miembro en el futuro.
- Permitir agregar nuevos campos fácilmente.

---

**¿Listo para comenzar con la implementación?** 