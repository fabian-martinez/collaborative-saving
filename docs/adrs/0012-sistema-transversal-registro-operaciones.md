# ADR-0012: Sistema Transversal de Registro de Operaciones Contables

## Estado

Aceptado

## Contexto

Se identificó una duplicación masiva de código (más de 1,300 líneas en 8 servicios) relacionada con la creación de operaciones (`Operation`) y asientos contables (`LedgerEntry`). Esto generaba riesgos de inconsistencia en el balance contable y dificultades en la migración a la arquitectura hexagonal.

### Opciones consideradas

- **Opción A: Repetir lógica en cada servicio** — Mantener la creación manual usando TypeORM QueryRunner en cada módulo.
- **Opción B: Utilidad estática** — Crear funciones *helpers* para reducir líneas de código.
- **Opción C: Caso de Uso Transversal (RecordOperationUseCase)** — Centralizar toda la lógica contable en un servicio de aplicación especializado.

## Decisión

Se eligió la **Opción C (RecordOperationUseCase)**.

Cualquier movimiento financiero en el sistema **DEBE** pasar por este caso de uso transversal, el cual garantiza:
1.  **Validación de Balance**: Débitos sumados deben ser iguales a Créditos.
2.  **Transaccionalidad Atómica**: La operación y sus asientos se guardan o fallan como un conjunto único.
3.  **Trazabilidad**: Asignación automática de IDs y timestamps.
4.  **Desacoplamiento**: Los servicios de negocio (Préstamos, Acciones, Reuniones) solo especifican el "qué" y no el "cómo" contable.

## Consecuencias

### Más fácil

- **Mantenibilidad**: Si cambian las reglas contables, solo se modifica un archivo.
- **Robustez**: Se elimina la posibilidad de que una operación "no cuadre" por error de código.
- **Testabilidad**: Es mucho más sencillo testear el balance contable de forma aislada.

### Más difícil

- **Refactorización**: Requiere modificar todos los servicios existentes que realizan transacciones financieras.

### Revisitar cuando

- Se requiera implementar *Event Sourcing* para el historial contable, ya que este Use Case será el punto natural de inyección.
