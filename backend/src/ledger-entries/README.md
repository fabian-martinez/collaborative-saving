# Módulo de Asientos Contables (Ledger Entries)

Este módulo implementa la funcionalidad para gestionar asientos contables en el sistema Collaborative Saving.

## Endpoints Disponibles

### 1. Obtener Tipos de Cuenta
```
GET /ledger-entries/account-types
```
Retorna la lista de todos los tipos de cuenta disponibles para filtrar asientos contables.

**Respuesta:**
```json
[
  {
    "value": "CASH",
    "label": "Cash"
  },
  {
    "value": "LOANS_RECEIVABLE",
    "label": "Loans Receivable"
  }
]
```

### 2. Listar Asientos Contables
```
GET /ledger-entries
```
Obtiene una lista paginada de asientos contables con opciones de filtrado.

**Parámetros de Query:**
- `q` (opcional): Búsqueda por texto en descripción o ID de operación
- `memberId` (opcional): Filtrar por ID de miembro
- `accountType` (opcional): Filtrar por tipo de cuenta
- `meetingId` (opcional): Filtrar por ID de reunión
- `dateFrom` (opcional): Fecha desde (ISO 8601)
- `dateTo` (opcional): Fecha hasta (ISO 8601)
- `page` (opcional): Página (por defecto 1)
- `limit` (opcional): Resultados por página (por defecto 20, máximo 100)

**Ejemplo de Request:**
```
GET /ledger-entries?q=loan&memberId=123&accountType=CASH&page=1&limit=10
```

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "operationId": "uuid",
      "accountType": "CASH",
      "amount": 150000.00,
      "description": "Pago de cuota de préstamo",
      "createdAt": "2025-01-15T10:30:00Z",
      "operationType": "LOAN_PAYMENT",
      "operationDescription": "Pago mensual de préstamo",
      "operationDate": "2025-01-15T10:30:00Z",
      "memberId": "uuid",
      "memberName": "Ana Gómez",
      "meetingId": "uuid",
      "meetingDate": "2025-01-15T09:00:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 150
}
```

### 3. Obtener Asiento Contable por ID
```
GET /ledger-entries/:id
```
Obtiene un asiento contable específico por su ID.

**Respuesta:** `LedgerEntryEnrichedDto`

### 4. Obtener Asientos por Operación
```
GET /ledger-entries/operation/:operationId
```
Obtiene todos los asientos contables asociados a una operación específica.

**Respuesta:** Array de `LedgerEntryEnrichedDto`

## Estructura de Datos

### LedgerEntryEnrichedDto
Contiene información completa del asiento contable enriquecida con datos de:
- Operación asociada
- Miembro involucrado
- Reunión donde ocurrió
- Entidades relacionadas (préstamo, acción, etc.)

### FindLedgerEntriesDto
DTO para filtros de búsqueda con validaciones:
- Búsqueda por texto
- Filtros por miembro, cuenta, reunión
- Rango de fechas
- Paginación

## Características

- **Filtrado Avanzado**: Búsqueda por texto, filtros por múltiples criterios
- **Paginación**: Control de resultados por página con límite máximo de 100
- **Ordenamiento**: Por defecto ordenado por fecha de creación descendente
- **Enriquecimiento de Datos**: JOINs automáticos para obtener información completa
- **Validación**: DTOs con validaciones usando class-validator
- **Documentación Swagger**: API completamente documentada

## Uso en Frontend

Este módulo está diseñado para integrarse con el frontend Vue.js existente:

1. **Tabla de Asientos**: Usar endpoint `/ledger-entries` con filtros
2. **Detalles de Operación**: Usar endpoint `/ledger-entries/operation/:id`
3. **Tipos de Cuenta**: Usar endpoint `/ledger-entries/account-types` para filtros

## Dependencias

- `@nestjs/common`: Decoradores y funcionalidades base
- `@nestjs/typeorm`: ORM para base de datos
- `class-validator`: Validación de DTOs
- `class-transformer`: Transformación de datos

## Testing

Para probar los endpoints, usar la colección de Postman incluida:
`postman-ledger-entries-collection.json`

## Próximos Pasos

1. Implementar índices de base de datos para optimización
2. Agregar tests unitarios y e2e
3. Implementar cache para tipos de cuenta
4. Agregar métricas de performance
