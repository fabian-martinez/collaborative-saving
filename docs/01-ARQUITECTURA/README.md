# Documentación de Arquitectura

Índice de la documentación arquitectónica del proyecto Collaborative Saving.

## Arquitectura v2 (Objetivo)

### Documento Principal
- **[ARQUITECTURA_V2.md](./ARQUITECTURA_V2.md)** - Documento general con principios, decisiones arquitectónicas y diagramas

### Documentación por Capa
- **[DOMINIO.md](./DOMINIO.md)** - Capa de dominio: entidades, value objects, domain services, eventos, invariantes y puertos (interfaces)
- **[CAPA_APLICACION.md](./CAPA_APLICACION.md)** - Capa de aplicación: casos de uso, DTOs y estructura
- **[INFRAESTRUCTURA.md](./INFRAESTRUCTURA.md)** - Capa de infraestructura: repositorios concretos, adaptadores HTTP, mappers

### Guías de Implementación
- **[FLUJO_REQUEST_HEXAGONAL.md](./FLUJO_REQUEST_HEXAGONAL.md)** - Flujo completo de un request HTTP en arquitectura hexagonal (desde HTTP hasta DB y vuelta)
- **[IMPLEMENTACION_ESCALONADA.md](./IMPLEMENTACION_ESCALONADA.md)** - Estrategia Outside-In con TDD: cómo implementar un caso de uso paso a paso (E2E → Adapters → Use Case → Domain)
- **[MAPEO_CONTROLADORES_CASOS_USO.md](./MAPEO_CONTROLADORES_CASOS_USO.md)** - Mapeo completo de controladores actuales → casos de uso v2, plan de migración priorizado y contratos por caso de uso
- **[REGLAS_DESARROLLO.md](./REGLAS_DESARROLLO.md)** - Reglas de desarrollo a aplicar durante la implementación (arquitectura, estilo, testing, git, operaciones)

### Diagramas
- **[DIAGRAMAS_ARQUITECTURA.md](./DIAGRAMAS_ARQUITECTURA.md)** - Diagramas C4, ERD, State Diagrams y Sequence Diagrams

## Documentación Histórica

- **[PLAN_MEJORAS_ARQUITECTURA.md](./PLAN_MEJORAS_ARQUITECTURA.md)** - Plan detallado de mejoras (histórico, contenido migrado a documentos v2)
- **[ARQUITECTURA_ACTUAL.md](./ARQUITECTURA_ACTUAL.md)** - Análisis de la arquitectura actual del sistema

## Análisis Técnico

- **[ANALISIS_CODIGO.md](./ANALISIS_CODIGO.md)** - Análisis del código existente
- **[ANALISIS_MODELO_DATOS.md](./ANALISIS_MODELO_DATOS.md)** - Análisis del modelo de datos
- **[ANALISIS_MODULOS_NESTJS.md](./ANALISIS_MODULOS_NESTJS.md)** - Análisis de módulos NestJS
- **[ANALISIS_PATRONES_DISENO.md](./ANALISIS_PATRONES_DISENO.md)** - Patrones de diseño identificados
- **[ANALISIS_PATRONES_DUPLICADOS.md](./ANALISIS_PATRONES_DUPLICADOS.md)** - Patrones duplicados detectados

## Guía de Navegación

### Para entender la arquitectura objetivo
1. Lee **[ARQUITECTURA_V2.md](./ARQUITECTURA_V2.md)** para obtener una visión general
2. Revisa **[DIAGRAMAS_ARQUITECTURA.md](./DIAGRAMAS_ARQUITECTURA.md)** para ver la estructura visual
3. Profundiza en cada capa según necesidad:
   - **[DOMINIO.md](./DOMINIO.md)** - Lógica de negocio y reglas
   - **[CAPA_APLICACION.md](./CAPA_APLICACION.md)** - Casos de uso y DTOs
   - **[INFRAESTRUCTURA.md](./INFRAESTRUCTURA.md)** - Implementaciones técnicas

### Para migrar funcionalidades
1. **Mapeo inicial**: Consulta **[MAPEO_CONTROLADORES_CASOS_USO.md](./MAPEO_CONTROLADORES_CASOS_USO.md)** para ver qué endpoint mapea a qué caso de uso y la priorización
2. **Proceso paso a paso**: Lee **[IMPLEMENTACION_ESCALONADA.md](./IMPLEMENTACION_ESCALONADA.md)** para entender el proceso día a día
3. **Entiende el flujo**: Revisa **[FLUJO_REQUEST_HEXAGONAL.md](./FLUJO_REQUEST_HEXAGONAL.md)** para ver cómo fluyen los datos
4. **Consulta las capas**:
   - **[DOMINIO.md](./DOMINIO.md)** - Entidades y puertos necesarios
   - **[CAPA_APLICACION.md](./CAPA_APLICACION.md)** - Casos de uso y DTOs requeridos
   - **[INFRAESTRUCTURA.md](./INFRAESTRUCTURA.md)** - Implementaciones concretas

### Para entender el estado actual
1. Lee **[ARQUITECTURA_ACTUAL.md](./ARQUITECTURA_ACTUAL.md)** para el análisis de la arquitectura existente
2. Consulta los documentos de análisis técnico según necesidad

