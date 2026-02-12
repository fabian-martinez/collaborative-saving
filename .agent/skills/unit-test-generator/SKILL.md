---
name: Unit Test Generator
description: Generates unit tests following project-specific patterns — AAA structure, complete mocks, spies for ESLint compliance, and edge case coverage.
---

# Unit Test Generator

Use this skill when the user asks to "write tests", "add tests for", or "generate tests" for any backend module.

## Context

The project's testing standards are documented in `.cursor/rules/TESTING_PATTERNS.md`. All tests must follow these patterns to achieve ≥90% coverage (ideal 100%).

## Instructions

### 1. File naming

```
{same-name-as-source}.spec.ts

Examples:
- email.value-object.spec.ts
- create-member.use-case.spec.ts
- typeorm-member.repository.spec.ts
- members.v2.controller.spec.ts
```

### 2. AAA Pattern (MANDATORY)

Every `it()` block MUST follow Arrange-Act-Assert:

```typescript
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
```

### 3. Complete Mocks (MANDATORY)

Mock ALL methods of a repository, including optional ones:

```typescript
memberRepository = {
  findById: jest.fn(),
  findActive: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  findByIdWithDeleted: jest.fn(),
  updateStatus: jest.fn(),
} as unknown as jest.Mocked<MemberRepository>;
```

### 4. Spies for ESLint Compliance (MANDATORY)

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

### 5. Edge Cases (MANDATORY)

Always include these test categories:

#### a) Happy Path
```typescript
it('should create {entity} successfully', async () => { ... });
```

#### b) Not Found
```typescript
it('should throw error when {entity} not found', async () => {
  memberRepository.findById.mockResolvedValue(null);
  await expect(useCase.execute(dto)).rejects.toThrow('{Entity} not found');
});
```

#### c) Non-Error Exceptions
```typescript
it('should handle non-Error exceptions', async () => {
  createUseCaseSpy.mockRejectedValue('String error');
  await expect(controller.create(mockBody)).rejects.toThrow(
    expect.objectContaining({ message: 'String error' })
  );
});
```

#### d) Nullable Fields
```typescript
it('should handle null optional fields', () => {
  const data = { id: '1', name: 'Test', phone: null };
  const result = Mapper.toDomain(data);
  expect(result.phone).toBeUndefined();
});

it('should convert undefined to null in persistence', () => {
  const entity = Entity.create({ name: 'Test' });
  const result = Mapper.toPersistence(entity);
  expect(result.phone).toBe(null);
});
```

### 6. Describe Block Structure

```typescript
describe('ClassName', () => {
  // Setup (beforeEach, mocks, spies)

  describe('methodName', () => {
    it('should {expected behavior} when {condition}', () => {});
    it('should throw error when {invalid condition}', () => {});
  });
});
```

### 7. Test Templates by Layer

#### Value Objects — test constructor validation + factory methods
#### Domain Entities — test `create()`, `fromPersistence()`, `update()`, getters
#### Use Cases — test execute success + errors + edge cases
#### Query Handlers — test empty results + list results + mapping
#### Repositories — test `findById`, `save` (insert/update), `softDelete`
#### Controllers — test endpoints + HTTP error codes + non-Error exceptions
#### Mappers — test `toDomain` (with try-catch) + `toPersistence` (with null handling)

## Running Tests

```bash
# Unit tests
cd backend && npm run test:unit

# Specific file
cd backend && npx jest --testPathPattern="create-member.use-case.spec.ts"

# Coverage
cd backend && npm run test:cov
```
