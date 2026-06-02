# 🔌 Puertos (Ports): ¿Qué Son y Por Qué Son Importantes?

## 📚 Concepto de "Puerto" en Arquitectura Hexagonal

Un **Puerto** es una **interfaz** (interface TypeScript) que define un **contrato** que el dominio necesita.

### Analogía: Puerto Físico

Piensa en un puerto USB de tu computadora:
- **El puerto** define el **contrato**: forma, tamaño, protocolo
- **Cualquier dispositivo** que cumpla ese contrato puede conectarse
- Puedes cambiar el dispositivo (mouse, teclado, disco) sin cambiar el puerto

Lo mismo en código:
- **El puerto (interface)** define el contrato: qué métodos necesita el dominio
- **La implementación** (adaptador) puede cambiar: TypeORM, MongoDB, in-memory para tests
- El dominio **no sabe** qué implementación se está usando

---

## 🔌 ¿Por Qué "Puerto"?

El término viene de "**Ports and Adapters**" (Puertos y Adaptadores):

- **Puerto (Port)**: La interfaz (contrato)
- **Adaptador (Adapter)**: La implementación concreta

```
┌─────────────────────────────────────────┐
│         DOMAIN (Centro)                 │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Port (Interface)                │  │
│  │  MemberRepository                 │  │
│  │  - findById()                     │  │
│  │  - save()                         │  │
│  └─────────────────────────────────┘  │
│              ↑                         │
│              │ implementa              │
└──────────────┼─────────────────────────┘
               │
┌──────────────┼─────────────────────────┐
│              ↓                         │
│  Adapter (Implementation)               │
│  TypeOrmMemberRepository                │
│  - findById() { usa TypeORM }           │
│  - save() { usa TypeORM }               │
└─────────────────────────────────────────┘
```

---

## ✅ ¿Por Qué Es Importante (No un Problema)?

El símbolo 🔌 es porque es **fundamental** entenderlo, no porque sea malo:

### Ventajas de los Puertos:

1. **Desacoplamiento**: El dominio no depende de TypeORM, MongoDB, etc.
2. **Testabilidad**: Puedes usar repositorios in-memory para tests
3. **Flexibilidad**: Puedes cambiar de base de datos sin tocar el dominio
4. **Claridad**: Define explícitamente qué necesita el dominio

---

## 📝 Ejemplo Concreto: MemberRepository

### 1. Puerto (Domain) - Solo la Interfaz

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

**Nota importante**:
- ✅ Es solo una **interface TypeScript**
- ✅ No tiene implementación
- ✅ El dominio **define** qué necesita
- ✅ No importa TypeORM ni ninguna librería externa

### 2. Adaptador TypeORM (Infrastructure) - Implementación Real

```typescript
// infrastructure/typeorm/repositories/typeorm-member.repository.ts
@Injectable()
export class TypeOrmMemberRepository implements MemberRepository {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly orm: Repository<MemberEntity>,
  ) {}

  async findById(id: string): Promise<Member | null> {
    // Implementación usando TypeORM
    const entity = await this.orm.findOne({ where: { id } });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  // ... implementa todos los métodos de la interface
}
```

### 3. Adaptador In-Memory (Tests) - Implementación Mock

```typescript
// test/mocks/in-memory/repositories/in-memory-member.repository.ts
export class InMemoryMemberRepository implements MemberRepository {
  private members: Member[] = [];

  async findById(id: string): Promise<Member | null> {
    // Implementación simple en memoria (para tests)
    return this.members.find(m => m.id === id) || null;
  }

  // ... implementa todos los métodos de la interface
}
```

### 4. Use Case (Application) - Usa el Puerto

```typescript
// application/use-cases/members/update-member.use-case.ts
export class UpdateMemberUseCase {
  constructor(
    // ✅ Usa la INTERFACE (puerto), no la implementación
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(dto: UpdateMemberDto): Promise<MemberResponseDto> {
    // El código aquí NO sabe si es TypeORM o in-memory
    const member = await this.memberRepository.findById(dto.memberId);
    // ...
  }
}
```

---

## 🎯 Resumen: ¿Por Qué el Símbolo 🔌?

El símbolo 🔌 (en lugar de ⚠️) indica que es un **concepto clave** a entender:

- ✅ **No es un problema**: Es una característica positiva
- ✅ **Es fundamental**: Sin puertos, no hay desacoplamiento
- ✅ **Define el contrato**: El dominio especifica qué necesita
- ✅ **Habilita flexibilidad**: Puedes cambiar implementaciones fácilmente

---

## 📚 Regla de Oro

**En `domain/ports/`**:
- ✅ Solo **interfaces** (interfaces TypeScript)
- ✅ Sin implementaciones
- ✅ Sin decoradores de TypeORM
- ✅ Sin imports de librerías externas (excepto tipos básicos)

**En `infrastructure/`**:
- ✅ Implementaciones **concretas** de esas interfaces
- ✅ Con TypeORM, HTTP, etc.
- ✅ Los adaptadores implementan los puertos

---

**En resumen**: Los puertos son **buenos** - definen contratos claros y permiten desacoplamiento. El símbolo 🔌 es para destacar su importancia, no para indicar un problema.

