# ADR-0010: Migración a Arquitectura Hexagonal

**Fecha**: $(date)  
**Estado**: Aceptado  
**Decisores**: Product Owner, Arquitecto de Software  
**Consultores**: Equipo de Desarrollo  

## Contexto

El sistema de ahorro colaborativo actual presenta **problemas arquitectónicos significativos** que afectan la mantenibilidad, escalabilidad y calidad del código:

### Problemas Identificados
- **Servicios sobrecargados**: MeetingsService (673 líneas), StocksService (1079 líneas)
- **Violaciones del SRP**: Múltiples responsabilidades en un solo servicio
- **Duplicación de código**: Validaciones y transacciones repetidas en múltiples servicios
- **Acoplamiento excesivo**: Dependencias circulares entre módulos
- **Cobertura de tests crítica**: Solo 8% de cobertura actual
- **Consultas N+1**: Problemas de performance identificados

### Análisis de Funcionalidades
El sistema tiene **8 de 10 funcionalidades principales implementadas** pero con problemas de calidad que requieren refactoring arquitectónico para resolver de manera definitiva.

## Decisión

**Migrar el sistema actual a una arquitectura hexagonal (Ports and Adapters)** manteniendo la funcionalidad existente mediante **migración escalonada por funcionalidad** e implementando **TDD desde el inicio**.

### Arquitectura Hexagonal Adoptada

