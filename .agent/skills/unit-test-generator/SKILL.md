---
name: Unit Test Generator
description: Generates unit tests following project-specific patterns — AAA structure, complete mocks, spies for ESLint compliance, and edge case coverage.
---

# Unit Test Generator

## When to Use

Invoke this skill when the user requests:
- "Write tests for X"
- "Add tests"
- "Generate tests"
- "Create unit tests"

## Context

Testing standards are documented in `.cursor/rules/TESTING_PATTERNS.md`.  
**Coverage target**: ≥90% for critical layers, ideal 100%.

## File Naming

```
{same-name-as-source}.spec.ts

Examples:
- email.value-object.spec.ts
- create-member.use-case.spec.ts
- typeorm-member.repository.spec.ts
- members.v2.controller.spec.ts
```

## AAA Pattern (MANDATORY)

Every `it()` block MUST follow **Arrange-Act-Assert**:

```typescript
it('should create a member successfully', async () => {
  // ARRANGE — Setup data and mocks
  const dto = { name: 'Test', email: 'test@example.com' };
  const savedMember = Member.create(dto);
  memberRepository.save.mockResolvedValue(savedMember);

  // ACT — Execute the code under test
  const result = await useCase.execute(dto);

  // ASSERT — Verify results
  expect(saveSpy).toHaveBeenCalledTimes(1);
  expect(result.name).toBe('Test');
});
```

## Complete Mocks (MANDATORY)

Mock **ALL** methods of a repository, including optional ones:

```typescript
let memberRepository: jest.Mocked<MemberRepository>;

beforeEach(() => {
  memberRepository = {
    findById: jest.fn(),
    findActive: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    findByIdWithDeleted: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as jest.Mocked<MemberRepository>;
});
```

## Spies for ESLint Compliance (MANDATORY)

To avoid `@typescript-eslint/unbound-method` errors, create spies in `beforeEach`:

```typescript
let findByIdSpy: jest.SpyInstance;
let saveSpy: jest.SpyInstance;

beforeEach(() => {
  memberRepository = { /* full mock */ } as unknown as jest.Mocked<MemberRepository>;

  // Create spies
  findByIdSpy = jest.spyOn(memberRepository, 'findById');
  saveSpy = jest.spyOn(memberRepository, 'save');

  useCase = new CreateMemberUseCase(memberRepository);
});

it('should call repository', async () => {
  // Use spies in assertions, NOT mock methods directly
  expect(findByIdSpy).toHaveBeenCalledWith('123');
  expect(saveSpy).toHaveBeenCalledTimes(1);
});
```

**NEVER** disable ESLint to work around unbound methods. Always use spies.

## Required Test Cases

### 1. Happy Path
```typescript
it('should create {entity} successfully', async () => {
  // Arrange
  const dto = { /* valid data */ };
  repository.save.mockResolvedValue(entity);
  
  // Act
  const result = await useCase.execute(dto);
  
  // Assert
  expect(result).toBeDefined();
  expect(saveSpy).toHaveBeenCalledTimes(1);
});
```

### 2. Not Found
```typescript
it('should throw error when {entity} not found', async () => {
  // Arrange
  repository.findById.mockResolvedValue(null);
  
  // Act & Assert
  await expect(useCase.execute(dto)).rejects.toThrow('{Entity} not found');
});
```

### 3. Non-Error Exceptions
```typescript
it('should handle non-Error exceptions', async () => {
  // Arrange
  createUseCaseSpy.mockRejectedValue('String error');
  
  // Act & Assert
  await expect(controller.create(mockBody)).rejects.toThrow(
    expect.objectContaining({ message: 'String error' })
  );
});
```

### 4. Nullable Fields
```typescript
it('should handle null optional fields', () => {
  // Arrange
  const data = { id: '1', name: 'Test', phone: null };
  
  // Act
  const result = Mapper.toDomain(data);
  
  // Assert
  expect(result.phone).toBeUndefined();
});

it('should convert undefined to null in persistence', () => {
  // Arrange
  const entity = Entity.create({ name: 'Test' });
  
  // Act
  const result = Mapper.toPersistence(entity);
  
  // Assert
  expect(result.phone).toBe(null);
});
```

## Describe Block Structure

```typescript
describe('ClassName', () => {
  // Setup (beforeEach, mocks, spies)
  let useCase: CreateMemberUseCase;
  let repository: jest.Mocked<MemberRepository>;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = { /* mocks */ } as unknown as jest.Mocked<MemberRepository>;
    saveSpy = jest.spyOn(repository, 'save');
    useCase = new CreateMemberUseCase(repository);
  });

  describe('execute', () => {
    it('should {expected behavior} when {condition}', () => {});
    it('should throw error when {invalid condition}', () => {});
  });
});
```

## Test Templates by Layer

### Value Objects
Test constructor validation + factory methods:
```typescript
it('should create valid email', () => {
  const email = Email.create('test@example.com');
  expect(email.value).toBe('test@example.com');
});

it('should throw error for invalid email', () => {
  expect(() => Email.create('invalid')).toThrow('Invalid email');
});
```

### Domain Entities
Test `create()`, `fromPersistence()`, `update()`, getters:
```typescript
it('should create entity with valid data', () => {
  const entity = Entity.create({ name: 'Test' });
  expect(entity.name).toBe('Test');
});

it('should update entity properties', () => {
  const entity = Entity.create({ name: 'Test' });
  entity.update({ name: 'Updated' });
  expect(entity.name).toBe('Updated');
});
```

### Use Cases
Test execute success + errors + edge cases:
```typescript
it('should execute use case successfully', async () => {
  // AAA pattern
});

it('should throw error when validation fails', async () => {
  // AAA pattern
});
```

### Repositories
Test `findById`, `save` (insert/update), `softDelete`:
```typescript
it('should find entity by id', async () => {
  // Mock ORM response
  // Call repository method
  // Assert mapper was called
});
```

### Controllers
Test endpoints + HTTP error codes + non-Error exceptions:
```typescript
it('should return 201 on successful creation', async () => {
  // Mock use case
  // Call controller
  // Assert response
});
```

### Mappers
Test `toDomain` (with try-catch) + `toPersistence` (with null handling):
```typescript
it('should map to domain successfully', () => {
  const result = Mapper.toDomain(dbEntity);
  expect(result).toBeInstanceOf(Entity);
});

it('should throw error on invalid data', () => {
  expect(() => Mapper.toDomain(invalidData)).toThrow();
});
```

## Running Tests

```bash
# Unit tests
cd backend && npm run test:unit

# Specific file
cd backend && npx jest --testPathPattern="create-member.use-case.spec.ts"

# Coverage
cd backend && npm run test:cov

# Watch mode
cd backend && npm run test:watch
```
