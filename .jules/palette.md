## 2026-01-31 - [Foundational A11y Gaps in Shared Components]
**Learning:** Core shared components like `ErrorMessage` lacked basic accessibility roles (`role="alert"`) and visual cues (icons), and even ignored defined props (`title`). This suggests a pattern of "visual-first" development where semantic structure was overlooked.
**Action:** When touching shared components, always audit for ARIA roles and unused props to incrementally harden the design system foundation.
## 2024-05-22 - Accessibility & Feedback Patterns
**Learning:** Adding `aria-label` to icon-only buttons is a low-effort, high-impact a11y win. Combining `loading` state with disabled attribute on destructive actions (like delete) prevents double-submission and provides clear feedback.
**Action:** Systematically audit all `DataTable` action slots for missing ARIA labels and ensure all async modals use the loading spinner pattern.

## 2024-05-23 - Loading States & Context
**Learning:** Replacing main content (like a table) with a global spinner during creation actions causes jarring flashes and loss of context.
**Action:** Use localized loading states (e.g., inside the button) for creation/update actions, keeping the existing data visible.

**Learning:** When an action is blocked by a rule (e.g., "only one active meeting"), keeping the button enabled and showing an alert on click provides better feedback than a silent disabled state.
**Action:** Use disabled states only for technical constraints (loading, empty input) and alerts for business logic constraints.

## 2024-05-24 - Modal Interaction
**Learning:** Modals must support `Escape` key to close. Using `watch` on the visibility prop is a reliable pattern for managing global event listeners in conditionally rendered components.
**Action:** Ensure all modals have `aria-label` on close buttons and respond to `Escape` key.
