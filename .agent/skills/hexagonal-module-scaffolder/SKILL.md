---
name: Hexagonal Module Scaffolder
description: Generates complete hexagonal architecture module scaffolding for NestJS backend, including domain entities, ports, use cases, DTOs, mappers, repositories, controllers, and modules with Symbol-based DI.
---

# Hexagonal Module Scaffolder

Use this skill when the user asks to "create a new module", "scaffold a hexagonal module", or "add a new feature" to the backend.

## Context

The project follows a strict hexagonal architecture pattern documented in `.cursor/rules/ARCHITECTURE_PATTERNS.md`. The dependency rule is:

```
Infrastructure → Application → Domain
```

Domain NEVER imports from Application or Infrastructure.

## Pre-Requisites

Before generating files, the agent MUST:
1. Read `.cursor/rules/LESSONS_LEARNED.md` for relevant past lessons
2. Read `.cursor/rules/COMMON_PITFALLS.md` for known anti-patterns
3. Ask the user for:
   - **Module name** (e.g., `stock`, `loan`, `member`)
   - **Domain context** (e.g., `stocks`, `loans`, `members`)
   - **Key properties** (e.g., `name: string`, `amount: number`)
   - **Whether it needs accounting operations** (if yes, integrate `RecordOperationUseCase`)

## Files to Generate

Given a module name `{Name}` (PascalCase) and context `{context}` (lowercase plural):

### 1. Domain Entity
**Path:** `backend/src/domain/entities/{name}.entity.ts`

```typescript
export class {Name} {
  constructor(
    public readonly id: string,
    private _{prop1}: {Type1},
    // ... other properties with _ prefix
  ) {}

  static create(data: { {prop1}: {Type1}; ... }): {Name} {
    const id = randomUUID();
    return new {Name}(id, data.{prop1}, ...);
  }

  static fromPersistence(data: { id: string; {prop1}: {Type1}; ... }): {Name} {
    return new {Name}(data.id, data.{prop1}, ...);
  }

  update(data: Partial<{ {prop1}: {Type1}; ... }>): void {
    if (data.{prop1} !== undefined) this._{prop1} = data.{prop1};
  }

  validateInvariants(): void {
    // Add domain validation rules here
  }

  get {prop1}(): {Type1} { return this._{prop1}; }
}
```

### 2. Repository Port
**Path:** `backend/src/domain/ports/repositories/{name}-repository.port.ts`

```typescript
import { {Name} } from '../../entities/{name}.entity';

export interface {Name}Repository {
  findById(id: string): Promise<{Name} | null>;
  findAll(): Promise<{Name}[]>;
  save({name}: {Name}): Promise<{Name}>;
  softDelete(id: string): Promise<void>;
}
```

### 3. Application DTOs
**Path:** `backend/src/application/dto/{context}/create-{name}.dto.ts`

```typescript
/**
 * Create {Name} DTO
 *
 * Input DTO for creating a new {name}.
 */
export interface Create{Name}Dto {
  {prop1}: {Type1};
  // camelCase, no decorators
}
```

**Path:** `backend/src/application/dto/{context}/{name}-response.dto.ts`

```typescript
export interface {Name}ResponseDto {
  id: string;
  {prop1}: {Type1};
}
```

### 4. Use Case
**Path:** `backend/src/application/use-cases/{context}/create-{name}.use-case.ts`

```typescript
import { {Name} } from '@domain/entities/{name}.entity';
import { {Name}Repository } from '@domain/ports/repositories/{name}-repository.port';
import { Create{Name}Dto } from '@application/dto/{context}/create-{name}.dto';
import { {Name}ResponseDto } from '@application/dto/{context}/{name}-response.dto';

export class Create{Name}UseCase {
  constructor(private readonly {name}Repository: {Name}Repository) {}

  async execute(dto: Create{Name}Dto): Promise<{Name}ResponseDto> {
    const {name} = {Name}.create(dto);
    const saved = await this.{name}Repository.save({name});
    return this.toDto(saved);
  }

  private toDto({name}: {Name}): {Name}ResponseDto {
    return { id: {name}.id, {prop1}: {name}.{prop1} };
  }
}
```

### 5. Mapper
**Path:** `backend/src/infrastructure/typeorm/mappers/{name}.mapper.ts`

- `toDomain()` with try-catch
- `toPersistence()` with explicit null conversion for nullable fields

### 6. Repository Implementation
**Path:** `backend/src/infrastructure/typeorm/repositories/typeorm-{name}.repository.ts`

- Implements `{Name}Repository` port
- Uses `MemberMapper` for conversions
- Filters `deletedAt: IsNull()` in all find queries
- Verifies `affected` count in soft delete

### 7. HTTP DTO (snake_case)
**Path:** `backend/src/infrastructure/nestjs/http/dto/create-{name}-http.dto.ts`

- Uses `class-validator` decorators
- Uses `@ApiProperty()` / `@ApiPropertyOptional()`
- All property names in **snake_case**

### 8. Controller
**Path:** `backend/src/infrastructure/nestjs/http/controllers/{name}s.v2.controller.ts`

- `@ApiTags('{Name}s V2')`
- `@Controller('v2/{context}')`
- Thin controller: only delegates to Use Cases/Queries
- Try-catch with `instanceof Error` check
- `@UsePipes(new ValidationPipe({ whitelist: true }))` on POST/PATCH

### 9. NestJS Module (Symbol DI)
**Path:** `backend/src/infrastructure/nestjs/http/modules/{context}-v2.module.ts`

```typescript
const {NAME}_REPOSITORY = Symbol('{Name}Repository');

@Module({
  imports: [TypeOrmModule.forFeature([{Name}Entity])],
  controllers: [{Name}sV2Controller],
  providers: [
    { provide: {NAME}_REPOSITORY, useClass: TypeOrm{Name}Repository },
    {
      provide: Create{Name}UseCase,
      useFactory: (repo: {Name}Repository) => new Create{Name}UseCase(repo),
      inject: [{NAME}_REPOSITORY],
    },
    TypeOrm{Name}Repository,
  ],
})
export class {Name}sV2Module {}
```

## Important Rules

1. **License Header**: Apply the copyright header from `license-header` skill to all new files.
2. **No `any`**: Never use `any` type.
3. **No legacy imports**: Never import from `src/{feature}/` directories in domain or application layers.
4. **Swagger**: All endpoints must have Swagger decorators.
