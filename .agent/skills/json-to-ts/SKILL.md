---
name: JSON to TypeScript Interfaces
description: Generates TypeScript interfaces from JSON snippets using Few-Shot Learning to match project naming and formatting conventions.
---

# JSON to TypeScript Interfaces

Use this skill to convert JSON data into TypeScript interfaces that look exactly like the ones in the project.

## Context
Analysis of the project shows the following conventions:
- **Naming**: No `I` prefix for interfaces (e.g., `User`, not `IUser`).
- **Formatting**:
  - Backend: Uses semicolons at the end of properties.
  - Frontend (Nuxt): Omit semicolons at the end of properties.
- **Style**: Use `interface` instead of `type` for object definitions where possible.

## Instructions
When the user provides a JSON snippet and asks for TypeScript interfaces:

1. **Detect Context**: Check if the user is working in `backend/` or `frontend-nuxt/` to decide on semicolon usage.
2. **Naming**: Use PascalCase and avoid the `I` prefix.
3. **Use Few-Shot Examples**: Refer to the following "ideal output" examples from the project to guide the generation.

### Few-Shot Example 1: Backend Style (with semicolons)
**Input JSON:**
```json
{
  "id": "123",
  "name": "Personal Loan",
  "amount": 5000,
  "isActive": true
}
```

**Ideal Output (Backend):**
```typescript
export interface Loan {
  id: string;
  name: string;
  amount: number;
  isActive: boolean;
}
```

### Few-Shot Example 2: Frontend Style (no semicolons)
**Input JSON:**
```json
{
  "items": [
    {"title": "Task 1", "done": false}
  ],
  "total": 1
}
```

**Ideal Output (Frontend/Nuxt):**
```typescript
export interface TaskResponse {
  items: TaskItem[]
  total: number
}

export interface TaskItem {
  title: string
  done: boolean
}
```

## Prompt Engineering
When performing the conversion, always look for nested objects and arrays to create separate, well-named interfaces for them, maintaining the "flat" and "clean" style found in `CreateLoanDto` and `PaginatedResponse`.
