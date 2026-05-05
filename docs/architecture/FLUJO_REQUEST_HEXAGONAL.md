# Flujo de Request en Arquitectura Hexagonal

## 📥 Flujo Completo: Desde HTTP hasta DB y vuelta

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. HTTP REQUEST                                                  │
│    POST /api/loans                                               │
│    Body: { memberId: "123", amount: 10000, ... }                │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. INFRASTRUCTURE (Driving Adapter)                             │
│    Controller (NestJS)                                           │
│    - Recibe HTTP request                                         │
│    - Valida formato (DTOs HTTP)                                 │
│    - Mapea HTTP DTO → Application DTO                           │
│    - Llama al Use Case                                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. APPLICATION LAYER                                            │
│    Use Case (CreateLoanUseCase)                                  │
│    - Recibe Application DTO                                      │
│    - Valida pre-condiciones                                      │
│    - Orquesta:                                                   │
│      * Llama a Domain Services                                   │
│      * Usa entidades de dominio                                  │
│      * Llama a repositorios (interfaces/ports)                  │
│    - Retorna Application DTO                                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. DOMAIN LAYER                                                 │
│    - Entities (Loan, Member)                                     │
│    - Value Objects (Money, InterestRate)                         │
│    - Domain Services (DebtCapacityService)                       │
│    - Invariantes y reglas de negocio                            │
│                                                                  │
│    ⚠️ El dominio NO sabe que existe HTTP ni TypeORM             │
│    Solo trabaja con interfaces (ports)                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. INFRASTRUCTURE (Driven Adapter)                              │
│    Repository Implementation (TypeORM)                          │
│    - Implementa la interfaz del puerto (LoanRepository)          │
│    - Mapea Entity Domain → DB Model                              │
│    - Ejecuta queries SQL                                         │
│    - Mapea DB Model → Entity Domain                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. DATABASE                                                     │
│    PostgreSQL / Supabase                                         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
         [RESPUESTA: Flujo inverso]
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Repository → Domain Entity                                    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Use Case → Application DTO                                    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. Controller → HTTP Response                                    │
│    Mapea Application DTO → HTTP DTO                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. HTTP RESPONSE                                                │
│     { "loanId": "abc-123", "status": "pending", ... }           │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Dirección de Dependencias (Hacia Adentro)

```
Infrastructure → Application → Domain
     ↓              ↓              ↓
  (depende)     (depende)     (NO depende)
```

### ✅ Regla de Oro:

- **Infrastructure** conoce `Application` y `Domain`
- **Application** conoce solo `Domain`
- **Domain** NO conoce nada externo (solo interfaces que él mismo define)

## 📝 Ejemplo Práctico: Crear un Préstamo

### Paso 1: HTTP llega al Controller (Infrastructure - Driving)

```typescript
// infrastructure/nestjs/http/controllers/loans.controller.ts
@Controller('loans')
export class LoansController {
  constructor(
    private readonly createLoanUseCase: CreateLoanUseCase
  ) {}

  @Post()
  async create(@Body() httpDto: CreateLoanHttpDto) {
    // 1. Mapear HTTP DTO → Application DTO
    const appDto: CreateLoanDto = {
      memberId: httpDto.memberId,
      amount: httpDto.amount,
      // ...
    };
    
    // 2. Llamar al Use Case
    const result = await this.createLoanUseCase.execute(appDto);
    
    // 3. Mapear Application DTO → HTTP DTO
    return {
      loanId: result.loanId,
      status: result.status,
    };
  }
}
```

### Paso 2: Use Case orquesta (Application)

```typescript
// application/use-cases/loans/create-loan.use-case.ts
export class CreateLoanUseCase {
  constructor(
    // Depende de INTERFACES (puertos), no implementaciones
    private readonly loanRepository: LoanRepository,        // ← Interface
    private readonly memberRepository: MemberRepository,    // ← Interface
    private readonly debtCapacityService: DebtCapacityService // ← Domain Service
  ) {}

  async execute(dto: CreateLoanDto): Promise<CreateLoanResultDto> {
    // 1. Validar pre-condiciones
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) throw new Error('Member not found');
    
    // 2. Usar Domain Service para validar capacidad
    const capacity = await this.debtCapacityService.calculate(member);
    if (dto.amount > capacity) {
      throw new Error('Exceeds debt capacity');
    }
    
    // 3. Crear entidad de dominio
    const loan = Loan.create({
      memberId: dto.memberId,
      amount: Money.create(dto.amount),
      // ... la entidad valida sus propias invariantes
    });
    
    // 4. Persistir usando el puerto (interface)
    const saved = await this.loanRepository.save(loan);
    
    // 5. Retornar DTO
    return {
      loanId: saved.id.value,
      status: saved.status,
    };
  }
}
```

### Paso 3: Domain Layer (Entidades y Value Objects)

