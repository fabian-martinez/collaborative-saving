## 2024-05-24 - Accessibility Learnings

**Learning:** When using components like `Pin` / `PinSlash` inside of a ghost button for sticky actions (like in `DisbursementSummary.vue`), the button's action and state aren't always clear to screen reader users if relying solely on the title attribute or the icon itself. Similarly, small circular buttons with SVG paths (like the edit loan term buttons) lack semantic meaning unless an `aria-label` is applied to convey the action.
**Action:** Always ensure icon-only buttons have an explicit `aria-label`. For toggleable states, dynamically bind the `aria-label` to clearly communicate the specific action associated with the current visual state (e.g., `:aria-label="isSticky ? 'Desfijar resumen' : 'Fijar resumen'"`).
