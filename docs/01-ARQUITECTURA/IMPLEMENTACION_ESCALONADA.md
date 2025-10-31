# Implementación Escalonada: Outside-In con TDD

## 🎯 Estrategia: Outside-In (E2E → Adapters → Use Case → Domain)

Implementar **desde afuera hacia adentro** significa empezar por el contrato externo (HTTP) y trabajar hacia el dominio, construyendo solo lo necesario en cada paso.

## 📅 Timeline de un Sprint (6 días)

```
┌─────────────────────────────────────────────────────────────────┐
│ DÍA 1: Test E2E (RED)                                           │
│                                                                  │
│  ❌ Falla porque no existe nada                                │
│  ✅ Define el contrato completo                                 │
│                                                                  │
│  Test: POST /api/loans → { loanId, status }                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ DÍA 2: Controller + Mock Use Case (GREEN mínimo)                │
│                                                                  │
│  ✅ Test E2E pasa (código mínimo)                              │
│                                                                  │
│  - Controller (Infrastructure)                                  │
│  - Use Case mock que retorna hardcoded                         │
│  - DTOs de Application                                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ DÍA 3: Use Case Real + Mock Repos (GREEN con lógica)            │
│                                                                  │
│  ✅ Tests unitarios + E2E pasan                                 │
│                                                                  │
│  - Use Case real                                                │
│  - Interfaces de repositorios (puertos) en Domain              │
│  - Entidades mínimas                                            │
│  - Repositorios en memoria (mocks)                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ DÍA 4: Domain Completo + Reglas de Negocio (REFACTOR)          │
│                                                                  │
│  ✅ Tests pasan, código robusto                                │
│                                                                  │
│  - Value Objects                                                │
│  - Domain Services                                              │
│  - Invariantes y validaciones                                  │
│  - Use Case actualizado con reglas                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ DÍA 5: Repository Real (TypeORM) (GREEN final)                  │
│                                                                  │
│  ✅ Test E2E pasa con DB real                                   │
│                                                                  │
│  - Entity TypeORM (DB model)                                    │
│  - Mappers Domain ↔ DB                                          │
│  - Repository Implementation                                    │
│  - Configuración DI                                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ DÍA 6: Refactor y Limpieza (REFACTOR)                           │
│                                                                  │
│  ✅ Código limpio, documentado, optimizado                      │
│                                                                  │
│  - Extraer mappers                                              │
│  - Validaciones DTOs                                            │
│  - Swagger documentation                                         │
│  - Optimizaciones                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo Visual de Dependencias por Día

### Día 2: Capa Externa (GREEN mínimo)

```
HTTP Request
    ↓
┌─────────────────┐
│ Controller      │ (Infrastructure - Driving)
│ - Recibe HTTP   │
│ - Llama Mock    │
└─────────────────┘
    ↓
┌─────────────────┐
│ Mock Use Case   │ (Application)
│ return {        │
│   loanId: "123" │
│ }               │
└─────────────────┘
```

**Dependencias creadas**: `Infrastructure → Application`

### Día 3: Lógica de Aplicación (GREEN con lógica)

```
HTTP Request
    ↓
┌─────────────────┐
│ Controller      │
└─────────────────┘
    ↓
┌─────────────────┐     ┌──────────────────┐
│ Use Case Real   │────→│ Domain Interface │ (Puerto)
│ - Validaciones  │     │ LoanRepository   │
│ - Orquestación  │     └──────────────────┘
└─────────────────┘              ↑
    ↓                           │
┌─────────────────┐             │
│ Mock Repository │──────────────┘ (Implementa)
│ In-Memory       │
└─────────────────┘
    ↓
┌─────────────────┐
│ Domain Entity   │ (Mínima)
│ Loan            │
└─────────────────┘
```

**Dependencias creadas**: `Infrastructure → Application → Domain` (puertos)

### Día 4: Dominio Completo (REFACTOR)

```
HTTP Request
    ↓
