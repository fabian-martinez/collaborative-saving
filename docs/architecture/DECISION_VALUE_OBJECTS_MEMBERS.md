# Decisión: Value Objects para Members

## 📋 Value Objects Propuestos

En el plan propuse 3 Value Objects:
1. **MemberId** - Validación de formato UUID
2. **Email** - Validación de formato de email
3. **MemberStatus** - Enum tipado para estados

## 🤔 Análisis de la Decisión

### ¿Qué es un Value Object?

Un **Value Object** (VO) en DDD es:
- **Inmutable**: Una vez creado, no cambia
- **Se identifica por valor**: Dos VOs con el mismo valor son iguales
- **Encapsula validaciones**: Garantiza que el valor siempre es válido
- **Sin identidad propia**: A diferencia de las Entidades, no tienen ID

### Comparación: Value Object vs String Simple

#### Opción A: Value Objects (lo que propuse)

```typescript
// Con Value Objects
export class Member {
  constructor(
    public readonly id: MemberId,        // ✅ Validación automática
    private _email: Email,                // ✅ Validación automática
    private _status: MemberStatus,        // ✅ Solo valores permitidos
  ) {}
}

// Uso
const member = new Member(
  MemberId.create('invalid-id'),  // ❌ Lanza error inmediatamente
  Email.create('invalid-email'),  // ❌ Lanza error inmediatamente
  MemberStatus.ACTIVE,             // ✅ Solo puede ser ACTIVE o INACTIVE
);
```

**Ventajas**:
- ✅ **Validación temprana**: Los errores se detectan al crear el objeto
- ✅ **Type safety**: TypeScript previene errores de tipo
- ✅ **Documentación implícita**: El código expresa la intención claramente
- ✅ **Reutilizable**: Email se puede usar en otros lugares
- ✅ **Encapsulación**: Las reglas de negocio están en un lugar

**Desventajas**:
- ❌ **Más código**: Más archivos y clases que mantener
- ❌ **Overhead**: Más complejidad para casos simples
- ❌ **Mapeo**: Necesitas mappers entre Domain y DB

#### Opción B: Strings Simples (alternativa simple)

```typescript
// Con strings simples
export class Member {
  constructor(
    public readonly id: string,          // ⚠️ Cualquier string
    private _email: string,               // ⚠️ Cualquier string
    private _status: string,              // ⚠️ Cualquier string
  ) {
    // Validaciones en el constructor
    this.validateId(id);
    this.validateEmail(_email);
    this.validateStatus(_status);
  }
  
  private validateId(id: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new DomainError('Invalid member ID');
    }
  }
}

// Uso
const member = new Member(
  'invalid-id',      // ❌ Error solo cuando se crea Member
  'invalid-email',   // ❌ Error solo cuando se crea Member
  'invalid-status',  // ❌ Error solo cuando se crea Member
);
```

**Ventajas**:
- ✅ **Más simple**: Menos archivos, menos complejidad
- ✅ **Mapeo directo**: No necesitas mappers para DB
- ✅ **Menos overhead**: Menos código que mantener

**Desventajas**:
- ❌ **Validación tardía**: Solo se valida cuando creas la entidad
- ❌ **Menos reutilizable**: La validación está acoplada a Member
- ❌ **Menos expresivo**: Un string no documenta su propósito

---

## 🎯 Recomendación: Enfoque Pragmático

Después de analizar, propongo un **enfoque híbrido**:

### Value Objects Recomendados

#### ✅ **Email** - SÍ usar Value Object

**Razones**:
1. **Reutilizable**: Se usa en Member, Loan, Meeting, etc.
2. **Validación compleja**: Requiere regex específico
3. **Invariante de negocio**: Email debe ser único y válido
4. **Alto valor**: Previene bugs comunes (emails inválidos)

```typescript
// domain/value-objects/email.value-object.ts
export class Email {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new DomainError(`Invalid email: ${value}`);
    }
  }
  
  static create(value: string): Email {
    return new Email(value);
  }
  
  private isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  
  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
```

#### ✅ **MemberStatus** - SÍ usar Value Object (enum tipado)

**Razones**:
1. **Invariante de negocio**: Solo 2 estados válidos (active/inactive)
2. **Type safety**: Previene estados inválidos
3. **Lógica asociada**: Puede tener métodos (`canBeDeleted()`, `isActive()`)

