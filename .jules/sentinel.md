## 2024-05-22 - [Missing RBAC Architecture]
**Vulnerability:** Core write operations were completely unprotected by role checks, relying only on authentication.
**Learning:** Symbols used for Dependency Injection (like `MEMBER_REPOSITORY`) were encapsulated within modules, making them inaccessible to Guards which need them for authorization checks.
**Prevention:** Always define DI tokens in shared constants files to ensure they can be injected into Guards, Interceptors, and other global enhancers.
