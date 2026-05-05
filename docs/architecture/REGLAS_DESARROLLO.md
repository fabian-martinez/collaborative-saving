# Development Rules (Quick Guide)

## Dev environment tips

- Backend: `cd backend`
  - Install deps: `npm ci`
  - Start dev: `npm run start:dev`
  - Run specific package scripts with filters if needed: `npm run <script>`
- Frontend: `cd app`
  - Install deps: `npm ci`
  - Start dev: `npm run dev`
- Navigate quickly to feature code:
  - Backend (Nest): `src/<feature>/...` (actual), hexagonal under `src/{domain,application,infrastructure}` (nuevo)
  - Use `rg "class .*Controller" -n src` para ubicar controladores rápido
- DB (Postgres):
  - Prefer MCP over Supabase CLI (cuando corresponda)
  - Migrations en `infra/database/migrations`
- Containers (si aplica):
  - Prefer Podman: `podman compose up -d`
- Crear estructura hexagonal base (si falta):
  - `cd backend/src && mkdir -p domain/{entities,value-objects,ports/{repositories,services}} application/{use-cases,queries,dto} infrastructure/{typeorm/{entities,repositories,mappers},nestjs/{http/controllers,mappers}}`

## Testing instructions

- E2E (backend): `cd backend && npm run test:e2e`
  - Foco en un archivo: `npm run test:e2e -- test/members/members.e2e-spec.ts`
  - Foco en un test: `npm run test:e2e -- -t "<test name>"`
- Unit tests: `npm run test:unit`
- Cobertura: `npm run test:cov`
- Después de mover archivos/imports: `npm run lint` (solo si aporta; evita perder tiempo en cosmetico)
- Regla: agrega/actualiza tests para cada cambio de lógica. Suite en verde antes de merge.

## PR instructions

- Title: `[backend|app|docs] <Title>` o `[feature/<context>] <Title>`
- Antes de abrir PR: `npm run test:e2e` y `npm run test:unit` (backend) / `npm run build` (frontend)
- Tamaño: PRs pequeños y enfocados (un caso de uso o endpoint por PR)
- Mensajes de commit (en inglés, imperativo): `Add UpdateMember use case`, `Fix members controller validation`
- No mezclar refactors grandes con cambios funcionales en el mismo PR

---

## Appendix: Detailed Rules (Architecture & Process)

## 1) Principios rectores
- Arquitectura Hexagonal: infrastructure → application → domain. Domain no depende de frameworks.
- Outside-In + TDD: E2E (RED) → Adapters/Mocks (GREEN) → Use Cases → Domain → Repos reales → Refactor.
- Cohesión por contexto (Members, Loans, Stocks, Meetings).
- Código en inglés. Migración incremental sin romper endpoints.

## 2) Organización de código
- domain/: entities, value-objects, services (puro), ports (interfaces).
- application/: use-cases (commands), queries (read), dto/.
- infrastructure/: typeorm (entities/mappers/repos), nestjs (http controllers/mappers), services.

## 3) Naming & estilo
- Clases/Interfaces: PascalCase. Variables/funciones: camelCase. Enums PascalCase.
- DTOs: `*Dto`/`*ResponseDto`. Use-case: `verb-noun.use-case.ts`.
- Repos (ports): `XRepository`. Implementaciones: `TypeOrmXRepository`. Mappers: `toDomain/toPersistence/toHttp`.

## 4) Reglas de dominio
- Entidades y VOs validan invariantes. VOs recomendados: `Email`, `Phone`, `MemberStatus`, `Money`, `Quantity`.
- Domain services para reglas transversales. Domain events cuando aplique.

## 5) Puertos (ports)
- Solo interfaces en `domain/ports/**`. Implementaciones en `infrastructure/**`.
- Application usa puertos; no depende de implementaciones.

## 6) DTOs y mapeos
- HTTP DTOs ↔ Application DTOs ↔ Domain Entities (mappers). Validación con `class-validator` en HTTP.

## 7) Errores y excepciones
- Domain: errores de negocio (`NotFoundError`, `BusinessRuleError`). Infra (HTTP): filtro global a códigos HTTP.

