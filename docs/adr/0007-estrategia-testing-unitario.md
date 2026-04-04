# ADR-0007: Estrategia de Testing Unitario

**Fecha**: 2024-01-20  
**Estado**: Aceptado  
**Decisores**: Equipo de Desarrollo  
**Consultores**: Arquitecto de Software  

## Contexto

El sistema de ahorro colaborativo actualmente presenta una **cobertura crítica de pruebas del 8%**, lo que representa un riesgo significativo para una aplicación financiera. El análisis del estado actual revela:

- **76 archivos TypeScript** en el backend
- **Solo 8 archivos con tests unitarios** (10.5%)
- **68 archivos sin tests** (89.5%)
- **Servicios críticos sin testing** (LoansService, LedgerEntriesService, OperationsService)
- **15 estrategias sin tests** (Payment y Disbursement strategies)

## Decisión

Implementar una **estrategia integral de testing unitario con TDD** que eleve la cobertura del 8% al 90%+ mediante migración a arquitectura hexagonal con Test-Driven Development.

### Actualización: Integración con Arquitectura Hexagonal y TDD (ADR-0010)

**Fecha de actualización**: $(date)

La estrategia de testing se ha actualizado para integrarse con la **migración a arquitectura hexagonal** y implementar **TDD desde el inicio**, garantizando calidad desde el diseño hasta la implementación.

### Estrategia Adoptada

#### 1. Pirámide de Testing
```
        /\
       /  \     E2E Tests (10%)
      /____\    - Flujos completos
     /      \   - Casos de uso críticos
    /        \  
   /__________\  Integration Tests (20%)
  /            \ - Interacciones entre servicios
 /              \ - Validaciones de reglas de negocio
/________________\ Unit Tests (70%)
                  - Lógica de negocio
                  - Servicios individuales
                  - Utilidades
```

#### 2. Cobertura por Categoría (Actualizada)
- **Entidades de dominio**: 100% cobertura (TDD obligatorio)
- **Use Cases**: 95% cobertura (TDD obligatorio)
- **Servicios de aplicación**: 90% cobertura
- **Repositorios**: 85% cobertura
- **Controladores**: 80% cobertura
- **Servicios de infraestructura**: 80% cobertura

#### 3. Implementación por Fases (Actualizada)
- **Fase 0**: Diseño con TDD (2-3 semanas)
- **Fase 1**: Infraestructura base con TDD (2-3 semanas)
- **Fase 2**: Migración por funcionalidad con TDD (8-10 semanas)
- **Fase 3**: Funcionalidades faltantes con TDD (2-3 semanas)
- **Fase 4**: Tests de integración y E2E (2 semanas)

## Alternativas Consideradas

### Alternativa 1: Testing Manual
- **Pros**: Implementación inmediata
- **Contras**: No escalable, propenso a errores, no automatizable
- **Decisión**: Rechazada por no ser sostenible

### Alternativa 2: Testing E2E Únicamente
- **Pros**: Cobertura de flujos completos
- **Contras**: Tests lentos, difíciles de mantener, debugging complejo
- **Decisión**: Rechazada por no ser eficiente

### Alternativa 3: Testing Unitario Únicamente
- **Pros**: Tests rápidos y confiables
- **Contras**: No valida integraciones
- **Decisión**: Rechazada por no ser completa

## Consecuencias

### Positivas
- **Confiabilidad**: Reducción del 90% en bugs de producción
- **Mantenibilidad**: Código más fácil de modificar y extender
- **Documentación**: Tests como documentación viva del comportamiento
- **Refactoring**: Seguridad para refactorizar código
- **Onboarding**: Nuevos desarrolladores entienden el código más rápido

### Negativas
- **Tiempo inicial**: 24 semanas-persona de desarrollo
- **Mantenimiento**: Tests requieren mantenimiento continuo
- **Complejidad**: Aumento en la complejidad del proyecto
- **Curva de aprendizaje**: Equipo necesita aprender mejores prácticas

### Riesgos
- **Tests frágiles**: Tests que fallan por cambios menores
- **Cobertura falsa**: Tests que no validan comportamiento real
- **Mantenimiento**: Tests desactualizados o abandonados

## Implementación

### Herramientas Adoptadas
- **Jest**: Framework de testing principal
- **@nestjs/testing**: Testing utilities para NestJS
- **Supertest**: Testing de endpoints HTTP
- **Testcontainers**: Testing de integración con base de datos

### Configuración
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

### Estructura de Tests
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    describe('when valid input', () => {
      it('should return expected result', () => {
        // Arrange, Act, Assert
      });
    });
  });
});
```

## Monitoreo y Métricas

### Métricas de Éxito
- **Cobertura de código**: 80% global, 90% servicios críticos
- **Tiempo de ejecución**: <5 minutos para suite completa
- **Tasa de fallos**: <1% de tests fallando
- **Reducción de bugs**: 90% menos bugs en producción

### Herramientas de Monitoreo
- **Jest Coverage**: Reportes de cobertura
- **GitHub Actions**: CI/CD pipeline
- **Codecov**: Análisis de cobertura
- **SonarQube**: Análisis de calidad

## Revisión y Actualización

### Criterios de Revisión
- **Cobertura**: Mantener >80% global
- **Calidad**: Tests deben ser mantenibles y confiables
- **Performance**: Suite de tests debe ejecutarse en <5 minutos
- **Adopción**: Equipo debe seguir las mejores prácticas

### Frecuencia de Revisión
- **Mensual**: Revisión de métricas de cobertura
- **Trimestral**: Evaluación de calidad de tests
- **Anual**: Revisión completa de la estrategia

## Referencias

- [Plan de Mejora de Testing](./PLAN_MEJORA_TESTING.md)
- [Análisis de Testing](./ANALISIS_TESTING.md)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

