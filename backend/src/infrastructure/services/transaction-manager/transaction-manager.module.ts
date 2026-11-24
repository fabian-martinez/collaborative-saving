import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { TypeOrmTransactionManager } from './typeorm-transaction-manager.service';

@Global()
@Module({
  imports: [TypeOrmModule], // Needed for DataSource injection
  providers: [
    {
      provide: TransactionManager,
      useClass: TypeOrmTransactionManager,
    },
    {
      provide: TRANSACTION_MANAGER,
      useExisting: TransactionManager,
    },
  ],
  exports: [TransactionManager, TRANSACTION_MANAGER],
})
export class TransactionManagerModule {}
