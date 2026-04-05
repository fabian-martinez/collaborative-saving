# Arquitectura v2 - Hexagonal + TDD

> Arquitectura objetivo para la refactorización del sistema Collaborative Saving

## Resumen ejecutivo

La arquitectura objetivo adopta un enfoque hexagonal (ports & adapters) con énfasis en dominio y casos de uso, eliminando duplicación, separando responsabilidades y habilitando TDD como práctica base. La migración será por funcionalidad, manteniendo los endpoints actuales y la compatibilidad de datos.

## Principios y lineamientos

- **Separación estricta de capas**: `domain` (puro), `application` (use cases), `infrastructure` (adapters/repos/orm).
- **Dependencias hacia adentro**: `infrastructure → application → domain` (nunca al revés).
- **Contratos estables en interfaces**: Los puertos (interfaces) definen el contrato del dominio.
- **Adaptadores reversibles**: La infraestructura implementa los puertos, permitiendo cambiar implementaciones sin afectar el dominio.
- **TDD como práctica base**: Red-green-refactor por funcionalidad migrada; cobertura objetivo 90%+ en cada módulo migrado.
- **Naming en inglés**: Código y componentes en inglés; comentarios concisos y con intención.

## Estructura de capas

```
backend/src/
├── domain/           # Capa de dominio (pura, sin dependencias externas)
│   ├── entities/    # Entidades de dominio
│   ├── value-objects/ # Value Objects
│   ├── services/     # Domain Services
│   ├── events/       # Domain Events
│   └── ports/        # Interfaces (Puertos) - Contratos del dominio
│       ├── repositories/  # Interfaces de repositorios
│       └── services/     # Interfaces de servicios transversales
│           ├── event-bus.port.ts
│           └── transaction-manager.port.ts
├── application/      # Capa de aplicación (orquestación)
│   ├── use-cases/    # Casos de uso organizados por dominio
│   └── dto/          # DTOs (Request/Response)
└── infrastructure/   # Capa de infraestructura (implementaciones por adaptador)
    ├── typeorm/      # Adaptador TypeORM
    │   ├── repositories/  # Implementaciones de repositorios
    │   └── config/        # Configuración TypeORM
    ├── nestjs/       # Adaptador NestJS
    │   ├── http/          # Controladores HTTP
    │   └── mappers/       # Mappers DTO ↔ Domain
    ├── in-memory/    # Adaptador en memoria (para tests)
    │   └── repositories/  # Repositorios en memoria
    └── services/     # Implementaciones de servicios transversales
        ├── event-bus/
        │   └── nestjs-event-bus.service.ts
        └── transaction-manager/
            └── typeorm-transaction-manager.ts
```

### Regla de dependencias

```
┌─────────────────────┐
│  Infrastructure     │ → Implementa puertos definidos en domain
│  (Implementaciones) │   Usa casos de uso de application
└─────────────────────┘
          ↓
┌─────────────────────┐
│  Application        │ → Orquesta entidades y domain services
│  (Use Cases)        │   Usa puertos (interfaces) de domain
└─────────────────────┘
          ↓
┌─────────────────────┐
│  Domain             │ → No depende de nada externo
│  (Entidades, VOs,   │   Define contratos (puertos)
│   Services, Events) │
└─────────────────────┘
```

## Diagramas arquitectónicos

Ver [DIAGRAMAS_ARQUITECTURA.md](./DIAGRAMAS_ARQUITECTURA.md) para:
- Diagrama de Contexto (C4)
- Diagrama de Contenedores (C4)
- Diagrama de Componentes (C4) - Alineado con arquitectura hexagonal
- ERD del dominio
- State Diagrams (StockSubscription, Loan, Meeting, PendingMemberPayment, Member)
- Sequence Diagrams (casos de uso principales)

## Documentación por capa

- **[DOMINIO.md](./DOMINIO.md)**: Entidades, Value Objects, Domain Services, Eventos, Invariantes y Puertos (interfaces)
- **[APLICACION.md](./APLICACION.md)**: Casos de uso, DTOs y estructura de la capa de aplicación
- **[INFRAESTRUCTURA.md](./INFRAESTRUCTURA.md)**: Repositorios concretos, adaptadores HTTP, mappers, servicios transversales

## Decisiones arquitectónicas clave

### 1. Puertos en Domain

**Decisión**: Los puertos (interfaces) pertenecen a la capa de dominio, no a la capa de aplicación.

**Razón**: Los puertos definen el contrato que el dominio necesita. Es el dominio quien especifica "qué necesita", no la aplicación.

**Estructura**:
```
domain/
└── ports/
    ├── repositories/  # Interfaces de repositorios
    └── services/      # Interfaces de servicios transversales
```

### 2. Organización por dominio de negocio

**Decisión**: Los casos de uso se organizan por dominio de negocio (stocks, loans, meetings), no por entidades técnicas.

**Razón**: Facilita encontrar funcionalidades relacionadas y refleja mejor la estructura del negocio.

### 3. Estrategia para pagos parciales (sin modificar BD)

**Decisión**: Soportar múltiples pagos parciales usando el esquema actual de `PendingMemberPayment` sin modificarlo.

**Estrategia**:
- Lote original: `status = 'pending'`, `reference_meeting_id = null`
- Pagos parciales: registros con `status = 'paid'`, `type = 'partial_settlement'`, `reference_meeting_id = id_original`
- Cálculo de restante: `amount_original - sum(amount de parciales)`

Ver detalles en [APLICACION.md](./APLICACION.md#estrategia-para-pagos-parciales).

## Estrategia de migración

1. **Infraestructura base**: Implementar repositorios base y estructura hexagonal
2. **Migración por funcionalidad**: Members → Stocks → Loans → Meetings → Accounting
3. **Completar funcionalidades faltantes**: Payment Board, Planner (con nueva arquitectura)

## Criterios de aceptación

- ✅ Separación de capas implementada en módulos migrados
- ✅ Contratos de puertos estables y testeados
- ✅ Endpoints actuales funcionando sin regresiones
- ✅ Cobertura ≥ 90% y tests de integración pasando
- ✅ Sin dependencias circulares
- ✅ Domain layer sin dependencias externas

## Referencias

- [Plan de Mejoras (detalle histórico)](./PLAN_MEJORAS_ARQUITECTURA.md)
- [Arquitectura Actual](./ARQUITECTURA_ACTUAL.md)
- [Diagramas de Arquitectura](./DIAGRAMAS_ARQUITECTURA.md)

