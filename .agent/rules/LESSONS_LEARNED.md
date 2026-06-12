# Lecciones Aprendidas - Collaborative Saving

Este documento registra las lecciones aprendidas durante el desarrollo del proyecto, enfocándose en arquitectura hexagonal, testing y diseño de software.

---

## 2025-10-31 - Inversión de dependencias con Symbols en NestJS

- **Contexto**: Implementación del módulo Members V2 con arquitectura hexagonal.
- **Problema/Desafío**: Evitar el acoplamiento directo entre Use Cases/Queries y las implementaciones concretas de la base de datos (como TypeORM) en NestJS.
- **Solución**: Registrar y referenciar repositorios usando `Symbol` centralizados en `injection-tokens.ts` e inyectarlos con factories (`useFactory`) en módulos de NestJS.
- **Resultado**: Aislamiento total de las capas de negocio respecto a frameworks de persistencia.
- **Aplicabilidad**: Obligatorio en todos los módulos NestJS del backend.

---

## 2025-10-31 - Value Objects como barrera de validación

- **Contexto**: Validación de campos de entrada como emails, teléfonos y estados.
- **Problema/Desafío**: Evitar validación repetida, inconsistente o dispersa en controladores o casos de uso.
- **Solución**: Encapsular la lógica de validación directamente en el constructor de Value Objects inmutables.
- **Resultado**: Imposibilidad de crear entidades de dominio con datos inconsistentes.
- **Aplicabilidad**: Cualquier dato del dominio que requiera reglas de formato (email, ID, UUID, phone, amounts).

---

## 2025-10-31 - Factory Methods en Domain Entities

- **Contexto**: Instanciación de entidades desde controladores (HTTP/nuevo) o repositorios (Base de datos/reconstrucción).
- **Problema/Desafío**: Complejidad de constructores y manejo dispar de valores opcionales o valores por defecto.
- **Solución**: Definir métodos de creación estáticos como `create()` (genera UUIDs y valores por defecto) y `fromPersistence()` (reconstruye datos existentes).
- **Resultado**: Encapsulación limpia de la lógica de instanciación y legibilidad mejorada.
- **Aplicabilidad**: Mandatory en todas las clases de entidad de dominio.

---

## 2025-10-31 - Mappers dedicados de Persistencia

- **Contexto**: Transformación de datos entre base de datos (TypeORM) y dominio.
- **Problema/Desafío**: Errores crípticos al fallar validaciones de dominio al mapear y manejo de campos `undefined` vs `null`.
- **Solución**: Crear clases mapper estáticas con `toDomain()` envuelto en `try-catch` y `toPersistence()` convirtiendo explícitamente `undefined` a `null`.
- **Resultado**: Robustez y facilidad de debug al mapear datos desde/hacia la base de datos.
- **Aplicabilidad**: Todos los repositorios que persistan entidades de dominio.

---

## 2025-10-31 - Manejo de errores y consistencia en controladores

- **Contexto**: Exposición de endpoints HTTP a clientes REST.
- **Problema/Desafío**: Lanzamiento directo de excepciones de negocio al cliente sin formato HTTP correcto.
- **Solución**: Controladores delgados con bloques try-catch que atrapan excepciones de dominio y las convierten en excepciones HTTP estándar (`HttpException`).
- **Resultado**: API REST consistente y de fácil consumo.
- **Aplicabilidad**: Todos los controladores HTTP.

---

## 2025-10-31 - Estrategia dual para borrado lógico (Soft Delete)

- **Contexto**: Necesidad de eliminar lógicamente miembros sin perder su historial financiero.
- **Problema/Desafío**: Evitar retornar registros eliminados lógicamente en consultas comunes pero permitir recuperarlos o validarlos para evitar duplicados.
- **Solución**: Exponer `findById()` (filtra eliminados) y `findByIdWithDeleted()` (busca incluyendo borrados) en el repositorio.
- **Resultado**: Control preciso sobre registros activos y eliminados lógicamente.
- **Aplicabilidad**: Entidades con soporte de soft delete.

---

## 2025-10-31 - Separación física de DTOs por capa

- **Contexto**: payloads de entrada y salida HTTP vs aplicación.
- **Problema/Desafío**: Acoplamiento de la capa de aplicación a decoradores de NestJS (`class-validator`, `@ApiProperty`).
- **Solución**: Crear DTOs HTTP separados con validaciones en la capa de infraestructura, y DTOs planos TypeScript en la capa de aplicación.
- **Resultado**: La capa de aplicación no tiene dependencias de librerías de validación o documentación HTTP.
- **Aplicabilidad**: Todos los endpoints que requieran datos de entrada o salida estructurados.

---

## 2025-10-31 - Cobertura de excepciones no-Error en tests

- **Contexto**: Asegurar robustez en controladores y mappers ante cualquier tipo de error.
- **Problema/Desafío**: El código puede arrojar strings u objetos personalizados en lugar de la clase `Error`.
- **Solución**: Agregar pruebas de manejo de excepciones específicas para fallos que no heredan de la clase `Error`.
- **Resultado**: Cobertura robusta y prevención de comportamientos inesperados de runtime.
- **Aplicabilidad**: Cobertura de tests unitarios obligatorios.

---

## Guía de Uso para Agentes

Al capturar una nueva lección aprendida:
1. Seguir el formato conciso de este archivo.
2. Evitar bloques de código redundantes o excesivos; referenciar a guías de diseño en la carpeta `docs` si es necesario.
3. Asegurar que la aplicabilidad quede claramente definida.

**Última actualización**: 2025-10-31
