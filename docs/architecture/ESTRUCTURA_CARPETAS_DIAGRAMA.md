# 📁 Diagrama Visual: Estructura de Carpetas Hexagonal

## 🎯 Estructura para Members (Primer Módulo a Migrar)

```
backend/src/
│
├── domain/                              ← 🟦 DOMINIO (Puro)
│   │
│   ├── entities/
│   │   └── member.entity.ts            # Entidad de negocio (sin TypeORM)
│   │
│   ├── value-objects/
│   │   ├── email.value-object.ts       # VO: Email con validación
│   │   ├── phone.value-object.ts       # VO: Phone con validación
│   │   └── member-status.value-object.ts # VO: Status (active/inactive)
│   │
│   └── ports/                           # 🔌 Solo INTERFACES (Puertos)
│       └── repositories/
│           └── member-repository.port.ts
│               # interface MemberRepository {
│               #   findById(id: string): Promise<Member | null>
│               #   findActive(): Promise<Member[]>
│               #   save(member: Member): Promise<Member>
│               #   softDelete(id: string): Promise<void>
│               # }
│
├── application/                         ← 🟨 APLICACIÓN (Orquestación)
│   │
│   ├── use-cases/                       # Commands (escriben)
│   │   └── members/
│   │       ├── update-member.use-case.ts
│   │       └── delete-member.use-case.ts
│   │
│   ├── queries/                         # Queries (leen)
│   │   └── members/
│   │       ├── get-members.query-handler.ts
│   │       └── get-member-detail.query-handler.ts
│   │
│   └── dto/                             # DTOs de Application
│       └── members/
│           ├── update-member.dto.ts
│           ├── delete-member.dto.ts
│           └── member-response.dto.ts
│
└── infrastructure/                      ← 🟩 INFRAESTRUCTURA (Implementaciones)
    │
    ├── typeorm/                         # Adaptador TypeORM (DB)
    │   ├── entities/
    │   │   └── member.entity.ts         # TypeORM Entity (@Entity decorator)
    │   │
    │   ├── repositories/
    │   │   └── typeorm-member.repository.ts
    │   │       # class TypeOrmMemberRepository implements MemberRepository {
    │   │       #   // Implementación real usando TypeORM
    │   │       # }
    │   │
    │   └── mappers/
    │       └── member.mapper.ts
    │           # static toDomain(persistence): Member
    │           # static toPersistence(domain): MemberEntity
    │
    └── nestjs/                           # Adaptador NestJS (HTTP)
        ├── http/
        │   └── controllers/
        │       └── members.controller.ts
        │           # @Controller('members')
        │           # class MembersController {
        │           #   constructor(
        │           #     private getMembersQuery: GetMembersQueryHandler,
        │           #     private updateUseCase: UpdateMemberUseCase,
        │           #   ) {}
        │           # }
        │
        └── mappers/
            └── member-http.mapper.ts     # HTTP DTO ↔ Application DTO
```

---

## 🔄 Flujo de Dependencias

```
┌─────────────────────────────────────────────────────────┐
│ Controller (Infrastructure)                             │
│  ↓ usa                                                   │
│ Query Handlers / Use Cases (Application)                │
│  ↓ usa                                                   │
│ Interfaces (Ports en Domain)                            │
│  ↑ implementado por                                     │
│ Repository TypeORM (Infrastructure)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Comparación: Archivo por Archivo

### ❌ Estructura Actual (members/)

```
members/
├── members.controller.ts          # HTTP
├── members.service.ts             # Lógica + Persistencia
├── members.module.ts              # Configuración NestJS
├── entities/
│   └── member.entity.ts          # TypeORM Entity
└── dto/
    └── member-detail-response.dto.ts
```

### ✅ Estructura Hexagonal (separada por capas)

```
domain/
└── entities/
    └── member.entity.ts          # Puro, sin TypeORM

application/
├── use-cases/members/
│   └── update-member.use-case.ts
├── queries/members/
│   └── get-members.query-handler.ts
└── dto/members/
    └── member-response.dto.ts

infrastructure/
├── typeorm/entities/
│   └── member.entity.ts          # TypeORM Entity
├── typeorm/repositories/
│   └── typeorm-member.repository.ts
└── nestjs/http/controllers/
    └── members.controller.ts
```

---

## 🎯 Archivos que Vamos a Crear (Día 2)

### 1. Domain (Interfaces primero)

```
domain/
└── ports/
    └── repositories/
        └── member-repository.port.ts     # ← Interface
```

### 2. Application (DTOs y Handlers mock)

```
application/
├── dto/members/
│   ├── update-member.dto.ts
│   ├── delete-member.dto.ts
│   └── member-response.dto.ts
├── queries/members/
│   ├── get-members.query-handler.ts     # Mock
│   └── get-member-detail.query-handler.ts  # Mock
└── use-cases/members/
    ├── update-member.use-case.ts        # Mock
    └── delete-member.use-case.ts        # Mock
```

### 3. Infrastructure (Controller actualizado)

```
infrastructure/
└── nestjs/
    └── http/
        └── controllers/
            └── members.controller.ts     # Usa los handlers/use-cases nuevos
```

---

## ✅ Checklist: Crear Estructura

- [ ] Crear carpetas base (domain, application, infrastructure)
- [ ] Crear subcarpetas específicas para Members
- [ ] Crear archivos mock (Día 2)
- [ ] Actualizar controller para usar nuevos handlers

---

¿Quieres que cree estas carpetas ahora?

