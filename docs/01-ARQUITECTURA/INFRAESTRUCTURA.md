# Capa de Infraestructura

> Implementaciones concretas de repositorios, adaptadores HTTP, mappers y servicios transversales.

## Estructura de directorios

```
backend/src/infrastructure/
├── typeorm/           # Adaptador TypeORM (persistencia)
│   ├── repositories/
│   │   ├── member.repository.ts
│   │   ├── stock.repository.ts
│   │   ├── stock-subscription.repository.ts
│   │   ├── loan.repository.ts
│   │   ├── loan-transaction-detail.repository.ts
│   │   ├── meeting.repository.ts
│   │   ├── operation.repository.ts
│   │   ├── ledger-entry.repository.ts
│   │   ├── stock-value-history.repository.ts
│   │   ├── pending-member-payment.repository.ts
│   │   └── mandatory-contribution.repository.ts
│   └── config/
│       ├── database.config.ts
│       └── entities/  # Entity mappings (TypeORM entities)
├── nestjs/            # Adaptador NestJS (framework)
│   ├── http/          # Controladores HTTP
│   │   ├── stocks.controller.ts
│   │   ├── loans.controller.ts
│   │   ├── meetings.controller.ts
│   │   ├── members.controller.ts
│   │   └── accounting.controller.ts
│   └── mappers/       # Mappers DTO ↔ Domain
│       ├── stock.mapper.ts
│       ├── loan.mapper.ts
│       └── ...
├── in-memory/         # Adaptador en memoria (para tests)
│   └── repositories/
│       ├── member.repository.ts
│       ├── stock.repository.ts
│       └── ...
├── services/          # Implementaciones de servicios transversales
│   ├── event-bus/
│   │   └── nestjs-event-bus.service.ts  # Implementa EventBus port
│   └── transaction-manager/
│       └── typeorm-transaction-manager.ts  # Implementa TransactionManager port
└── strategies/        # Estrategias de implementación (shared)
    ├── disbursement-strategy.factory.ts
    └── payment-strategy.factory.ts
```

## Adaptadores

La infraestructura está organizada por adaptadores tecnológicos. Cada adaptador implementa los puertos definidos en el dominio.

### Adaptador TypeORM

Implementa los repositorios usando TypeORM como ORM.

#### Ejemplo: TypeORMMemberRepository

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../../domain/entities/member.entity';
import { MemberRepository } from '../../domain/ports/repositories/member.repository.port';

@Injectable()
export class TypeORMMemberRepository implements MemberRepository {
  constructor(
    @InjectRepository(Member)
    private readonly typeOrmRepo: Repository<Member>
  ) {}

  async findById(id: string): Promise<Member | null> {
    return this.typeOrmRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Member | null> {
    return this.typeOrmRepo.findOne({ where: { email } });
  }

  // ... otros métodos
}
```

### Adaptador NestJS

Implementa los adaptadores HTTP y mappers usando NestJS.

#### Controladores HTTP

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CreateStockSubscriptionUseCase } from '../../application/use-cases/stocks/create-stock-subscription.use-case';
import { CreateStockSubscriptionDto } from '../../application/dto/stocks/create-stock-subscription.dto';

@Controller('stocks')
export class StocksController {
  constructor(
    private readonly createStockSubscriptionUseCase: CreateStockSubscriptionUseCase
  ) {}

  @Post('subscriptions')
  async createSubscription(@Body() dto: CreateStockSubscriptionDto) {
    return this.createStockSubscriptionUseCase.execute(dto);
  }
}
```

### Adaptador In-Memory

Implementaciones en memoria de los repositorios, útiles para testing.

#### Ejemplo: InMemoryMemberRepository

```typescript
import { Member } from '../../domain/entities/member.entity';
import { MemberRepository } from '../../domain/ports/repositories/member.repository.port';

export class InMemoryMemberRepository implements MemberRepository {
  private members: Map<string, Member> = new Map();

  async findById(id: string): Promise<Member | null> {
    return this.members.get(id) || null;
  }

  async save(member: Member): Promise<Member> {
    this.members.set(member.id, member);
    return member;
  }

  // ... otros métodos
}
```

## Mappers

Los mappers transforman entre DTOs (application) y entidades de dominio. Están en `infrastructure/nestjs/mappers/`.

### Ejemplo: StockMapper

```typescript
import { Stock } from '../../domain/entities/stock.entity';
import { CreateStockSubscriptionDto } from '../../application/dto/stocks/create-stock-subscription.dto';

export class StockMapper {
  static toDomain(dto: CreateStockSubscriptionDto): Partial<StockSubscription> {
    // Transformación DTO → Domain
  }

  static toDTO(entity: StockSubscription): CreateStockSubscriptionResponseDto {
    // Transformación Domain → DTO
  }
}
```

## Servicios transversales

Los servicios transversales están organizados en `infrastructure/services/` por tipo de servicio.

### Event Bus Service

Implementa el puerto `EventBus` definido en `domain/ports/services/event-bus.port.ts`.

```typescript
import { Injectable } from '@nestjs/common';
import { EventBus } from '../../domain/ports/services/event-bus.port';
import { DomainEvent } from '../../domain/events/domain-event';

@Injectable()
export class NestJSEventBusService implements EventBus {
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    // Implementación con EventEmitter o librería de eventos
  }

  subscribe<T>(eventType: string, handler: (event: DomainEvent<T>) => Promise<void>): void {
    // Suscripción a eventos
  }
}
```

### Transaction Manager

Implementa el puerto `TransactionManager` usando transacciones de TypeORM. Está en `infrastructure/services/transaction-manager/`.

```typescript
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionManager } from '../../domain/ports/services/transaction-manager.port';

@Injectable()
export class TypeORMTransactionManager implements TransactionManager {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(operation: (trx: any) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      return operation(manager);
    });
  }
}
```

## Beneficios de la organización por adaptadores

1. **Separación clara**: Cada adaptador es independiente y puede cambiarse sin afectar otros
2. **Fácil testing**: Los adaptadores in-memory permiten tests sin infraestructura real
3. **Escalabilidad**: Agregar nuevos adaptadores (ej: MongoDB, Redis) no afecta código existente
4. **Framework agnóstico**: El dominio no sabe si usamos NestJS, Express u otro framework
5. **Simplicidad**: Solo incluye lo esencial para la funcionalidad actual

## Inyección de dependencias

En el módulo de NestJS, se configuran las implementaciones:

```typescript
@Module({
  providers: [
    // Use cases
    CreateStockSubscriptionUseCase,
    
    // Repositorios (implementaciones)
    {
      provide: 'MemberRepository',
      useClass: TypeORMMemberRepository,
    },
    
    // Servicios transversales
    {
      provide: 'EventBus',
      useClass: NestJSEventBusService,
    },
    {
      provide: 'TransactionManager',
      useClass: TypeORMTransactionManager,
    },
  ],
})
export class StocksModule {}
```

## Testing

Para tests, se pueden usar implementaciones en memoria:

```typescript
// En tests
const memberRepository = new InMemoryMemberRepository();
const createStockSubscriptionUseCase = new CreateStockSubscriptionUseCase(
  memberRepository,
  // ... otros repositorios en memoria
);
```

