# Análisis: Contribuciones Obligatorias (Mandatory Contributions)

**Fecha**: 2025-01-20  
**Estado**: 🔴 **FALTA EN PLAN DE MIGRACIÓN**  
**Prioridad**: 🟡 Media (configuración del sistema)

---

## 🔍 Estado Actual

### Implementación Existente (Sistema Tradicional)

✅ **Módulo NestJS tradicional**:
- `backend/src/mandatory-contributions/mandatory-contributions.controller.ts`
- `backend/src/mandatory-contributions/mandatory-contributions.service.ts`
- `backend/src/mandatory-contributions/entities/mandatory-contribution.entity.ts` (TypeORM Entity)
- `backend/src/mandatory-contributions/dto/` (Create, Update DTOs)
- `backend/src/mandatory-contributions/mandatory-contributions.module.ts`

### Funcionalidad Actual

**Endpoints implementados**:
- `GET /mandatory-contributions` - Lista todas las contribuciones obligatorias
- `GET /mandatory-contributions/:id` - Obtiene detalle de una contribución
- `POST /mandatory-contributions` - Crea una nueva contribución obligatoria
- `PATCH /mandatory-contributions/:id` - Actualiza una contribución existente
- `DELETE /mandatory-contributions/:id` - Elimina una contribución

**Modelo de datos**:
```typescript
{
  id: string (UUID)
  asset_type: string (unique) // Ej: 'stock', 'savings'
  value: number // Monto obligatorio
}
```

### Integración con Otros Módulos

✅ **Usado por**:
- `DuesService`: Calcula cuotas que incluyen contribuciones obligatorias
- `MeetingsService`: Procesa pagos de contribuciones obligatorias
- `AssetRevaluationService`: Considera contribuciones en revalorización
- `LedgerEntry`: Referencia `mandatory_contribution_id`

---

## ❌ Lo que FALTA en Arquitectura Hexagonal v2

### 1. Entidad de Dominio

**Falta**: `domain/entities/mandatory-contribution.entity.ts`

**Diseño propuesto**:
```typescript
export class MandatoryContribution {
  private constructor(
    private readonly id: string,
    private assetType: AssetType, // Value Object
    private value: Money, // Value Object
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: {
    assetType: string;
    value: number;
  }): MandatoryContribution {
    // Validaciones:
    // - assetType no debe estar vacío
    // - value debe ser > 0
    // - assetType debe ser único (validar en repository)
  }

  update(params: { assetType?: string; value?: number }): void {
    // Validaciones y actualización
  }
}
```

### 2. Value Objects

**Falta**: `domain/value-objects/asset-type.value-object.ts`

**Diseño propuesto**:
```typescript
export class AssetType {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Asset type cannot be empty');
    }
  }

  static create(value: string): AssetType {
    return new AssetType(value.trim().toLowerCase());
  }

  toString(): string {
    return this.value;
  }

  equals(other: AssetType): boolean {
    return this.value === other.value;
  }
}
```

### 3. Repository Port

**Mencionado pero no definido**: `domain/ports/repositories/mandatory-contribution-repository.port.ts`

**Diseño propuesto**:
```typescript
export interface MandatoryContributionRepository {
  findById(id: string): Promise<MandatoryContribution | null>;
  findByAssetType(assetType: string): Promise<MandatoryContribution | null>;
  findAll(): Promise<MandatoryContribution[]>;
  save(contribution: MandatoryContribution): Promise<MandatoryContribution>;
  delete(id: string): Promise<void>;
}
```

### 4. Casos de Uso

**Falta completamente** - No están definidos en arquitectura v2

**Casos de uso necesarios**:
1. `CreateMandatoryContributionUseCase`
   - Input: `{ assetType: string, value: number }`
   - Pre-condiciones: assetType único, value > 0
   - Post-condiciones: contribución creada en repositorio
   - Output: `MandatoryContributionResponseDto`

2. `UpdateMandatoryContributionUseCase`
   - Input: `{ id: string, assetType?: string, value?: number }`
   - Pre-condiciones: contribución existe
   - Post-condiciones: contribución actualizada
   - Output: `MandatoryContributionResponseDto`

3. `DeleteMandatoryContributionUseCase`
   - Input: `{ id: string }`
   - Pre-condiciones: contribución existe
   - Post-condiciones: contribución eliminada
   - Output: `void`

### 5. Query Handlers

**Falta completamente** - Mencionados como "pendientes" pero no definidos

**Query handlers necesarios**:
1. `GetMandatoryContributionsQueryHandler`
   - Input: ninguno (filtros opcionales)
   - Output: `MandatoryContributionResponseDto[]`

