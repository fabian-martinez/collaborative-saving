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

---

## 💾 2. Diseño de la Base de Datos

Para manejar la complejidad de las transacciones financieras, hemos optado por un **modelo de "Libro Contable" normalizado**. Este enfoque proporciona máxima flexibilidad, trazabilidad y robustez. La decisión clave es que **no se almacenarán saldos ni totales precalculados**; en su lugar, todos los balances se calcularán al vuelo a partir de los registros de transacciones para garantizar la máxima integridad de los datos. La migración de datos existentes se manejará creando "asientos de apertura" o de "saldo inicial".

### Diagrama Entidad-Relación (ERD) Final Normalizado

Este diagrama representa la estructura completa y final de la base de datos que se implementará.

```mermaid
erDiagram
    Members {
        UUID id PK
        String name
        String email
        String identification_number
    }

    Operations {
        UUID id PK
        UUID member_id FK
        TIMESTAMP date
        String description
    }

    LedgerEntries {
        UUID id PK
        UUID operation_id FK
        UUID member_id FK
        String account_type
        Decimal amount
    }

    %% --- Transaction Details ---
    StockTrades {
        UUID ledger_entry_id PK, FK
        UUID stock_id FK
        Integer quantity
        Decimal stock_value_at_trade
    }

    LoanTransactionDetails {
        UUID ledger_entry_id PK, FK
        UUID loan_id FK
        String type "'desembolso', 'pago' o 'saldo_inicial'"
        Decimal principal_amount
        Decimal interest_amount
    }

    %% --- Main Business Entities ---
    Stocks {
        UUID id PK
        String type
        Decimal current_value
    }
    
    Loans {
        UUID id PK
        UUID member_id FK
        Decimal approved_amount
        Float interest_rate
        String status "'activo', 'pagado' o 'migrado'"
    }

    Insurance {
        UUID id PK
        UUID member_id FK
        Decimal total_coverage
    }

    %% --- Reporting & Auditing ---
    MeetingReports {
        UUID id PK
        DATE date
        String summary_data_json
    }

    StockValueHistory {
        UUID id PK
        UUID stock_id FK
        DATE date
        Decimal value
    }
    
    FundAssets {
        UUID id PK
        String asset_type
        Decimal total
    }

    AuditLog {
        UUID id PK
        TIMESTAMP timestamp
        String action
        String user_id
    }

    %% --- Relationships ---
    Members ||--o{ Operations : "inicia"
    Members ||--o{ LedgerEntries : "afecta_a"
    Members ||--o{ Loans : "tiene"
    Members ||--o{ Insurance : "tiene"

    Operations ||--o{ LedgerEntries : "causa"
    
    LedgerEntries |o--|| StockTrades : "es_detallado_por"
    LedgerEntries |o--|| LoanTransactionDetails : "es_detallado_por"

    LoanTransactionDetails }o--|| Loans : "sobre_prestamo"
    StockTrades }o--|| Stocks : "de_tipo"
    
    Stocks ||--o{ StockValueHistory : "tiene_historial"
```