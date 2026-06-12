# Errores Comunes y Soluciones - Collaborative Saving

Este documento cataloga los errores comunes y sus soluciones arquitectónicas/técnicas correctas.

## Errores de Arquitectura

### 1. Importación incorrecta de dependencias
- **Problema**: El dominio (`domain/`) importa de `application/` o `infrastructure/`.
- **Solución**: El dominio debe ser totalmente autónomo e independiente. Solo se importan elementos del propio dominio.

### 2. Confundir Entidad de Dominio con Entidad TypeORM Legacy
- **Problema**: Importar `@domain/entities/...` o la entidad de persistencia legacy de forma errónea en repositorios o mappers.
- **Solución**: Usar aliases claros en repositorios y mappers. Las entidades TypeORM legacy (`src/{feature}/entities/`) **solo** se importan en repositorios concrete, mappers concrete y módulos NestJS. NUNCA en Use Cases o Domain.
```typescript
// ✅ CORRECTO (en repositorio)
import { Member as MemberDomain } from '@domain/entities/member.entity';
import { Member as MemberEntity } from '../../../members/entities/member.entity'; // legacy
```

### 3. Use Cases dependiendo de implementaciones concretas
- **Problema**: Un Use Case inyecta directamente un repositorio TypeORM (`TypeOrmMemberRepository`).
- **Solución**: Inyectar el puerto interface (`MemberRepository`).

### 4. Falta de Symbol en módulo NestJS
- **Problema**: NestJS no puede resolver la interfaz por falta de token Symbol.
- **Solución**: Usar `Symbol` centralizados en `injection-tokens.ts` e inyectar usando factories en el módulo.

---

## Errores de Testing

### 1. Mock incompleto de Repositorios
- **Problema**: El mock del repositorio en tests no incluye métodos opcionales o secundarios, causando errores en runtime.
- **Solución**: Mockear todos los métodos de la interface.

### 2. Tests sin patrón AAA
- **Problema**: Tests desordenados difíciles de seguir.
- **Solución**: Separar claramente con comentarios `// ARRANGE`, `// ACT`, `// ASSERT`.

### 3. No testear excepciones no-Error o casos edge
- **Problema**: Ignorar flujos de error que lanzan strings o fallos de validación.
- **Solución**: Testear respuestas de error y try-catch.
```typescript
it('should handle non-Error exceptions', async () => {
  useCase.execute.mockRejectedValue('String error');
  await expect(controller.create(dto)).rejects.toThrow(expect.objectContaining({ message: 'String error' }));
});
```

---

## Errores de TypeScript

### 1. Uso de `any`
- **Problema**: Pérdida de seguridad de tipos.
- **Solución**: Usar tipado explícito o `unknown` si es genérico.

### 2. Imports circulares
- **Problema**: Dependencia cíclica (A -> B -> A) causando referencias `undefined`.
- **Solución**: Extraer dependencias comunes a interfaces/puertos o a un archivo neutral.

### 3. Falta de control de null/undefined
- **Problema**: Llamar métodos en variables opcionales (ej: `dto.phone.trim()`).
- **Solución**: Usar optional chaining (`dto.phone?.trim()`) o validación/valores por defecto (`|| ''`).

---

## Errores de NestJS

### 1. Falta ValidationPipe en controllers
- **Problema**: Los payloads no son validados, permitiendo inyecciones o datos basura.
- **Solución**: Usar `@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`.

### 2. Manejo inconsistente de errores
- **Problema**: Lanzar excepciones genéricas de dominio sin convertirlas a HTTP status correctos.
- **Solución**: Envolver las llamadas a Use Cases en try-catch y mapear a `HttpException` correspondientes.

### 3. Falta de decorador `@Injectable()`
- **Problema**: Errores al resolver dependencias en NestJS.
- **Solución**: Asegurar que toda clase inyectable tenga `@Injectable()`.

---

## Errores de TypeORM

### 1. Soft Delete sin filtrar deletedAt
- **Problema**: Queries en repositorios retornan registros borrados.
- **Solución**: Filtrar explícitamente `deletedAt: IsNull()` (a menos que se necesite explícitamente `withDeleted: true`).

### 2. Save sin verificar existencia (Update vs Insert)
- **Problema**: Intentar actualizar un registro modificado que fue borrado lógicamente, o duplicar inserciones.
- **Solución**: Buscar con `withDeleted: true` antes de guardar. Si existe, usar `.update()` en lugar de `.save()` para evitar comportamientos extraños de inserción.

### 3. Borrado lógico sin validar affected
- **Problema**: Intentar borrar un registro inexistente y no lanzar error.
- **Solución**: Comprobar `affected` en el resultado de `softDelete`.
```typescript
const result = await this.repo.softDelete(id);
if (result.affected === 0) throw new Error('Not found');
```

---

## Errores de Mappers

### 1. Sin manejo de nullable/undefined en `toPersistence`
- **Problema**: TypeORM trata `undefined` ignorando la propiedad, pero a veces se requiere guardar `null` en base de datos.
- **Solución**: Mapear campos opcionales explícitamente:
```typescript
phone: domain.phone !== undefined ? domain.phone || null : null
```

### 2. Falta de try-catch en `toDomain`
- **Problema**: Fallos en la creación de Value Objects en el dominio al leer de base de datos lanzan excepciones crípticas de mapping.
- **Solución**: Envolver la conversión en un bloque `try-catch` con logs claros del mapeo fallido.

---

## Checklist de Prevención (Pre-commit)
- [ ] ¿El dominio está 100% aislado de dependencias externas?
- [ ] ¿Los módulos usan Symbols de `injection-tokens.ts`?
- [ ] ¿Los HTTP DTOs validan sus campos con `class-validator`?
- [ ] ¿Tus tests usan el patrón AAA y mockean todas las dependencias?
- [ ] ¿Los mappers gestionan campos nulos/indefinidos y controlan errores?
- [ ] ¿Las operaciones en base de datos filtran `deletedAt` y verifican `affected`?
- [ ] ¿Se usa `RecordOperationUseCase` para transacciones contables?

**Última actualización**: 2025-10-31
