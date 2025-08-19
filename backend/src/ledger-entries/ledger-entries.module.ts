import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { LedgerEntriesController } from './ledger-entries.controller';
import { LedgerEntriesService } from './ledger-entries.service';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerEntry])],
  controllers: [LedgerEntriesController],
  providers: [LedgerEntriesService],
  exports: [LedgerEntriesService],
})
export class LedgerEntriesModule {}
