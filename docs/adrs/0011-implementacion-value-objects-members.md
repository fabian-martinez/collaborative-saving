# ADR-0011: Implementación de Value Objects para Members

## Estado

Aceptado

## Contexto

Durante la migración a la Arquitectura Hexagonal del módulo de Members, surgió el debate sobre si utilizar **Value Objects (VO)** para todos los campos o mantener tipos primitivos (strings). El objetivo es balancear la robustez de la lógica de negocio con la simplicidad del código y evitar el *over-engineering*.

### Opciones consideradas

- **Opción A: Value Objects totales** — Crear clases para cada campo (`MemberId`, `Email`, `MemberStatus`, `Phone`, `Address`, `Beneficiary`).
- **Opción B: Strings simples** — Utilizar tipos primitivos y validar únicamente en el servicio de aplicación.
- **Opción C: Enfoque pragmático (Híbrido)** — Usar VOs solo donde aporten valor real en validación compleja o reutilización.

## Decisión

Se optó por la **Opción C (Enfoque pragmático)**.

1.  **SÍ usar Value Objects** para:
    *   `Email`: Validación compleja y alta reutilización.
    *   `MemberStatus`: Garantiza invariantes de negocio (solo estados válidos).
    *   `Phone`: Necesita normalización y validación de formato.
2.  **NO usar Value Objects** para:
    *   `MemberId`: Ya es validado como UUID por la infraestructura (NestJS Pipes).
    *   `Address`/`Beneficiary`: Son metadatos simples sin lógica asociada.

## Consecuencias

### Más fácil

- **Validación centralizada**: Las reglas de formato del email o teléfono viven en un solo lugar.
- **Type Safety**: Evita pasar un string de dirección donde se espera un email.
- **Invariantes**: Es imposible tener un `Member` en un estado no permitido.

### Más difícil

- **Mapeo**: Requiere el uso de *Mappers* en la capa de infraestructura para convertir de la base de datos al dominio y viceversa.
- **Verbocidad**: Ligeramente más archivos en la carpeta `domain/value-objects/`.

### Revisitar cuando

- Se requieran validaciones geográficas complejas para las direcciones.
