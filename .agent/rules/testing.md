# Testing Rules

## Strategy

- **TDD Outside-In**: E2E (RED) → Adapters (GREEN) → Use Cases → Domain → Repos → Refactor
- **Coverage target**: ≥90% critical layers, ideal 100%

## AAA Pattern (MANDATORY)

Every test MUST follow **Arrange-Act-Assert**:

```typescript
it('should do X when Y', async () => {
  // ARRANGE — Setup data, mocks
  const dto = { name: 'Test' };
  repository.save.mockResolvedValue(entity);

  // ACT — Execute code under test
  const result = await useCase.execute(dto);

  // ASSERT — Verify results
  expect(saveSpy).toHaveBeenCalledTimes(1);
  expect(result.name).toBe('Test');
});
```

## Mocking

- Mock ALL methods of repository interfaces, including optional ones
- Use `as unknown as jest.Mocked<XRepository>` for type safety
- Clear mocks in `beforeEach`

**Example**:
```typescript
let repository: jest.Mocked<MemberRepository>;

beforeEach(() => {
  repository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as jest.Mocked<MemberRepository>;
});
```

## Spies (MANDATORY for assertions)

Use spies to avoid ESLint `@typescript-eslint/unbound-method` errors:

```typescript
let saveSpy: jest.SpyInstance;

beforeEach(() => {
  repository = { /* mocks */ } as unknown as jest.Mocked<MemberRepository>;
  saveSpy = jest.spyOn(repository, 'save');
});

// In assertions:
expect(saveSpy).toHaveBeenCalledTimes(1);
```

**NEVER** disable ESLint to work around unbound methods.

## Required Test Cases

1. **Happy path**: Success case
2. **Not found**: Entity returns null → throw error
3. **Non-Error exceptions**: Test string errors in controllers
4. **Nullable fields**: Test null/undefined handling in mappers
5. **Edge cases**: Empty arrays, boundary values

## Naming

- **Files**: `{source-file}.spec.ts`
- **Describe**: `describe('ClassName', () => { describe('method', () => { ... }) })`
- **It**: `it('should {behavior} when {condition}', ...)`

## Commands

```bash
# Unit tests
cd backend && npm run test:unit

# E2E tests
cd backend && npm run test:e2e

# Specific file
cd backend && npx jest --testPathPattern="create-member.use-case.spec.ts"

# Coverage
cd backend && npm run test:cov

# Watch mode
cd backend && npm run test:watch

# Lint
cd backend && npm run lint
```
