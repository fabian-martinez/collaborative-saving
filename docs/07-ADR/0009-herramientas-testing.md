# ADR-0009: Herramientas de Testing

**Fecha**: 2024-01-20  
**Estado**: Aceptado  
**Decisores**: Equipo de Desarrollo  
**Consultores**: Arquitecto de Software  

## Contexto

Para implementar una estrategia de testing efectiva, es necesario seleccionar y configurar las **herramientas adecuadas** que soporten los estándares establecidos y permitan alcanzar los objetivos de cobertura y calidad.

El proyecto actual utiliza:
- **Jest** como framework principal de testing
- **@nestjs/testing** para testing de NestJS
- **Supertest** para testing de endpoints HTTP
- **TypeScript** como lenguaje de desarrollo

Sin embargo, faltan herramientas para:
- **Generación de datos de prueba** (faker)
- **Testing de integración** (testcontainers)
- **Análisis de cobertura** (reportes avanzados)
- **Validación de estándares** (linting de tests)
- **CI/CD integration** (GitHub Actions)

## Decisión

Adoptar un **stack completo de herramientas de testing** que soporte todas las fases del desarrollo y testing, desde la escritura de tests hasta el análisis de cobertura y la integración continua.

### Herramientas Adoptadas

#### 1. Framework de Testing Principal

**Jest** - Framework principal
```json
{
  "devDependencies": {
    "jest": "^30.0.4",
    "ts-jest": "^29.4.0",
    "@types/jest": "^30.0.0"
  }
}
```

**Configuración**:
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.interface.ts',
    '!**/*.module.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

#### 2. Testing de NestJS

**@nestjs/testing** - Testing utilities para NestJS
```json
{
  "devDependencies": {
    "@nestjs/testing": "^11.1.3"
  }
}
```

**Uso**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ServiceName', () => {
  let service: ServiceName;
  let repository: jest.Mocked<Repository<Entity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: getRepositoryToken(Entity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    repository = module.get(getRepositoryToken(Entity));
  });
});
```

#### 3. Testing de Endpoints HTTP

**Supertest** - Testing de APIs REST
```json
{
  "devDependencies": {
    "supertest": "^7.1.1",
    "@types/supertest": "^6.0.3"
  }
}
```

**Uso**:
```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('LoansController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/loans (POST)', () => {
    return request(app.getHttpServer())
      .post('/loans')
      .send({
        memberId: 'member-1',
        amount: 10000,
        termMonths: 12,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.amount).toBe(10000);
      });
  });
});
```

#### 4. Generación de Datos de Prueba

**@faker-js/faker** - Generación de datos sintéticos
```json
{
  "devDependencies": {
    "@faker-js/faker": "^8.4.1"
  }
}
```

**Uso**:
```typescript
import { faker } from '@faker-js/faker';

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
}

// En tests
const member = MemberFactory.create({ name: 'John Doe' });
const members = MemberFactory.createMany(5);
```

#### 5. Testing de Integración con Base de Datos

**Testcontainers** - Contenedores para testing
```json
{
  "devDependencies": {
    "testcontainers": "^10.0.0",
    "@testcontainers/postgresql": "^10.0.0"
  }
}
```

**Uso**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('LoansService Integration', () => {
  let app: INestApplication;
  let container: PostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('testdb')
      .withUsername('test')
      .withPassword('test')
      .start();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getPort(),
          username: 'test',
          password: 'test',
          database: 'testdb',
          entities: [Loan, Member],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Loan, Member]),
      ],
      providers: [LoansService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });
});
```

#### 6. Linting de Tests

**eslint-plugin-jest** - Reglas de ESLint para Jest
```json
{
  "devDependencies": {
    "eslint-plugin-jest": "^27.6.0"
  }
}
```

**Configuración**:
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:jest/recommended',
    'plugin:jest/style',
  ],
  rules: {
    'jest/expect-expect': 'error',
    'jest/no-disabled-tests': 'error',
    'jest/no-focused-tests': 'error',
    'jest/prefer-to-have-length': 'error',
    'jest/valid-expect': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-be': 'error',
    'jest/prefer-to-contain': 'error',
  },
};
```

#### 7. Análisis de Cobertura

**Jest Coverage** - Reportes de cobertura integrados
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.interface.ts',
    '!**/*.module.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### 8. CI/CD Integration

**GitHub Actions** - Pipeline de testing
```yaml
# .github/workflows/test.yml
name: Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run linting
      run: |
        cd backend
        npm run lint
    
    - name: Run unit tests
      run: |
        cd backend
        npm run test:ci
    
    - name: Run E2E tests
      run: |
        cd backend
        npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage/lcov.info
        flags: backend
        name: backend-coverage
