# Plan de Implementación: Members Endpoints

**Fecha**: 2025-01-20  
**Objetivo**: Implementar 4 endpoints de Members usando arquitectura hexagonal Outside-In

## 🎯 Endpoints a Implementar

1. **GET /members** - Listar miembros (Query Handler)
2. **GET /members/:id** - Obtener detalle de miembro (Query Handler)
3. **PATCH /members/:id** - Actualizar datos de miembro (UpdateMemberUseCase)
4. **DELETE /members/:id** - Eliminar miembro (borrado lógico) (DeleteMemberUseCase)

## 📋 Estructura Hexagonal

```
backend/src/
├── domain/
│   ├── entities/
│   │   └── member.entity.ts           # Entidad de dominio
│   ├── value-objects/
│   │   ├── email.value-object.ts
│   │   ├── phone.value-object.ts
│   │   └── member-status.value-object.ts
│   └── ports/
│       └── repositories/
│           └── member-repository.port.ts
├── application/
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
└── infrastructure/
    ├── typeorm/
    │   ├── entities/
    │   │   └── member.entity.ts       # TypeORM Entity (DB model)
    │   ├── repositories/
    │   │   └── typeorm-member.repository.ts
    │   └── mappers/
    │       └── member.mapper.ts
    └── nestjs/
        ├── http/
        │   └── controllers/
        │       └── members.controller.ts
        └── mappers/
            └── member-http.mapper.ts
```

## 🔄 Proceso de Implementación (Outside-In)

### Día 1: Tests E2E (RED)

#### 1.1 Test E2E - Listar Miembros
```typescript
// test/e2e/members/get-members.e2e-spec.ts
describe('GET /members', () => {
  it('should return list of members', async () => {
    const response = await request(app)
      .get('/api/members')
      .expect(200);
    
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
  });
});
```

#### 1.2 Test E2E - Obtener Detalle
```typescript
// test/e2e/members/get-member-detail.e2e-spec.ts
describe('GET /members/:id', () => {
  it('should return member detail', async () => {
    const member = await createTestMember();
    
    const response = await request(app)
      .get(`/api/members/${member.id}`)
      .expect(200);
    
    expect(response.body).toMatchObject({
      id: member.id,
      name: expect.any(String),
      email: expect.any(String),
    });
  });
});
```

#### 1.3 Test E2E - Actualizar Miembro
```typescript
// test/e2e/members/update-member.e2e-spec.ts
describe('PATCH /members/:id', () => {
  it('should update member', async () => {
    const member = await createTestMember();
    
    const response = await request(app)
      .patch(`/api/members/${member.id}`)
      .send({
        name: 'Updated Name',
        email: 'updated@example.com',
      })
      .expect(200);
    
    expect(response.body.name).toBe('Updated Name');
    expect(response.body.email).toBe('updated@example.com');
  });
});
```

#### 1.4 Test E2E - Eliminar Miembro (Borrado Lógico)
```typescript
// test/e2e/members/delete-member.e2e-spec.ts
describe('DELETE /members/:id', () => {
  it('should delete member (logical delete)', async () => {
    const member = await createTestMember();
    
    await request(app)
      .delete(`/api/members/${member.id}`)
      .expect(200);
    
    // Verificar que el miembro ya no aparece en listados
    const members = await request(app)
      .get('/api/members')
      .expect(200);
    
    expect(members.body.find(m => m.id === member.id)).toBeUndefined();
    
    // Pero debe existir en DB con deletedAt
    const deletedMember = await findMemberById(member.id);
    expect(deletedMember.deletedAt).toBeDefined();
  });
});
```

---

### Día 2: Controller + Mocks (GREEN mínimo)

#### 2.1 DTOs de Application
```typescript
// application/dto/members/update-member.dto.ts
export class UpdateMemberDto {
  name?: string;
  email?: string;
  role?: string;
  identificationNumber?: string;
  address?: string;
  phone?: string;
  beneficiary?: string;
}

// application/dto/members/delete-member.dto.ts
export class DeleteMemberDto {
  memberId: string;
}

// application/dto/members/member-response.dto.ts
export class MemberResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  identificationNumber?: string;
  status: string;
  address?: string;
  phone?: string;
  beneficiary?: string;
  registrationDate: Date;
  createdAt: Date;
}
```

#### 2.2 Query Handlers Mock
```typescript
// application/queries/members/get-members.query-handler.ts
export class GetMembersQueryHandler {
  async execute(): Promise<MemberResponseDto[]> {
    // Mock: retornar hardcoded
    return [];
  }
}

// application/queries/members/get-member-detail.query-handler.ts
export class GetMemberDetailQueryHandler {
  async execute(memberId: string): Promise<MemberResponseDto> {
    // Mock: retornar hardcoded
    return {
      id: 'mock-id',
      name: 'Mock Member',
      email: 'mock@example.com',
      status: 'active',
      registrationDate: new Date(),
    };
  }
}
```

