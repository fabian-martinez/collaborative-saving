## 2026-02-01 - Missing Role-Based Access Control
**Vulnerability:** Core write operations in `MembersV2Controller` were accessible to any authenticated user, lacking role verification.
**Learning:** RBAC was documented but completely missing in the codebase. Authentication guards (`FirebaseAuthGuard`) were present but insufficient for authorization.
**Prevention:** Always verify that `@UseGuards(RolesGuard)` is applied and functional, not just assume it based on documentation.
