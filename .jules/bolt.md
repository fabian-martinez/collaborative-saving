## 2024-03-02 - N+1 Queries in Use Cases
**Learning:** Found N+1 query bottleneck in `record-revaluation.use-case.ts` where the same repository entity (`Stock`) was being queried repetitively inside multiple loops using `findById`.
**Action:** Replace repetitive `findById` calls with a single `findByIds` call before loops, cache the results in a `Map<string, Entity>`, and perform O(1) memory lookups within iterations.
