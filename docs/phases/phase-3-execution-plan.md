# 📝 Plan de Ejecución: Fase 3 - Desarrollo del MVP

Este documento desglosa las tareas necesarias para completar el Producto Mínimo Viable (MVP) de la aplicación de gestión del fondo de ahorro, considerando una arquitectura con un backend dedicado. El issue principal que agrupa estas tareas en Linear es [PLA-197](https://linear.app/issue/PLA-197).

---

## 📋 Lista de Tareas

A continuación se detallan las tareas principales, ahora agrupadas por área (Backend y Frontend).

### Backend (NestJS API)

#### 1. Configuración del Entorno de Backend
-   **Descripción:** Inicializar un nuevo proyecto NestJS. Configurar la conexión a la base de datos de Supabase, variables de entorno y el módulo de autenticación para validar los JWT de Supabase.
-   **Tecnologías:** NestJS, TypeScript, PostgreSQL (node-postgres), Docker (opcional, para desarrollo local).
-   **Entregable:** Repositorio en GitHub (puede ser un monorepo o uno separado) con la estructura del proyecto NestJS.

#### 2. Implementación del Modelo de Datos (Migraciones)
-   **Descripción:** Implementar en la base de datos de Supabase el modelo de "Libro Contable" normalizado.
-   **Entregable:** Scripts de migración (usando una herramienta como `node-pg-migrate` o las propias de Supabase) con todas las tablas y relaciones.

#### 3. API - Módulo de Autenticación y Perfiles
-   **Descripción:** Crear los endpoints para gestionar perfiles de usuario. La creación de usuarios se delega a Supabase, pero el backend gestionará los datos del perfil local.
-   **Entregable:** Endpoints para obtener y actualizar perfiles de usuario, protegidos por autenticación.

#### 4. API - Lógica de Negocio y Transacciones
-   **Descripción:** Crear los servicios y controladores para manejar las operaciones financieras clave: registrar aportes, otorgar préstamos y calcular saldos. Aquí residirá la lógica crítica del libro contable.
-   **Entregable:** Endpoints `POST /contributions`, `POST /loans`, `GET /members/{id}/balance`. Lógica de servicios robusta y con pruebas unitarias.

#### 5. API - Cálculo del Valor de la Acción
-   **Descripción:** Implementar un endpoint que calcule el valor actual de la acción basándose en el estado financiero total del fondo (activos vs. pasivos).
-   **Entregable:** Un endpoint `GET /stocks/value` que retorne el valor calculado.

### Frontend (Vue.js App)

#### 6. Configuración del Entorno de Frontend
-   **Descripción:** Inicializar el proyecto Vue.js, instalar Tailwind/daisyUI y configurar el cliente de Supabase solo para autenticación y una librería (como Axios) para comunicarse con la API de NestJS.
-   **Tecnologías:** Vue.js 3, Vite, Tailwind CSS, daisyUI, `supabase-js`, `axios`.
-   **Entregable:** Estructura inicial del proyecto frontend lista para desarrollar componentes.

#### 7. Componentes de Autenticación y Perfil
-   **Descripción:** Crear las vistas y componentes para registro (usando Supabase), inicio de sesión (Supabase) y la página de perfil (obteniendo datos de nuestra API).
-   **Entregable:** Flujo de autenticación funcional y vista de perfil que consume datos del backend.

#### 8. Interfaz de Administración
-   **Descripción:** Desarrollar las vistas (protegidas por rol) que permitirán a los administradores registrar aportes y préstamos, consumiendo los endpoints correspondientes de la API de NestJS.
-   **Entregable:** Formularios e interfaces para la gestión administrativa.

#### 9. Dashboard del Socio
-   **Descripción:** Implementar la vista principal del socio, consumiendo los endpoints del backend para mostrar el saldo actual, el historial de transacciones y el valor de la acción.
-   **Entregable:** Dashboard funcional que presenta la información financiera del socio en tiempo real.

### General

#### 10. Despliegue y Pruebas E2E
-   **Descripción:** Configurar el despliegue continuo para ambos, frontend (Vercel) y backend (Render/Railway). Realizar una ronda de pruebas de extremo a extremo.
-   **Entregable:** Aplicación completamente desplegada y funcional en URLs públicas. 