# ADR-0008: Estándares de Testing

**Fecha**: 2024-01-20  
**Estado**: Aceptado  
**Decisores**: Equipo de Desarrollo  
**Consultores**: Arquitecto de Software  

## Contexto

Para implementar una estrategia de testing efectiva y mantener la calidad del código a largo plazo, es necesario establecer **estándares claros y consistentes** para la escritura, organización y mantenimiento de pruebas unitarias.

El proyecto actual presenta inconsistencias en:
- **Estructura de tests**: Diferentes patrones de organización
- **Naming conventions**: Nombres de tests poco descriptivos
- **Mocking strategies**: Enfoques inconsistentes para mocks
- **Test data management**: Datos de prueba no estandarizados
- **Assertion patterns**: Diferentes estilos de validación

## Decisión

Establecer **estándares unificados de testing con TDD** que garanticen consistencia, mantenibilidad y calidad en todas las pruebas del sistema, integrados con la arquitectura hexagonal.

### Actualización: Integración con TDD y Arquitectura Hexagonal (ADR-0010)

**Fecha de actualización**: $(date)

Los estándares de testing se han actualizado para integrarse con **Test-Driven Development (TDD)** y la **arquitectura hexagonal**, asegurando que los tests guíen el diseño y la implementación desde el inicio.

### Estándares Adoptados

#### 1. Estructura de Tests (AAA Pattern)

**Patrón**: Arrange, Act, Assert
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    describe('when [condition]', () => {
      it('should [expected behavior]', () => {
        // Arrange - Preparar datos y mocks
        const input = createValidInput();
        const expectedResult = createExpectedResult();
        mockDependency.method.mockResolvedValue(expectedResult);

        // Act - Ejecutar la acción a probar
        const result = await service.methodName(input);

        // Assert - Verificar el resultado
        expect(result).toEqual(expectedResult);
        expect(mockDependency.method).toHaveBeenCalledWith(input);
      });
    });
  });
});
```

#### 2. Convenciones de Naming (Actualizado para TDD)

**Domain Layer**: `describe('EntityName', () => { it('should enforce business rule when condition', () => {}) })`  
**Application Layer**: `describe('UseCaseName', () => { it('should execute use case when condition', () => {}) })`  
**Infrastructure Layer**: `describe('Class', () => { describe('method', () => { describe('when condition', () => { it('should behavior', () => {}) }) }) })`

**Ejemplos**:
```typescript
// ✅ Domain Layer - Entidades
describe('Member', () => {
  it('should create member when valid data provided', () => {});
  it('should throw error when email already exists', () => {});
});

// ✅ Application Layer - Use Cases  
describe('CreateMemberUseCase', () => {
  it('should execute use case when valid input provided', () => {});
});

// ✅ Infrastructure Layer - Servicios
describe('LoansService', () => {
  describe('create', () => {
    describe('when valid member and amount provided', () => {
      it('should return created loan with correct properties', () => {
        // Test implementation
      });
    });
    
    describe('when amount exceeds member capital', () => {
      it('should throw ValidationError with appropriate message', () => {
        // Test implementation
      });
    });
  });
});

// ❌ Malos nombres
describe('LoansService', () => {
  describe('create', () => {
    it('should work', () => {});
    it('should return something', () => {});
    it('should not fail', () => {});
  });
});
```

#### 3. Organización de Archivos

**Estructura**:
```
src/
├── services/
│   ├── loans.service.ts
│   └── loans.service.spec.ts
├── controllers/
│   ├── loans.controller.ts
│   └── loans.controller.spec.ts
├── strategies/
│   ├── payment/
│   │   ├── loan-payment.strategy.ts
│   │   └── loan-payment.strategy.spec.ts
└── utils/
    ├── round-and-limit.util.ts
    └── round-and-limit.util.spec.ts
```

**Reglas**:
- Cada archivo `.ts` debe tener su correspondiente `.spec.ts`
- Tests deben estar en la misma carpeta que el código fuente
- Archivos de test deben seguir el patrón `*.spec.ts`

#### 4. Estrategia de Mocking

**Principios**:
- **Mock solo dependencias externas**: Repositorios, servicios externos, APIs
- **No mockear el código bajo prueba**: Solo dependencias
- **Usar mocks específicos**: Evitar mocks genéricos cuando sea posible

**Patrón de Mocking**:
```typescript
// Para repositorios
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

// Para servicios
const mockService = {
  methodName: jest.fn(),
};

// Para DataSource (transacciones)
const mockQueryRunner = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};
```

#### 5. Gestión de Datos de Prueba

**Factories Pattern**:
```typescript
// test/factories/member.factory.ts
import { faker } from '@faker-js/faker';
import { Member } from '../../src/members/entities/member.entity';