```typescript
// domain/entities/loan.entity.ts
export class Loan {
  private constructor(
    public readonly id: LoanId,
    public readonly memberId: MemberId,
    private _amount: Money,
    private _status: LoanStatus
  ) {}

  static create(params: CreateLoanParams): Loan {
    // Invariantes de dominio
    if (params.amount.value <= 0) {
      throw new DomainError('Amount must be positive');
    }
    
    return new Loan(
      LoanId.generate(),
      params.memberId,
      params.amount,
      LoanStatus.PENDING
    );
  }
  
  // Métodos de dominio (sin saber nada de DB o HTTP)
  canBeDisbursed(): boolean {
    return this._status === LoanStatus.PENDING;
  }
}

// domain/value-objects/money.value-object.ts
export class Money {
  constructor(public readonly value: number) {
    if (value < 0) throw new DomainError('Money cannot be negative');
  }
  
  add(other: Money): Money {
    return new Money(this.value + other.value);
  }
}
```

### Paso 4: Repository Implementation (Infrastructure - Driven)

```typescript
// infrastructure/typeorm/repositories/loan.repository.ts
@Injectable()
export class TypeOrmLoanRepository implements LoanRepository {
  constructor(
    @InjectRepository(LoanEntity) // ← TypeORM Entity (DB model)
    private readonly orm: Repository<LoanEntity>
  ) {}

  async save(loan: Loan): Promise<Loan> {
    // 1. Mapear Domain Entity → DB Model
    const dbModel = LoanMapper.toPersistence(loan);
    
    // 2. Guardar en DB
    const saved = await this.orm.save(dbModel);
    
    // 3. Mapear DB Model → Domain Entity
    return LoanMapper.toDomain(saved);
  }
}
```

## 🎯 Implementación Escalonada con Scrum/TDD

### Orden de Implementación (Outside-In / E2E-First)

**Opción Recomendada: Outside-In (E2E → Adapters → Use Case → Domain)**

```
1. Test E2E (RED)                    ← Define el contrato completo
2. Controller + Mock Use Case (GREEN) ← Adapter Driving mínimo
3. Use Case + Mock Repos (GREEN)      ← Application mínimo
4. Domain Entities + VOs (GREEN)      ← Domain puro
5. Repository Implementation (GREEN)  ← Adapter Driven
6. Refactor (REFACTOR)                ← Limpiar y optimizar
```

### Ejemplo: Sprint "Crear Préstamo"

#### Sprint Planning: Definir Story

```
Story: Como usuario, quiero crear un préstamo para un miembro
AC:
- POST /api/loans con { memberId, amount, term }
- Retorna { loanId, status: "pending" }
- Valida que el miembro existe
- Valida que no excede capacidad de deuda
```

#### Día 1: Test E2E (RED ❌)

```typescript
// test/e2e/loans/create-loan.e2e-spec.ts
describe('POST /loans', () => {
  it('should create a loan successfully', async () => {
    const response = await request(app)
      .post('/api/loans')
      .send({
        memberId: 'member-123',
        amount: 10000,
        term: 12,
      })
      .expect(201);
    
    expect(response.body).toMatchObject({
      loanId: expect.any(String),
      status: 'pending',
    });
  });
});
```

**Ejecutar**: `npm run test:e2e` → ❌ Falla (no existe endpoint)

#### Día 2: Controller + Mock Use Case (GREEN ✅)

```typescript
// 1. Crear Application DTO (contrato)
// application/dto/loans/create-loan.dto.ts
export class CreateLoanDto {
  memberId: string;
  amount: number;
  term: number;
}

// 2. Crear Use Case con mock (verde rápido)
// application/use-cases/loans/create-loan.use-case.ts
export class CreateLoanUseCase {
  async execute(dto: CreateLoanDto) {
    // Mock simple para pasar E2E
    return {
      loanId: 'mock-loan-id',
      status: 'pending' as const,
    };
  }
}

// 3. Crear Controller
// infrastructure/nestjs/http/controllers/loans.controller.ts
@Controller('loans')
export class LoansController {
  constructor(
    private readonly createLoanUseCase: CreateLoanUseCase
  ) {}

  @Post()
  async create(@Body() dto: CreateLoanDto) {
    const result = await this.createLoanUseCase.execute(dto);
    return result;
  }
}

// 4. Registrar en módulo Nest
```

**Ejecutar**: `npm run test:e2e` → ✅ Pasa (verde mínimo)

#### Día 3: Use Case Real + Mock Repos (GREEN ✅)

```typescript
// 1. Definir puertos (interfaces) en Domain
// domain/ports/repositories/loan-repository.port.ts
export interface LoanRepository {
  save(loan: Loan): Promise<Loan>;
}

// domain/ports/repositories/member-repository.port.ts
export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
}

// 2. Crear entidades mínimas
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

// 3. Implementar Use Case real
export class CreateLoanUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,    // ← Interface
    private readonly memberRepository: MemberRepository // ← Interface
  ) {}

  async execute(dto: CreateLoanDto) {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) throw new NotFoundError('Member not found');
    
    const loan = Loan.create({ memberId: dto.memberId });
    const saved = await this.loanRepository.save(loan);
    
    return {
      loanId: saved.id.value,
      status: saved.status.value,
    };
  }
}

// 4. Crear mocks para tests unitarios
// test/mocks/in-memory/repositories/in-memory-loan.repository.ts
export class InMemoryLoanRepository implements LoanRepository {
  private loans: Loan[] = [];
  
  async save(loan: Loan): Promise<Loan> {
    this.loans.push(loan);
    return loan;
  }
}

// 5. Test unitario del Use Case
describe('CreateLoanUseCase', () => {
  it('should create loan', async () => {
    const loanRepo = new InMemoryLoanRepository();
    const memberRepo = new InMemoryMemberRepository();
    const useCase = new CreateLoanUseCase(loanRepo, memberRepo);
    
    const result = await useCase.execute({
      memberId: 'member-123',
      amount: 10000,
      term: 12,
    });
    
    expect(result.loanId).toBeDefined();
  });
});
```

