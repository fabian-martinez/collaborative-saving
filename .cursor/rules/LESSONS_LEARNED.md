# Lecciones Aprendidas - Collaborative Saving

> Este documento captura lecciones aprendidas durante el desarrollo del proyecto, especialmente durante la implementación de arquitectura hexagonal y módulos específicos.

## Formato de Entrada

Cada lección sigue este formato:

```markdown
## [YYYY-MM-DD] - [Título Descriptivo]

**Contexto**: [Qué se estaba haciendo]

**Problema/Desafío**: [Qué problema o desafío surgió]

**Solución**: [Cómo se resolvió]

**Resultado**: [Qué impacto tuvo]

**Aplicabilidad**: [Cuándo aplicar en el futuro]
```

---

## 2025-10-31 - Separación efectiva con Symbols en NestJS

**Contexto**: Implementación del módulo Members V2 con arquitectura hexagonal. Necesidad de invertir dependencias manteniendo compatibilidad con NestJS.

**Problema/Desafío**: Evitar acoplamiento directo entre Use Cases/Queries y la implementación concreta del repositorio.

**Solución**: 
- Uso de `Symbol('Repository')` como token de DI en lugar de clases/interfaces
- Patrón factory en módulos NestJS con `useFactory`
- Inyección del token Symbol en lugar de la clase concreta

```typescript
const MEMBER_REPOSITORY = Symbol('MemberRepository');

@Module({
  providers: [
    {
      provide: MEMBER_REPOSITORY,
      useClass: TypeOrmMemberRepository,
    },
    {
      provide: CreateMemberUseCase,
      useFactory: (repo: MemberRepository) => new CreateMemberUseCase(repo),
      inject: [MEMBER_REPOSITORY],
    },
  ],
})
```

**Resultado**: Separación limpia de capas sin conflictos de DI. Los Use Cases/Queries no conocen la implementación concreta del repositorio.

**Aplicabilidad**: Siempre que se implemente un módulo hexagonal en NestJS. Patter obligatorio para mantener inversión de dependencias.

---

## 2025-10-31 - Value Objects como barrera de validación

**Contexto**: Implementación de la entidad Member con campos como email, phone y status.

**Problema/Desafío**: Validación de emails y phone numbers dispersa en múltiples lugares. Formatos inconsistentes.

**Solución**: Crear Value Objects (Email, Phone, MemberStatus) que encapsulan validación en constructor:

```typescript
export class Email {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
  }
  
  static create(value: string): Email {
    return new Email(value);
  }
}
```

**Resultado**: Validación centralizada y consistente. Imposible crear instancias inválidas. Type-safety mejorado.

**Aplicabilidad**: Para cualquier campo que requiera validación estricta (emails, IDs, monedas, cantidades, estados válidos). Crear VO antes de persistir.

---

## 2025-10-31 - Factory methods en Domain Entities

**Contexto**: Necesidad de crear instancias de Member en diferentes contextos (desde HTTP, desde persistencia, en tests).

**Problema/Desafío**: Constructores complejos con múltiples parámetros. Manejo inconsistente de campos opcionales y valores por defecto.

**Solución**: Métodos factory estáticos:
- `Member.create()`: Para creación desde casos de uso (HTTP)
- `Member.fromPersistence()`: Para mapeo desde base de datos

```typescript
static create(data: { name: string; email: string; ... }): Member {
  const id = randomUUID();
  return new Member(id, data.name, Email.create(data.email), ...);
}

static fromPersistence(data: { id: string; ... }): Member {
  return new Member(data.id, data.name, Email.create(data.email), ...);
}
```

**Resultado**: Código más legible y fácil de testear. Encapsulación de lógica de creación. Valores por defecto centralizados.

**Aplicabilidad**: Para toda entidad de dominio. Patrón obligatorio para domain entities.

---

## 2025-10-31 - Mappers en tres niveles

**Contexto**: Conversión de datos entre capas: HTTP DTOs ↔ Application DTOs ↔ Domain Entities ↔ Persistence Entities.

**Problema/Desafío**: Conversiones manuales dispersas. Inconsistencias en manejo de campos nullable.

**Solución**: Mappers dedicados en `infrastructure/typeorm/mappers`:
- `toDomain()`: Persistence → Domain (con manejo de errores)
- `toPersistence()`: Domain → Persistence (con manejo de nulls)

```typescript
static toDomain(persistence: MemberEntity): Member {
  try {
    return Member.fromPersistence({ ... });
  } catch (error) {
    throw new Error(`Failed to map: ${error.message}`);
  }
}

static toPersistence(domain: Member): Partial<MemberEntity> {
  return {
    id: domain.id,
    email: domain.email,
    phone: domain.phone || null, // Explicit null conversion
  };
}
```

