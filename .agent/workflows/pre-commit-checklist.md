---
description: Pre-commit validation checklist based on project pitfalls and architecture rules
---

# Pre-Commit Checklist

Run this checklist before committing changes to ensure compliance with the project's architecture and quality standards.

## Architecture Checks

1. **Verify domain isolation**: Ensure no files in `domain/` import from `application/` or `infrastructure/`
// turbo
2. Run: `cd backend && grep -rn "from '.*application\|from '.*infrastructure" src/domain/ --include="*.ts" | grep -v ".spec.ts" | head -20`

3. **Verify Symbol DI**: Ensure all v2 modules use `Symbol()` tokens for dependency injection
// turbo
4. Run: `cd backend && grep -rn "Symbol(" src/infrastructure/nestjs/http/modules/ --include="*.ts" | head -20`

## Code Quality Checks

5. **No `any` types**: Verify there are no new `any` usages
// turbo
6. Run: `cd backend && grep -rn ": any" src/ --include="*.ts" | grep -v node_modules | grep -v ".spec.ts" | head -20`

7. **Soft delete filtering**: Ensure all `findOne` / `find` in repositories filter `deletedAt`
// turbo
8. Run: `cd backend && grep -rn "findOne\|\.find(" src/infrastructure/typeorm/repositories/ --include="*.ts" | head -20`

## Testing Checks

// turbo
9. Run unit tests: `cd backend && npm run test:unit`

// turbo
10. Run lint: `cd backend && npm run lint`

## Final Review

11. Review the diff with `git diff --staged` and verify:
    - [ ] No `any` types introduced
    - [ ] No legacy architecture imports in domain/application
    - [ ] All new endpoints have Swagger decorators
    - [ ] ValidationPipe on POST/PATCH/PUT endpoints
    - [ ] Tests follow AAA pattern with complete mocks
    - [ ] Mappers handle nullable → null conversion

12. Format commit message using the `git-commit-formatter` skill
