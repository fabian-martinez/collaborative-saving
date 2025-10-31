# Patrones Arquitectónicos - Collaborative Saving

> Este documento define los patrones arquitectónicos aplicados en el proyecto, basados en arquitectura hexagonal y las lecciones aprendidas de Members V2.

## Índice

1. [Estructura de Capas](#estructura-de-capas)
2. [Inversión de Dependencias](#inversión-de-dependencias)
3. [Separation of Concerns](#separation-of-concerns)
4. [Value Objects](#value-objects)
5. [Domain Entities](#domain-entities)
6. [Use Cases](#use-cases)
7. [Repositories](#repositories)
8. [Mappers](#mappers)
9. [Controllers HTTP](#controllers-http)
10. [DTOs por Capa](#dtos-por-capa)

---

## Estructura de Capas

### Regla de dependencias

```
Infrastructure → Application → Domain
```

**CRÍTICO**: Las dependencias siempre apuntan hacia adentro. El domain NO puede importar de application ni infrastructure.

### Estructura de directorios

```
src/
├── domain/                      # Capa de dominio (pura)
│   ├── entities/                # Entidades de dominio
│   ├── value-objects/           # Value Objects
│   ├── services/                # Domain Services
│   ├── events/                  # Domain Events
│   └── ports/                   # Interfaces (Puertos)
│       ├── repositories/        # Interfaces de repositorios
│       └── services/            # Interfaces de servicios transversales
│
├── application/                 # Capa de aplicación
│   ├── use-cases/               # Casos de uso organizados por dominio
│   │   └── {domain}/
│   │       ├── verb-noun.use-case.ts
│   │       └── verb-noun.use-case.spec.ts
│   ├── queries/                 # Query handlers (CQRS ligero)
│   │   └── {domain}/
│   │       ├── get-{noun}.query-handler.ts
│   │       └── get-{noun}.query-handler.spec.ts
│   └── dto/                     # DTOs de aplicación
│       └── {domain}/
│           ├── {noun}-response.dto.ts
│           └── create-{noun}.dto.ts
│
└── infrastructure/              # Capa de infraestructura
    ├── typeorm/                 # Adaptador TypeORM
    │   ├── entities/            # Entities de TypeORM (legacy, migrar)
    │   ├── repositories/        # Implementaciones de repositorios
    │   └── mappers/             # Mappers Domain ↔ Persistence
    │
    ├── nestjs/                  # Adaptador NestJS
    │   ├── http/
    │   │   ├── controllers/     # Controladores HTTP
    │   │   ├── dto/             # DTOs HTTP (con validaciones)
    │   │   ├── modules/         # Módulos de NestJS
    │   │   └── mappers/         # Mappers HTTP ↔ Application
    │   │
    │   └── mappers/             # Mappers NestJS
    │
    ├── in-memory/               # Adaptador en memoria (tests)
    │   └── repositories/
    │
    └── services/                # Servicios transversales
        ├── event-bus/
        └── transaction-manager/
```

### Reglas por capa

#### Domain Layer

```typescript
// ✅ CORRECTO - Domain no depende de nada externo
// domain/entities/member.entity.ts
import { Email } from '../value-objects/email.value-object';
import { Phone } from '../value-objects/phone.value-object';

export class Member {
  private _email: Email;  // Usa Value Objects
}

// ❌ INCORRECTO - Domain importando de infrastructure
import { MemberEntity } from '../../infrastructure/typeorm/entities/member.entity';
```

#### Application Layer

```typescript
// ✅ CORRECTO - Application solo importa de Domain (ports)
// application/use-cases/members/create-member.use-case.ts
import { Member } from '@domain/entities/member.entity';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';

export class CreateMemberUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}
}

// ❌ INCORRECTO - Application importando de Infrastructure
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';
```

#### Infrastructure Layer

```typescript
// ✅ CORRECTO - Infrastructure implementa interfaces de Domain
// infrastructure/typeorm/repositories/typeorm-member.repository.ts
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';

export class TypeOrmMemberRepository implements MemberRepository {
  // Implementación
}
```

---

## Inversión de Dependencias

### Patrón con Symbols en NestJS

**Problema**: NestJS usa tokens de clase por defecto, causando acoplamiento.

**Solución**: Usar `Symbol` como token de DI:

```typescript
// infrastructure/nestjs/http/modules/members-v2.module.ts
const MEMBER_REPOSITORY = Symbol('MemberRepository');

@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity])],
  controllers: [MembersV2Controller],
  providers: [
    // 1. Registrar implementación con Symbol
    {
      provide: MEMBER_REPOSITORY,
      useClass: TypeOrmMemberRepository,
    },
    // 2. Factory pattern para Use Cases
    {
      provide: CreateMemberUseCase,
      useFactory: (repo: MemberRepository) => new CreateMemberUseCase(repo),
      inject: [MEMBER_REPOSITORY],
    },
    // 3. También registrar la clase (para TypeORM)
    TypeOrmMemberRepository,
  ],
})
export class MembersV2Module {}
```

**Por qué funciona**:
- ✅ Use Cases/Queries no conocen `TypeOrmMemberRepository`
- ✅ Cambiar implementación solo requiere cambiar `useClass`
- ✅ Tests pueden inyectar mocks fácilmente

### Estructura de módulo completa

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [XxxV2Controller],
  providers: [
    // 1. Repository con Symbol
    { provide: REPO_SYMBOL, useClass: TypeOrmXxxRepository },
    
    // 2. Query Handlers
    {
      provide: GetXxxQueryHandler,
      useFactory: (repo: XxxRepository) => new GetXxxQueryHandler(repo),
      inject: [REPO_SYMBOL],
    },
    
    // 3. Use Cases
    {
      provide: CreateXxxUseCase,
      useFactory: (repo: XxxRepository) => new CreateXxxUseCase(repo),
      inject: [REPO_SYMBOL],
    },
    
    // 4. Clase concreta (para tests E2E si aplica)
    TypeOrmXxxRepository,
  ],
})
export class XxxV2Module {}
```

---

## Separation of Concerns

### Controller delgado

**Responsabilidad**: Solo delegar a Use Cases/Queries y manejar HTTP.

```typescript
@Controller('v2/members')
export class MembersV2Controller {
  constructor(
    private readonly getMembersQuery: GetMembersQueryHandler,
    private readonly createMemberUseCase: CreateMemberUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateMemberHttpDto): Promise<MemberResponseDto> {
    return await this.createMemberUseCase.execute(body);
  }
}
```

**NO hace**:
- ❌ Validación de negocio
- ❌ Transformación de datos compleja
- ❌ Lógica de aplicación

### Use Case enfocado

**Responsabilidad**: Orquestar lógica de aplicación.

```typescript
export class CreateMemberUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(dto: CreateMemberDto): Promise<MemberResponseDto> {
    // 1. Crear entidad de dominio
    const member = Member.create(dto);
    
    // 2. Persistir
    const saved = await this.memberRepository.save(member);
    
    // 3. Retornar DTO
    return { id: saved.id, name: saved.name, ... };
  }
}
```

### Repository simple

**Responsabilidad**: Solo acceso a datos.

```typescript
export class TypeOrmMemberRepository implements MemberRepository {
  async findById(id: string): Promise<Member | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? MemberMapper.toDomain(entity) : null;
  }
}
```

---

## Value Objects

### Estructura estándar

```typescript
// domain/value-objects/email.value-object.ts
export class Email {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
  }

  static create(value: string): Email {
    return new Email(value);
  }

  private isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
```

### Reglas

1. **Inmutabilidad**: `readonly` property
2. **Validación en constructor**: Imposible crear instancia inválida
3. **Factory method**: `static create()` para consistencia
4. **Validación privada**: Lógica encapsulada

### Casos de uso

```typescript
// ✅ CORRECTO - Usar VO en entidad
export class Member {
  private _email: Email;
  
  get email(): string {
    return this._email.value;  // Retorna string para compatibilidad
  }
}

// ❌ INCORRECTO - String sin validar
email: string;
```

---

## Domain Entities

### Estructura estándar

```typescript
// domain/entities/member.entity.ts
export class Member {
  constructor(
    public readonly id: string,
    private _name: string,
    private _email: Email,
    private _status: MemberStatus,
    // ...
  ) {}

  // Factory methods
  static create(data: { name: string; email: string; ... }): Member {
    const id = randomUUID();
    return new Member(id, data.name, Email.create(data.email), ...);
  }

  static fromPersistence(data: { id: string; ... }): Member {
    return new Member(data.id, data.name, Email.create(data.email), ...);
  }

  // Mutaciones
  update(data: { name?: string; email?: string }): void {
    if (data.name) this._name = data.name;
    if (data.email) this._email = Email.create(data.email);
  }

  // Getters
  get name(): string {
    return this._name;
  }
}
```

### Reglas

1. **ID inmutable**: `readonly id`
2. **State privado**: Props privadas con `_` prefix
3. **Getters públicos**: Acceso controlado
4. **Factory methods**: `create()` y `fromPersistence()`
5. **Encapsulación**: Mutación solo vía métodos

---

## Use Cases

### Naming convention

```
verb-noun.use-case.ts

Examples:
- create-member.use-case.ts
- update-member.use-case.ts
- delete-member.use-case.ts
- approve-loan.use-case.ts
```

### Estructura estándar

```typescript
// application/use-cases/members/create-member.use-case.ts
import { Member } from '@domain/entities/member.entity';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { CreateMemberDto } from '@application/dto/members/create-member.dto';
import { MemberResponseDto } from '@application/dto/members/member-response.dto';

export class CreateMemberUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(dto: CreateMemberDto): Promise<MemberResponseDto> {
    // 1. Crear entidad
    const member = Member.create(dto);
    
    // 2. Persistir
    const saved = await this.memberRepository.save(member);
    
    // 3. Retornar DTO
    return this.toDto(saved);
  }

  private toDto(member: Member): MemberResponseDto {
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      // ...
    };
  }
}
```

### Reglas

1. **Una responsabilidad**: Un use case = una operación de negocio
2. **Depender de ports**: Usar interfaces, no implementaciones
3. **Retornar DTOs**: Nunca retornar entities de dominio
4. **Tratar efectos**: Async/await para operaciones asíncronas

---

## Repositories

### Puerto (Domain)

```typescript
// domain/ports/repositories/member-repository.port.ts
export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
  findActive(): Promise<Member[]>;
  save(member: Member): Promise<Member>;
  softDelete(id: string): Promise<void>;
}
```

### Implementación (Infrastructure)

```typescript
// infrastructure/typeorm/repositories/typeorm-member.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberRepository as MemberRepositoryPort } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';
import { Member as MemberEntity } from '../../../members/entities/member.entity';
import { MemberMapper } from '../mappers/member.mapper';

@Injectable()
export class TypeOrmMemberRepository implements MemberRepositoryPort {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly repo: Repository<MemberEntity>,
  ) {}

  async findById(id: string): Promise<Member | null> {
    const entity = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async save(member: Member): Promise<Member> {
    const persistence = MemberMapper.toPersistence(member);
    const saved = await this.repo.save(persistence as MemberEntity);
    return MemberMapper.toDomain(saved);
  }
}
```

### Reglas

1. **Implementar interface**: `implements MemberRepository`
2. **Usar mapper**: Siempre `toDomain` / `toPersistence`
3. **No exponer entities**: Retornar `Member` (domain), no `MemberEntity`
4. **Manejar soft delete**: Filtrar `deletedAt IS NULL` en queries

---

## Mappers

### Ubicación

```
infrastructure/typeorm/mappers/
├── member.mapper.ts
└── member.mapper.spec.ts
```

### Estructura estándar

```typescript
// infrastructure/typeorm/mappers/member.mapper.ts
import { Member } from '@domain/entities/member.entity';
import { Member as MemberEntity } from '../../../members/entities/member.entity';

export class MemberMapper {
  static toDomain(persistence: MemberEntity): Member {
    try {
      return Member.fromPersistence({
        id: persistence.id,
        name: persistence.name,
        email: persistence.email,
        // ...
      });
    } catch (error) {
      throw new Error(
        `Failed to map Member to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(domain: Member): Partial<MemberEntity> {
    const result: Partial<MemberEntity> = {
      id: domain.id,
      name: domain.name,
      email: domain.email,
      // ...
    };

    // Handle nullable fields - TypeORM uses null
    result.phone = domain.phone !== undefined ? domain.phone || null : null;
    result.address = domain.address !== undefined ? domain.address || null : null;

    return result;
  }
}
```

### Reglas

1. **Métodos estáticos**: No instanciar mapper
2. **Try-catch**: Manejar errores de validación
3. **Nullable explícito**: Convertir `undefined` a `null` para TypeORM
4. **Retornar Partial**: En `toPersistence` para updates parciales

---

## Controllers HTTP

### Estructura estándar

```typescript
// infrastructure/nestjs/http/controllers/members.v2.controller.ts
import { Controller, Get, Post, ... } from '@nestjs/common';
import { ApiTags, ApiOperation, ... } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

@ApiTags('Members V2')
@Controller('v2/members')
export class MembersV2Controller {
  constructor(
    private readonly getMembersQuery: GetMembersQueryHandler,
    private readonly createMemberUseCase: CreateMemberUseCase,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() body: CreateMemberHttpDto): Promise<MemberResponseDto> {
    try {
      return await this.createMemberUseCase.execute(body);
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
```

### Manejo de errores consistente

```typescript
async endpoint(@Body() body: Dto): Promise<ResponseDto> {
  try {
    return await this.useCase.execute(body);
  } catch (e: unknown) {
    if (e instanceof Error) {
      // Error conocido de dominio
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    } else {
      // Error inesperado (string, etc)
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
```

### Reglas

1. **Solo delegar**: No lógica de negocio
2. **ValidationPipe**: En POST/PATCH/PUT
3. **Swagger decorators**: `@ApiTags`, `@ApiOperation`, etc.
4. **Manejo de errores**: Try-catch con `instanceof Error`
5. **Códigos HTTP**: Apropiados para cada caso

---

## DTOs por Capa

### Separación de DTOs

#### HTTP DTOs (Infrastructure)

```typescript
// infrastructure/nestjs/http/dto/create-member-http.dto.ts
import { IsOptional, IsEmail, IsString, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberHttpDto {
  @ApiProperty({ description: "The member's full name" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: "The member's email address" })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: ['member', 'admin', 'treasurer'] })
  @IsOptional()
  @IsIn(['member', 'admin', 'treasurer'])
  role?: 'member' | 'admin' | 'treasurer';
}
```

#### Application DTOs

```typescript
// application/dto/members/create-member.dto.ts
export class CreateMemberDto {
  name: string;
  email: string;
  role?: 'member' | 'admin' | 'treasurer';
  // Sin decoradores
}
```

### Reglas

1. **HTTP DTOs**: Con `class-validator` y Swagger decorators
2. **Application DTOs**: Solo estructura, sin decoradores
3. **Response DTOs**: Separados, nombrados con `*ResponseDto`
4. **No duplicar**: Application DTOs son minimales

---

## Checklist de Validación

Al implementar un nuevo módulo hexagonal, verificar:

- [ ] **Estructura de carpetas**: Domain / Application / Infrastructure
- [ ] **Dependencias**: No circular, Domain limpio
- [ ] **Symbols DI**: Tokens con Symbol en módulos NestJS
- [ ] **Value Objects**: Para campos con validación
- [ ] **Factory methods**: `create()` y `fromPersistence()` en entities
- [ ] **Mappers**: `toDomain()` y `toPersistence()`
- [ ] **Controllers**: Delgados, con manejo de errores
- [ ] **DTOs**: Separados por capa
- [ ] **Repositories**: Implementan interfaces de Domain
- [ ] **Use Cases**: Retornan DTOs, no entities

---

**Última actualización**: 2025-10-31  
**Patrones base**: Members V2  
**Próximos módulos**: Stocks, Loans, Meetings

