import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { PendingMemberPayment as PendingMemberPaymentDomain } from '@domain/entities/pending-member-payment.entity';
import { PendingMemberPayment as PendingMemberPaymentEntity } from '../entities/pending-member-payment.entity';
import { PendingMemberPaymentMapper } from '../mappers/pending-member-payment.mapper';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';

@Injectable()
export class TypeOrmPendingMemberPaymentRepository implements PendingMemberPaymentRepository {
  constructor(
    @InjectRepository(PendingMemberPaymentEntity)
    private readonly repo: Repository<PendingMemberPaymentEntity>,
  ) {}

  // LedgerEntryRepository will be injected via setter or passed as parameter
  private ledgerEntryRepository?: LedgerEntryRepository;

  setLedgerEntryRepository(repo: LedgerEntryRepository): void {
    this.ledgerEntryRepository = repo;
  }

  async findById(id: string): Promise<PendingMemberPaymentDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? PendingMemberPaymentMapper.toDomain(entity) : null;
  }

  async findByMember(memberId: string): Promise<PendingMemberPaymentDomain[]> {
    const entities = await this.repo.find({ where: { memberId } });
    return entities.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async findByMeeting(
    meetingId: string,
  ): Promise<PendingMemberPaymentDomain[]> {
    const entities = await this.repo.find({ where: { meetingId } });
    return entities.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async findPendingByMeeting(
    meetingId: string,
  ): Promise<PendingMemberPaymentDomain[]> {
    console.log(
      `[TypeOrmPendingMemberPaymentRepository] findPendingByMeeting - meetingId: ${meetingId}`,
    );
    console.log(
      `[TypeOrmPendingMemberPaymentRepository] Buscando TODOS los pagos pendientes activos (sin filtrar por reunión)`,
    );

    // Buscar TODOS los pagos pendientes activos, sin importar la reunión
    // Esto permite que pagos pendientes de reuniones anteriores puedan ser pagados en la reunión actual
    const entities = await this.repo.find({
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
    const entities = await this.repo.find({
      where: { referenceMeetingId },
    });
    return entities.map((e) => PendingMemberPaymentMapper.toDomain(e));
  }

  async save(
    payment: PendingMemberPaymentDomain,
  ): Promise<PendingMemberPaymentDomain> {
    const persistence = PendingMemberPaymentMapper.toPersistence(payment);
    const existing = await this.repo.findOne({ where: { id: payment.id } });

    if (existing) {
      await this.repo.update(payment.id, persistence);
      const updated = await this.repo.findOne({ where: { id: payment.id } });
      if (!updated) {
        throw new Error('PendingMemberPayment not found after update');
      }
      return PendingMemberPaymentMapper.toDomain(updated);
    } else {
      const saved = await this.repo.save(
        persistence as PendingMemberPaymentEntity,
      );
      return PendingMemberPaymentMapper.toDomain(saved);
    }
  }

  async saveMany(
    payments: PendingMemberPaymentDomain[],
  ): Promise<PendingMemberPaymentDomain[]> {
    const persistences = payments.map((p) =>
      PendingMemberPaymentMapper.toPersistence(p),
    );
    const saved = await this.repo.save(
      persistences as PendingMemberPaymentEntity[],
    );
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
}