#### 1. Estructura de Capas
```
┌─────────────────────────────────────────┐
│           Infrastructure Layer          │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Controllers │  │   Repositories  │   │
│  │     API     │  │   PostgreSQL    │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│           Application Layer             │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Use Cases  │  │ Application     │   │
│  │             │  │ Services        │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│              Domain Layer               │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Entities   │  │ Domain Services │   │
│  │ Value Objects│  │   & Rules      │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

#### 2. Separación de Responsabilidades

**Domain Layer (Dominio)**
- **Entidades**: Member, Stock, Loan, Meeting, Operation
- **Value Objects**: Money, StockValue, DebtCapacity
- **Reglas de negocio**: Servicios de dominio, validaciones
- **Eventos de dominio**: MemberCreated, StockPurchased, LoanDisbursed

**Application Layer (Aplicación)**
- **Use Cases**: CreateMember, BuyStock, ProcessLoanDisbursement
- **DTOs**: Request/Response objects
- **Servicios de aplicación**: Orquestación de casos de uso
- **Interfaces**: Definición de contratos para infraestructura

**Infrastructure Layer (Infraestructura)**
- **Repositorios**: PostgreSQLMemberRepository, PostgreSQLStockRepository
- **APIs**: NestJS Controllers, REST Endpoints
- **Servicios externos**: EmailService, ReportGenerator
- **Base de datos**: TypeORM entities, Database connections

### Estrategia de Migración

#### 1. Principios de Migración
- **Funcionalidad mantenida**: Sistema actual sigue funcionando
- **Migración escalonada**: Por funcionalidad, no por capas
- **TDD desde el inicio**: Calidad garantizada
- **Sin regresiones**: Tests de integración continuos
- **Compatibilidad de datos**: Estructura de base de datos mantenida

#### 2. Proceso de Migración por Funcionalidad
1. **Análisis**: Identificar servicios y controladores existentes
2. **Diseño**: Definir entidades, use cases y interfaces
3. **Implementación**: TDD (Red-Green-Refactor)
4. **Integración**: Migración gradual de controladores
5. **Validación**: Tests de integración y eliminación de código obsoleto

#### 3. Timeline de Migración
- **FASE 0**: Diseño arquitectónico (2-3 semanas)
- **FASE 1**: Infraestructura base (2-3 semanas)
- **FASE 2**: Migración por funcionalidad (8-10 semanas)
- **FASE 3**: Funcionalidades faltantes (2-3 semanas)

## Alternativas Consideradas

### Opción 1: Refactoring Incremental
- **Pros**: Menor riesgo, cambios graduales
- **Contras**: No resuelve problemas arquitectónicos fundamentales, mantiene deuda técnica

### Opción 2: Reescritura Completa
- **Pros**: Arquitectura limpia desde el inicio
- **Contras**: Alto riesgo, pérdida de funcionalidad, tiempo excesivo

### Opción 3: Arquitectura Hexagonal (Elegida)
- **Pros**: Resuelve problemas fundamentales, mantiene funcionalidad, migración segura
- **Contras**: Tiempo de migración (12-16 semanas), curva de aprendizaje

## Consecuencias

### Positivas

1. **Calidad Garantizada**: TDD asegura 90%+ de cobertura de tests
2. **Arquitectura Escalable**: Hexagonal permite crecimiento futuro sin refactoring
3. **Mantenibilidad**: Separación clara de responsabilidades
4. **Testabilidad**: Dominio independiente de infraestructura
5. **Flexibilidad**: Fácil intercambio de tecnologías de infraestructura
6. **Migración Segura**: Sin pérdida de funcionalidad durante migración
7. **Base Sólida**: Preparado para futuras mejoras y expansión

### Negativas

1. **Tiempo de Migración**: 12-16 semanas para completar migración
2. **Curva de Aprendizaje**: Equipo debe aprender arquitectura hexagonal
3. **Complejidad Inicial**: Mayor complejidad en diseño inicial
4. **Doble Mantenimiento**: Mantener código actual durante migración
5. **Inversión de Tiempo**: Tiempo significativo en diseño y planificación

### Riesgos y Mitigaciones

#### Riesgo 1: Regresiones durante migración
- **Mitigación**: Tests de integración continuos, migración por funcionalidad

#### Riesgo 2: Tiempo de migración excesivo
- **Mitigación**: Timeline realista, migración escalonada, validación continua

#### Riesgo 3: Resistencia del equipo
- **Mitigación**: Capacitación, documentación, beneficios claros

## Criterios de Éxito

### Criterios Técnicos
- **Arquitectura hexagonal implementada** en 100% del sistema
- **TDD implementado** con 90%+ de cobertura
- **Funcionalidad actual mantenida** durante toda la migración
- **Sin regresiones** en funcionalidad existente
- **Performance mejorada** respecto al sistema actual

### Criterios de Negocio
- **Todos los flujos de negocio** funcionan end-to-end
- **Sistema contable** mantiene balance automático
- **APIs existentes** siguen funcionando
- **Nuevas funcionalidades** implementadas correctamente

### Métricas de Progreso
- **Funcionalidades migradas**: 5/5 funcionalidades principales
- **Cobertura de tests**: Auto-incremento a 90%+
- **Tiempo de respuesta**: <200ms para consultas básicas
- **Regresiones**: 0 regresiones permitidas

## Implementación

### Fase 0: Diseño (2-3 semanas)
- Definir entidades de dominio y reglas de negocio
- Crear use cases y interfaces de aplicación
- Diseñar repositorios y servicios de infraestructura

### Fase 1: Infraestructura Base (2-3 semanas)
- Configurar herramientas TDD y estructura base
- Implementar entidades de dominio con tests
- Crear interfaces base y tipos

### Fase 2: Migración por Funcionalidad (8-10 semanas)
- Migrar Gestión de Socios (2 semanas)
- Migrar Gestión de Acciones (2 semanas)
- Migrar Gestión de Préstamos (2 semanas)
- Migrar Gestión de Reuniones (2 semanas)
- Migrar Sistema Contable (2 semanas)

### Fase 3: Funcionalidades Faltantes (2-3 semanas)
- Implementar Cuadro de Pagos del Socio
- Implementar Asistente de Planificación de Pagos

## Referencias

- [Arquitectura Hexagonal - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Test-Driven Development - Kent Beck](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Domain-Driven Design - Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)

---

**Fecha de creación**: $(date)  
**Versión**: 1.0  
**Estado**: Aceptado  
**Próxima revisión**: Al completar FASE 0
