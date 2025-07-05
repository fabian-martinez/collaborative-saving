import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerEntry])],
  controllers: [],
  providers: [],
})
export class LedgerEntriesModule {}