#### 2.3 Use Cases Mock
```typescript
// application/use-cases/members/update-member.use-case.ts
export class UpdateMemberUseCase {
  async execute(dto: UpdateMemberDto): Promise<MemberResponseDto> {
    // Mock: retornar hardcoded
    return {
      id: dto.memberId || 'mock-id',
      name: dto.name || 'Mock',
      email: dto.email || 'mock@example.com',
      status: 'active',
      registrationDate: new Date(),
    };
  }
}

// application/use-cases/members/delete-member.use-case.ts
export class DeleteMemberUseCase {
  async execute(dto: DeleteMemberDto): Promise<void> {
    // Mock: no hacer nada
  }
}
```

#### 2.4 Controller Actualizado
```typescript
// infrastructure/nestjs/http/controllers/members.controller.ts
@Controller('members')
export class MembersController {
  constructor(
    private readonly getMembersQuery: GetMembersQueryHandler,
    private readonly getMemberDetailQuery: GetMemberDetailQueryHandler,
    private readonly updateMemberUseCase: UpdateMemberUseCase,
    private readonly deleteMemberUseCase: DeleteMemberUseCase,
  ) {}

  @Get()
  async getAllMembers(): Promise<MemberResponseDto[]> {
    return this.getMembersQuery.execute();
  }

  @Get(':id')
  async getMemberDetail(@Param('id', ParseUUIDPipe) id: string): Promise<MemberResponseDto> {
    return this.getMemberDetailQuery.execute(id);
  }

  @Patch(':id')
  async updateMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<MemberResponseDto> {
    return this.updateMemberUseCase.execute({ ...dto, memberId: id });
  }

  @Delete(':id')
  async deleteMember(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteMemberUseCase.execute({ memberId: id });
  }
}
```

**Resultado**: ✅ Tests E2E pasan (código mínimo)

---

### Día 3: Use Cases Real + Mock Repos (GREEN con lógica)

#### 3.1 Definir Puertos (Interfaces)
```typescript
// domain/ports/repositories/member-repository.port.ts
export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
  findAll(): Promise<Member[]>;
  findActive(): Promise<Member[]>;
  save(member: Member): Promise<Member>;
  softDelete(id: string): Promise<void>;
}
```

#### 3.2 Entidad de Dominio
```typescript
// domain/entities/member.entity.ts
export class Member {
  constructor(
    public readonly id: string,              // ← String simple (UUID validado por infraestructura)
    private _name: string,
    private _email: Email,                   // ← Value Object
    private _status: MemberStatus,            // ← Value Object
    private _role: string,                   // ← String simple (default: 'member')
    private _identificationNumber?: string,   // ← String simple (opcional, único)
    private _address?: string,                // ← String simple (opcional)
    private _phone?: Phone,                   // ← Value Object (opcional)
    private _beneficiary?: string,            // ← String simple (opcional)
    public readonly registrationDate: Date,   // ← Date (default: current_date)
    public readonly createdAt: Date,           // ← Timestamp (default: now())
  ) {}

  update(data: { 
    name?: string; 
    email?: string; 
    address?: string; 
    phone?: string; 
    beneficiary?: string;
    role?: string;
  }): void {
    if (data.name) this._name = data.name;
    if (data.email) this._email = Email.create(data.email);
    if (data.address !== undefined) this._address = data.address;
    if (data.phone !== undefined) {
      this._phone = data.phone ? Phone.create(data.phone) : undefined;
    }
    if (data.beneficiary !== undefined) this._beneficiary = data.beneficiary;
    if (data.role) this._role = data.role;
  }

  markAsDeleted(): void {
    this._status = MemberStatus.INACTIVE;
  }

  get name(): string { return this._name; }
  get email(): string { return this._email.value; }
  get status(): string { return this._status.value; }
  get role(): string { return this._role; }
  get identificationNumber(): string | undefined { return this._identificationNumber; }
  get address(): string | undefined { return this._address; }
  get phone(): string | undefined { return this._phone?.value; }
  get beneficiary(): string | undefined { return this._beneficiary; }
  
  isActive(): boolean {
    return this._status.isActive();
  }
}
```

