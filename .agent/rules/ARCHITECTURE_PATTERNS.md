# Patrones Arquitectónicos - Collaborative Saving

Este documento define los patrones arquitectónicos basados en arquitectura hexagonal y lecciones aprendidas.

## Estructura de Capas
```
Infrastructure → Application → Domain
```
**CRÍTICO**: Las dependencias siempre apuntan hacia adentro. El `domain` NUNCA importa de `application` o `infrastructure`.

### Regla Crítica de Imports Legacy
**NUNCA importar de la arquitectura legacy** (directorios `src/{feature}/` excepto entidades de base de datos) en código de la nueva arquitectura hexagonal (`domain/`, `application/`, `infrastructure/`).
Las entidades TypeORM legacy (`src/{feature}/entities/`) SOLO pueden importarse en:
- Mappers de TypeORM (`infrastructure/typeorm/mappers/`)
- Repositorios TypeORM (`infrastructure/typeorm/repositories/`)
- Módulos NestJS para `TypeOrmModule.forFeature()`

### Estructura de Directorios
```
src/
├── domain/                      # Capa pura de negocio (Entities, Value Objects, Domain Services, Ports)
├── application/                 # Casos de uso (Naming: verb-noun.use-case.ts), Queries y DTOs (camelCase)
└── infrastructure/              # Adaptadores (TypeORM, NestJS Controllers/HTTP DTOs/Modules, Services)
```

---

## Inversión de Dependencias (DI) con Symbols
Para evitar acoplamiento en NestJS, todos los puertos (interfaces) se registran con `Symbol` como tokens de DI.
**REGLA**: Todos los tokens de DI transversales deben centralizarse en `backend/src/domain/constants/injection-tokens.ts` (ej. `MEMBER_REPOSITORY`, `TRANSACTION_MANAGER`).

### Configuración del Módulo NestJS
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity])],
  controllers: [MembersV2Controller],
  providers: [
    { provide: MEMBER_REPOSITORY, useClass: TypeOrmMemberRepository },
    {
      provide: CreateMemberUseCase,
      useFactory: (repo: MemberRepository) => new CreateMemberUseCase(repo),
      inject: [MEMBER_REPOSITORY],
    },
    TypeOrmMemberRepository,
  ],
})
export class MembersV2Module {}
```

---

## Responsabilidades de Componentes

### 1. Controllers HTTP (Infrastructure)
Manejan la entrada HTTP y delegan a Use Cases/Queries.
- **Sin lógica de negocio**: Solo validación y mapeo.
- **ValidationPipe**: Obligatorio en POST/PATCH/PUT con `{ whitelist: true, forbidNonWhitelisted: true }`.
- **Swagger**: Decoradores obligatorios (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, etc.).
- **Manejo de Errores**: Consistente mediante try-catch y HttpExceptions.

### 2. DTOs por Capa
- **HTTP DTOs**: Usan `snake_case` para propiedades. Llevan decoradores de `class-validator` y Swagger.
- **Application DTOs**: Usan `camelCase` para propiedades. Son clases o interfaces TS puras sin decoradores.
- **Mappers HTTP**: Convierten `snake_case` (HTTP) ↔ `camelCase` (Application).

```typescript
// HTTP DTO (snake_case)
export class CreateMemberHttpDto {
  @ApiProperty() @IsNotEmpty() @IsString()
  identification_number: string;
}
// Application DTO (camelCase)
export class CreateMemberDto {
  identificationNumber: string;
}
// HTTP Mapper
export class MemberHttpMapper {
  static toApplication(http: CreateMemberHttpDto): CreateMemberDto {
    return { identificationNumber: http.identification_number };
  }
}
```

### 3. Use Cases (Application)
Orquestan la lógica de aplicación ejecutando una sola acción de negocio.
- Dependen de interfaces de dominio (ports).
- Retornan DTOs de aplicación (nunca entities de dominio directas).

### 4. Value Objects (Domain)
Encapsulan validación y son inmutables.
- Constructor valida el valor y lanza error si es inválido.
- `readonly` properties y método estático `create()`.

```typescript
export class Email {
  constructor(public readonly value: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Invalid email');
  }
  static create(value: string): Email { return new Email(value); }
}
```

### 5. Domain Entities (Domain)
Modelan el negocio. ID inmutable, estado mutable privado (`_prop`) con getters públicos.
- Métodos estáticos: `create()` (nuevos registros) y `fromPersistence()` (reconstrucción).
- Modificaciones solo a través de métodos explícitos del dominio.

### 6. Repositorios y Mappers (Infrastructure)
- **Repositorios**: Implementan los puertos de dominio. Reciben/retornan entidades de dominio usando mappers para persistir con TypeORM.
- **Mappers**: Clases estáticas para mapeo `toDomain()` y `toPersistence()`.
  - `toDomain()` debe envolver en `try/catch` para manejar errores de validación de negocio.
  - `toPersistence()` debe convertir explícitamente `undefined` de TypeScript a `null` de BD para campos opcionales.

---

## Sistema Transversal de Registro de Operaciones (Contabilidad)
**MANDATORIO**: Todas las operaciones contables (débitos/créditos) DEBEN usar `RecordOperationUseCase.execute()`. NUNCA crear operaciones o ledger entries directamente con TypeORM.

- **RecordOperationUseCase**: Orquesta la creación usando transacciones atómicas (`TransactionManager`).
- **OperationBalanceValidator**: Domain service puro que valida que Débitos (amount > 0) y Créditos (amount < 0) sumen cero. Lanza `BusinessRuleError` si no balancea.

```typescript
// Uso correcto:
await this.recordOperationUseCase.execute({
  memberId,
  meetingId,
  type: OperationType.MONTHLY_PAYMENT,
  description: 'Pago mensual',
  entries: [
    { accountType: CASH_ACCOUNT, amount: -1000 },
    { accountType: STOCK_CAPITAL_ACCOUNT, amount: 1000 },
  ],
});
```

---

## Checklist de Validación
- [ ] Estructura limpia de capas (`domain`, `application`, `infrastructure`).
- [ ] Ningún import de infraestructura/aplicación en `domain`.
- [ ] Ningún import legacy en `domain` o `application`.
- [ ] Inversión de dependencias mediante Symbols centralizados.
- [ ] DTOs HTTP en `snake_case`, DTOs de Aplicación en `camelCase`.
- [ ] Validaciones en constructores de Value Objects.
- [ ] Entidades de dominio encapsuladas con constructores privados o factory methods.
- [ ] Mappers de TypeORM manejan nulabilidad y controlan errores en `toDomain`.
- [ ] Operaciones contables utilizan únicamente `RecordOperationUseCase`.

**Última actualización**: 2025-10-31