**Resultado**: Separación clara de responsabilidades. Manejo consistente de nullable/undefined. Errores más claros.

**Aplicabilidad**: Para todo módulo hexagonal. Mappers obligatorios en infrastructure layer.

---

## 2025-10-31 - Controller delgado con manejo de errores consistente

**Contexto**: Implementación de endpoints HTTP para Members V2.

**Problema/Desafío**: Cómo manejar errores de manera consistente entre diferentes endpoints. Conversión de errores de dominio a códigos HTTP.

**Solución**: Controller delgado que solo delega y maneja errores:

```typescript
async create(@Body() body: CreateMemberHttpDto): Promise<MemberResponseDto> {
  try {
    const result = await this.createMemberUseCase.execute(body);
    return result;
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    } else {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
```

**Resultado**: Endpoints consistente. Errores transformados apropiadamente. Código HTTP correcto.

**Aplicabilidad**: Para todos los controllers. Patrón obligatorio para manejo de errores.

---

## 2025-10-31 - Tests unitarios al 100% con AAA pattern

**Contexto**: Implementación de tests para Members V2 siguiendo TDD.

**Problema/Desafío**: Cómo estructurar tests para alcanzar 100% de cobertura y mantenerlos legibles.

**Solución**: Estructura AAA (Arrange-Act-Assert) consistente:

```typescript
it('should create a member successfully', async () => {
  // Arrange
  const dto = { name: 'Test', email: 'test@example.com' };
  const savedMember = Member.create(dto);
  memberRepository.save.mockResolvedValue(savedMember);
  
  // Act
  const result = await useCase.execute(dto);
  
  // Assert
  expect(memberRepository.save).toHaveBeenCalledTimes(1);
  expect(result.name).toBe('Test');
});
```

**Resultado**: 100% cobertura en Value Objects, Domain Entities, Use Cases, Queries, Repositories y Controllers. Tests legibles y mantenibles.

**Aplicabilidad**: Para todos los módulos. Objetivo mínimo: 90% cobertura, ideal 100%.

---

## 2025-10-31 - Mocking completo de dependencias

**Contexto**: Tests unitarios de Use Cases y Controllers que dependen de repositorios y otros services.

**Problema/Desafío**: Mocks incompletos causaban errores de runtime en tests.

**Solución**: Mocking explícito de todas las dependencias:

```typescript
memberRepository = {
  findById: jest.fn(),
  findActive: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  findByIdWithDeleted: jest.fn(), // Opcional pero probado
  updateStatus: jest.fn(), // Opcional pero probado
} as unknown as jest.Mocked<MemberRepository>;
```

**Resultado**: Tests robustos y predecibles. Identificación temprana de cambios en interfaces.

**Aplicabilidad**: Para todos los tests unitarios. Mocks completos incluyendo métodos opcionales.

---

## 2025-10-31 - Casos edge en Value Objects

**Contexto**: Testing de Value Objects con diferentes formatos de input.

**Problema/Desafío**: Validar todos los casos límite sin duplicar lógica de validación.

**Solución**: Tests exhaustivos de casos edge:

```typescript
describe('Email Value Object', () => {
  it('should throw error for invalid email format - missing @', () => {
    expect(() => new Email('testexample.com')).toThrow('Invalid email format');
  });
  
  it('should accept valid email with subdomain', () => {
    const email = new Email('test@mail.example.com');
    expect(email.value).toBe('test@mail.example.com');
  });
  
  it('should accept valid email with plus sign', () => {
    const email = new Email('test+tag@example.com');
    expect(email.value).toBe('test+tag@example.com');
  });
});
```

**Resultado**: 100% cobertura de branches en Value Objects. Validación robusta y predecible.

**Aplicabilidad**: Para todos los Value Objects. Testear casos válidos, inválidos y edge cases.

---

## 2025-10-31 - Soft delete con estrategia dual

**Contexto**: Implementación de borrado lógico de miembros.

**Problema/Desafío**: Diferenciar entre "no encontrado" y "borrado lógicamente".

**Solución**: Dos métodos en repositorio:
- `findById()`: Solo retorna activos (filtra `deletedAt IS NULL`)
- `findByIdWithDeleted()`: Incluye borrados para validación

