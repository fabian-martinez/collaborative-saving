## 2024-04-13 - [Dynamic ARIA labels for stateful toggle buttons]
**Learning:** Toggleable icon-only buttons (like menu collapsers) in this app require their `aria-label` and `title` to dynamically reflect their current state (e.g., "Expand" vs "Collapse") rather than just a generic action ("Toggle menu") to be truly accessible. Adding `aria-expanded` is also crucial for screen readers to understand the state of the collapsible region they control.
**Action:** When adding or updating icon-only toggle buttons, always dynamically bind `:aria-label`, `:title`, and `:aria-expanded` based on the reactive state of the component they toggle.

## 2025-02-12 - Aria attributes for toggleable icons vs expandable sections
**Learning:** For a toggle button that pins/unpins something, `aria-pressed="true/false"` is the correct ARIA attribute to use, whereas `aria-expanded` is meant for elements that collapse/expand content (like accordions).
**Action:** Always verify semantic usage of ARIA attributes when implementing toggleable icon-only buttons. Use `aria-expanded` strictly for accordion-style components or elements that control visibility of other elements, and `aria-pressed` for boolean state toggles.