#### 3.3 Value Objects
```typescript
// domain/value-objects/email.value-object.ts
export class Email {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new DomainError('Invalid email');
    }
  }
  
  static create(value: string): Email {
    return new Email(value);
  }
  
  private isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}

// domain/value-objects/phone.value-object.ts
export class Phone {
  constructor(public readonly value: string) {
    if (value && !this.isValid(value)) {
      throw new DomainError(`Invalid phone format: ${value}`);
    }
  }
  
  static create(value: string | undefined): Phone | undefined {
    if (!value) return undefined;
    return new Phone(value);
  }
  
  private isValid(value: string): boolean {
    // Validación: al menos 7 dígitos, formato internacional opcional
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    return /^\+?[\d]{7,15}$/.test(cleaned);
  }
  
  get formatted(): string {
    // Normalizar formato (remover espacios, guiones, paréntesis)
    return this.value.replace(/[\s\-\(\)]/g, '');
  }
}

// domain/value-objects/member-status.value-object.ts
export class MemberStatus {
  static readonly ACTIVE = new MemberStatus('active');
  static readonly INACTIVE = new MemberStatus('inactive');
  
  private constructor(public readonly value: string) {}
  
  static fromString(value: string): MemberStatus {
    if (value === 'active') return MemberStatus.ACTIVE;
    if (value === 'inactive') return MemberStatus.INACTIVE;
    throw new DomainError(`Invalid member status: ${value}`);
  }
  
  isActive(): boolean {
    return this === MemberStatus.ACTIVE;
  }
}
```

#### 3.4 Query Handlers Real
```typescript
// application/queries/members/get-members.query-handler.ts
export class GetMembersQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(): Promise<MemberResponseDto[]> {
    const members = await this.memberRepository.findActive();
    return members.map(m => this.toDto(m));
  }

  private toDto(member: Member): MemberResponseDto {
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      identificationNumber: member.identificationNumber,
      status: member.status,
      address: member.address,
      phone: member.phone,
      beneficiary: member.beneficiary,
      registrationDate: member.registrationDate,
      createdAt: member.createdAt,
    };
  }
}

// application/queries/members/get-member-detail.query-handler.ts
export class GetMemberDetailQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(memberId: string): Promise<MemberResponseDto> {
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new NotFoundError(`Member with ID ${memberId} not found`);
    }
    
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      identificationNumber: member.identificationNumber,
      status: member.status,
      address: member.address,
      phone: member.phone,
      beneficiary: member.beneficiary,
      registrationDate: member.registrationDate,
      createdAt: member.createdAt,
    };
  }
}
```

#### 3.5 Use Cases Real
```typescript
// application/use-cases/members/update-member.use-case.ts
export class UpdateMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(dto: UpdateMemberDto): Promise<MemberResponseDto> {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new NotFoundError(`Member with ID ${dto.memberId} not found`);
    }
    
    member.update({
      name: dto.name,
      email: dto.email,
      address: dto.address,
      phone: dto.phone,
      beneficiary: dto.beneficiary,
    });
    
    const updated = await this.memberRepository.save(member);
    
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      identificationNumber: updated.identificationNumber,
      status: updated.status,
      address: updated.address,
      phone: updated.phone,
      beneficiary: updated.beneficiary,
      registrationDate: updated.registrationDate,
      createdAt: updated.createdAt,
    };
  }
}

// application/use-cases/members/delete-member.use-case.ts
export class DeleteMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(dto: DeleteMemberDto): Promise<void> {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new NotFoundError(`Member with ID ${dto.memberId} not found`);
    }
    
    member.markAsDeleted();
    await this.memberRepository.softDelete(dto.memberId);
  }
}
```

#### 3.6 Repository In-Memory (Mock para tests)
```typescript
// test/mocks/in-memory/repositories/in-memory-member.repository.ts
export class InMemoryMemberRepository implements MemberRepository {
  private members: Member[] = [];

  async findById(id: string): Promise<Member | null> {
    return this.members.find(m => m.id === id && !m.isDeleted()) || null;
  }

  async findAll(): Promise<Member[]> {
    return this.members;
  }

  async findActive(): Promise<Member[]> {
    return this.members.filter(m => !m.isDeleted());
  }

  async save(member: Member): Promise<Member> {
    const index = this.members.findIndex(m => m.id === member.id);
    if (index >= 0) {
      this.members[index] = member;
    } else {
      this.members.push(member);
    }
    return member;
  }

  async softDelete(id: string): Promise<void> {
    const member = await this.findById(id);
    if (member) {
      member.markAsDeleted();
    }
  }
}
```

**Resultado**: ✅ Tests unitarios y E2E pasan (con mocks)

---

### Día 4: Domain Completo (REFACTOR)

- Validar invariantes en entidad Member
- Agregar más Value Objects si es necesario
- Domain Services si aplica
- Tests de dominio

---

### Día 5: Repository Real TypeORM (GREEN final)