export class MemberFactory {
  static create(overrides: Partial<Member> = {}): Member {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<Member> = {}): Member[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

// test/factories/loan.factory.ts
export class LoanFactory {
  static create(overrides: Partial<Loan> = {}): Loan {
    return {
      id: faker.string.uuid(),
      amount: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
      interestRate: faker.number.float({ min: 0.01, max: 0.15, fractionDigits: 4 }),
      termMonths: faker.number.int({ min: 1, max: 60 }),
      memberId: faker.string.uuid(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }
}
```

#### 6. Patrones de Assertion

**Assertions Específicas**:
```typescript
// ✅ Buenos assertions
expect(result).toEqual(expectedResult);
expect(mockRepository.save).toHaveBeenCalledWith(expectedEntity);
expect(mockRepository.save).toHaveBeenCalledTimes(1);
expect(mockRepository.save).toHaveBeenCalledWith(
  expect.objectContaining({
    amount: 1000,
    status: 'ACTIVE',
  })
);

// ❌ Malos assertions
expect(result).toBeTruthy();
expect(mockRepository.save).toHaveBeenCalled();
expect(result).not.toBeNull();
```

**Validación de Errores**:
```typescript
// Para errores síncronos
expect(() => service.methodName(invalidInput))
  .toThrow(ValidationError);

// Para errores asíncronos
await expect(service.methodName(invalidInput))
  .rejects
  .toThrow(ValidationError);

// Con mensaje específico
await expect(service.methodName(invalidInput))
  .rejects
  .toThrow('Amount must be positive');
```

#### 7. Configuración de Tests

**Setup y Teardown**:
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockRepository: jest.Mocked<Repository<Entity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: getRepositoryToken(Entity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    mockRepository = module.get(getRepositoryToken(Entity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

#### 8. Cobertura de Casos

**Tipos de Tests Requeridos**:
```typescript
describe('methodName', () => {
  // 1. Casos exitosos (Happy Path)
  describe('when valid input', () => {
    it('should return expected result', () => {});
  });

  // 2. Validaciones de entrada
  describe('when invalid input', () => {
    it('should throw ValidationError', () => {});
  });

  // 3. Casos edge
  describe('when edge cases', () => {
    it('should handle zero values correctly', () => {});
    it('should handle maximum values correctly', () => {});
    it('should handle empty arrays correctly', () => {});
  });

  // 4. Casos de error
  describe('when external service fails', () => {
    it('should throw ServiceUnavailableError', () => {});
  });

  // 5. Reglas de negocio
  describe('when business rules apply', () => {
    it('should enforce business rule correctly', () => {});
  });
});
```

## Alternativas Consideradas

### Alternativa 1: Sin Estándares
- **Pros**: Flexibilidad total
- **Contras**: Inconsistencia, dificultad de mantenimiento
- **Decisión**: Rechazada por falta de estructura

### Alternativa 2: Estándares Mínimos
- **Pros**: Fácil adopción
- **Contras**: No garantiza calidad
- **Decisión**: Rechazada por insuficiente

### Alternativa 3: Estándares Estrictos
- **Pros**: Máxima consistencia
- **Contras**: Puede ser restrictivo
- **Decisión**: Rechazada por ser demasiado rígido

## Consecuencias

### Positivas
- **Consistencia**: Todos los tests siguen el mismo patrón
- **Mantenibilidad**: Tests fáciles de entender y modificar
- **Onboarding**: Nuevos desarrolladores pueden contribuir rápidamente
- **Calidad**: Tests más robustos y confiables
- **Documentación**: Tests como documentación viva

### Negativas
- **Curva de aprendizaje**: Equipo debe aprender los estándares
- **Tiempo inicial**: Más tiempo para escribir tests inicialmente
- **Rigidez**: Menos flexibilidad en casos especiales

### Riesgos
- **Adopción**: Equipo puede resistirse a seguir estándares
- **Mantenimiento**: Estándares pueden volverse obsoletos
- **Complejidad**: Puede ser abrumador para desarrolladores junior

## Implementación

### Fase 1: Establecimiento de Estándares
- **Semana 1**: Documentar estándares completos
- **Semana 2**: Crear templates y ejemplos
- **Semana 3**: Training del equipo
- **Semana 4**: Implementación en nuevos tests

### Fase 2: Migración de Tests Existentes
- **Semana 5-8**: Refactorizar tests existentes
- **Semana 9-12**: Aplicar estándares a todos los tests

### Fase 3: Automatización
- **Semana 13-14**: Configurar linting para tests
- **Semana 15-16**: Integrar validación en CI/CD

### Herramientas de Validación
```json
// .eslintrc.js
{
  "rules": {
    "jest/expect-expect": "error",
    "jest/no-disabled-tests": "error",
    "jest/no-focused-tests": "error",
    "jest/prefer-to-have-length": "error",
    "jest/valid-expect": "error"
  }
}
```

## Monitoreo y Métricas

### Métricas de Calidad
- **Consistencia**: 100% de tests siguen estándares
- **Cobertura de casos**: 100% de métodos tienen casos edge
- **Mantenibilidad**: Tiempo promedio de modificación de tests
- **Adopción**: % de desarrolladores siguiendo estándares

### Herramientas de Monitoreo
- **ESLint**: Validación de estándares de código
- **Jest**: Reportes de cobertura y calidad
- **SonarQube**: Análisis de calidad de tests
- **Code Review**: Validación manual de estándares

## Revisión y Actualización

### Criterios de Revisión
- **Adopción**: >95% de tests siguen estándares
- **Calidad**: Tests son mantenibles y confiables
- **Efectividad**: Estándares mejoran la calidad del código
- **Satisfacción**: Equipo está satisfecho con los estándares

### Frecuencia de Revisión
- **Mensual**: Revisión de adopción de estándares
- **Trimestral**: Evaluación de efectividad
- **Anual**: Revisión completa de estándares

## Referencias

- [ADR-0007: Estrategia de Testing Unitario](./0007-estrategia-testing-unitario.md)
- [Plan de Mejora de Testing](../PLAN_MEJORA_TESTING.md)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Testing Standards Guide](https://testingjavascript.com/)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)

