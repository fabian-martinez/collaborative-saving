# 🎨 Fase 2: Diseño de la Solución

---

## 🏛️ 1. Arquitectura y Stack Tecnológico

Tras un análisis colaborativo, hemos decidido optar por una arquitectura moderna y eficiente que nos permita desarrollar de manera ágil y sostenible, ideal para un proyecto no lucrativo.

**Decisiones clave:**
-   **Frontend:** Vue.js 3
-   **Backend:** Supabase (Backend as a Service)

### Diagrama de Arquitectura del Sistema

Este diagrama muestra la estructura general de la aplicación, identificando los componentes principales y sus interacciones.

```mermaid
graph TD
    subgraph "Cliente (Navegador)"
        A["Aplicación Frontend<br/>(Vue.js)"]
    end

    subgraph "Plataforma de Hosting"
        B["Vercel / Netlify"]
    end

    subgraph "Backend as a Service (Supabase)"
        D["Servicio de<br/>Autenticación"]
        E["Base de Datos<br/>(PostgreSQL)"]
        F["Almacenamiento<br/>(Storage)"]
    end

    A -- "Valida usuarios con" --> D
    A -- "Accede a los datos vía API" --> E
    A -- "Guarda archivos en" --> F
    B -- "Despliega y sirve" --> A

    style A fill:#4FC08D,stroke:#34495E,stroke-width:2px,color:#fff
    style B fill:#f1f1f1,stroke:#000,stroke-width:2px
    style D fill:#3ECF8E,stroke:#2A2A2A,stroke-width:2px,color:#fff
    style E fill:#3ECF8E,stroke:#2A2A2A,stroke-width:2px,color:#fff
    style F fill:#3ECF8E,stroke:#2A2A2A,stroke-width:2px,color:#fff
```

### Stack Tecnológico Detallado

| Componente      | Tecnología        | Razón de la elección                                                                                   |
|-----------------|-------------------|--------------------------------------------------------------------------------------------------------|
| **Frontend**    | **Vue.js 3**      | Framework progresivo, con una curva de aprendizaje amigable y un excelente rendimiento para SPAs.        |
| **UI Framework**| **Tailwind CSS + daisyUI** | Se usará Tailwind por su flexibilidad para crear diseños a medida. Se añade daisyUI para disponer de componentes pre-construidos (botones, modales, etc.), acelerando el desarrollo. |
| **Backend**     | **Supabase**      | Solución todo-en-uno que nos provee base de datos, autenticación y APIs, acelerando el desarrollo.     |
| **Base de Datos**| **PostgreSQL**    | Base de datos relacional potente, ideal para la estructura de datos del fondo. Gestionada por Supabase. |
| **Hosting**     | **Vercel/Netlify**| Plataformas optimizadas para el despliegue de aplicaciones frontend modernas.                             |
```