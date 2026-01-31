## 2026-01-31 - [Foundational A11y Gaps in Shared Components]
**Learning:** Core shared components like `ErrorMessage` lacked basic accessibility roles (`role="alert"`) and visual cues (icons), and even ignored defined props (`title`). This suggests a pattern of "visual-first" development where semantic structure was overlooked.
**Action:** When touching shared components, always audit for ARIA roles and unused props to incrementally harden the design system foundation.
