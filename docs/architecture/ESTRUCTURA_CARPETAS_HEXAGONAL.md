# Estructura de Carpetas: Arquitectura Hexagonal

## 🔄 Estado Actual vs Estado Objetivo

### Estructura Actual (NestJS Tradicional)

```
backend/src/
├── members/              # Módulo NestJS
│   ├── members.controller.ts
│   ├── members.service.ts
│   ├── members.module.ts
│   ├── entities/
│   │   └── member.entity.ts    # TypeORM Entity
│   └── dto/
│       └── ...
├── loans/                # Módulo NestJS
│   ├── loans.controller.ts
│   ├── loans.service.ts
│   └── ...
└── ...
```

**Problema**: Todo mezclado, difícil de testear, acoplamiento alto.

---

## ✅ Estructura Objetivo (Hexagonal)

### Organización por Capas (No por Módulos)

```
backend/src/
├── domain/               # ⭐ Capa de Dominio (PURA - sin dependencias externas)
│   ├── entities/        # Entidades de negocio
│   │   ├── member.entity.ts
│   │   ├── loan.entity.ts
│   │   └── ...
│   ├── value-objects/   # Value Objects
│   │   ├── email.value-object.ts
│   │   ├── phone.value-object.ts
│   │   ├── member-status.value-object.ts
│   │   ├── money.value-object.ts
│   │   └── ...
│   ├── services/        # Domain Services (lógica de negocio pura)
│   │   ├── debt-capacity.service.ts
│   │   └── ...
│   ├── events/          # Domain Events
│   │   └── ...
│   └── ports/           # 🔌 Interfaces (Puertos) - Contratos del dominio
│       ├── repositories/
│       │   ├── member-repository.port.ts
│       │   ├── loan-repository.port.ts
│       │   └── ...
│       └── services/
│           ├── event-bus.port.ts
│           └── transaction-manager.port.ts
│
├── application/         # ⭐ Capa de Aplicación (Orquestación)
│   ├── use-cases/       # Casos de uso (Commands)
│   │   ├── members/
│   │   │   ├── update-member.use-case.ts
│   │   │   └── delete-member.use-case.ts
│   │   ├── loans/
│   │   │   ├── create-loan.use-case.ts
│   │   │   └── disburse-loan.use-case.ts
│   │   └── ...
│   ├── queries/         # Query Handlers (Read)
│   │   ├── members/
│   │   │   ├── get-members.query-handler.ts
│   │   │   └── get-member-detail.query-handler.ts
│   │   └── ...
│   └── dto/             # DTOs de Application
│       ├── members/
│       │   ├── update-member.dto.ts
│       │   ├── delete-member.dto.ts
│       │   └── member-response.dto.ts
│       └── ...
│
└── infrastructure/       # ⭐ Capa de Infraestructura (Implementaciones)
    ├── typeorm/         # Adaptador TypeORM (Persistencia)
    │   ├── entities/    # TypeORM Entities (DB models)
    │   │   ├── member.entity.ts
    │   │   ├── loan.entity.ts
    │   │   └── ...
    │   ├── repositories/ # Implementaciones de repositorios
    │   │   ├── typeorm-member.repository.ts
    │   │   ├── typeorm-loan.repository.ts
    │   │   └── ...
    │   └── mappers/     # Mappers Domain ↔ DB
    │       ├── member.mapper.ts
    │       └── ...
    │
    ├── nestjs/          # Adaptador NestJS (HTTP)
    │   ├── http/
    │   │   └── controllers/
    │   │       ├── members.controller.ts
    │   │       ├── loans.controller.ts
    │   │       └── ...
    │   └── mappers/      # Mappers HTTP ↔ Application DTOs
    │       └── ...
    │
    └── services/        # Implementaciones de servicios transversales
        ├── event-bus/
        │   └── nestjs-event-bus.service.ts
        └── transaction-manager/
            └── typeorm-transaction-manager.ts
```

---

## 🎯 Diferencia Clave: Capas vs Módulos

### ❌ Estructura Actual (por Módulo)

```
members/
  ├── controller.ts      # HTTP
  ├── service.ts         # Lógica + Persistencia mezclada
  ├── entity.ts          # TypeORM (DB)
  └── dto.ts
```

**Problema**: Todo mezclado en un módulo.

### ✅ Estructura Hexagonal (por Capa)

