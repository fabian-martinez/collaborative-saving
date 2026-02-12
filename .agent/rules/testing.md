# Testing Rules

## Strategy

- **TDD Outside-In**: E2E (RED) → Adapters (GREEN) → Use Cases → Domain → Repos → Refactor
- **Coverage target**: ≥90% critical layers, ideal 100%

## AAA Pattern (MANDATORY)

Every test MUST follow Arrange-Act-Assert:

```typescript
it('should do X when Y', async () => {
  // ARRANGE - setup data, mocks
  // ACT - execute code under test
  // ASSERT - verify results
});
```

## Mocking

- Mock ALL methods of repository interfaces, including optional ones
- Use `as unknown as jest.Mocked<XRepository>` for type safety
- Clear mocks in `beforeEach`

## Spies (MANDATORY for assertions)

Use spies to avoid ESLint `@typescript-eslint/unbound-method` errors:

```typescript
let saveSpy: jest.SpyInstance;
beforeEach(() => {
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

- Files: `{source-file}.spec.ts`
- Describe: `describe('ClassName', () => { describe('method', () => { ... }) })`
- It: `it('should {behavior} when {condition}', ...)`

## Commands

- Unit: `cd backend && npm run test:unit`
- E2E: `cd backend && npm run test:e2e`
- Coverage: `cd backend && npm run test:cov`
- Lint: `cd backend && npm run lint`
