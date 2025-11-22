import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  ],
  exports: [TransactionManager],
})
export class TransactionManagerModule {}