┌─────────────────┐
│ Controller      │
└─────────────────┘
    ↓
┌─────────────────┐     ┌──────────────────────┐
│ Use Case Real   │────→│ Domain Service       │
│ - Reglas        │     │ DebtCapacityService  │
│ - Validaciones  │     └──────────────────────┘
└─────────────────┘              ↑
    ↓                    ┌────────┴────────┐
┌─────────────────┐      │                 │
│ Repository      │      │                 │
│ Interface       │      │                 │
└─────────────────┘      │                 │
    ↓                    │                 │
┌─────────────────┐      │                 │
│ Domain Entity   │──────┘                 │
│ + Value Objects │                         │
│ + Invariantes   │                         │
└─────────────────┘                         │
                                             │
                    ┌────────────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
┌───────────────┐      ┌─────────────────┐
│ Money (VO)    │      │ LoanStatus (VO) │
└───────────────┘      └─────────────────┘
```

**Dependencias**: Mismo flujo, pero domain más rico

### Día 5: Persistencia Real (GREEN final)

```
HTTP Request
    ↓
┌─────────────────┐
│ Controller      │
└─────────────────┘
    ↓
┌─────────────────┐
│ Use Case        │
└─────────────────┘
    ↓
┌─────────────────┐     ┌──────────────────┐
│ Repository      │────→│ Domain Interface │
│ Interface       │     │ LoanRepository   │
└─────────────────┘     └──────────────────┘
    ↓                           ↑
┌─────────────────┐             │
│ TypeORM Repo    │─────────────┘ (Implementa)
│ Implementation  │
└─────────────────┘
    ↓
┌─────────────────┐
│ Mapper          │
│ Domain ↔ DB     │
└─────────────────┘
    ↓
┌─────────────────┐
│ TypeORM Entity  │ (DB Model)
│ LoanEntity      │
└─────────────────┘
    ↓
┌─────────────────┐
│ PostgreSQL      │
└─────────────────┘
```

**Dependencias completas**: `Infrastructure → Application → Domain` (todos los adapters)

## 🎯 Ventajas de Outside-In

### ✅ Por qué empezar por E2E

1. **Define el contrato primero**: Sabes exactamente qué esperar
2. **Feedback rápido**: Ves el resultado inmediatamente
3. **No sobre-construyes**: Solo implementas lo necesario
4. **Tests guían el diseño**: El código emerge del test
5. **Valida integración completa**: E2E valida todo el flujo

### ✅ Por qué no empezar por Domain

Si empiezas por Domain:
- ❌ Puedes crear cosas que no necesitas
- ❌ No tienes feedback del flujo completo
- ❌ Más difícil validar que todo encaja

## 📋 Checklist por Día

### Día 1: E2E (RED)
- [ ] Test E2E escrito y fallando
- [ ] Define contrato HTTP (request/response)
- [ ] Ejecutar: `npm run test:e2e` → ❌

### Día 2: Controller Mock (GREEN mínimo)
- [ ] Controller creado
- [ ] DTOs de Application
- [ ] Use Case mock (retorna hardcoded)
- [ ] Módulo Nest configurado
- [ ] Ejecutar: `npm run test:e2e` → ✅

### Día 3: Use Case Real (GREEN con lógica)
- [ ] Interfaces de repositorios en `domain/ports/`
- [ ] Entidades mínimas en `domain/entities/`
- [ ] Use Case real implementado
- [ ] Repositorios in-memory (mocks)
- [ ] Tests unitarios del Use Case
- [ ] Ejecutar: `npm run test:unit && npm run test:e2e` → ✅

### Día 4: Domain Completo (REFACTOR)
- [ ] Value Objects creados
- [ ] Domain Services implementados
- [ ] Invariantes validadas en entidades
- [ ] Use Case actualizado con reglas
- [ ] Tests de dominio
- [ ] Ejecutar: Todos los tests → ✅

### Día 5: Persistencia Real (GREEN final)
- [ ] TypeORM Entity (DB model)
- [ ] Mappers Domain ↔ DB
- [ ] Repository Implementation (TypeORM)
- [ ] Configuración DI en módulo Nest
- [ ] Tests de integración del repository
- [ ] Ejecutar: `npm run test:e2e` (con DB real) → ✅

### Día 6: Refactor (REFACTOR)
- [ ] Código limpio y organizado
- [ ] Validaciones con class-validator
- [ ] Swagger documentation completa
- [ ] Optimizaciones de queries
- [ ] Code review y documentación

## 🔍 Ejemplo Concreto: "Crear Préstamo"

### Story del Sprint

```
Como: Usuario del sistema
Quiero: Crear un préstamo para un miembro
Para: Registrar nuevas solicitudes de préstamo