```typescript
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

#### ✅ **Phone** - SÍ usar Value Object (si hay validaciones complejas)

**Razones**:
1. **Validación de formato**: Puede requerir formato internacional (+XX XXXX XXXX)
2. **Normalización**: Limpiar espacios, guiones, paréntesis
3. **Reutilizable**: Se puede usar en otras entidades

**Alternativa**: Si solo aceptas formato simple, puede ser string simple.

```typescript
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
    // Validación simple: al menos 7 dígitos
    // O más compleja: formato internacional
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    return /^\+?[\d]{7,15}$/.test(cleaned);
  }
  
  get formatted(): string {
    // Normalizar formato
    return this.value.replace(/[\s\-\(\)]/g, '');
  }
}
```

#### ❌ **MemberId** - NO usar Value Object (usar string)

**Razones**:
1. **Validación simple**: El formato UUID se valida en la capa de infraestructura (ParseUUIDPipe de NestJS)
2. **No tiene lógica**: Es solo un identificador, no tiene comportamiento
3. **Overhead innecesario**: Agregar un VO para esto es over-engineering
4. **Ya validado**: NestJS ya valida UUIDs con `ParseUUIDPipe`

**Alternativa**: Validar en el constructor de Member si es necesario:

```typescript
export class Member {
  constructor(
    public readonly id: string,  // ← String simple
    private _email: Email,        // ← Value Object
    private _status: MemberStatus, // ← Value Object
  ) {
    // Validación opcional del ID (si queremos ser estrictos)
    if (!this.isValidUUID(id)) {
      throw new DomainError('Invalid UUID format');
    }
  }
  
  private isValidUUID(value: string): boolean {
    // Validación simple, o confiar en ParseUUIDPipe
    return true; // O implementar si es necesario
  }
}
```

---

## 📊 Comparación Final

| Value Object | ¿Usar? | Razón |
|--------------|--------|-------|
| **Email** | ✅ **SÍ** | Reutilizable, validación compleja, invariante de negocio |
| **MemberStatus** | ✅ **SÍ** | Invariante de negocio, type safety, puede tener lógica |
| **MemberId** | ❌ **NO** | Ya validado por infraestructura, no tiene lógica, overhead innecesario |
| **Phone** | ✅ **SÍ** | Validación de formato, normalización, puede ser reutilizable |
| **Address** | ❌ **NO** | String simple es suficiente |

---

## 🔄 Propuesta Revisada

### Entidad Member Simplificada

```typescript
// domain/entities/member.entity.ts
export class Member {
  constructor(
    public readonly id: string,              // ← String simple
    private _name: string,
    private _email: Email,                   // ← Value Object
    private _status: MemberStatus,            // ← Value Object
    private _role: string,                    // ← String simple (default: 'member')
    private _identificationNumber?: string,   // ← String simple (puede ser opcional)
    private _address?: string,                // ← String simple
    private _phone?: Phone,                   // ← Value Object (opcional)
    private _beneficiary?: string,            // ← String simple
    public readonly registrationDate: Date,
    public readonly createdAt: Date,          // ← Timestamp de creación
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

---

## 🎓 Criterios para Decidir: ¿Value Object o String?

Usa **Value Object** cuando:
- ✅ El valor tiene **validación compleja** (email, phone internacional)
- ✅ El valor tiene **invariantes de negocio** (status solo puede ser X o Y)
- ✅ El valor se **reutiliza** en múltiples entidades
- ✅ El valor tiene **comportamiento** (métodos como `equals()`, `isValid()`)
- ✅ El valor necesita **normalización** (email a lowercase)

Usa **String simple** cuando:
- ✅ El valor es **solo un identificador** (MemberId, LoanId)
- ✅ La validación es **simple** o **ya se hace en infraestructura** (UUID con ParseUUIDPipe)
- ✅ El valor **no tiene lógica** ni comportamiento
- ✅ El valor es **específico de una entidad** (address, beneficiary)

---

## ✅ Decisión Final para Members

**Value Objects a implementar**:
1. ✅ **Email** - Reutilizable y con validación compleja
2. ✅ **MemberStatus** - Invariante de negocio y type safety
3. ✅ **Phone** - Validación de formato y normalización

**No usar Value Object**:
- ❌ **MemberId** - String simple (validado por infraestructura)
- ❌ **Address, Beneficiary** - Strings simples (no tienen lógica compleja)

¿Estás de acuerdo con esta decisión o prefieres un enfoque diferente?

