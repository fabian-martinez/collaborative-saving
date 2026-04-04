## 2024-03-02 - N+1 Queries in Use Cases
**Learning:** Found N+1 query bottleneck in `record-revaluation.use-case.ts` where the same repository entity (`Stock`) was being queried repetitively inside multiple loops using `findById`.
**Action:** Replace repetitive `findById` calls with a single `findByIds` call before loops, cache the results in a `Map<string, Entity>`, and perform O(1) memory lookups within iterations.
## 2024-02-23 - TypeORM Save vs Update Pattern
**Learning:** The codebase frequently uses a manual `findOne` -> `update` -> `findOne` pattern for updates, which incurs 3 database roundtrips. TypeORM's `save()` method handles upserts (insert or update) and returns the updated entity in a single or double query (depending on driver support for `RETURNING`), significantly reducing latency.
**Action:** Always prefer `repository.save(entity)` over manual existence checks and updates when the full entity is available, especially for high-frequency write operations.
