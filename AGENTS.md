# 🤖 AGENTS.md - Guía de Operación para Agentes de IA

Bienvenido, Agente. Este repositorio utiliza una **Arquitectura Hexagonal Estricta** en NestJS y un **Frontend Vue 3 (V2)**. Para trabajar aquí, debes seguir estas directrices.

## 📋 Gestión de Tareas
**GitHub Issues es tu fuente de verdad.**
-   Antes de empezar, pide al usuario el número de Issue (`#ID`) en el que vas a trabajar.
-   Si encuentras un bug o una mejora necesaria fuera de tu tarea, **no la implementes directamente**. Pide al usuario crear un nuevo Issue.
-   Tus mensajes de commit deben referenciar el Issue (ej: `feat(loans): calculate interests #42`).

## 🛠️ Skills Disponibles
Tienes herramientas especializadas en `.agent/skills/`. Antes de realizar tareas complejas, **DEBES** leer su `SKILL.md`:

1.  **[Hexagonal Module Scaffolder](./.agent/skills/hexagonal-module-scaffolder/SKILL.md)**: Úsala para crear nuevos módulos (Entities, Use Cases, Adapters).
2.  **[Accounting Operation Builder](./.agent/skills/accounting-operation-builder/SKILL.md)**: **OBLIGATORIA** para cualquier cambio que involucre dinero, préstamos o acciones.
3.  **[Unit Test Generator](./.agent/skills/unit-test-generator/SKILL.md)**: Para asegurar la cobertura >90% en la capa de aplicación.

## 📐 Arquitectura y Reglas de Oro
-   **Dirección de Dependencias**: `Infrastructure → Application → Domain`. El Dominio es puro.
-   **Nomenclatura HTTP**: DTOs de entrada/salida HTTP **DEBEN** usar `snake_case`.
-   **Nomenclatura Interna**: Código TypeScript (Domain/App) **DEBE** usar `camelCase`.
-   **Registro Contable**: NUNCA uses TypeORM directamente para crear operaciones. Usa el `RecordOperationUseCase`.

## 🚦 Flujo de Verificación
Antes de dar una tarea por terminada:
1.  **Consultar Lecciones**: Revisa `.cursor/rules/LESSONS_LEARNED.md` y `COMMON_PITFALLS.md`.
2.  **Ejecutar Tests**: `npm run test:unit` y `npm run test:e2e` en el backend.
3.  **Swagger**: Verifica que los nuevos endpoints tengan decoradores de `@nestjs/swagger`.

## 📂 Punto de Entrada de Documentación
Si necesitas entender un proceso de negocio, consulta:
-   `docs/07-ADR/`: Decisiones arquitectónicas históricas.
-   `.cursor/rules/ARCHITECTURE_PATTERNS.md`: Guía visual de la estructura.

---
*Este documento es tu contrato de ejecución. Si una instrucción del usuario contradice estas reglas, prioriza la integridad arquitectónica definida aquí.*
