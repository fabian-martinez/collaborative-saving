# 📁 Estructura del Proyecto (Arquitectura Hexagonal)

Este documento describe la organización de carpetas del backend siguiendo los principios de **Arquitectura Hexagonal (Ports & Adapters)**.

## 🔄 Organización por Capas

A diferencia de la estructura tradicional de NestJS (por módulos), el sistema se organiza en capas concéntricas donde las dependencias siempre apuntan hacia adentro.

```text
backend/src/
├── domain/               # ⭐ Capa de Dominio (PURA)
│   ├── entities/        # Entidades de negocio (sin decoradores de persistencia)
│   ├── value-objects/   # Objetos inmutables con validación (Email, Money, etc.)
│   ├── services/        # Domain Services (lógica que cruza múltiples entidades)
│   └── ports/           # 🔌 Interfaces (Contratos del dominio)
│       ├── repositories/ # Definición de acceso a datos
│       └── services/     # Servicios transversales (TransactionManager, EventBus)
│
├── application/         # ⭐ Capa de Aplicación (Orquestación)
│   ├── use-cases/       # Comandos que cambian el estado (Write)
│   ├── queries/         # Consultas que leen el estado (Read)
│   └── dto/             # Objetos de transferencia de datos de la aplicación
│
└── infrastructure/       # ⭐ Capa de Infraestructura (Implementaciones)
    ├── typeorm/         # Adaptador de persistencia (SQL)
    │   ├── entities/    # Modelos de base de datos (@Entity)
    │   ├── repositories/ # Implementación real de los puertos
    │   └── mappers/     # Conversión entre Domain Entity ↔ DB Entity
    ├── nestjs/          # Adaptador de framework (HTTP)
    │   ├── http/        # Controladores y DTOs de API
    │   └── mappers/     # Conversión entre HTTP DTO ↔ Application DTO
    └── services/        # Implementaciones de servicios transversales
```

## 🔌 El Concepto de Puertos (Ports)

Los **Puertos** son interfaces que definen lo que el dominio necesita del mundo exterior sin acoplarse a una tecnología específica.

- **Port (Interface)**: Define el contrato en `domain/ports/`.
- **Adapter (Implementation)**: Implementa el contrato en `infrastructure/`.

Esto permite, por ejemplo, cambiar TypeORM por cualquier otro ORM o usar repositorios en memoria para los tests unitarios sin tocar una sola línea de la lógica de negocio.

## ✅ Regla de Oro de Dependencias

1. **Dominio**: No depende de nada.
2. **Aplicación**: Depende solo del Dominio.
3. **Infraestructura**: Depende de Aplicación y Dominio.

> **Nunca** debe haber un import de `infrastructure` dentro de `domain` o `application`.
