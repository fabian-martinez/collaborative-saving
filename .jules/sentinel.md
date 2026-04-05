## 2024-05-22 - [Missing RBAC Architecture]
**Vulnerability:** Core write operations were completely unprotected by role checks, relying only on authentication.
**Learning:** Symbols used for Dependency Injection (like `MEMBER_REPOSITORY`) were encapsulated within modules, making them inaccessible to Guards which need them for authorization checks.
**Prevention:** Always define DI tokens in shared constants files to ensure they can be injected into Guards, Interceptors, and other global enhancers.
## 2026-02-01 - Missing Role-Based Access Control
**Vulnerability:** Core write operations in `MembersV2Controller` were accessible to any authenticated user, lacking role verification.
**Learning:** RBAC was documented but completely missing in the codebase. Authentication guards (`FirebaseAuthGuard`) were present but insufficient for authorization.
**Prevention:** Always verify that `@UseGuards(RolesGuard)` is applied and functional, not just assume it based on documentation.
## 2024-03-30 - Fix Information Leakage in Exception Filter
**Vulnerability:** The NestJS `GlobalExceptionFilter` was leaking internal stack traces and application details by returning the original error messages of generic unhandled exceptions (like `Error` objects or strings) directly to the client in HTTP responses instead of sanitizing them.
**Learning:** Default exception handlers often fallback to passing `error.message` to clients for debugging, which exposes internals when unhandled exceptions occur in production, violating the "Fail securely" principle and aiding reconnaissance.
**Prevention:** Generic/unhandled errors must always be mapped to a generic message like "Internal server error" for external HTTP responses, while their details (e.g., stack traces, original messages) must be securely logged server-side to prevent data leakage while maintaining observability.