```typescript
async findById(id: string): Promise<MemberDomain | null> {
  const m = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  if (!m) return null;
  return MemberMapper.toDomain(m);
}

async findByIdWithDeleted(id: string): Promise<MemberDomain | null> {
  const m = await this.repo.findOne({ where: { id }, withDeleted: true });
  if (!m || m.deletedAt) return null;
  return MemberMapper.toDomain(m);
}
```

**Resultado**: Borrado lógico funcional sin regresiones. Validación correcta de casos edge.

**Aplicabilidad**: Para entidades con soft delete. Ambos métodos necesarios para testing y validación.

---

## 2025-10-31 - Manejo de nullable en mappers

**Contexto**: Conversión de Domain a Persistence con campos opcionales/nullable.

**Problema/Desafío**: TypeORM usa `null` para nullable, TypeScript usa `undefined`.

**Solución**: Conversión explícita en mapper:

```typescript
static toPersistence(domain: Member): Partial<MemberEntity> {
  const result: Partial<MemberEntity> = { /* required fields */ };
  
  // Handle nullable fields - TypeORM uses null
  result.identificationNumber = domain.identificationNumber !== undefined
    ? domain.identificationNumber || null
    : null;
  
  return result;
}
```

**Resultado**: Persistencia correcta de campos opcionales. Sin inconsistencias entre Domain y DB.

**Aplicabilidad**: Para todos los mappers. Conversión explícita mandatory.

---

## 2025-10-31 - Separación de DTOs por capa

**Contexto**: DTOs para HTTP vs Application layer.

**Problema/Desafío**: Validaciones HTTP (class-validator) mezcladas con lógica de aplicación.

**Solución**: DTOs separados:
- HTTP DTOs en `infrastructure/nestjs/http/dto`: con decoradores `@IsEmail`, `@ApiProperty`
- Application DTOs en `application/dto`: sin decoradores, solo estructura

```typescript
// HTTP DTO (validation + Swagger)
export class CreateMemberHttpDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
}

// Application DTO (pure data)
export class CreateMemberDto {
  email: string;
}
```

**Resultado**: Separación de concerns. Application layer no depende de NestJS decorators.

**Aplicabilidad**: Para todos los módulos. DTOs separados por capa.

---

## 2025-10-31 - Cobertura de manejo de excepciones no-Error

**Contexto**: Tests de controllers y mappers que manejan errores.

**Problema/Desafío**: Casos donde se lanza string en lugar de Error().

**Solución**: Tests explícitos de manejo de excepciones no-Error:

```typescript
it('should handle non-Error exceptions', async () => {
  createMemberUseCaseExecuteSpy.mockRejectedValue('String error');
  
  await expect(controller.create(mockBody)).rejects.toThrow(
    expect.objectContaining({ message: 'String error' })
  );
});
```

**Resultado**: 100% cobertura incluyendo casos edge. Manejo robusto de errores.

**Aplicabilidad**: Para tests de controllers y mappers. Cubrir ambos tipos de excepciones.

---

## 2025-10-31 - Validación con ValidationPipe en endpoints

**Contexto**: Endpoints POST/PATCH requieren validación de input.

**Problema/Desafío**: Validar y filtrar datos de entrada correctamente.

**Solución**: `ValidationPipe` con configuración específica:

```typescript
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
async create(@Body() body: CreateMemberHttpDto): Promise<MemberResponseDto> {
  // body solo contiene campos whitelisted
}
```

**Resultado**: Validación automática y filtrado de campos no permitidos.

**Aplicabilidad**: Para todos los endpoints POST/PATCH/PUT. Obligatorio.

---

## Guía de Uso para Agentes AI

### Al capturar nuevas lecciones

1. **Agregar entrada**: Seguir el formato establecido
2. **Timestamp**: Incluir fecha de descubrimiento
3. **Clasificar**: Por categoría (Arquitectura, Testing, Implementación)
4. **Incluir código**: Ejemplos concretos siempre
5. **Especificar aplicabilidad**: Cuándo usar la lección

### Al validar decisiones

1. **Consultar antes**: Revisar lecciones relevantes
2. **Verificar patrones**: Usar soluciones probadas
3. **Evitar anti-patterns**: Referenciar COMMON_PITFALLS.md
4. **Actualizar**: Si se descubre mejor solución

### Al implementar nuevo módulo

1. **Revisar TODAS** las lecciones
2. **Aplicar patrones**: Value Objects, Factory Methods, Mappers, etc.
3. **Validar estructura**: Usar ARCHITECTURE_PATTERNS.md
4. **Testing completo**: Usar TESTING_PATTERNS.md

---

**Última actualización**: 2025-10-31  
**Módulos base documentados**: Members V2  
**Próximos módulos**: Stocks, Loans, Meetings, Accounting

