# Plan de Implementación: Detalle de la Reunión (MeetingDetailView.vue)

## 1. Definir el modelo de datos y endpoints necesarios
- Revisar el modelo de "Meeting" en el backend y asegurarse de que expone:
  - Fecha de la reunión
  - Estado (finalizada, activa, etc.)
  - Resumen de ingresos (aportes, abonos, intereses, seguro, activos, compras varias)
  - Resumen de egresos (préstamos entregados, dividendos, retiros de acciones)
  - Lista de transacciones (tipo, miembro, monto, detalle)
- Si algún dato no está disponible, crear/ajustar los DTOs y endpoints necesarios en el backend.

### Endpoints relevantes
- **GET /meetings/:id/summary**: Devuelve un resumen flexible de la reunión (ingresos, egresos, totales). Usa un DTO para solicitar los campos requeridos.
- **GET /operations?meetingId=...**: Devuelve la lista de operaciones (transacciones) asociadas a la reunión, incluyendo detalles de miembro y asientos contables. Permite filtrar por tipo de operación, miembro, fechas, etc.

#### Detalle del endpoint de operaciones
- **Ruta:** `GET /operations?meetingId=...`
- **Descripción:** Permite obtener todas las operaciones (transacciones) asociadas a una reunión específica.
- **Parámetros útiles:**
  - `meetingId`: ID de la reunión (obligatorio para este caso)
  - `operationType`: Filtrar por tipo de operación (opcional)
  - `memberId`, `dateFrom`, `dateTo`, paginación, etc. (opcional)
- **Respuesta:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "type": "string",
        "member": { "id": "uuid", "name": "string", ... },
        "description": "string",
        "ledger_entries": [ ... ],
        ...
      },
      ...
    ],
    "total": number
  }
  ```
- **Notas:**
  - El nombre del miembro está disponible en `operation.member.name`.
  - El monto de la transacción debe calcularse usando los campos `total_debit` y `total_credit` de la entidad Operation (ya calculados por el backend tras cargar los ledger_entries).
  - El tipo de operación está en `operation.type` y el detalle en `operation.description`.
  - Es posible mapear estos datos directamente al arreglo `transactions` del modelo `MeetingDetail` en el frontend.

### Modelo de datos propuesto para el frontend

```ts
// MeetingDetail
interface MeetingDetail {
  meeting: {
    id: string;
    date: string;
    status: 'active' | 'closed';
    notes?: string;
  };
  income: {
    contributions: number;
    loanPayments: number;
    interest: number;
    insurance: number;
    assets: number;
    purchases: number;
  };
  withdrawals: {
    loansGranted: { ordinary: number; emergency: number };
    dividendPayouts: number;
    shareWithdrawals: number;
  };
  transactions: Array<{
    id: string;
    type: string;
    member: string;
    amount: number;
    details: string;
  }>;
}
```

### Contrato de API (DTO esperado)
- El endpoint `/meetings/:id/summary` debe aceptar un query param `fields` para pedir los totales requeridos.
- Para la lista de transacciones, se debe usar `/operations?meetingId=...`.
- Si se requiere, proponer un endpoint combinado que devuelva todo el detalle en una sola llamada.

## 2. Crear/ajustar el servicio de API en el frontend
- Centralizar las llamadas a la API en un servicio bajo `app/src/features/meetings/services/meetings.ts`.
- Métodos sugeridos:
  - `getMeetingDetail(meetingId: string): Promise<MeetingDetail>`
  - (Opcional) Métodos para obtener transacciones, ingresos y egresos por separado si la API lo requiere.

## 3. Conectar la vista con datos reales
- Reemplazar los datos mockeados en la vista por datos obtenidos desde el servicio.
- Usar el parámetro de ruta (probablemente `meetingId`) para cargar la información correspondiente.
- Manejar estados de carga y error.

## 4. Mejorar la presentación y navegación
- Asegurarse de que los datos se muestran correctamente formateados (fechas, montos, nombres).
- Agregar enlaces o botones para navegar a detalles de miembros, préstamos, acciones, etc. si aplica.
- (Opcional) Permitir exportar o imprimir el resumen de la reunión.

## 5. Pruebas y validación
- Probar la vista con diferentes reuniones (con y sin transacciones, con distintos tipos de ingresos/egresos).
- Validar que los totales coincidan con los datos individuales.
- Revisar que la vista sea responsiva y accesible.

---

### Tareas Específicas

1. **Backend**
   - [x] Revisar/ajustar el endpoint de detalle de reunión.
   - [x] Asegurar que el endpoint retorna todos los datos necesarios.
   - [x] Validar que `/operations?meetingId=...` retorna todos los datos requeridos para la tabla de transacciones (nombre del miembro, tipo, monto, detalle).
   - [x] Analizar el mapeo de los campos de Operation a los requeridos por el frontend.
   - [ ] (Opcional) Proponer un endpoint combinado para optimizar la consulta del detalle completo.
   - [x] Agregar tests para el endpoint si no existen. (Pendiente de validación manual, pero la estructura es correcta)

2. **Frontend**
   - [ ] Definir los tipos TypeScript para el detalle de reunión.
   - [ ] Implementar el servicio de API para obtener el detalle.
   - [ ] Conectar la vista a los datos reales.
   - [ ] Manejar estados de carga y error.
   - [ ] Mejorar la presentación y navegación.
   - [ ] Probar la vista con datos reales.

---

#### Notas de la revisión de backend
- El backend ya expone todos los datos necesarios para la vista de detalle de reunión.
- El nombre del miembro se obtiene de `operation.member.name`.
- El monto de la transacción se puede calcular usando `total_debit` y `total_credit` de cada operación.
- El tipo de operación y el detalle están disponibles directamente.
- El resumen de reunión permite solicitar los totales requeridos usando el DTO de campos. 