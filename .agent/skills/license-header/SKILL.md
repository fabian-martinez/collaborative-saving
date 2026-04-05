---
name: License/Copyright Header
description: Automatically applies a copyright header to new .ts, .tsx, or .vue files.
---

# License/Copyright Header

Use this skill to ensure all new source files have the standard project copyright header.

## Context
The project does not currently have consistent license headers. This skill helps maintain consistency for all new additions.

## Instructions
When you create a new file with the extension `.ts`, `.tsx`, or `.vue`:

1. **Read the Header**: Read the contents of `resources/HEADER.txt` in this skill's directory.
2. **Apply Header**: Prepend the header content to the very top of the new file.
3. **Avoid Duplication**: If you are editing an existing file that already has a header (or a similar comment at the top), do not add it again.

## Template
The default header used:
```typescript
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */
```
