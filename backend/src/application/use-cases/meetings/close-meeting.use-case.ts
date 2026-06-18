import { CloseMeetingDto } from '@application/dto/meetings/close-meeting.dto';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import {
  CASH_ACCOUNT,
  ACCUMULATED_SURPLUS_ACCOUNT,
} from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

export class CloseMeetingUseCase {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
    private readonly transactionManager: TransactionManager,
    private readonly operationRepository: OperationRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
  ) {}

  async execute(dto: CloseMeetingDto): Promise<MeetingResponseDto> {
    return this.transactionManager.execute(async () => {
      const meeting = await this.meetingRepository.findById(dto.meetingId);

      if (!meeting) {
        throw new MeetingNotFoundException(dto.meetingId);
      }

      if (meeting.isClosed()) {
        throw new InvalidRequestError('This meeting is already closed');
      }

      // 1. Validar que se haya ejecutado la revaluación de activos
      const existingRevaluation =
        await this.operationRepository.findByMeetingAndType(
          dto.meetingId,
          OperationType.ASSET_REVALUATION,
        );
      if (existingRevaluation.length === 0) {
        throw new BusinessRuleError(
          'No se puede cerrar la reunión porque no se ha ejecutado la revaluación de activos.',
        );
      }

      // 2. Validar que no existan desembolsos pendientes creados en esta reunión sin procesar
      // (excluyendo los saldos pendientes creados por pagos parciales que se arrastran a la siguiente reunión)
      const meetingPayments =
        await this.pendingMemberPaymentRepository.findByMeeting(dto.meetingId);
      const unprocessedPayments = meetingPayments.filter(
        (p) =>
          (p.status === 'pending' || p.status === 'approved') &&
          !p.notes?.includes('Saldo pendiente') &&
          !p.notes?.includes('saldo pendiente'),
      );
      if (unprocessedPayments.length > 0) {
        throw new BusinessRuleError(
          `No se puede cerrar la reunión porque existen ${unprocessedPayments.length} desembolsos pendientes por aplicar o rechazar.`,
        );
      }

      // Calcular el balance final de CASH de la reunión
      const meetingLedgerEntries =
        await this.ledgerEntryRepository.findByMeeting(dto.meetingId);
      const cashEntries = meetingLedgerEntries.filter(
        (entry) => entry.accountType === CASH_ACCOUNT,
      );
      const cashBalance = cashEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      );

      // Validar que el balance de CASH no sea negativo
      if (cashBalance < 0) {
        throw new BusinessRuleError(
          `El balance de efectivo no puede quedar negativo. Balance actual: ${cashBalance}`,
        );
      }

      // Si hay CASH pendiente (> 0), moverlo a ACCUMULATED_SURPLUS
      if (cashBalance > 0) {
        const authorizationText = dto.authorizedBy
          ? ` - Autorizado por: ${dto.authorizedBy}`
          : '';
        const description = `Acumulación de superávit${authorizationText}`;

        await this.recordOperationUseCase.execute({
          memberId: null,
          meetingId: dto.meetingId,
          type: OperationType.SURPLUS_ACCUMULATION,
          description,
          entries: [
            {
              accountType: ACCUMULATED_SURPLUS_ACCOUNT,
              amount: cashBalance,
              description: `Superávit acumulado de la reunión`,
            },
            {
              accountType: CASH_ACCOUNT,
              amount: -cashBalance,
              description: `Transferencia de efectivo pendiente a superávit acumulado`,
            },
          ],
        });
      }

      meeting.close();
      const saved = await this.meetingRepository.save(meeting);

      return {
        id: saved.id,
        date: saved.date,
        status: saved.status,
        notes: saved.notes,
        createdAt: saved.createdAt,
      };
    });
  }
}
