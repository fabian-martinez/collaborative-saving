---
description: Step-by-step guide to implement a new hexagonal architecture module with TDD Outside-In
---

# New Hexagonal Module Workflow

Follow these steps to implement a new hexagonal module from scratch using TDD Outside-In approach.

## Pre-Implementation

1. **Consult lessons learned**: Read `.cursor/rules/LESSONS_LEARNED.md` for relevant past lessons
2. **Check common pitfalls**: Read `.cursor/rules/COMMON_PITFALLS.md` for known anti-patterns to avoid
3. **Review architecture patterns**: Read `.cursor/rules/ARCHITECTURE_PATTERNS.md` for the expected structure

## Step 1: Scaffold the Module

// turbo
4. Use the `hexagonal-module-scaffolder` skill to generate the base files. Provide the module name, context, and key properties.

## Step 2: Write E2E Test (RED)

5. Create `backend/test/{context}/{context}.e2e-spec.ts` with the happy path test
// turbo
6. Run: `cd backend && npm run test:e2e -- test/{context}/{context}.e2e-spec.ts` — should FAIL (RED)

## Step 3: Implement Controller + Module (GREEN)

7. Implement the controller with Swagger decorators and ValidationPipe
8. Register the module in `backend/src/app.module.ts`
// turbo
9. Run: `cd backend && npm run test:e2e -- test/{context}/{context}.e2e-spec.ts` — should PASS (GREEN)

## Step 4: Implement Domain Layer

10. Add Value Objects if needed (e.g., `Email`, `Money`, `Status`)
11. Implement domain entity with `create()`, `fromPersistence()`, `update()`, and getters
12. Add domain validation rules in `validateInvariants()`

## Step 5: Implement Use Cases

13. Implement CRUD use cases with ports (interfaces), not concrete implementations
14. If the module involves financial transactions, use the `accounting-operation-builder` skill

## Step 6: Implement Infrastructure

15. Implement TypeORM mapper with `toDomain()` (try-catch) and `toPersistence()` (null handling)
16. Implement TypeORM repository with `deletedAt: IsNull()` filtering
17. Wire everything in the NestJS module with Symbol-based DI

## Step 7: Write Unit Tests

18. Use the `unit-test-generator` skill to generate tests for all layers
// turbo
19. Run: `cd backend && npm run test:unit` — all should PASS

## Step 8: Verify

// turbo
20. Run: `cd backend && npm run test:e2e` — all should PASS
// turbo
21. Run: `cd backend && npm run lint` — no errors
22. Verify Swagger documentation at `http://localhost:3000/api`

## Step 9: Capture Learnings

23. If any new lessons were learned, update `.cursor/rules/LESSONS_LEARNED.md`
24. If any new pitfalls were found, update `.cursor/rules/COMMON_PITFALLS.md`
