## 2024-03-23 - [TypeORM N+1 Queries in Revaluation Loop]
**Learning:** Calling `findById` inside loops inside Use Cases causes significant N+1 queries. When dealing with batched inputs, missing a bulk fetch method (`findByIds`) in repository interfaces hides the opportunity for performance improvements at the DB layer.
**Action:** Always check loop structures inside UseCases/Services in NestJS. Implement `findByIds` in repository ports and infrastructure implementations, and map the results to a `Map<ID, Entity>` in O(1) time before looping over operations.
