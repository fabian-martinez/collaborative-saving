## 2024-05-22 - Accessibility & Feedback Patterns
**Learning:** Adding `aria-label` to icon-only buttons is a low-effort, high-impact a11y win. Combining `loading` state with disabled attribute on destructive actions (like delete) prevents double-submission and provides clear feedback.
**Action:** Systematically audit all `DataTable` action slots for missing ARIA labels and ensure all async modals use the loading spinner pattern.
