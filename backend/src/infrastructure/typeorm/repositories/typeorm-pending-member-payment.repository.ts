import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { PendingMemberPayment as PendingMemberPaymentDomain } from '@domain/entities/pending-member-payment.entity';
import { PendingMemberPayment as PendingMemberPaymentEntity } from '../entities/pending-member-payment.entity';
import { PendingMemberPaymentMapper } from '../mappers/pending-member-payment.mapper';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';

@Injectable()
export class TypeOrmPendingMemberPaymentRepository implements PendingMemberPaymentRepository {
  constructor(
    @InjectRepository(PendingMemberPaymentEntity)
    private readonly repo: Repository<PendingMemberPaymentEntity>,
    private readonly transactionManager: TransactionManager,
  ) {}

  // LedgerEntryRepository will be injected via setter or passed as parameter
  private ledgerEntryRepository?: LedgerEntryRepository;

  setLedgerEntryRepository(repo: LedgerEntryRepository): void {
    this.ledgerEntryRepository = repo;
  }

  /**
   * Get the repository to use (with or without active transaction)
   */
  private getRepository(): Repository<PendingMemberPaymentEntity> {
    const activeQueryRunner = this.transactionManager.getActiveQueryRunner();
    if (activeQueryRunner) {
      return activeQueryRunner.manager.getRepository(
        PendingMemberPaymentEntity,
      ) as Repository<PendingMemberPaymentEntity>;
    }
    return this.repo;
  }

  async findById(id: string): Promise<PendingMemberPaymentDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({ where: { id } });
    return entity ? PendingMemberPaymentMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<PendingMemberPaymentDomain[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const repo = this.getRepository();
    const entities = await repo.find({ where: { id: In(ids) } });
    return entities.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async findByMember(memberId: string): Promise<PendingMemberPaymentDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({ where: { memberId } });
    return entities.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async findByMeeting(
    meetingId: string,
  ): Promise<PendingMemberPaymentDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({ where: { meetingId } });
    return entities.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async findPendingByMeeting(
    meetingId: string,
  ): Promise<PendingMemberPaymentDomain[]> {
    const repo = this.getRepository();
    console.log(
      `[TypeOrmPendingMemberPaymentRepository] findPendingByMeeting - meetingId: ${meetingId}`,
    );
    console.log(
      `[TypeOrmPendingMemberPaymentRepository] Buscando TODOS los pagos pendientes activos (sin filtrar por reunión)`,
    );

    // Buscar TODOS los pagos pendientes activos, sin importar la reunión
    // Esto permite que pagos pendientes de reuniones anteriores puedan ser pagados en la reunión actual
    const entities = await repo.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' }, // Ordenar por fecha de creación para mantener consistencia
    });

    console.log(
      `[TypeOrmPendingMemberPaymentRepository] Found ${entities.length} pending payments (all meetings)`,
    );
    entities.forEach((e, idx) => {
      console.log(
        `[TypeOrmPendingMemberPaymentRepository] Entity ${idx + 1}:`,
        {
          id: e.id,
          memberId: e.memberId,
          meetingId: e.meetingId,
          referenceMeetingId: e.referenceMeetingId,
          type: e.type,
          status: e.status,
          amount: e.amount,
          notes: e.notes,
        },
      );
    });

    return entities.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async findByReference(
    referenceMeetingId: string,
  ): Promise<PendingMemberPaymentDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { referenceMeetingId },
    });
    return entities.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async save(
    payment: PendingMemberPaymentDomain,
  ): Promise<PendingMemberPaymentDomain> {
    const repo = this.getRepository();
    const persistence = PendingMemberPaymentMapper.toPersistence(payment);
    const existing = await repo.findOne({ where: { id: payment.id } });

    if (existing) {
      await repo.update(payment.id, persistence);
      const updated = await repo.findOne({ where: { id: payment.id } });
      if (!updated) {
        throw new Error('PendingMemberPayment not found after update');
      }
      return PendingMemberPaymentMapper.toDomain(updated);
    } else {
      const saved = await repo.save(persistence as PendingMemberPaymentEntity);
      return PendingMemberPaymentMapper.toDomain(saved);
    }
  }

  async saveMany(
    payments: PendingMemberPaymentDomain[],
  ): Promise<PendingMemberPaymentDomain[]> {
    const repo = this.getRepository();
    const persistences = payments.map((p) =>
      PendingMemberPaymentMapper.toPersistence(p),
    );
    const saved = await repo.save(persistences as PendingMemberPaymentEntity[]);
    return saved.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async calculateRemainingAmount(paymentId: string): Promise<number> {
    const payment = await this.findById(paymentId);
    if (!payment) {
      throw new Error('PendingMemberPayment not found');
    }

    // Find all ledger entries related to this payment
    // This would require additional logic to link ledger entries to payments
    // For now, return the full amount
    // TODO: Implement proper calculation based on ledger entries
    // Note: This method may require LedgerEntryRepository for full implementation
    return payment.amount;
  }

  async findWithFilters(filters: {
    status?: string;
    memberId?: string;
    meetingId?: string;
    type?: string;
  }): Promise<PendingMemberPaymentDomain[]> {
    const repo = this.getRepository();
    const query = repo.createQueryBuilder('payment');

    if (filters.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }
    if (filters.memberId) {
      query.andWhere('payment.memberId = :memberId', {
        memberId: filters.memberId,
      });
    }
    if (filters.meetingId) {
      query.andWhere('payment.meetingId = :meetingId', {
        meetingId: filters.meetingId,
      });
    }
    if (filters.type) {
      query.andWhere('payment.type = :type', { type: filters.type });
    }

    // Join member to get the name optionally, though for now we return domain entities
    // We can just return standard domain
    query.orderBy('payment.createdAt', 'DESC');

    const entities = await query.getMany();
    return entities.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async delete(id: string): Promise<void> {
    const repo = this.getRepository();
    await repo.delete(id);
  }
}