## 8) Transacciones
- Orquestadas en application con `TransactionManager` (puerto) + implementación TypeORM.

## 8.1) Registro de Operaciones Contables (OBLIGATORIO)
- **TODAS las operaciones contables** DEBEN registrarse usando `RecordOperationUseCase`.
- **NO crear** operaciones directamente con TypeORM (`queryRunner.manager.create(Operation, ...)`).
- **NO crear** ledger entries directamente con TypeORM (`queryRunner.manager.create(LedgerEntry, ...)`).
- **NO duplicar** lógica de validación de balance (está centralizada en la entidad `Operation` y `OperationBalanceValidator`).
- **NO gestionar** transacciones manualmente para operaciones contables (use case lo maneja automáticamente).

### Ejemplo de Uso Obligatorio
```typescript
// ✅ CORRECTO - Usar RecordOperationUseCase
const result = await this.recordOperationUseCase.execute({
  memberId: memberId,
  meetingId: meetingId,
  type: OperationType.MONTHLY_PAYMENT,
  description: 'Pago mensual',
  entries: [
    { accountType: CASH_ACCOUNT, amount: -1000 },
    { accountType: STOCK_CAPITAL_ACCOUNT, amount: 1000 },
  ],
});

// ❌ INCORRECTO - NO crear operaciones directamente
const queryRunner = this.dataSource.createQueryRunner();
// ... código duplicado ...
```

### Beneficios
- Validación automática de balance (débitos = créditos)
- Transaccionalidad garantizada (todo o nada)
- Eliminación de código duplicado (~1,300 líneas)
- Consistencia en todo el sistema

### Documentación Completa
Ver [GUIA_REGISTRO_OPERACIONES.md](./GUIA_REGISTRO_OPERACIONES.md) para ejemplos detallados y casos de uso.

## 9) Testing
- E2E: contratos externos y flujos completos. Unit: domain/application sin DB (repos in-memory).
- Cobertura: priorizar módulos migrados (≥ 90% deseable). Evitar gastar tiempo en linting si no bloquea.

## 10) Git & PR
- Commits atómicos por caso de uso. PR pequeño, con DoD:
  - Tests E2E/Unit en verde
  - Use-cases con puertos
  - DTOs y validaciones
  - **Swagger documentado (obligatorio para nuevos endpoints)**
  - Doc breve si hay nueva decisión

## 10.1) Documentación Swagger (Obligatoria)
- **Todos los endpoints nuevos DEBEN estar documentados con Swagger**
- Controller: usar `@ApiTags()` para agrupar endpoints relacionados
- Cada endpoint: `@ApiOperation()` con `summary` y `description`
- Parámetros: `@ApiParam()` para path params, `@ApiBody()` para request body
- Respuestas: `@ApiResponse()` para 200, `@ApiBadRequestResponse()`, `@ApiNotFoundResponse()`, etc.
- DTOs:
  - Convertir `type` a `class` para usar decoradores Swagger
  - Usar `@ApiProperty()` para campos requeridos
  - Usar `@ApiPropertyOptional()` para campos opcionales
  - Incluir `description`, `example`, y `enum` cuando aplique
- Ejemplo de estructura:
  ```typescript
  @ApiTags('Members V2')
  @Controller('v2/members')
  export class MembersV2Controller {
    @Get()
    @ApiOperation({ summary: 'List all active members' })
    @ApiResponse({ status: 200, type: [MemberResponseDto] })
    async list(): Promise<MemberResponseDto[]> { ... }
  }
  ```
- Verificar documentación en `/api` (Swagger UI) antes de hacer merge

## 11) Operaciones y herramientas
- DB normalizada. Usar MCP para DB. Podman para contenedores. Frontend con Tailwind + DaisyUI.
- Presentar scripts antes de ejecutarlos; no interactivos en CI.

## 12) Observabilidad y seguridad
- Logging en infrastructure. Métricas en application si aplica.
- Validación y saneamiento en HTTP. No exponer datos sensibles en logs.