2. `GetMandatoryContributionDetailQueryHandler`
   - Input: `{ id: string }`
   - Output: `MandatoryContributionResponseDto`
   - Error: 404 si no existe

### 6. Infraestructura

**Falta completamente**:
- `infrastructure/typeorm/repositories/typeorm-mandatory-contribution.repository.ts`
- `infrastructure/typeorm/mappers/mandatory-contribution.mapper.ts`
- `infrastructure/typeorm/entities/mandatory-contribution.entity.ts` (TypeORM Entity)
- `infrastructure/nestjs/http/controllers/mandatory-contributions.v2.controller.ts`
- `infrastructure/nestjs/http/dto/create-mandatory-contribution-http.dto.ts`
- `infrastructure/nestjs/http/dto/update-mandatory-contribution-http.dto.ts`
- `infrastructure/nestjs/http/modules/mandatory-contributions-v2.module.ts`

### 7. Tests

**Falta completamente**:
- Tests unitarios para entidad de dominio
- Tests unitarios para value objects
- Tests unitarios para casos de uso
- Tests unitarios para query handlers
- Tests unitarios para repositorio
- Tests unitarios para mapper
- Tests unitarios para controller

---

## 📋 Plan de Migración Propuesto

### Fase 1: Dominio (1-2 días)

1. **Crear Value Object `AssetType`**
   - `domain/value-objects/asset-type.value-object.ts`
   - `domain/value-objects/asset-type.value-object.spec.ts`
   - Tests: validación, equals, create

2. **Crear Entidad de Dominio**
   - `domain/entities/mandatory-contribution.entity.ts`
   - `domain/entities/mandatory-contribution.entity.spec.ts`
   - Tests: create, update, validaciones, invariantes

3. **Crear Repository Port**
   - `domain/ports/repositories/mandatory-contribution-repository.port.ts`
   - Documentar métodos y contratos

### Fase 2: Aplicación (2-3 días)

1. **Crear Casos de Uso**
   - `application/use-cases/mandatory-contributions/create-mandatory-contribution.use-case.ts`
   - `application/use-cases/mandatory-contributions/update-mandatory-contribution.use-case.ts`
   - `application/use-cases/mandatory-contributions/delete-mandatory-contribution.use-case.ts`
   - Tests para cada caso de uso

2. **Crear Query Handlers**
   - `application/queries/mandatory-contributions/get-mandatory-contributions.query-handler.ts`
   - `application/queries/mandatory-contributions/get-mandatory-contribution-detail.query-handler.ts`
   - Tests para cada query handler

3. **Crear DTOs**
   - `application/dto/mandatory-contributions/create-mandatory-contribution.dto.ts`
   - `application/dto/mandatory-contributions/update-mandatory-contribution.dto.ts`
   - `application/dto/mandatory-contributions/mandatory-contribution-response.dto.ts`

### Fase 3: Infraestructura (2-3 días)

1. **Crear TypeORM Entity**
   - `infrastructure/typeorm/entities/mandatory-contribution.entity.ts`

2. **Crear Mapper**
   - `infrastructure/typeorm/mappers/mandatory-contribution.mapper.ts`
   - `infrastructure/typeorm/mappers/mandatory-contribution.mapper.spec.ts`
   - Tests: toDomain, toPersistence, manejo de nulls

3. **Crear Repository TypeORM**
   - `infrastructure/typeorm/repositories/typeorm-mandatory-contribution.repository.ts`
   - `infrastructure/typeorm/repositories/typeorm-mandatory-contribution.repository.spec.ts`
   - Tests: todos los métodos del port

4. **Crear Controller v2**
   - `infrastructure/nestjs/http/controllers/mandatory-contributions.v2.controller.ts`
   - `infrastructure/nestjs/http/controllers/mandatory-contributions.v2.controller.spec.ts`
   - Tests: todos los endpoints, manejo de errores

5. **Crear DTOs HTTP**
   - `infrastructure/nestjs/http/dto/create-mandatory-contribution-http.dto.ts`
   - `infrastructure/nestjs/http/dto/update-mandatory-contribution-http.dto.ts`

6. **Crear Module**
   - `infrastructure/nestjs/http/modules/mandatory-contributions-v2.module.ts`
   - Integrar en `app.module.ts`

### Esfuerzo Total Estimado: **5-8 días**

---

## 🎯 Prioridad y Justificación

### Prioridad: 🟡 Media

**Razones**:
1. ✅ **Es funcionalidad de configuración**: No es crítica para operaciones diarias
2. ✅ **Uso indirecto**: Se usa principalmente por otros servicios (Dues, Meetings)
3. ⚠️ **Completitud arquitectónica**: Debe migrarse para tener consistencia
4. ⚠️ **Dependencias**: Otros módulos la referencian