Criterios de Aceptación:
- POST /api/loans con { memberId, amount, term }
- Retorna 201 con { loanId, status: "pending" }
- Valida que memberId existe
- Valida que amount > 0
- Valida que term >= 1
- Valida capacidad de deuda (80% de assets)
```

### Día 1: Test E2E

```typescript
// test/e2e/loans/create-loan.e2e-spec.ts
describe('POST /api/loans', () => {
  it('should create a loan for a member', async () => {
    // Setup: crear miembro
    const member = await createTestMember();
    
    // Action
    const response = await request(app)
      .post('/api/loans')
      .send({
        memberId: member.id,
        amount: 10000,
        term: 12,
      })
      .expect(201);
    
    // Assert
    expect(response.body).toMatchObject({
      loanId: expect.any(String),
      status: 'pending',
    });
    
    // Verificar en DB
    const loan = await findLoanById(response.body.loanId);
    expect(loan).toBeDefined();
    expect(loan.memberId).toBe(member.id);
  });
});
```

**Resultado**: ❌ Falla (no existe endpoint)

### Día 2: Controller + Mock

```typescript
// application/dto/loans/create-loan.dto.ts
export class CreateLoanDto {
  memberId: string;
  amount: number;
  term: number;
}

// application/use-cases/loans/create-loan.use-case.ts
export class CreateLoanUseCase {
  async execute(dto: CreateLoanDto) {
    return {
      loanId: 'mock-loan-id',
      status: 'pending' as const,
    };
  }
}

// infrastructure/nestjs/http/controllers/loans.controller.ts
@Controller('loans')
export class LoansController {
  constructor(
    private readonly createLoanUseCase: CreateLoanUseCase
  ) {}

  @Post()
  async create(@Body() dto: CreateLoanDto) {
    return this.createLoanUseCase.execute(dto);
  }
}
```

**Resultado**: ✅ E2E pasa (pero no persiste nada real)

### Día 3: Use Case Real

```typescript
// domain/ports/repositories/loan-repository.port.ts
export interface LoanRepository {
  save(loan: Loan): Promise<Loan>;
}

export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
}

// domain/entities/loan.entity.ts
export class Loan {
  constructor(
    public readonly id: LoanId,
    public readonly memberId: MemberId,
    private _status: LoanStatus
  ) {}
  
  static create(params: { memberId: string }): Loan {
    return new Loan(
      LoanId.generate(),
      MemberId.create(params.memberId),
      LoanStatus.PENDING
    );
  }
}

// application/use-cases/loans/create-loan.use-case.ts
export class CreateLoanUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  async execute(dto: CreateLoanDto) {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new NotFoundError('Member not found');
    }
    
    const loan = Loan.create({ memberId: dto.memberId });
    const saved = await this.loanRepository.save(loan);
    
    return {
      loanId: saved.id.value,
      status: saved.status.value,
    };
  }
}

// test/mocks/in-memory/repositories/in-memory-loan.repository.ts
export class InMemoryLoanRepository implements LoanRepository {
  private loans: Loan[] = [];
  
