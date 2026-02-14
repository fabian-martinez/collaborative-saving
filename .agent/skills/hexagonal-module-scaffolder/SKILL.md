---
name: Hexagonal Module Scaffolder
description: Generates complete hexagonal architecture module scaffolding for NestJS backend, including domain entities, ports, use cases, DTOs, mappers, repositories, controllers, and modules with Symbol-based DI.
---

# Hexagonal Module Scaffolder

## When to Use

Invoke this skill when the user requests:
- "Create a new module for X"
- "Scaffold a hexagonal module"
- "Add a new feature to the backend"
- "Generate boilerplate for X entity"

## Context

This project follows **strict hexagonal architecture** with unidirectional dependencies:

```
Infrastructure → Application → Domain
```

**CRITICAL**: Domain layer NEVER imports from Application or Infrastructure.

## Pre-Requisites

Before generating files, you MUST:

1. **Read documentation**:
   - `.cursor/rules/LESSONS_LEARNED.md` — Past lessons and patterns
   - `.cursor/rules/COMMON_PITFALLS.md` — Known anti-patterns to avoid
   - `.cursor/rules/ARCHITECTURE_PATTERNS.md` — Expected structure

2. **Gather requirements** from the user:
   - **Module name** (singular, e.g., `Stock`, `Loan`, `Member`)
   - **Domain context** (plural, e.g., `stocks`, `loans`, `members`)
   - **Key properties** with types (e.g., `name: string`, `amount: number`, `status: StockStatus`)
   - **Accounting operations?** (if yes, integrate `RecordOperationUseCase`)

## Files to Generate

Given module name `{Name}` (PascalCase) and context `{context}` (lowercase plural):

### 1. Domain Entity
**Path**: `backend/src/domain/entities/{name}.entity.ts`

**Template**:
```typescript
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export class {Name} {
  constructor(
    public readonly id: string,
    private _{prop1}: {Type1},
    private _{prop2}: {Type2},
  ) {}

  static create(data: { {prop1}: {Type1}; {prop2}: {Type2} }): {Name} {
    const id = randomUUID();
    const instance = new {Name}(id, data.{prop1}, data.{prop2});
    instance.validateInvariants();
    return instance;
  }

  static fromPersistence(data: { id: string; {prop1}: {Type1}; {prop2}: {Type2} }): {Name} {
    return new {Name}(data.id, data.{prop1}, data.{prop2});
  }

  update(data: Partial<{ {prop1}: {Type1}; {prop2}: {Type2} }>): void {
    if (data.{prop1} !== undefined) this._{prop1} = data.{prop1};
    if (data.{prop2} !== undefined) this._{prop2} = data.{prop2};
    this.validateInvariants();
  }

  validateInvariants(): void {
    // Add domain validation rules here
    // Example: if (!this._{prop1}) throw new Error('...');
  }

  get {prop1}(): {Type1} { return this._{prop1}; }
  get {prop2}(): {Type2} { return this._{prop2}; }
}
```

### 2. Repository Port (Interface)
**Path**: `backend/src/domain/ports/repositories/{name}-repository.port.ts`

**Template**:
```typescript
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { {Name} } from '../../entities/{name}.entity';

export interface {Name}Repository {
  findById(id: string): Promise<{Name} | null>;
  findAll(): Promise<{Name}[]>;
  save({name}: {Name}): Promise<{Name}>;
  softDelete(id: string): Promise<void>;
}
```

### 3. Application DTOs
**Path**: `backend/src/application/dto/{context}/create-{name}.dto.ts`

**Template**:
```typescript
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

/**
 * Create {Name} DTO
 * 
 * Application layer input DTO for creating a new {name}.
 * Uses camelCase (no decorators, no snake_case).
 */
export interface Create{Name}Dto {
  {prop1}: {Type1};
  {prop2}: {Type2};
}
```

**Path**: `backend/src/application/dto/{context}/{name}-response.dto.ts`

**Template**:
```typescript
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export interface {Name}ResponseDto {
  id: string;
  {prop1}: {Type1};
  {prop2}: {Type2};
}
```

### 4. Use Case
**Path**: `backend/src/application/use-cases/{context}/create-{name}.use-case.ts`

**Template**:
```typescript
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

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
    return {
      id: {name}.id,
      {prop1}: {name}.{prop1},
      {prop2}: {name}.{prop2},
    };
  }
}
```

### 5. TypeORM Mapper
**Path**: `backend/src/infrastructure/typeorm/mappers/{name}.mapper.ts`

**Key requirements**:
- `toDomain()` with try-catch and descriptive error messages
- `toPersistence()` with explicit `undefined → null` conversion for nullable fields
- Handle all edge cases (null, undefined, invalid data)

### 6. TypeORM Repository Implementation
**Path**: `backend/src/infrastructure/typeorm/repositories/typeorm-{name}.repository.ts`

**Key requirements**:
- Implements `{Name}Repository` port
- Uses `{Name}Mapper` for all conversions
- **ALWAYS** filter `deletedAt: IsNull()` in find queries
- Verify `affected` count in `softDelete()`

### 7. HTTP DTO (snake_case)
**Path**: `backend/src/infrastructure/nestjs/http/dto/create-{name}-http.dto.ts`

**Template**:
```typescript
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class Create{Name}HttpDto {
  @ApiProperty({ description: 'Description of {prop1}' })
  @IsString()
  {prop1_snake_case}: string;

  @ApiProperty({ description: 'Description of {prop2}' })
  @IsNumber()
  {prop2_snake_case}: number;
}
```

**CRITICAL**: All HTTP DTO properties MUST use `snake_case`.

### 8. Controller
**Path**: `backend/src/infrastructure/nestjs/http/controllers/{name}s.v2.controller.ts`

**Requirements**:
- `@ApiTags('{Name}s V2')`
- `@Controller('v2/{context}')`
- Thin controller: only delegate to Use Cases/Queries
- Try-catch with `instanceof Error` check
- `@UsePipes(new ValidationPipe({ whitelist: true }))` on POST/PATCH/PUT

### 9. NestJS Module (Symbol-based DI)
**Path**: `backend/src/infrastructure/nestjs/http/modules/{context}-v2.module.ts`

**Template**:
```typescript
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { {Name}Entity } from '@infrastructure/typeorm/entities/{name}.entity';
import { TypeOrm{Name}Repository } from '@infrastructure/typeorm/repositories/typeorm-{name}.repository';
import { Create{Name}UseCase } from '@application/use-cases/{context}/create-{name}.use-case';
import { {Name}sV2Controller } from '../controllers/{name}s.v2.controller';
import { {Name}Repository } from '@domain/ports/repositories/{name}-repository.port';

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

## Critical Rules

1. **Copyright header**: Apply to ALL new `.ts` files using `license-header` skill
2. **No `any` type**: Use proper TypeScript types
3. **No legacy imports**: Never import from `src/{feature}/` in domain/application
4. **Swagger**: All endpoints need `@ApiTags`, `@ApiOperation`, `@ApiResponse`
5. **Accounting operations**: If module involves money, use `accounting-operation-builder` skill

## After Generation

1. Register module in `backend/src/app.module.ts`
2. Create E2E test in `backend/test/{context}/{context}.e2e-spec.ts`
3. Run `/run-tests` workflow to verify