### ¿Cuándo migrar?

**Opción 1: Después de módulos críticos** (Recomendado)
- Migrar después de: Members ✅, Stocks ✅, Meetings ✅, Loans, Operations
- **Razón**: No bloquea funcionalidad principal, pero completa arquitectura

**Opción 2: En paralelo con otros módulos**
- Migrar junto con módulos de menor complejidad
- **Razón**: Es relativamente simple (solo CRUD)

---

## 📊 Comparación con Otros Módulos

| Aspecto | Members | Stocks | Meetings | **MandatoryContributions** |
|---------|---------|--------|----------|---------------------------|
| Complejidad | Media | Media | Alta | **Baja** ✅ |
| Casos de uso | 4 | 2 | 5 | **3** ✅ |
| Query handlers | 2 | 2 | 0 | **2** ✅ |
| Dependencias | Baja | Baja | Alta | **Baja** ✅ |
| Estado | ✅ Migrado | ✅ Migrado | ✅ Migrado | ❌ **Pendiente** |

**Conclusión**: Es el módulo más simple de migrar después de Members.

---

## 🔗 Integración con Arquitectura Existente

### Dependencias de MandatoryContributions

**Usa** (sin dependencias directas):
- Ninguna entidad de dominio
- Es un catálogo simple

### Dependencias HACIA MandatoryContributions

**Usado por**:
1. **DuesCalculationService** (domain service)
   - Necesita: `MandatoryContributionRepository.findAll()`
   - **Estado**: ⚠️ Pendiente implementar en arquitectura hexagonal

2. **AssetRevaluationService** (domain service)
   - Necesita: Leer contribuciones para calcular distribución
   - **Estado**: ⚠️ Pendiente implementar en arquitectura hexagonal

3. **MeetingsService** (sistema tradicional)
   - Procesa pagos de contribuciones obligatorias
   - **Estado**: ⚠️ Pendiente migrar a arquitectura hexagonal

---

## ✅ Checklist de Migración

### Dominio
- [ ] Value Object `AssetType`
- [ ] Entidad `MandatoryContribution`
- [ ] Repository Port `MandatoryContributionRepository`
- [ ] Tests de dominio (cobertura 100%)

### Aplicación
- [ ] Use Case: CreateMandatoryContribution
- [ ] Use Case: UpdateMandatoryContribution
- [ ] Use Case: DeleteMandatoryContribution
- [ ] Query Handler: GetMandatoryContributions
- [ ] Query Handler: GetMandatoryContributionDetail
- [ ] DTOs de aplicación
- [ ] Tests de aplicación (cobertura 95%+)

### Infraestructura
- [ ] TypeORM Entity
- [ ] Mapper Domain ↔ Persistence
- [ ] Repository TypeORM
- [ ] Controller v2
- [ ] DTOs HTTP
- [ ] Module NestJS
- [ ] Integración en app.module.ts
- [ ] Tests de infraestructura (cobertura 90%+)

### Validación
- [ ] Tests E2E para endpoints v2
- [ ] Validación de no-regresión (sistema antiguo sigue funcionando)
- [ ] Documentación actualizada
- [ ] Cobertura total > 90%

---

## 📝 Notas Importantes

### Consideraciones Técnicas

1. **Unicidad de asset_type**:
   - Debe validarse en el caso de uso Create
   - Repository debe tener método `findByAssetType()`

2. **Relación con LedgerEntry**:
   - `LedgerEntry` tiene `mandatory_contribution_id` opcional
   - No requiere migración inmediata, pero debe considerarse

3. **Integración con DuesCalculationService**:
   - Este servicio necesita leer contribuciones
   - Debe actualizarse para usar el nuevo repository port

### Decisiones Pendientes

1. **¿Soft delete o hard delete?**
   - Actualmente: hard delete
   - Propuesta: mantener hard delete (es configuración del sistema)

2. **¿Value Object para asset_type o string simple?**
   - Propuesta: Value Object `AssetType` (consistencia con arquitectura)

3. **¿Necesita eventos de dominio?**
   - Propuesta: No (no tiene efectos secundarios complejos)

---

## 🚀 Siguiente Paso

**Recomendación**: Agregar MandatoryContributions al plan de migración después de Loans u Operations, ya que es un módulo simple (CRUD básico) que completará la arquitectura.

**Prioridad sugerida**:
- Semana 7-8: Migrar MandatoryContributions (junto con Operations o después)

---

**Última actualización**: 2025-01-20  
**Estado**: Análisis completado - Listo para agregar al plan