```
domain/
  └── entities/member.entity.ts        # Puro, sin TypeORM
application/
  └── use-cases/members/update-member.use-case.ts
infrastructure/
  ├── typeorm/entities/member.entity.ts  # TypeORM Entity
  └── nestjs/http/controllers/members.controller.ts
```

**Ventaja**: Separación clara de responsabilidades.

---

## 📁 Estructura Completa para Members (Ejemplo)

Vamos a crear la estructura **junto a** la estructura actual (migración gradual):

```
backend/src/
│
├── domain/                          # ← NUEVA (crear ahora)
│   ├── entities/
│   │   └── member.entity.ts        # Entidad de dominio (sin TypeORM)
│   ├── value-objects/
│   │   ├── email.value-object.ts
│   │   ├── phone.value-object.ts
│   │   └── member-status.value-object.ts
│   └── ports/
│       └── repositories/
│           └── member-repository.port.ts
│
├── application/                     # ← NUEVA (crear ahora)
│   ├── use-cases/
│   │   └── members/
│   │       ├── update-member.use-case.ts
│   │       └── delete-member.use-case.ts
│   ├── queries/
│   │   └── members/
│   │       ├── get-members.query-handler.ts
│   │       └── get-member-detail.query-handler.ts
│   └── dto/
│       └── members/
│           ├── update-member.dto.ts
│           ├── delete-member.dto.ts
│           └── member-response.dto.ts
│
├── infrastructure/                   # ← NUEVA (crear ahora)
│   ├── typeorm/
│   │   ├── entities/
│   │   │   └── member.entity.ts     # TypeORM Entity (puede reutilizar código actual)
│   │   ├── repositories/
│   │   │   └── typeorm-member.repository.ts
│   │   └── mappers/
│   │       └── member.mapper.ts
│   └── nestjs/
│       ├── http/
│       │   └── controllers/
│       │       └── members.controller.ts  # Controller actualizado
│       └── mappers/
│           └── member-http.mapper.ts
│
└── members/                          # ← ACTUAL (mantener temporalmente)
    ├── members.controller.ts         # Se moverá a infrastructure/nestjs
    ├── members.service.ts            # Se convertirá en use-cases
    ├── entities/
    │   └── member.entity.ts         # Se moverá a infrastructure/typeorm/entities
    └── dto/                          # Se moverá a application/dto
```

---

## 🔄 Plan de Migración: Coexistencia Temporal

### Estrategia: Migrar Gradualmente

Durante la migración, **ambas estructuras coexistirán**:

1. **Crear nueva estructura hexagonal** en `domain/`, `application/`, `infrastructure/`
2. **Migrar Members primero** (nuestro caso)
3. **Mantener estructura antigua** para otros módulos
4. **Ir migrando módulo por módulo**

### Ejemplo: Members (Durante Migración)

```
backend/src/
├── domain/
│   ├── entities/
│   │   └── member.entity.ts              # ← NUEVO (dominio puro)
│   └── ports/
│       └── repositories/
│           └── member-repository.port.ts  # ← NUEVO
│
├── application/
│   ├── use-cases/members/...              # ← NUEVO
│   └── queries/members/...                # ← NUEVO
│
├── infrastructure/
│   ├── typeorm/
│   │   ├── entities/
│   │   │   └── member.entity.ts          # ← NUEVO (TypeORM)
│   │   └── repositories/
│   │       └── typeorm-member.repository.ts  # ← NUEVO
│   └── nestjs/
│       └── http/controllers/
│           └── members.controller.ts      # ← ACTUALIZAR (usar nuevos use-cases)
│
└── members/                               # ← MANTENER (otros módulos lo usan)
    ├── members.controller.ts             # Deprecated (redirige a nuevo)
    └── members.service.ts                # Deprecated (redirige a nuevos use-cases)
```

---

## 🛠️ Comandos para Crear la Estructura

### Paso 1: Crear Carpetas Base

```bash
cd backend/src

# Domain
mkdir -p domain/entities
mkdir -p domain/value-objects
mkdir -p domain/services
mkdir -p domain/events
mkdir -p domain/ports/repositories
mkdir -p domain/ports/services

# Application
mkdir -p application/use-cases/members
mkdir -p application/queries/members
mkdir -p application/dto/members

# Infrastructure
mkdir -p infrastructure/typeorm/entities
mkdir -p infrastructure/typeorm/repositories
mkdir -p infrastructure/typeorm/mappers
mkdir -p infrastructure/nestjs/http/controllers
mkdir -p infrastructure/nestjs/mappers
mkdir -p infrastructure/services/event-bus
mkdir -p infrastructure/services/transaction-manager
```

