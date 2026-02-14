# Coding Standards

## Naming Conventions

- **Classes/Interfaces**: PascalCase (e.g., `Member`, `CreateMemberUseCase`)
- **Variables/Functions**: camelCase (e.g., `memberId`, `findById`)
- **Files**: kebab-case (e.g., `create-member.use-case.ts`, `member-response.dto.ts`)
- **Enums**: PascalCase
- **DTOs**: `*Dto` / `*ResponseDto`
- **Use Cases**: `verb-noun.use-case.ts`
- **Repositories (ports)**: `XRepository`
- **Repositories (impl)**: `TypeOrmXRepository`
- **No `I` prefix** for interfaces

## Domain Entities

- ID is `readonly`
- State is private with `_` prefix
- Getters for public access
- Factory methods: `static create()` and `static fromPersistence()`
- Mutation only via methods (e.g., `update()`, `validateInvariants()`)

**Example**:
```typescript
export class Member {
  constructor(
    public readonly id: string,
    private _name: string,
  ) {}

  static create(data: { name: string }): Member {
    const instance = new Member(randomUUID(), data.name);
    instance.validateInvariants();
    return instance;
  }

  get name(): string { return this._name; }
}
```

## Value Objects

- Immutable (`readonly` property)
- Validate in constructor (impossible to create invalid instance)
- Factory method: `static create()`

**Example**:
```typescript
export class Email {
  constructor(public readonly value: string) {
    if (!value.includes('@')) throw new Error('Invalid email');
  }

  static create(value: string): Email {
    return new Email(value);
  }
}
```

## Mappers

- Static methods: `toDomain()` and `toPersistence()`
- `toDomain()`: Wrap in try-catch with descriptive error message
- `toPersistence()`: Convert `undefined` → `null` explicitly for TypeORM
- Return `Partial<Entity>` from `toPersistence()`

**Example**:
```typescript
export class MemberMapper {
  static toDomain(entity: MemberEntity): Member {
    try {
      return Member.fromPersistence({
        id: entity.id,
        name: entity.name,
      });
    } catch (error) {
      throw new Error(`Failed to map Member: ${error.message}`);
    }
  }

  static toPersistence(member: Member): Partial<MemberEntity> {
    return {
      id: member.id,
      name: member.name,
      phone: member.phone ?? null, // undefined → null
    };
  }
}
```

## Controllers

- **Thin**: Only delegate to Use Cases/Queries
- **ValidationPipe**: On POST/PATCH/PUT endpoints
- **Error handling**: Try-catch with `instanceof Error` check
- **No business logic** in controllers

## Error Handling

- Domain: `NotFoundError`, `BusinessRuleError`
- Infrastructure: Global exception filter maps domain errors to HTTP codes
- Controllers: `try-catch` with `instanceof Error` → `HttpException`

## TypeORM

- Always filter `deletedAt: IsNull()` in find queries
- Verify `affected` count in `softDelete()` operations
- Use `withDeleted: true` when you need to find soft-deleted records

## Code Language

- Code in **English**
- Comments can be in Spanish or English
- Commit messages in **English**
