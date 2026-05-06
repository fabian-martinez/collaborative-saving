# 13. Decisiones Técnicas Frontend V2

Date: 2024-12-01 (Migrado)

## Status

Accepted

## Context

Durante el desarrollo de la V2 del Frontend, se han tomado varias decisiones técnicas para estandarizar el desarrollo y asegurar una base de código mantenible, escalable y con tipado fuerte. Estas decisiones complementan la decisión de utilizar una organización por features (ADR-004).

## Decisiones

### 1. snake_case Direct Usage

**Decisión**: Trabajar directamente con `snake_case` del backend sin normalización.

**Contexto**: La API V2 (NestJS) usa `snake_case` consistentemente en todos sus endpoints, tal cual se extrae de la base de datos PostgreSQL.

**Consecuencias**:
- ✅ Sin overhead de transformación en las peticiones/respuestas HTTP.
- ✅ Consistencia directa con el modelo de datos del backend.
- ⚠️ Requiere disciplina en el código frontend, ya que en JavaScript/TypeScript la convención general es `camelCase`.

### 2. Pinia para State Management

**Decisión**: Usar Pinia en lugar de Vuex.

**Contexto**: Pinia es la solución de manejo de estado oficial y moderna de Vue 3, diseñada para integrarse de forma natural con la Composition API.

**Consecuencias**:
- ✅ Mejor soporte y deducción de tipos con TypeScript.
- ✅ API mucho más simple (sin mutations, directamente state, getters, y actions).
- ✅ DevTools integradas.
- ✅ Menos boilerplate en general en comparación con Vuex.

### 3. Mocks para Desarrollo

**Decisión**: Utilizar un sistema de mocks activable mediante variable de entorno (`VITE_USE_MOCKS=true`).

**Contexto**: Frecuentemente se requiere desarrollar vistas y flujos en el frontend sin tener el backend corriendo o con data específica y predecible.

**Consecuencias**:
- ✅ Permite desarrollo frontend independiente y en paralelo.
- ✅ Facilita el testing (manual y automatizado).
- ⚠️ Los mocks deben mantenerse actualizados manualmente si el esquema de la API cambia.

### 4. Composition API Exclusivo

**Decisión**: Usar solo Composition API (`<script setup>`), prohibiendo el uso de Options API en componentes nuevos.

**Contexto**: Vue 3 recomienda fuertemente Composition API para nuevos proyectos debido a su superioridad en la reutilización de código (Composables) y soporte TypeScript.

**Consecuencias**:
- ✅ Mejor organización de lógica basada en funcionalidad en lugar de opciones del framework.
- ✅ Facilita crear y extraer composables reutilizables.
- ✅ Excelente tipado estricto.
- ⚠️ Requiere una curva de aprendizaje para desarrolladores que solo conocen Vue 2 (Options API).
