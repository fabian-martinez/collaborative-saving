import { OpenMeetingDto } from '@application/dto/meetings/open-meeting.dto';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { Meeting } from '@domain/entities/meeting.entity';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import {
  CASH_ACCOUNT,
  ACCUMULATED_SURPLUS_ACCOUNT,
} from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

export class OpenMeetingUseCase {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(dto: OpenMeetingDto): Promise<MeetingResponseDto> {
    // Validar que no exista una reunión activa
    const activeMeeting = await this.meetingRepository.findActive();
    if (activeMeeting) {
      throw new InvalidRequestError(
        'An active meeting already exists. Please close it before creating a new one.',
      );
    }

    const meeting = Meeting.create({
      date: dto.date,
      notes: dto.notes,
    });

    const saved = await this.meetingRepository.save(meeting);

    // Calcular el balance total de ACCUMULATED_SURPLUS
    const accumulatedSurplusBalance =
      await this.ledgerEntryRepository.sumByAccountType(
        ACCUMULATED_SURPLUS_ACCOUNT,
      );

    // Si hay balance en ACCUMULATED_SURPLUS, transferirlo a CASH
    if (accumulatedSurplusBalance > 0) {
      // Calcular el balance actual de CASH antes de la transferencia
      const currentCashBalance =
        await this.ledgerEntryRepository.sumByAccountType(CASH_ACCOUNT);

      // Validar que el balance de CASH resultante no sea negativo
      const resultingCashBalance =
        currentCashBalance + accumulatedSurplusBalance;
      if (resultingCashBalance < 0) {
        throw new BusinessRuleError(
          `El balance de efectivo no puede quedar negativo. Balance actual: ${currentCashBalance}, Transferencia: ${accumulatedSurplusBalance}`,
        );
      }

      // Crear operación de transferencia
      await this.recordOperationUseCase.execute({
        memberId: null,
        meetingId: saved.id,
        type: OperationType.INITIAL_CASH_BALANCE,
        description:
          'Transferencia de superávit acumulado a efectivo de reunión',
        entries: [
          {
            accountType: CASH_ACCOUNT,
            amount: accumulatedSurplusBalance,
            description: 'Efectivo disponible de superávit acumulado',
          },
          {
            accountType: ACCUMULATED_SURPLUS_ACCOUNT,
            amount: -accumulatedSurplusBalance,
            description: 'Transferencia de superávit a reunión actual',
          },
        ],
      });
    }

    return {
      id: saved.id,
      date: saved.date,
      status: saved.status,
      notes: saved.notes,
      createdAt: saved.createdAt,
    };
  }
}
