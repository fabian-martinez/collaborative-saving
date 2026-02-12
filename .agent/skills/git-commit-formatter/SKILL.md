---
name: Smart Git Commit
description: Formats git commit messages using semantic prefixes (feat, refactor, perf) detected from the user's history.
---

# Smart Git Commit

Use this skill to format commit messages in a style that matches the current project's history.

## Context
Based on the analysis of the project's git history, the user prefers a semantic commit style without emojis or Jira tickets.

## Instructions
When the user asks to "prepare a commit message" or "format a commit", follow these rules:

1. **Semantic Prefixes**: Use one of the following prefixes based on the nature of the changes:
   - `feat:` for a new feature.
   - `fix:` for a bug fix.
   - `refactor:` for code changes that neither fix a bug nor add a feature.
   - `perf:` for code changes that improve performance.
   - `docs:` for documentation updates.
   - `test:` for adding or improving tests.
   - `chore:` for maintenance tasks.

2. **Formatting**:
   - The first line should be the commit summary (max 50-72 characters).
   - Start the summary with the lowercase prefix followed by a colon and a space.
   - **Do not** use emojis.
   - **Do not** add ticket numbers unless explicitly provided by the user.
   - Use the imperative mood (e.g., "add feature" instead of "added feature").

3. **Body (Optional)**:
   - If the changes are complex, add a blank line followed by a more detailed description.
   - Separate the body into logical points if necessary.

## Example
If I modified the authentication logic to handle Firebase errors:
`refactor: enhance authentication error logging and robustness`
