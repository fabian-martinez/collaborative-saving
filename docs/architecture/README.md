# Documentación de Arquitectura

Índice de la documentación arquitectónica vigente para el proyecto Collaborative Saving.

## Arquitectura Hexagonal (Objetivo)

### Fundamentos
- **[ARQUITECTURA_V2.md](./ARQUITECTURA_V2.md)** — Principios generales, decisiones clave y visión de la refactorización.
- **[ESTRUCTURA_PROYECTO.md](./ESTRUCTURA_PROYECTO.md)** — Guía de carpetas y capas (Ports & Adapters).
- **[FLUJO_REQUEST_HEXAGONAL.md](./FLUJO_REQUEST_HEXAGONAL.md)** — Ciclo de vida de una petición desde el controlador hasta la base de datos.

### Documentación por Capa
- **[DOMINIO.md](./DOMINIO.md)** — Invariantes de negocio, entidades, value objects y puertos (interfaces).
- **[APLICACION.md](./APLICACION.md)** — Catálogo de Use Cases, DTOs y orquestación.
- **[INFRAESTRUCTURA.md](./INFRAESTRUCTURA.md)** — Implementaciones técnicas: adaptadores TypeORM, NestJS y servicios transversales.

### Guías y Reglas
- **[REGLAS_DESARROLLO.md](./REGLAS_DESARROLLO.md)** — Estándares de código, naming, testing y workflow de PRs.
- **[GUIA_REGISTRO_OPERACIONES.md](./GUIA_REGISTRO_OPERACIONES.md)** — Manual obligatorio para el uso del sistema contable transversal.

### Diagramas y Mapeo
- **[DIAGRAMAS_ARQUITECTURA.md](./DIAGRAMAS_ARQUITECTURA.md)** — Modelos C4, ERD y diagramas de estado/secuencia.
- **[HISTORICO_MAPEO_CASOS_USO.md](./HISTORICO_MAPEO_CASOS_USO.md)** — Seguimiento del progreso de migración de endpoints V1 a V2.

## Registro de Decisiones (ADRs)
Las decisiones arquitectónicas históricas y recientes se encuentran centralizadas en:
- **[Decisiones (ADRs)](../adrs/README.md)**
