## 2024-05-31 - TypeORM SQL Injection via OrderBy
**Vulnerability:** Moderate severity vulnerability in typeorm versions 0.1.12 - 0.3.28 where SQL Injection is possible in UpdateQueryBuilder/SoftDeleteQueryBuilder orderBy (MySQL/MariaDB).
**Learning:** Typeorm vulnerabilities in older versions should be patched via version bump, which can happen through transitive dependencies or direct.
**Prevention:** Regularly audit backend dependencies using `npm audit` and bump the direct `typeorm` dependency to `>=0.3.29` or use `overrides` for nested dependencies to resolve these SQLi risks without needing major architectural refactors.