### Paso 2: Estructura Visual Final

```
backend/src/
│
├── domain/
│   ├── entities/              ← Entidades de negocio (puras)
│   ├── value-objects/         ← Value Objects
│   ├── services/              ← Domain Services
│   ├── events/                ← Domain Events
│   └── ports/                 ← Interfaces (puertos)
│       ├── repositories/      ← Interfaces de repositorios
│       └── services/          ← Interfaces de servicios transversales
│
├── application/
│   ├── use-cases/             ← Casos de uso (Commands)
│   │   ├── members/
│   │   ├── loans/
│   │   ├── meetings/
│   │   └── stocks/
│   ├── queries/               ← Query Handlers (Read)
│   │   ├── members/
│   │   ├── loans/
│   │   └── ...
│   └── dto/                   ← DTOs de Application
│       ├── members/
│       ├── loans/
│       └── ...
│
└── infrastructure/
    ├── typeorm/               ← Adaptador TypeORM
    │   ├── entities/          ← TypeORM Entities (DB models)
    │   ├── repositories/      ← Implementaciones de repositorios
    │   └── mappers/           ← Domain ↔ DB mappers
    ├── nestjs/                ← Adaptador NestJS
    │   ├── http/
    │   │   └── controllers/   ← Controllers HTTP
    │   └── mappers/           ← HTTP ↔ Application mappers
    └── services/              ← Implementaciones de servicios
```

---

## 📝 Reglas de Organización

### ✅ Qué va en cada capa

#### Domain/
- **Entities**: Clases de negocio puras (sin decoradores de TypeORM)
- **Value Objects**: Objetos inmutables con validación
- **Services**: Lógica de negocio que no pertenece a una entidad específica
- **Events**: Eventos de dominio
- **Ports**: Solo interfaces (interfaces TypeScript)

#### Application/
- **use-cases/**: Casos de uso que orquestan entidades y domain services
- **queries/**: Handlers de consultas (read-only)
- **dto/**: DTOs de entrada/salida de casos de uso

#### Infrastructure/
- **typeorm/entities/**: TypeORM Entities (decoradores `@Entity`)
- **typeorm/repositories/**: Implementaciones reales de repositorios
- **nestjs/http/controllers/**: Controllers NestJS
- **nestjs/mappers/**: Mappers entre HTTP DTOs y Application DTOs

---

## 🎯 Ejemplo Concreto: Members

### Archivos a Crear (Orden de Implementación)

#### Día 2: Mocks (Estructura mínima)

1. **DTOs** (application/dto/members/):
   - `update-member.dto.ts`
   - `delete-member.dto.ts`
   - `member-response.dto.ts`

2. **Query Handlers Mock** (application/queries/members/):
   - `get-members.query-handler.ts` (retorna hardcoded)
   - `get-member-detail.query-handler.ts` (retorna hardcoded)

3. **Use Cases Mock** (application/use-cases/members/):
   - `update-member.use-case.ts` (retorna hardcoded)
   - `delete-member.use-case.ts` (no hace nada)

4. **Controller Actualizado** (infrastructure/nestjs/http/controllers/):
   - `members.controller.ts` (usa los nuevos handlers/casos de uso)

#### Día 3: Lógica Real (Con interfaces)

5. **Puerto** (domain/ports/repositories/):
   - `member-repository.port.ts` (interface)

6. **Entidad de Dominio** (domain/entities/):
   - `member.entity.ts` (sin TypeORM)

7. **Value Objects** (domain/value-objects/):
   - `email.value-object.ts`
   - `phone.value-object.ts`
   - `member-status.value-object.ts`

8. **Implementaciones Reales**:
   - Actualizar query handlers y use cases para usar repositorios

---

## 🚀 Siguiente Paso: Crear Estructura Base

¿Quieres que cree todas las carpetas ahora? Puedo ejecutar los comandos para crear la estructura completa.

**Comando propuesto**:
```bash
cd backend/src
mkdir -p domain/{entities,value-objects,services,events,ports/{repositories,services}}
mkdir -p application/{use-cases/members,queries/members,dto/members}
mkdir -p infrastructure/{typeorm/{entities,repositories,mappers},nestjs/{http/controllers,mappers},services/{event-bus,transaction-manager}}
```

¿Ejecuto estos comandos para crear la estructura?

