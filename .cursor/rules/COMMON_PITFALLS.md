# Errores Comunes y Soluciones - Collaborative Saving

> Este documento cataloga errores comunes encontrados durante el desarrollo y sus soluciones verificadas.

## Índice

1. [Errores de Arquitectura](#errores-de-arquitectura)
2. [Errores de Testing](#errores-de-testing)
3. [Errores de TypeScript](#errores-de-typescript)
4. [Errores de NestJS](#errores-de-nestjs)
5. [Errores de TypeORM](#errores-de-typeorm)
6. [Errores de Mappers](#errores-de-mappers)

---

## Errores de Arquitectura

### ❌ Importación incorrecta de dependencias

**Problema**: Domain importando de Application o Infrastructure.

```typescript
// ❌ INCORRECTO
// domain/entities/member.entity.ts
import { MemberDto } from '../../../application/dto/member.dto';
import { MemberEntity } from '../../../infrastructure/typeorm/entities/member.entity';
```

**Solución**: Domain no debe importar de ninguna otra capa.

```typescript
// ✅ CORRECTO
// domain/entities/member.entity.ts
import { Email } from '../value-objects/email.value-object';
// Solo imports de domain
```

**Verificación**: Revisar imports en archivos de `domain/`.

---

### ❌ Use Cases dependiendo de implementaciones concretas

**Problema**: Use Case importando repositorio TypeORM en lugar de interface.

```typescript
// ❌ INCORRECTO
// application/use-cases/members/create-member.use-case.ts
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';

export class CreateMemberUseCase {
  constructor(private readonly memberRepository: TypeOrmMemberRepository) {}
}
```

**Solución**: Usar interface del puerto.

```typescript
// ✅ CORRECTO
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';

export class CreateMemberUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}
}
```

**Verificación**: Revisar imports en `application/use-cases/`.

---

### ❌ Falta de Symbol en módulo NestJS

**Problema**: DI directamente con clase, causando acoplamiento.

```typescript
// ❌ INCORRECTO
@Module({
  providers: [
    TypeOrmMemberRepository,
    CreateMemberUseCase, // Direct injection
  ],
})
```

**Solución**: Usar Symbol como token.

```typescript
// ✅ CORRECTO
const MEMBER_REPOSITORY = Symbol('MemberRepository');

@Module({
  providers: [
    { provide: MEMBER_REPOSITORY, useClass: TypeOrmMemberRepository },
    {
      provide: CreateMemberUseCase,
      useFactory: (repo: MemberRepository) => new CreateMemberUseCase(repo),
      inject: [MEMBER_REPOSITORY],
    },
  ],
})
```

**Verificación**: Todos los módulos v2 deben usar Symbols.

---

## Errores de Testing

### ❌ Mock incompleto de Repository

**Problema**: Falta mock de métodos opcionales pero usados.

```typescript
// ❌ INCORRECTO
memberRepository = {
  findById: jest.fn(),
  save: jest.fn(),
  // Falta findByIdWithDeleted y updateStatus
} as unknown as jest.Mocked<MemberRepository>;
```

**Solución**: Mock completo incluyendo opcionales.

```typescript
// ✅ CORRECTO
memberRepository = {
  findById: jest.fn(),
  findActive: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  findByIdWithDeleted: jest.fn(), // Opcional pero importante
  updateStatus: jest.fn(), // Opcional pero importante
} as unknown as jest.Mocked<MemberRepository>;
```

**Verificación**: Revisar errores de tests por métodos no definidos.

---

### ❌ Tests sin AAA pattern

**Problema**: Tests difíciles de leer sin estructura.

```typescript
// ❌ INCORRECTO
it('should create member', async () => {
  const member = Member.create({name: 'Test', email: 'test@example.com'});
  memberRepository.save.mockResolvedValue(member);
  const result = await useCase.execute({name: 'Test', email: 'test@example.com'});
  expect(result).toBeDefined();
});
```

**Solución**: Usar AAA pattern.

```typescript
// ✅ CORRECTO
it('should create member', async () => {
  // ARRANGE
  const dto = { name: 'Test', email: 'test@example.com' };
  const member = Member.create(dto);
  memberRepository.save.mockResolvedValue(member);

  // ACT
  const result = await useCase.execute(dto);

  // ASSERT
  expect(memberRepository.save).toHaveBeenCalledTimes(1);
  expect(result.name).toBe('Test');
});
```

**Verificación**: Todos los tests deben tener comentarios AAA.

---

### ❌ No testear casos edge de errores

**Problema**: Tests solo cubren happy path.

```typescript
// ❌ INCORRECTO
it('should create member', async () => {
  // Solo test de éxito
});
```

**Solución**: Incluir tests de errores.

```typescript
// ✅ CORRECTO
it('should create member successfully', async () => {
  // ARRANGE...
  // ACT...
  // ASSERT...
});

it('should throw error when member not found', async () => {
  memberRepository.findById.mockResolvedValue(null);
  await expect(useCase.execute(dto)).rejects.toThrow('Member not found');
});
```

**Verificación**: Cobertura debe incluir ramas de error.

---

### ❌ No testear excepciones no-Error

**Problema**: Solo testear `Error` instances.

```typescript
// ❌ INCORRECTO
it('should handle errors', async () => {
  createUseCase.mockRejectedValue(new Error('Error'));
  await expect(controller.create(dto)).rejects.toThrow();
});
```

**Solución**: Testear también strings y otros.

```typescript
// ✅ CORRECTO
it('should handle non-Error exceptions', async () => {
  createUseCase.mockRejectedValue('String error');
  await expect(controller.create(dto)).rejects.toThrow(
    expect.objectContaining({ message: 'String error' })
  );
});
```

**Verificación**: Controllers y mappers deben tener estos tests.

---

## Errores de TypeScript

### ❌ Uso de `any`

**Problema**: Pierdes type safety.

```typescript
// ❌ INCORRECTO
function process(data: any) {
  return data.value;
}
```

**Solución**: Usar tipos específicos.

```typescript
// ✅ CORRECTO
function process(data: { value: string }) {
  return data.value;
}
```

**Verificación**: Buscar `any` en código.

---

### ❌ Imports circulares

**Problema**: A → B → A causando `undefined`.

```typescript
// ❌ INCORRECTO
// a.ts
import { B } from './b';
export class A {
  b: B;
}

// b.ts
import { A } from './a';
export class B {
  a: A;
}
```

**Solución**: Invertir dependencias o usar interfaces.

```typescript
// ✅ CORRECTO
// domain/ports/b.port.ts
export interface BPort {
  // ...
}

// a.ts
import { BPort } from './ports/b.port';
export class A {
  constructor(private b: BPort) {}
}
```

**Verificación**: Revisar imports circulares.

---

### ❌ Null/undefined sin manejo explícito

**Problema**: Tipos nullable sin validación.

```typescript
// ❌ INCORRECTO
function getValue(data: { value?: string }) {
  return data.value.toUpperCase(); // Error si undefined
}
```

**Solución**: Validar o usar operadores seguros.

```typescript
// ✅ CORRECTO
function getValue(data: { value?: string }) {
  return data.value?.toUpperCase() || '';
}

// O mejor:
function getValue(data: { value: string | null }) {
  if (data.value === null) throw new Error('Value is required');
  return data.value.toUpperCase();
}
```

**Verificación**: No acceder a propiedades opcionales sin validar.

---

## Errores de NestJS

### ❌ Falta ValidationPipe en endpoints

**Problema**: Input sin validar.

```typescript
// ❌ INCORRECTO
@Post()
async create(@Body() body: CreateMemberHttpDto): Promise<MemberResponseDto> {
  return await this.useCase.execute(body);
}
```

**Solución**: Agregar ValidationPipe.

```typescript
// ✅ CORRECTO
@Post()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
async create(@Body() body: CreateMemberHttpDto): Promise<MemberResponseDto> {
  return await this.useCase.execute(body);
}
```

**Verificación**: Todos los POST/PATCH/PUT deben tener ValidationPipe.

---

### ❌ Manejo inconsistente de errores en controllers

**Problema**: Algunos endpoints lanzan errores, otros no.

```typescript
// ❌ INCORRECTO
@Get(':id')
async detail(@Param('id') id: string) {
  return await this.queryHandler.execute(id);
}
```

**Solución**: Manejo consistente.

```typescript
// ✅ CORRECTO
@Get(':id')
async detail(@Param('id', ParseUUIDPipe) id: string): Promise<MemberResponseDto> {
  try {
    return await this.queryHandler.execute(id);
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw new HttpException(e.message, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
```

**Verificación**: Todos los endpoints deben tener try-catch consistente.

---

### ❌ Falta decorador @Injectable()

**Problema**: Servicios no inyectables.

```typescript
// ❌ INCORRECTO
export class SomeService {
  // Falta @Injectable()
}
```

**Solución**: Agregar decorador.

```typescript
// ✅ CORRECTO
@Injectable()
export class SomeService {
  // ...
}
```

**Verificación**: Todos los servicios deben ser inyectables.

---

## Errores de TypeORM

### ❌ Soft delete sin filtrar deletedAt

**Problema**: Queries retornan registros borrados.

```typescript
// ❌ INCORRECTO
async findById(id: string): Promise<Member | null> {
  const entity = await this.repo.findOne({ where: { id } });
  return entity ? MemberMapper.toDomain(entity) : null;
}
```

**Solución**: Filtrar `deletedAt IS NULL`.

```typescript
// ✅ CORRECTO
import { IsNull } from 'typeorm';

async findById(id: string): Promise<Member | null> {
  const entity = await this.repo.findOne({ 
    where: { id, deletedAt: IsNull() } 
  });
  return entity ? MemberMapper.toDomain(entity) : null;
}
```

**Verificación**: Revisar todas las queries en repositorios.

---

### ❌ Save sin verificar existencia

**Problema**: Updates sobre registros que no existen.

```typescript
// ❌ INCORRECTO
async save(member: Member): Promise<Member> {
  const persistence = MemberMapper.toPersistence(member);
  const saved = await this.repo.save(persistence);
  return MemberMapper.toDomain(saved);
}
```

**Solución**: Verificar existencia primero.

```typescript
// ✅ CORRECTO
async save(member: Member): Promise<Member> {
  const persistence = MemberMapper.toPersistence(member);
  
  const existing = await this.repo.findOne({ 
    where: { id: member.id },
    withDeleted: true 
  });
  
  if (existing) {
    await this.repo.update(member.id, persistence);
    const updated = await this.repo.findOne({ 
      where: { id: member.id },
      withDeleted: true 
    });
    if (!updated || updated.deletedAt) {
      throw new Error('Member not found after update');
    }
    return MemberMapper.toDomain(updated);
  } else {
    const saved = await this.repo.save(persistence as MemberEntity);
    return MemberMapper.toDomain(saved);
  }
}
```

**Verificación**: Métodos `save` deben verificar existencia.

---

### ❌ Soft delete sin verificar affected

**Problema**: No detectar cuando no se borra nada.

```typescript
// ❌ INCORRECTO
async softDelete(id: string): Promise<void> {
  await this.repo.softDelete(id);
}
```

**Solución**: Verificar `affected`.

```typescript
// ✅ CORRECTO
async softDelete(id: string): Promise<void> {
  const result = await this.repo.softDelete(id);
  if (result.affected === 0) {
    throw new Error('Member not found');
  }
}
```

**Verificación**: Métodos `softDelete` deben verificar afectados.

---

## Errores de Mappers

### ❌ Sin manejo de nullable en toPersistence

**Problema**: `undefined` no se convierte a `null`.

```typescript
// ❌ INCORRECTO
static toPersistence(domain: Member): Partial<MemberEntity> {
  return {
    id: domain.id,
    name: domain.name,
    phone: domain.phone, // undefined en DB
  };
}
```

**Solución**: Conversión explícita.

```typescript
// ✅ CORRECTO
static toPersistence(domain: Member): Partial<MemberEntity> {
  return {
    id: domain.id,
    name: domain.name,
    phone: domain.phone !== undefined ? domain.phone || null : null,
  };
}
```

**Verificación**: Todos los mappers deben convertir `undefined` a `null`.

---

### ❌ Sin try-catch en toDomain

**Problema**: Errores de validación no claros.

```typescript
// ❌ INCORRECTO
static toDomain(persistence: MemberEntity): Member {
  return Member.fromPersistence({
    id: persistence.id,
    name: persistence.name,
    // ...
  });
}
```

**Solución**: Try-catch con mensaje claro.

```typescript
// ✅ CORRECTO
static toDomain(persistence: MemberEntity): Member {
  try {
    return Member.fromPersistence({
      id: persistence.id,
      name: persistence.name,
      // ...
    });
  } catch (error) {
    throw new Error(
      `Failed to map Member to domain: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

**Verificación**: Todos los `toDomain` deben tener try-catch.

---

### ❌ Mapper sin tests de casos edge

**Problema**: Campos nullable no cubiertos.

```typescript
// ❌ INCORRECTO
it('should map to domain', () => {
  const entity = { id: '1', name: 'Test', email: 'test@example.com' };
  const result = mapper.toDomain(entity);
  expect(result).toBeDefined();
});
```

**Solución**: Tests exhaustivos.

```typescript
// ✅ CORRECTO
it('should map to domain with null fields', () => {
  const entity = { id: '1', name: 'Test', email: 'test@example.com', phone: null };
  const result = mapper.toDomain(entity);
  expect(result.phone).toBeUndefined();
});

it('should map to persistence with undefined fields as null', () => {
  const member = Member.create({ name: 'Test', email: 'test@example.com' });
  const result = mapper.toPersistence(member);
  expect(result.phone).toBe(null);
});
```

**Verificación**: Mappers deben tener tests de nullable.

---

## Checklist de Prevención

Antes de commitear, verificar:

- [ ] **Arquitectura**: Domain no importa de otras capas
- [ ] **DI**: Módulos usan Symbols para inversión
- [ ] **Testing**: Mocks completos, AAA pattern, casos edge
- [ ] **TypeScript**: Sin `any`, imports sin circular
- [ ] **NestJS**: ValidationPipe en POST/PATCH, try-catch consistente
- [ ] **TypeORM**: Queries filtran `deletedAt`, verifican affected
- [ ] **Mappers**: Nullable manejado, try-catch presente
- [ ] **Cobertura**: ≥90% en capas críticas

---

**Última actualización**: 2025-10-31  
**Fuente**: Lecciones de Members V2  
**Próximos módulos**: Stocks, Loans, Meetings

