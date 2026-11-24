/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AUDIT_LOG_REPOSITORY } from '@domain/constants/injection-tokens';
import { AuditLogRepository } from '@domain/ports/repositories/audit-log-repository.port';
import { GetAuditLogsQueryHandler } from '@application/queries/audit/get-audit-logs.query-handler';
import { AuditLog as AuditLogEntity } from '../../typeorm/entities/audit-log.entity';
import { TypeOrmAuditLogRepository } from '../../typeorm/repositories/typeorm-audit-log.repository';
import { AuditV2Controller } from '../../nestjs/http/controllers/audit.v2.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditV2Controller],
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: TypeOrmAuditLogRepository,
    },
    {
      provide: GetAuditLogsQueryHandler,
      useFactory: (auditLogRepository: AuditLogRepository) =>
        new GetAuditLogsQueryHandler(auditLogRepository),
      inject: [AUDIT_LOG_REPOSITORY],
    },
  ],
  exports: [AUDIT_LOG_REPOSITORY],
})
export class AuditModule {}
