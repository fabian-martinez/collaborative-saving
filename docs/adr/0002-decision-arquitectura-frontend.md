# 0002. Decisión sobre el Stack Tecnológico del Frontend

**Fecha:** 2025-07-04

**Estado:** Aceptado

## Contexto

Para la Fase 3 (Desarrollo del MVP), es crucial definir las tecnologías del frontend. La elección debe equilibrar la velocidad de desarrollo, la facilidad de mantenimiento, la curva de aprendizaje y el rendimiento, considerando la naturaleza comunitaria y sin fines de lucro del proyecto.

En el documento de la Fase 2, se realizó una propuesta inicial que fue validada. Este ADR formaliza dicha decisión para que sirva como referencia única durante el desarrollo.

## Decisión

Se ha decidido adoptar el siguiente stack para el desarrollo del frontend:

-   **Framework Principal:** **Vue.js 3**
    -   **Razón:** Es un framework progresivo y bien documentado, con una curva de aprendizaje amigable que facilita la incorporación de posibles colaboradores en el futuro. Su sistema de componentes es ideal para la estructura de la aplicación.

-   **Framework de UI y Estilos:** **Tailwind CSS** en combinación con **daisyUI**.
    -   **Razón:** Tailwind CSS proporciona una base de utilidades de bajo nivel que ofrece máxima flexibilidad para crear una interfaz a medida. Se complementa con `daisyUI` para obtener un conjunto de componentes pre-diseñados (botones, modales, tarjetas, etc.) que aceleran significativamente el desarrollo sin sacrificar la personalización.

## Consecuencias

-   **Positivas:**
    -   **Agilidad:** El uso de Vue.js y daisyUI permitirá construir la interfaz del MVP de manera rápida.
    -   **Personalización:** Tailwind CSS asegura que no estaremos limitados por un framework de componentes tradicional.
    -   **Curva de Aprendizaje:** La elección de Vue.js es accesible para desarrolladores con experiencia en JavaScript.

-   **A considerar:**
    -   La configuración inicial del entorno de desarrollo deberá incluir Vue.js, Vite, Tailwind CSS y daisyUI.
    -   El equipo de desarrollo (actual y futuro) deberá familiarizarse con estas herramientas. 