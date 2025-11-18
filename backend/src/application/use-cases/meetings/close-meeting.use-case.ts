import { CloseMeetingDto } from '@application/dto/meetings/close-meeting.dto';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
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
  ) {}

  async execute(dto: CloseMeetingDto): Promise<MeetingResponseDto> {
    const meeting = await this.meetingRepository.findById(dto.meetingId);

    if (!meeting) {
      throw new MeetingNotFoundException(dto.meetingId);
    }

    if (meeting.isClosed()) {
      throw new InvalidRequestError('This meeting is already closed');
    }

    // Calcular el balance final de CASH de la reunión
    const meetingLedgerEntries = await this.ledgerEntryRepository.findByMeeting(
      dto.meetingId,
    );
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
  }
}
