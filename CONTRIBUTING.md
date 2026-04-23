# 🤝 CONTRIBUTING.md - GitHub Flow y Estándares

Para mantener la calidad y evitar que las ramas queden aisladas, seguimos este flujo de trabajo obligatorio.

## 🚀 Ciclo de Vida de una Tarea (Paso a Paso)

Para asegurar la trazabilidad y calidad, cada cambio debe seguir este flujo estrictamente:

1.  **Identificar/Crear Issue**: Selecciona un issue existente de la columna "Backlog" o crea uno nuevo detallando el problema o funcionalidad. **No se permite iniciar desarrollo sin un issue asociado.**
2.  **Crear Rama**: Crea una rama local desde la versión más reciente de `main` usando el prefijo adecuado:
    - `feat/nombre-funcionalidad`
    - `fix/descripcion-bug`
    - `refactor/nombre-mejora`
3.  **Implementar Cambios**: Realiza los cambios siguiendo la estrategia de **TDD Outside-In** (primero el test, luego la implementación). Asegúrate de seguir los estándares de arquitectura hexagonal.
4.  **Commitear**: Realiza commits atómicos y descriptivos siguiendo el estándar de **Conventional Commits** (en inglés).
5.  **Pushear**: Sube tu rama al repositorio remoto en GitHub (`git push origin nombre-de-tu-rama`).
6.  **Crear Pull Request (PR)**: Abre un PR hacia la rama `main` en GitHub.
    - Vincula el issue en la descripción usando la palabra clave `Closes #numero-del-issue`.
    - Asegúrate de que los tests automáticos (GitHub Actions) pasen exitosamente.

## 🔱 Gestión de Tareas (GitHub Issues)
**GitHub Issues es la única fuente de verdad para el trabajo pendiente.**
1.  **No trabajes sin un Issue**: Cada rama y cada Pull Request DEBE estar vinculado a un Issue de GitHub.
2.  **Reporte de Progreso**: Usa los comentarios del Issue para documentar bloqueos o decisiones técnicas rápidas.
3.  **Cierre de Tareas**: Incluye `Closes #numero-del-issue` en la descripción del PR para que GitHub lo cierre automáticamente al mergear.

## 🔱 GitHub Flow (Ramas y Merges)

1.  **Sincronización**: Mantén tu rama actualizada con `main`.
2.  **Nomenclatura de Ramas**:
    -   `feat/nombre-funcionalidad`: Nuevas características.
    -   `fix/descripcion-bug`: Corrección de errores.
    -   `refactor/nombre-mejora`: Cambios de estructura sin cambio funcional.
3.  **Commits**: Usa el estándar de **Conventional Commits** (en inglés):
    -   `feat(members): add update status use case`
    -   `fix(loans): resolve interest calculation rounding error`
4.  **Pull Requests**:
    -   Deben incluir la descripción del "Por qué" del cambio.
    -   **DOD (Definition of Done)**: Tests pasando, Swagger actualizado, sin duplicación de código.

## 🧪 Estrategia de Testing (TDD)

Aplicamos **Outside-In TDD**:
1.  Crear un test E2E en `backend/test/` que falle (Rojo).
2.  Definir el Caso de Uso y el Puerto (Interface) en el dominio.
3.  Implementar el Caso de Uso con un repositorio en memoria para que el test unitario pase (Verde).
4.  Implementar el adaptador real (TypeORM) y verificar el test E2E.
5.  Refactorizar.

## 🏛️ Estándares de Código

### Backend (NestJS)
-   Uso de **Symbols** para Inyección de Dependencias (ver `ARCHITECTURE_PATTERNS.md`).
-   Validación de DTOs con `class-validator`.
-   Mappers explícitos para convertir entre capas (Persistence ↔ Domain ↔ HTTP).

### Frontend (Vue 3 / Vite)
-   Uso de **Tailwind CSS 4** y **DaisyUI**.
-   Arquitectura por **Features** (cada carpeta en `src/features` contiene sus propios componentes y servicios).
-   State management con **Pinia**.

---
*La calidad no es negociable. Si el código no tiene tests o rompe la arquitectura hexagonal, no será mergeado.*