  async save(loan: Loan): Promise<Loan> {
    this.loans.push(loan);
    return loan;
  }
}
```

**Resultado**: ✅ E2E y unit tests pasan (con mocks)

### Día 4: Domain Completo

```typescript
// domain/value-objects/money.value-object.ts
export class Money {
  constructor(public readonly value: number) {
    if (value <= 0) {
      throw new DomainError('Amount must be positive');
    }
  }
  
  isGreaterThan(other: Money): boolean {
    return this.value > other.value;
  }
}

// domain/services/debt-capacity.service.ts
export class DebtCapacityService {
  calculate(member: Member): Money {
    const totalAssets = member.totalAssets();
    return new Money(totalAssets.value * 0.8); // 80%
  }
}

// application/use-cases/loans/create-loan.use-case.ts (actualizado)
export class CreateLoanUseCase {
  constructor(
    // ...
    private readonly debtCapacityService: DebtCapacityService
  ) {}

  async execute(dto: CreateLoanDto) {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) throw new NotFoundError();
    
    // Validar capacidad
    const capacity = this.debtCapacityService.calculate(member);
    const requested = new Money(dto.amount);
    if (requested.isGreaterThan(capacity)) {
      throw new BusinessRuleError('Exceeds debt capacity');
    }
    
    const loan = Loan.create({
      memberId: dto.memberId,
      amount: requested,
      term: LoanTerm.create(dto.term),
    });
    
    return await this.loanRepository.save(loan);
  }
}
```

**Resultado**: ✅ Tests pasan, código robusto

### Día 5: Persistencia Real

```typescript
// infrastructure/typeorm/entities/loan.entity.ts
@Entity('loans')
export class LoanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column('uuid')
  member_id: string;
  
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;
  
  @Column('varchar')
  status: string;
}

// infrastructure/typeorm/mappers/loan.mapper.ts
export class LoanMapper {
  static toPersistence(domain: Loan): LoanEntity {
    return {
      id: domain.id.value,
      member_id: domain.memberId.value,
      amount: domain.amount.value,
      status: domain.status.value,
    };
  }
  
  static toDomain(persistence: LoanEntity): Loan {
    return Loan.fromPersistence({
      id: persistence.id,
      memberId: persistence.member_id,
      amount: persistence.amount,
      status: persistence.status,
    });
  }
}

// infrastructure/typeorm/repositories/loan.repository.ts
@Injectable()
export class TypeOrmLoanRepository implements LoanRepository {
  constructor(
    @InjectRepository(LoanEntity)
    private readonly orm: Repository<LoanEntity>
  ) {}

  async save(loan: Loan): Promise<Loan> {
    const dbModel = LoanMapper.toPersistence(loan);
    const saved = await this.orm.save(dbModel);
    return LoanMapper.toDomain(saved);
  }
}
```

**Resultado**: ✅ E2E pasa con DB real

## 🎯 Resumen: Quién Accede a Quién

```
┌─────────────────────────────────────────────────────────┐
│ REQUEST FLOW                                            │
│                                                         │
│ HTTP → Controller → Use Case → Domain → Repository → DB│
│                                                         │
│ REVERSE FLOW (respuesta)                                │
│                                                         │
│ DB → Repository → Domain → Use Case → Controller → HTTP│
└─────────────────────────────────────────────────────────┘

DEPENDENCIES (hacia adentro):

Infrastructure (Controller, TypeORM Repo)
    ↓ depende de
Application (Use Cases)
    ↓ depende de  
Domain (Entities, Ports/Interfaces)
    ↑ implementado por
Infrastructure (TypeORM Repo)
```

**Regla clave**: 
- Domain define **interfaces** (puertos)
- Infrastructure **implementa** esas interfaces
- Application **usa** esas interfaces (no conoce implementaciones)