```

#### 9. Scripts de Testing

**package.json** - Scripts organizados
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:cov:watch": "jest --coverage --watch",
    "test:unit": "jest --testPathPattern=spec.ts",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:ci": "jest --coverage --watchAll=false --passWithNoTests",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:coverage:open": "open coverage/index.html"
  }
}
```

#### 10. Herramientas de Desarrollo

**Jest Runner** - Extension para VS Code
```json
{
  "recommendations": [
    "firsttris.vscode-jest-runner",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss"
  ]
}
```

**Debugging Configuration**:
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticBPs": true,
      "windows": {
        "program": "${workspaceFolder}/backend/node_modules/jest/bin/jest"
      }
    }
  ]
}
```

## Alternativas Consideradas

### Alternativa 1: Vitest
- **Pros**: Más rápido que Jest, mejor soporte para ESM
- **Contras**: Menor ecosistema, menos integración con NestJS
- **Decisión**: Rechazada por falta de madurez en el ecosistema NestJS

### Alternativa 2: Mocha + Chai
- **Pros**: Flexibilidad, configuración personalizable
- **Contras**: Requiere más configuración, menos integración
- **Decisión**: Rechazada por complejidad de configuración

### Alternativa 3: Testing Library
- **Pros**: Enfoque en testing de componentes
- **Contras**: No aplicable para backend
- **Decisión**: Rechazada por no ser relevante para el contexto

### Alternativa 4: Cypress
- **Pros**: Excelente para E2E testing
- **Contras**: Sobrecarga para testing unitario
- **Decisión**: Rechazada por ser específico para E2E

## Consecuencias

### Positivas
- **Ecosistema maduro**: Herramientas probadas y estables
- **Integración**: Herramientas trabajan bien juntas
- **Documentación**: Amplia documentación y comunidad
- **Performance**: Herramientas optimizadas para velocidad
- **Flexibilidad**: Configuración adaptable a necesidades

### Negativas
- **Curva de aprendizaje**: Equipo debe aprender múltiples herramientas
- **Configuración**: Requiere configuración inicial compleja
- **Dependencias**: Aumenta el número de dependencias
- **Mantenimiento**: Múltiples herramientas requieren mantenimiento

### Riesgos
- **Compatibilidad**: Herramientas pueden tener conflictos
- **Actualizaciones**: Cambios en herramientas pueden romper tests
- **Performance**: Múltiples herramientas pueden afectar velocidad
- **Complejidad**: Puede ser abrumador para desarrolladores junior

## Implementación

### Fase 1: Configuración Base (1 semana)
- **Día 1-2**: Configurar Jest y TypeScript
- **Día 3-4**: Configurar @nestjs/testing
- **Día 5**: Configurar Supertest para E2E
- **Día 6-7**: Configurar scripts y documentación

### Fase 2: Herramientas Avanzadas (1 semana)
- **Día 1-2**: Configurar @faker-js/faker
- **Día 3-4**: Configurar Testcontainers
- **Día 5**: Configurar ESLint para tests
- **Día 6-7**: Configurar reportes de cobertura

### Fase 3: CI/CD Integration (1 semana)
- **Día 1-2**: Configurar GitHub Actions
- **Día 3-4**: Configurar Codecov
- **Día 5**: Configurar pre-commit hooks
- **Día 6-7**: Testing y documentación

### Fase 4: Herramientas de Desarrollo (1 semana)
- **Día 1-2**: Configurar VS Code extensions
- **Día 3-4**: Configurar debugging
- **Día 5**: Crear templates y snippets
- **Día 6-7**: Training del equipo

## Monitoreo y Métricas

### Métricas de Herramientas
- **Tiempo de ejecución**: <5 minutos para suite completa
- **Cobertura**: >80% global, >90% servicios críticos
- **Tasa de fallos**: <1% de tests fallando
- **Adopción**: 100% del equipo usando herramientas

### Herramientas de Monitoreo
- **Jest**: Reportes de cobertura y performance
- **GitHub Actions**: Métricas de CI/CD
- **Codecov**: Análisis de cobertura
- **ESLint**: Validación de estándares

## Revisión y Actualización

### Criterios de Revisión
- **Performance**: Herramientas ejecutan tests en <5 minutos
- **Confiabilidad**: <1% de tests fallando
- **Adopción**: 100% del equipo usando herramientas
- **Satisfacción**: Equipo está satisfecho con las herramientas

### Frecuencia de Revisión
- **Mensual**: Revisión de performance y confiabilidad
- **Trimestral**: Evaluación de adopción y satisfacción
- **Anual**: Revisión completa de herramientas

## Referencias

- [ADR-0007: Estrategia de Testing Unitario](./0007-estrategia-testing-unitario.md)
- [ADR-0008: Estándares de Testing](./0008-estandares-testing.md)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testcontainers](https://testcontainers.com/)
- [Faker.js](https://fakerjs.dev/)
- [Supertest](https://github.com/visionmedia/supertest)