#### 5.1 TypeORM Entity
```typescript
// infrastructure/typeorm/entities/member.entity.ts
@Entity({ name: 'members' })
export class MemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', unique: true, name: 'identification_number' })
  identificationNumber: string;

  @Column({ type: 'text', default: 'member' })
  role: string;

  @Column({ type: 'text', default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  beneficiary: string;

  @CreateDateColumn({ type: 'date', name: 'registration_date' })
  registrationDate: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
```

#### 5.2 Mapper Domain ↔ DB
```typescript
// infrastructure/typeorm/mappers/member.mapper.ts
export class MemberMapper {
  static toPersistence(domain: Member): MemberEntity {
    return {
      id: domain.id,
      name: domain.name,
      email: domain.email,  // Email.value se accede automáticamente con el getter
      identificationNumber: domain.identificationNumber,
      role: domain.role,
      status: domain.status,
      address: domain.address,
      phone: domain.phone || null,
      beneficiary: domain.beneficiary,
      registrationDate: domain.registrationDate,
      createdAt: domain.createdAt,
      deletedAt: null,
    };
  }

  static toDomain(persistence: MemberEntity): Member {
    return Member.fromPersistence({
      id: persistence.id,
      name: persistence.name,
      email: persistence.email,
      role: persistence.role,
      identificationNumber: persistence.identificationNumber,
      status: persistence.status,
      address: persistence.address,
      phone: persistence.phone ? Phone.create(persistence.phone) : undefined,
      beneficiary: persistence.beneficiary,
      registrationDate: persistence.registrationDate,
      createdAt: persistence.createdAt,
    });
  }
}
```

#### 5.3 Repository Implementation
```typescript
// infrastructure/typeorm/repositories/typeorm-member.repository.ts
@Injectable()
export class TypeOrmMemberRepository implements MemberRepository {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly orm: Repository<MemberEntity>,
  ) {}

  async findById(id: string): Promise<Member | null> {
    const entity = await this.orm.findOne({ where: { id } });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Member[]> {
    const entities = await this.orm.find();
    return entities.map(MemberMapper.toDomain);
  }

  async findActive(): Promise<Member[]> {
    const entities = await this.orm.find({
      where: { deletedAt: IsNull() },
    });
    return entities.map(MemberMapper.toDomain);
  }

  async save(member: Member): Promise<Member> {
    const entity = MemberMapper.toPersistence(member);
    const saved = await this.orm.save(entity);
    return MemberMapper.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.orm.softDelete(id);
  }
}
```

---

### Día 6: Refactor y Limpieza

- Mappers HTTP ↔ Application DTOs
- Validaciones con class-validator
- Swagger documentation
- Optimizaciones

---

## 📊 Resumen de Implementación

### Archivos a Crear

**Domain (5 archivos)**:
- `domain/entities/member.entity.ts`
- `domain/value-objects/email.value-object.ts`
- `domain/value-objects/phone.value-object.ts`
- `domain/value-objects/member-status.value-object.ts`
- `domain/ports/repositories/member-repository.port.ts`

**Application (6 archivos)**:
- `application/use-cases/members/update-member.use-case.ts`
- `application/use-cases/members/delete-member.use-case.ts`
- `application/queries/members/get-members.query-handler.ts`
- `application/queries/members/get-member-detail.query-handler.ts`
- `application/dto/members/update-member.dto.ts`
- `application/dto/members/delete-member.dto.ts`
- `application/dto/members/member-response.dto.ts`

**Infrastructure (4 archivos)**:
- `infrastructure/typeorm/entities/member.entity.ts`
- `infrastructure/typeorm/repositories/typeorm-member.repository.ts`
- `infrastructure/typeorm/mappers/member.mapper.ts`
- `infrastructure/nestjs/http/controllers/members.controller.ts` (actualizar)
- `infrastructure/nestjs/mappers/member-http.mapper.ts`

**Tests (5 archivos)**:
- `test/e2e/members/get-members.e2e-spec.ts`
- `test/e2e/members/get-member-detail.e2e-spec.ts`
- `test/e2e/members/update-member.e2e-spec.ts`
- `test/e2e/members/delete-member.e2e-spec.ts`
- `test/mocks/in-memory/repositories/in-memory-member.repository.ts`

---

## ✅ Checklist

- [ ] Día 1: Tests E2E creados y fallando (RED)
- [ ] Día 2: Controller + Mocks (GREEN mínimo)
- [ ] Día 3: Use Cases + Mock Repos (GREEN con lógica)
- [ ] Día 4: Domain completo (REFACTOR)
- [ ] Día 5: Repository TypeORM (GREEN final)
- [ ] Día 6: Refactor y documentación

---

**Estado**: ⏳ Pendiente de inicio  
**Prioridad**: **Alta** (Fase 1)

