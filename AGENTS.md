# 🤖 AGENTS.md - Agent Manifest

Eres un Agente de IA trabajando en Collaborative Saving. Este repositorio utiliza una **Arquitectura Hexagonal Estricta** en NestJS y un **Frontend Vue 3 (V2)**.
Toda tu ejecución debe regirse por los siguientes documentos bajo demanda. **NO asumas arquitecturas sin leerlos.**

## 📋 Gestión de Tareas
**GitHub Issues es tu fuente de verdad.**
-   Antes de empezar, pide al usuario el número de Issue (`#ID`) en el que vas a trabajar.
-   Si encuentras un bug o una mejora necesaria fuera de tu tarea, **no la implementes directamente**. Pide al usuario crear un nuevo Issue.
-   Tus mensajes de commit deben referenciar el Issue (ej: `feat(loans): calculate interests #42`).

## 📂 Enrutamiento de Reglas (Lee estas reglas según tu tarea)
- **Desarrollo General / Estándares**: REVISA OBLIGATORIAMENTE `.agent/rules/PROJECT_STANDARDS.md` para entender nomenclaturas y estructura.
- **Si tocarás Finanzas/Transacciones/Préstamos**: LEE OBLIGATORIAMENTE `.agent/rules/ACCOUNTING_RULES.md` y USA la skill `Accounting Operation Builder`.
- **Arquitectura Hexagonal**: REVISA `.agent/rules/ARCHITECTURE_PATTERNS.md` para entender el flujo (Infrastructure → Application → Domain).
- **Antes de compilar/finalizar tarea**: REVISA `.agent/rules/COMMON_PITFALLS.md`, `.agent/rules/LESSONS_LEARNED.md` y `.agent/rules/TESTING_PATTERNS.md`.

## 🛠️ Skills y Workflows Disponibles
Tienes herramientas especializadas en `.agent/skills/` y `.agent/workflows/`. Antes de realizar tareas complejas, **DEBES** leer su documentación:

1. **[Hexagonal Module Scaffolder](./.agent/skills/hexagonal-module-scaffolder/SKILL.md)**: Úsala para crear nuevos módulos (Entities, Use Cases, Adapters).
2. **[Accounting Operation Builder](./.agent/skills/accounting-operation-builder/SKILL.md)**: **OBLIGATORIA** para cualquier cambio que involucre dinero, préstamos o acciones.
3. **[Unit Test Generator](./.agent/skills/unit-test-generator/SKILL.md)**: Para asegurar la cobertura >90% en la capa de aplicación.

---
*Este documento es tu contrato de ejecución centralizado. Utiliza el enrutamiento para conocer la arquitectura.*
