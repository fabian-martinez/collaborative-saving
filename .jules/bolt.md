## 2024-02-23 - TypeORM Save vs Update Pattern
**Learning:** The codebase frequently uses a manual `findOne` -> `update` -> `findOne` pattern for updates, which incurs 3 database roundtrips. TypeORM's `save()` method handles upserts (insert or update) and returns the updated entity in a single or double query (depending on driver support for `RETURNING`), significantly reducing latency.
**Action:** Always prefer `repository.save(entity)` over manual existence checks and updates when the full entity is available, especially for high-frequency write operations.
