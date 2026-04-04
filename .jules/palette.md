# PALETTE'S JOURNAL

## 2024-05-23 - [Modal Accessibility - Icon Only Buttons]
**Learning:** Modals often use an '✕' icon for closing, which is visually clear but inaccessible to screen readers without an explicit label.
**Action:** Always add `aria-label="Cerrar modal"` (or context-appropriate label) to icon-only close buttons. Ensure keyboard focus indicators are visible (`focus-visible:ring-2`).