**Ejecutar**:
- ✅ Tests unitarios pasan
- ✅ Test E2E sigue pasando (usando mocks en DI)

#### Día 4: Domain Completo + Reglas de Negocio (REFACTOR 🔄)

```typescript
// domain/entities/loan.entity.ts
export class Loan {
  static create(params: CreateLoanParams): Loan {
    // Validar invariantes
    if (params.amount.value <= 0) {
      throw new DomainError('Amount must be positive');
    }
    if (params.term < 1) {
      throw new DomainError('Term must be at least 1 month');
    }
    
    return new Loan(
      LoanId.generate(),
      MemberId.create(params.memberId),
      Money.create(params.amount.value),
      LoanTerm.create(params.term),
      LoanStatus.PENDING
    );
  }
}

// domain/services/debt-capacity.service.ts
export class DebtCapacityService {
  calculateCapacity(member: Member): Money {
    // Lógica de negocio pura
    const totalAssets = member.totalAssets();
    return totalAssets.multiply(0.8); // 80% de capacidad
  }
}

// Actualizar Use Case
export class CreateLoanUseCase {
  constructor(
    // ...
    private readonly debtCapacityService: DebtCapacityService
  ) {}

  async execute(dto: CreateLoanDto) {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) throw new NotFoundError();
    
    // Validar capacidad
    const capacity = this.debtCapacityService.calculateCapacity(member);
    const requested = Money.create(dto.amount);
    if (requested.isGreaterThan(capacity)) {
      throw new BusinessRuleError('Exceeds debt capacity');
    }
    
    const loan = Loan.create({
      memberId: dto.memberId,
      amount: requested,
      term: dto.term,
    });
    
    return await this.loanRepository.save(loan);
  }
}
```

**Ejecutar**: ✅ Tests pasan, código más robusto

#### Día 5: Repository Real (TypeORM) (GREEN ✅)

```typescript
// 1. TypeORM Entity (DB Model)
// infrastructure/typeorm/entities/loan.entity.ts
@Entity('loans')
export class LoanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column('uuid')
  member_id: string;
  
  @Column('decimal')
  amount: number;
  
  // ...
}

// 2. Mapper Domain ↔ DB
// infrastructure/typeorm/mappers/loan.mapper.ts
export class LoanMapper {
  static toPersistence(domain: Loan): LoanEntity {
    return {
      id: domain.id.value,
      member_id: domain.memberId.value,
      amount: domain.amount.value,
      // ...
    };
  }
  
  static toDomain(persistence: LoanEntity): Loan {
    return Loan.fromPersistence({
      id: persistence.id,
      memberId: persistence.member_id,
      amount: persistence.amount,
      // ...
    });
  }
}

// 3. Repository Implementation
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

// 4. Configurar DI en módulo Nest
@Module({
  imports: [TypeOrmModule.forFeature([LoanEntity])],
  providers: [
    CreateLoanUseCase,
    {
      provide: 'LoanRepository',  // ← Token del puerto
      useClass: TypeOrmLoanRepository, // ← Implementación
    },
  ],
  controllers: [LoansController],
})
export class LoansModule {}
```

**Ejecutar**:
- ✅ Test E2E pasa con DB real
- ✅ Tests unitarios siguen usando mocks
- ✅ Tests de integración del repository

#### Día 6: Refactor y Limpieza (REFACTOR 🔄)

- Extraer mappers a clases separadas
- Agregar validación de DTOs con class-validator
- Documentar con Swagger
- Optimizar queries si es necesario

## 📊 Resumen del Flujo

```
REQUEST → Controller → Use Case → Domain → Repository → DB
                                         ↑
                                    (interfaces/puertos)
```

**Puntos clave**:
1. El **Controller** (infra) llama al **Use Case** (app)
2. El **Use Case** llama a **repositorios** (interfaces/puertos)
3. Las **interfaces** están en **Domain** (puertos)
4. Las **implementaciones** están en **Infrastructure** (adapters)
5. El **Domain** NO sabe que existe HTTP ni TypeORM

## 🎯 Checklist por Sprint

- [ ] Test E2E define el contrato
- [ ] Controller mínimo (mock use case)
- [ ] Use Case con mocks (interfaces definidas)
- [ ] Domain entities y value objects
- [ ] Repository real (TypeORM)
- [ ] Tests pasando (unit + e2e)
- [ ] Refactor y documentación

