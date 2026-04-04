# Patrones de Testing - Collaborative Saving

> Este documento define los patrones y estrategias de testing aplicados en el proyecto, basados en las lecciones aprendidas de Members V2.

## Índice

1. [Estrategia TDD](#estrategia-tdd)
2. [Estructura AAA](#estructura-aaa)
3. [Mocking de Dependencias](#mocking-de-dependencias)
4. [Tests Unitarios por Capa](#tests-unitarios-por-capa)
5. [Cobertura Objetivos](#cobertura-objetivos)
6. [Casos Edge](#casos-edge)
7. [Naming Conventions](#naming-conventions)
8. [Best Practices](#best-practices)

---

## Estrategia TDD

### Red-Green-Refactor

**Flujo**:
1. **Red**: Escribir test que falle
2. **Green**: Implementar código mínimo que pase el test
3. **Refactor**: Mejorar código sin romper tests

### Ejemplo práctico

```typescript
// 1. RED - Test que falla
describe('Email Value Object', () => {
  it('should create Email with valid email format', () => {
    const email = new Email('test@example.com');
    expect(email.value).toBe('test@example.com');
  });
});

// 2. GREEN - Implementación mínima
export class Email {
  constructor(public readonly value: string) {}
}

// 3. REFACTOR - Agregar validación
export class Email {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
  }
  private isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
```

---

## Estructura AAA

### Patrón Arrange-Act-Assert

**Todos los tests deben seguir esta estructura**:

```typescript
it('should do something', async () => {
  // ARRANGE - Preparar datos y mocks
  const dto = { name: 'Test', email: 'test@example.com' };
  const savedMember = Member.create(dto);
  memberRepository.save.mockResolvedValue(savedMember);

  // ACT - Ejecutar código bajo test
  const result = await useCase.execute(dto);

  // ASSERT - Verificar resultado
  expect(memberRepository.save).toHaveBeenCalledTimes(1);
  expect(result.name).toBe('Test');
});
```

### Por qué funciona

- **Legible**: Se entiende qué se prueba
- **Consistente**: Todos los tests siguen la misma estructura
- **Mantenible**: Fácil identificar qué parte falla

---

## Mocking de Dependencias

### Mocking completo de Repositories

**CRÍTICO**: Mock todos los métodos del repositorio, incluso los opcionales.

```typescript
// ✅ CORRECTO - Mock completo
memberRepository = {
  findById: jest.fn(),
  findActive: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  findByIdWithDeleted: jest.fn(), // Opcional pero importante
  updateStatus: jest.fn(), // Opcional pero importante
} as unknown as jest.Mocked<MemberRepository>;
```

### Mocking de TypeORM Repository

```typescript
const mockTypeOrmRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const module: TestingModule = await Test.createTestingModule({
  providers: [
    TypeOrmMemberRepository,
    {
      provide: getRepositoryToken(MemberEntity),
      useValue: mockTypeOrmRepo,
    },
  ],
}).compile();
```

### Mocking de Use Cases/Queries en Controllers

```typescript
const module: TestingModule = await Test.createTestingModule({
  controllers: [MembersV2Controller],
  providers: [
    {
      provide: GetMembersQueryHandler,
      useValue: {
        execute: jest.fn(),
      },
    },
    {
      provide: CreateMemberUseCase,
      useValue: {
        execute: jest.fn(),
      },
    },
  ],
}).compile();
```

### Uso de Spies (cuando aplica)

```typescript
// Evitar 'this' scoping issues
getMembersQueryExecuteSpy = jest.spyOn(getMembersQuery, 'execute');
updateMemberUseCaseExecuteSpy = jest.spyOn(updateMemberUseCase, 'execute');
```

---

## Tests Unitarios por Capa

### Value Objects

**Estrategia**: Casos válidos + casos inválidos + factory methods

```typescript
describe('Email Value Object', () => {
  describe('constructor', () => {
    it('should create Email with valid email format', () => {
      const email = new Email('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw error for invalid email format - missing @', () => {
      expect(() => new Email('testexample.com')).toThrow(
        'Invalid email format: testexample.com',
      );
    });

    it('should accept valid email with subdomain', () => {
      const email = new Email('test@mail.example.com');
      expect(email.value).toBe('test@mail.example.com');
    });
  });

  describe('create static method', () => {
    it('should create Email using static factory method', () => {
      const email = Email.create('test@example.com');
      expect(email).toBeInstanceOf(Email);
    });
  });
});
```

**Cobertura objetivo**: 100%

### Domain Entities

**Estrategia**: Factory methods + mutaciones + getters

```typescript
describe('Member Entity', () => {
  describe('create', () => {
    it('should create Member with minimum fields', () => {
      const member = Member.create({
        name: 'Test',
        email: 'test@example.com',
      });
      expect(member.name).toBe('Test');
      expect(member.email).toBe('test@example.com');
    });

    it('should set default role to member', () => {
      const member = Member.create({ name: 'Test', email: 'test@example.com' });
      expect(member.role).toBe('member');
    });
  });

  describe('fromPersistence', () => {
    it('should map from persistence data', () => {
      const data = {
        id: '123',
        name: 'Test',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      };
      const member = Member.fromPersistence(data);
      expect(member.id).toBe('123');
    });
  });

  describe('update', () => {
    it('should update member fields', () => {
      const member = Member.create({ name: 'Test', email: 'test@example.com' });
      member.update({ name: 'Updated' });
      expect(member.name).toBe('Updated');
    });
  });
});
```

**Cobertura objetivo**: ~100%

### Use Cases

**Estrategia**: Éxito + errores + casos edge

```typescript
describe('CreateMemberUseCase', () => {
  let useCase: CreateMemberUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;

  beforeEach(() => {
    memberRepository = { /* mock completo */ } as unknown as jest.Mocked<MemberRepository>;
    useCase = new CreateMemberUseCase(memberRepository);
  });

  it('should create a member successfully', async () => {
    // ARRANGE
    const dto = { name: 'Test', email: 'test@example.com' };
    const savedMember = Member.create(dto);
    memberRepository.save.mockResolvedValue(savedMember);

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Test');
  });

  it('should set default role to member when not provided', async () => {
    const dto = { name: 'Test', email: 'test@example.com' };
    const savedMember = Member.create(dto);
    memberRepository.save.mockResolvedValue(savedMember);

    const result = await useCase.execute(dto);

    expect(result.role).toBe('member');
  });
});
```

**Cobertura objetivo**: 100%

### Query Handlers

**Estrategia**: Array vacío + datos + mapeo correcto

```typescript
describe('GetMembersQueryHandler', () => {
  it('should return empty array when no members', async () => {
    memberRepository.findActive.mockResolvedValue([]);
    const result = await handler.execute();
    expect(result).toEqual([]);
  });

  it('should return list of active members', async () => {
    const members = [Member.create({ name: 'Test', email: 'test@example.com' })];
    memberRepository.findActive.mockResolvedValue(members);
    const result = await handler.execute();
    expect(result).toHaveLength(1);
  });
});
```

**Cobertura objetivo**: 100%

### Repositories

**Estrategia**: Método por método, casos edge

```typescript
describe('TypeOrmMemberRepository', () => {
  describe('findById', () => {
    it('should return Member when found', async () => {
      const entity = { /* test data */ };
      typeOrmRepo.findOne.mockResolvedValue(entity);
      const result = await repository.findById('123');
      expect(result).toBeInstanceOf(MemberDomain);
    });

    it('should return null when not found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findById('123');
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should insert new member when not exists', async () => {
      // Arrange...
      // Act...
      // Assert...
    });

    it('should update existing member', async () => {
      // Arrange...
      // Act...
      // Assert...
    });

    it('should throw error when member not found after update', async () => {
      // Arrange...
      // Act...
      // Assert...
    });
  });
});
```

**Cobertura objetivo**: 100%

### Controllers

**Estrategia**: Endpoints + códigos HTTP + manejo de errores

```typescript
describe('MembersV2Controller', () => {
  it('should return list of active members', async () => {
    getMembersQueryExecuteSpy.mockResolvedValue([mockMemberResponse]);
    const result = await controller.list();
    expect(result).toEqual([mockMemberResponse]);
  });

  it('should create member and return 201', async () => {
    createMemberUseCaseExecuteSpy.mockResolvedValue(mockMemberResponse);
    const result = await controller.create(mockBody);
    expect(result).toEqual(mockMemberResponse);
  });

  it('should return 404 when member not found', async () => {
    getMemberDetailQueryExecuteSpy.mockResolvedValue(null);
    await expect(controller.detail('123')).rejects.toThrow(HttpException);
  });

  it('should handle non-Error exceptions', async () => {
    createMemberUseCaseExecuteSpy.mockRejectedValue('String error');
    await expect(controller.create(mockBody)).rejects.toThrow(
      expect.objectContaining({ message: 'String error' })
    );
  });
});
```

**Cobertura objetivo**: 100%

---

## Cobertura Objetivos

### Por Capa

| Capa | Objetivo | Members V2 |
|------|----------|-----------|
| Value Objects | 100% | 100% ✅ |
| Domain Entities | ~100% | ~100% ✅ |
| Use Cases | 100% | 100% ✅ |
| Query Handlers | 100% | 100% ✅ |
| Mappers | 96%+ | 96.15% ✅ |
| Repositories | 100% | 100% ✅ |
| Controllers | 100% | 100% ✅ |
| Modules | 0% | 0% ✅ (NestJS config) |

**Regla**: Si una capa crítica tiene <90%, agregar tests.

---

## Casos Edge

### Manejo de campos nullable/undefined

```typescript
describe('fromPersistence', () => {
  it('should handle optional fields as null', () => {
    const data = {
      id: '123',
      name: 'Test',
      email: 'test@example.com',
      status: 'active',
      role: 'member',
      phone: null,
      address: null,
      registrationDate: new Date(),
    };
    const member = Member.fromPersistence(data);
    expect(member.phone).toBeUndefined();
  });

  it('should handle optional fields as undefined', () => {
    const data = {
      id: '123',
      name: 'Test',
      email: 'test@example.com',
      status: 'active',
      role: 'member',
      registrationDate: new Date(),
    };
    const member = Member.fromPersistence(data);
    expect(member.phone).toBeUndefined();
  });
});
```

### Manejo de excepciones no-Error

```typescript
it('should handle non-Error exceptions in mapper', () => {
  expect(() => {
    try {
      throw 'String error';
    } catch (error) {
      throw new Error(
        `Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }).toThrow('Failed: String error');
});
```

### Validación de repositorios con métodos opcionales

```typescript
it('should handle repository without optional methods', async () => {
  const incompleteRepo = {
    findById: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    // Sin findByIdWithDeleted ni updateStatus
  } as unknown as jest.Mocked<MemberRepository>;
  
  const useCase = new DeleteMemberUseCase(incompleteRepo);
  // Test debe manejarlo correctamente
});
```

---

## Naming Conventions

### Archivos de test

```
{same-name-as-file}.spec.ts

Examples:
- email.value-object.spec.ts
- create-member.use-case.spec.ts
- typeorm-member.repository.spec.ts
- members.v2.controller.spec.ts
```

### Describe blocks

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // ...
    });
  });
});
```

### It statements

```typescript
it('should {expected behavior} when {condition}', () => {
  // ...
});

it('should return {expected} for {input}', () => {
  // ...
});

it('should throw error for {invalid input}', () => {
  // ...
});
```

**Ejemplos**:
- `should create Email with valid email format`
- `should throw error for invalid email format - missing @`
- `should return null when member not found`
- `should set default role to member when not provided`

---

## Best Practices

### 1. Antes de escribir tests

- ✅ Leer el código que se va a testear
- ✅ Identificar casos edge
- ✅ Definir mocks completos
- ✅ Pensar en el flujo happy path + errores

### 2. Durante desarrollo

- ✅ Escribir test que falle primero (RED)
- ✅ Implementar mínimo para pasar (GREEN)
- ✅ Refactor sin romper tests (REFACTOR)
- ✅ Ejecutar tests frecuentemente

### 3. Estructura de tests

- ✅ Usar AAA pattern siempre
- ✅ Un test = una cosa específica
- ✅ Nombres descriptivos y claros
- ✅ Agrupar tests relacionados con `describe`

### 4. Mocks y fixtures

- ✅ Mock completo de dependencias
- ✅ Fixtures reutilizables para datos
- ✅ Limpiar mocks en `beforeEach`
- ✅ Verificar llamadas con `toHaveBeenCalled`

### 5. Aserciones

- ✅ Aserciones específicas, no genéricas
- ✅ Verificar valores esperados
- ✅ Verificar llamadas a mocks
- ✅ Verificar tipos cuando aplica

### 6. Cobertura

- ✅ Ejecutar cobertura después de implementar
- ✅ Identificar líneas no cubiertas
- ✅ Agregar tests para casos faltantes
- ✅ No obsesionarse con 100% si no aporta valor

---

## Ejemplo Completo

### Test de Use Case completo

```typescript
import { UpdateMemberUseCase } from './update-member.use-case';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';

describe('UpdateMemberUseCase', () => {
  let useCase: UpdateMemberUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    useCase = new UpdateMemberUseCase(memberRepository);
  });

  it('should update member successfully', async () => {
    // ARRANGE
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const existingMember = Member.fromPersistence({
      id: memberId,
      name: 'Original Name',
      email: 'original@example.com',
      status: 'active',
      role: 'member',
      registrationDate: new Date(),
    });

    const updateDto = { memberId, name: 'Updated Name' };

    memberRepository.findById.mockResolvedValue(existingMember);
    memberRepository.save.mockResolvedValue(existingMember);

    // ACT
    const result = await useCase.execute(updateDto);

    // ASSERT
    expect(memberRepository.findById).toHaveBeenCalledWith(memberId);
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Updated Name');
  });

  it('should throw error when member not found', async () => {
    // ARRANGE
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const updateDto = { memberId, name: 'Updated Name' };
    memberRepository.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(useCase.execute(updateDto)).rejects.toThrow('Member not found');
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('should update multiple fields', async () => {
    // ARRANGE
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const existingMember = Member.fromPersistence({
      id: memberId,
      name: 'Original',
      email: 'original@example.com',
      status: 'active',
      role: 'member',
      registrationDate: new Date(),
    });

    const updateDto = {
      memberId,
      name: 'Updated Name',
      email: 'updated@example.com',
      address: 'Updated Address',
    };

    memberRepository.findById.mockResolvedValue(existingMember);
    memberRepository.save.mockResolvedValue(existingMember);

    // ACT
    const result = await useCase.execute(updateDto);

    // ASSERT
    expect(result.name).toBe('Updated Name');
    expect(result.email).toBe('updated@example.com');
    expect(result.address).toBe('Updated Address');
  });
});
```

---

## Checklist de Testing

Al implementar tests para un nuevo módulo, verificar:

- [ ] **AAA pattern**: Arrange-Act-Assert en todos los tests
- [ ] **Mocks completos**: Todos los métodos de dependencias mockeados
- [ ] **Casos edge**: Null, undefined, errores, valores límite
- [ ] **Cobertura**: ≥90% en capas críticas (ideal 100%)
- [ ] **Nombres**: Descriptivos y específicos
- [ ] **Describe blocks**: Tests agrupados por funcionalidad
- [ ] **beforeEach**: Setup limpio para cada test
- [ ] **Aserciones**: Específicas y verificables

---

## Error Recurrente: Unbound Methods en Tests

### Problema

ESLint reporta error `@typescript-eslint/unbound-method` al usar métodos de mocks directamente en assertions:

```typescript
// ❌ INCORRECTO - Genera error de linting
expect(stockRepository.findByType).toHaveBeenCalledWith('preferential');
expect(stockRepository.save).toHaveBeenCalledTimes(1);
```

**Error**: `Avoid referencing unbound methods which may cause unintentional scoping of 'this'`

### Solución: Usar Spies

Crear spies en `beforeEach` para evitar problemas de scoping. Esta es la solución **recomendada** y más limpia.

```typescript
describe('CreateStockUseCase', () => {
  let useCase: CreateStockUseCase;
  let stockRepository: jest.Mocked<StockRepository>;
  let findByTypeSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    stockRepository = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    // Create spies to avoid 'this' scoping issues
    findByTypeSpy = jest.spyOn(stockRepository, 'findByType');
    saveSpy = jest.spyOn(stockRepository, 'save');

    useCase = new CreateStockUseCase(stockRepository);
  });

  it('should create a stock successfully', async () => {
    // ARRANGE
    const createDto = { type: 'preferential', value: 100, monthlyContribution: 50 };
    stockRepository.findByType.mockResolvedValue(null);
    stockRepository.save.mockResolvedValue(Stock.create(createDto));

    // ACT
    const result = await useCase.execute(createDto);

    // ASSERT - Usar spies en lugar de métodos directos
    expect(findByTypeSpy).toHaveBeenCalledWith('preferential');
    expect(findByTypeSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.type).toBe('preferential');
  });
});
```

### Cuándo aplicar

- **Siempre** cuando uses `toHaveBeenCalledWith()`, `toHaveBeenCalledTimes()`, `not.toHaveBeenCalled()` con mocks
- **Crear spies** en `beforeEach` para cada método del mock que vayas a verificar
- **Usar los spies** en lugar de los métodos del mock directamente

### Ventajas de usar Spies

1. ✅ **No requiere deshabilitar ESLint**
2. ✅ **Más explícito** - deja claro qué métodos se están verificando
3. ✅ **Mejor legibilidad** - nombres de spies descriptivos (`findByTypeSpy`, `saveSpy`)
4. ✅ **Patrón consistente** - igual que en tests de controladores

### Alternativa (NO recomendada)

Si por alguna razón no puedes usar spies, puedes deshabilitar ESLint temporalmente, pero **no es la solución recomendada**:

```typescript
// ⚠️ NO RECOMENDADO - Solo si spies no son opción
// eslint-disable-next-line @typescript-eslint/unbound-method
expect(stockRepository.findByType).toHaveBeenCalledWith('preferential');
```

**Regla**: Siempre preferir spies sobre deshabilitar ESLint.

---

**Última actualización**: 2025-10-31  
**Referencia**: Members V2 (100% cobertura)  
**Próximos módulos**: Stocks, Loans, Meetings

