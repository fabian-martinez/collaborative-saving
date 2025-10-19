# 0003. Adopción de un Backend Dedicado con NestJS

*   **Fecha:** 2024-07-25
*   **Estado:** Aceptado

## Contexto y Problema

Durante el diseño inicial (Fase 2), se propuso utilizar Supabase como un "Backend as a Service" (BaaS) completo, incluyendo el uso de `Supabase Functions` (basadas en Deno) para toda la lógica de negocio.

La preocupación principal que surgió es la mantenibilidad y la curva de aprendizaje del ecosistema de Deno y el flujo de trabajo específico de `Supabase Functions`. Para una aplicación con una lógica financiera compleja y crítica como un sistema de libro contable, la capacidad de estructurar, probar y depurar el código de manera robusta es primordial. El equipo considera que el entorno de las funciones serverless de Supabase podría volverse difícil de gestionar a medida que la complejidad del proyecto crezca.

## Decisión

Se ha decidido pivotar desde el uso de `Supabase Functions` hacia la implementación de un **servidor de backend dedicado utilizando el framework NestJS (Node.js/TypeScript)** con **arquitectura hexagonal**.

Este backend se ejecutará como un servicio independiente y será el único responsable de toda la lógica de negocio. Se comunicará con la base de datos PostgreSQL de Supabase y utilizará `Supabase Auth` para la gestión de la autenticación, pero no dependerá de las `Supabase Functions`.

### Actualización: Migración a Arquitectura Hexagonal (ADR-0010)

**Fecha de actualización**: $(date)

El sistema ha evolucionado hacia una **arquitectura hexagonal (Ports and Adapters)** para resolver problemas de mantenibilidad, escalabilidad y calidad del código identificados en el análisis arquitectónico.

**Nueva estructura del backend:**
- **Domain Layer**: Entidades, Value Objects, reglas de negocio
- **Application Layer**: Use Cases, DTOs, servicios de aplicación  
- **Infrastructure Layer**: Repositorios, Controllers, servicios externos

**Componentes de la Arquitectura Final:**

*   **Frontend:** Vue.js 3
*   **Backend:** API REST/GraphQL construida con NestJS.
*   **Base de Datos:** PostgreSQL (gestionada a través de Supabase).
*   **Autenticación:** Supabase Auth (el backend de NestJS validará los JWTs emitidos por Supabase).
*   **Almacenamiento de Archivos:** Supabase Storage (el frontend interactuará directamente con él, posiblemente con URLs firmadas generadas por el backend).
*   **Hosting:**
    *   **Frontend:** Vercel / Netlify.
    *   **Backend:** Render / Railway u otra plataforma similar de Platform as a Service (PaaS).

## Consecuencias

### Positivas

1.  **Mayor Control y Estructura:** NestJS impone una arquitectura modular y opinada (basada en Módulos, Controladores y Servicios) que es ideal para manejar la complejidad de la lógica financiera, manteniéndola organizada y testeable.
2.  **Ecosistema Maduro:** Se aprovecha el vasto ecosistema de paquetes de Node.js/NPM y la familiaridad del equipo con TypeScript en un entorno de servidor.
3.  **Facilidad para Pruebas:** Es significativamente más sencillo implementar pruebas unitarias, de integración y end-to-end en una aplicación NestJS estándar en comparación con un conjunto de funciones serverless.
4.  **Separación de Responsabilidades Clara:** Refuerza la división entre el frontend (capa de presentación) y el backend (capa de lógica de negocio y datos).
5.  **Flexibilidad de Hosting:** No estamos atados a un único proveedor para la lógica de servidor.

### Negativas

1.  **Mayor Complejidad de Infraestructura:** Requiere la gestión y el despliegue de un servicio adicional (el servidor NestJS), lo que introduce un nuevo componente en el ciclo de vida del desarrollo.
2.  **Posible Aumento de Costos:** Aunque existen generosos planes gratuitos en plataformas como Render o Railway, podría implicar un costo adicional en el futuro en comparación con el uso exclusivo de la infraestructura de Supabase.
3.  **Comunicación de Red Adicional:** Las operaciones que antes podrían haberse resuelto dentro del ecosistema de Supabase ahora requieren una llamada de red desde el cliente al backend. 