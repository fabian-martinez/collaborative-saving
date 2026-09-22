# 🤝 CONTRIBUTING.md - GitHub Flow y Estándares

Para mantener la calidad y evitar que las ramas queden aisladas, seguimos este flujo de trabajo obligatorio.

## 🚀 Ciclo de Vida de una Tarea (Paso a Paso)

Para asegurar la trazabilidad y calidad, cada cambio debe seguir este flujo estrictamente:

1. **Identificar/Crear Issue y Vincular al Proyecto**: Selecciona un issue del sprint activo en [Colaborative Savings (Project #1)](https://github.com/users/fabian-martinez/projects/1) o crea uno nuevo vinculándolo al proyecto con sus campos correspondientes (`Sprint`, `Track`, `Prioridad`). Mueve el estado a `In Progress`. **No se permite iniciar desarrollo sin un issue asociado.**
2. **Crear Rama**: Crea una rama local desde la versión más reciente de `main` usando el prefijo adecuado:
    - `feat/nombre-funcionalidad`
    - `fix/descripcion-bug`
    - `refactor/nombre-mejora`
3. **Implementar Cambios**: Realiza los cambios siguiendo la estrategia de **TDD Outside-In** (primero el test, luego la implementación). Asegúrate de seguir los estándares de arquitectura hexagonal.
4. **Commitear**: Realiza commits atómicos y descriptivos siguiendo el estándar de **Conventional Commits** (en inglés).
5. **Pushear**: Sube tu rama al repositorio remoto en GitHub (`git push origin nombre-de-tu-rama`).
6. **Crear Pull Request (PR)**: Abre un PR hacia la rama `main` en GitHub.
    - Vincula el issue en la descripción usando la palabra clave `Closes #numero-del-issue`.
    - Asegúrate de que los tests automáticos (GitHub Actions) pasen exitosamente.

## 🔱 Gestión de Tareas (GitHub Issues y Projects)

**GitHub Issues y GitHub Projects (#1) son las fuentes únicas de verdad para la planificación y seguimiento.**

El proyecto visual de gestión se encuentra en:  
👉 **[Colaborative Savings (GitHub Project #1)](https://github.com/users/fabian-martinez/projects/1)**

### 1. Reglas Fundamentales
1. **No trabajes sin un Issue**: Cada rama y cada Pull Request DEBE estar vinculado a un Issue de GitHub.
2. **Vinculación al Proyecto**: Todo issue nuevo o en curso DEBE pertenecer al **Project #1** y tener clasificados sus campos personalizados.
3. **Reporte de Progreso**: Usa los comentarios del Issue para documentar bloqueos o decisiones técnicas.
4. **Cierre Automático**: Incluye `Closes #numero-del-issue` en la descripción del PR para que GitHub cierre el issue y mueva la tarjeta a `Done` al mergear en `main`.

---

### 2. Campos Personalizados del Proyecto (Custom Fields)

Cada tarjeta en el proyecto debe tener definidos los siguientes metadatos:

#### 📅 `Sprint` (Planificación Temporal)
* **Valores:** `Sprint 1`, `Sprint 2`, `Sprint 3`, `Sprint 4`, `Sprint 5`, `Sprint 6`, `Sprint 7`, `Sprint 8`, `Backlog`.
* **⚠️ Regla de Oro (Cero Dependencias Intra-Sprint):**  
  Si la **Tarea B** depende de la **Tarea A**, obligatoriamente:
  $$\text{Sprint}(B) > \text{Sprint}(A)$$
  **Bajo ninguna circunstancia se asignará una tarea al mismo sprint que sus prerrequisitos no cerrados.** Esto garantiza que cada sprint sea autónomo y libre de bloqueos internos.

#### 🏷️ `Track` (Épica / Dominio Funcional)
* **`🚀 Despliegue Web $0`:** Infraestructura, Docker, Render, Cloudflare, Firebase Hosting y pipelines CI/CD de producción.
* **`💰 Core Financiero`:** Motor contable de partida doble, créditos, liquidaciones, recaudos mensuales, auditoría de libro mayor y asamblea.
* **`⚙️ Settings & Dinámica`:** Configuración dinámica del fondo, catálogo de acciones, tipos de crédito y parámetros globales.
* **`🔐 Auth, Passkeys & PII`:** Seguridad, Magic Link passwordless, WebAuthn/Passkeys, roles, sesiones y cifrado de datos personales en reposo.
* **`📱 CustomerUI & DX`:** Aplicación móvil de socios (`frontend-mobile`), capacidades PWA y herramientas de experiencia de desarrollo.
* **`🎨 Frontend UX & QA`:** Backoffice administrativo (`frontend-v2`), alineación de diseño, componentes UI y suites E2E con Playwright.
* **`🌐 DocuSeal & Multi-Tenancy`:** Firma digital de pagarés, SDK embebido y arquitectura multi-fondo.
* **`✅ Histórico / Cerrados`:** Tareas fundacionales concluidas previamente.

#### 🚨 `Prioridad`
* **`🔴 Crítica`:** Bloquea despliegues a producción, vulnerabilidades de seguridad, integridad contable o fallas en el flujo transaccional de asamblea.
* **`🟠 Alta`:** Funcionalidades imprescindibles para el objetivo del sprint o la épica activa.
* **`🔵 Media`:** Mejoras operativas, refactorizaciones arquitectónicas o deuda técnica controlada.
* **`⚪ Baja`:** Mejoras cosméticas, optimizaciones menores o documentación complementaria.

#### 📋 `Status`
* **`Todo`:** Tarea planificada en el sprint pero no iniciada.
* **`In Progress`:** Tarea con rama activa y desarrollo en curso.
* **`Done`:** PR mergeado exitosamente en `main`.

---

### 3. Automatización con GitHub CLI (`gh`)

Puedes vincular y clasificar issues directamente desde tu terminal:

```bash
# 1. Agregar issue al Project #1
gh project item-add 1 --owner fabian-martinez --url https://github.com/fabian-martinez/collaborative-saving/issues/<NUMERO>

# 2. Asignar Sprint, Track, Prioridad y Estado
gh project item-edit 1 --owner fabian-martinez --url https://github.com/fabian-martinez/collaborative-saving/issues/<NUMERO> --field "Sprint" --value "Sprint 2"
gh project item-edit 1 --owner fabian-martinez --url https://github.com/fabian-martinez/collaborative-saving/issues/<NUMERO> --field "Track" --value "Core Financiero"
gh project item-edit 1 --owner fabian-martinez --url https://github.com/fabian-martinez/collaborative-saving/issues/<NUMERO> --field "Prioridad" --value "Alta"
gh project item-edit 1 --owner fabian-martinez --url https://github.com/fabian-martinez/collaborative-saving/issues/<NUMERO> --field "Status" --value "In Progress"
```

## 🔱 GitHub Flow (Ramas y Merges)

1. **Sincronización**: Mantén tu rama actualizada con `main`.
2. **Nomenclatura de Ramas**:
    - `feat/nombre-funcionalidad`: Nuevas características.
    - `fix/descripcion-bug`: Corrección de errores.
    - `refactor/nombre-mejora`: Cambios de estructura sin cambio funcional.
3. **Commits**: Usa el estándar de **Conventional Commits** (en inglés):
    - `feat(members): add update status use case`
    - `fix(loans): resolve interest calculation rounding error`
4. **Pull Requests**:
    - Deben incluir la descripción del "Por qué" del cambio.
    - **DOD (Definition of Done)**: Tests pasando, Swagger actualizado, sin duplicación de código.

## 🧪 Estrategia de Testing (TDD)

Aplicamos **Outside-In TDD**:
1. Crear un test E2E en `backend/test/` que falle (Rojo).
2. Definir el Caso de Uso y el Puerto (Interface) en el dominio.
3. Implementar el Caso de Uso con un repositorio en memoria para que el test unitario pase (Verde).
4. Implementar el adaptador real (TypeORM) y verificar el test E2E.
5. Refactorizar.

## 🏛️ Estándares de Código

### Backend (NestJS)
- Uso de **Symbols** para Inyección de Dependencias (ver `ARCHITECTURE_PATTERNS.md`).
- Validación de DTOs con `class-validator`.
- Mappers explícitos para convertir entre capas (Persistence ↔ Domain ↔ HTTP).

### Frontend (Vue 3 / Vite)
- Uso de **Tailwind CSS 4** y **DaisyUI**.
- Arquitectura por **Features** (cada carpeta en `src/features` contiene sus propios componentes y servicios).
- State management con **Pinia**.

---
*La calidad no es negociable. Si el código no tiene tests o rompe la arquitectura hexagonal, no será mergeado.*
