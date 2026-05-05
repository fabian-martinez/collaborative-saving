# 0004: Adopción de Arquitectura Feature-Sliced para el Frontend

- **Estado:** Aceptado
- **Fecha:** 2024-07-28
- **Contexto:** A medida que la aplicación crece, la organización actual del frontend, basada en tipos de archivo (`components`, `views`, `stores`), se vuelve difícil de mantener. Encontrar y modificar todas las partes de una funcionalidad (ej. "gestión de socios") requiere navegar por múltiples carpetas, lo que aumenta la carga cognitiva y ralentiza el desarrollo.
- **Decisión:** Se ha decidido reestructurar el frontend siguiendo un enfoque de "feature-sliced design". Los archivos se organizarán por funcionalidad o "feature" (ej. `meetings`, `members`, `auth`).
  - Se creará un directorio `src/features`.
  - Cada feature (ej. `src/features/members`) contendrá sus propios subdirectorios para `components`, `views`, `stores`, `types`, etc.
  - Los componentes y lógica verdaderamente globales y reutilizables en múltiples features permanecerán en directorios raíz como `src/components` o `src/composables`.
  - Los servicios, como el cliente de API, se ubicarán en `src/services`.
- **Consecuencias:**
  - **Positivas:**
    - **Alta cohesión:** El código relacionado con una misma funcionalidad reside en un solo lugar.
    - **Bajo acoplamiento:** Las features son más independientes entre sí, lo que facilita su desarrollo, prueba y eliminación si es necesario.
    - **Mejor escalabilidad:** Es más fácil para los desarrolladores (tanto humanos como IA) entender la estructura del proyecto y añadir nuevas funcionalidades sin afectar a las existentes.
  - **Negativas:**
    - Requiere un esfuerzo inicial de refactorización.
    - Puede haber una ligera curva de aprendizaje para los desarrolladores no familiarizados con este patrón.