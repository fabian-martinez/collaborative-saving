# Architecture Rules

## Hexagonal Architecture

The project follows strict hexagonal architecture. Dependencies ALWAYS point inward:

```
Infrastructure → Application → Domain
```

**CRITICAL**: Domain NEVER imports from Application or Infrastructure.

## Layer Responsibilities

- **Domain**: Entities, Value Objects, Domain Services, Ports (interfaces). Pure business logic, no framework dependencies.
- **Application**: Use Cases (commands), Query Handlers (reads), DTOs. Orchestrates business logic via ports.
- **Infrastructure**: TypeORM repositories, NestJS controllers/modules, mappers. Implements ports.

## Directory Structure

```
backend/src/
├── domain/entities/              # Domain entities (create, fromPersistence)
├── domain/value-objects/         # VOs with validation in constructor
├── domain/ports/repositories/    # Repository interfaces
├── domain/ports/services/        # Service interfaces
├── application/use-cases/{ctx}/  # verb-noun.use-case.ts
├── application/queries/{ctx}/    # get-{noun}.query-handler.ts
├── application/dto/{ctx}/        # Application DTOs (camelCase, no decorators)
├── infrastructure/typeorm/       # Entities, Repositories, Mappers
└── infrastructure/nestjs/http/   # Controllers, HTTP DTOs, Modules
```

## Dependency Injection

Use `Symbol()` tokens in NestJS modules for DI inversion:

```typescript
const REPO_SYMBOL = Symbol('XxxRepository');
@Module({
  providers: [
    { provide: REPO_SYMBOL, useClass: TypeOrmXxxRepository },
    {
      provide: CreateXxxUseCase,
      useFactory: (repo: XxxRepository) => new CreateXxxUseCase(repo),
      inject: [REPO_SYMBOL],
    },
  ],
})
```

## DTOs Convention

- **HTTP DTOs**: `snake_case` properties + `class-validator` + Swagger decorators
- **Application DTOs**: `camelCase` properties, no decorators
- **HTTP Mappers**: Convert between `snake_case` ↔ `camelCase`

## Accounting Operations

**MANDATORY**: All accounting operations MUST use `RecordOperationUseCase.execute()`.
**NEVER** create operations or ledger entries directly with TypeORM.

## Legacy Code

- Never import from legacy `src/{feature}/` directories in `domain/` or `application/`
- Legacy TypeORM entities can only be imported in `infrastructure/typeorm/{mappers,repositories}` and NestJS modules for `TypeOrmModule.forFeature()`

## Swagger

All new endpoints MUST have Swagger documentation: `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty` on DTOs.
