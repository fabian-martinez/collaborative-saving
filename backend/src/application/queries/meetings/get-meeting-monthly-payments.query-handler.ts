import { Injectable } from '@nestjs/common';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { OperationType } from '@domain/enums/operation-type.enum';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { OperationResponseDto } from '@application/dto/meetings/operation-response.dto';
import { PaymentMapperService } from '@domain/services/payment-mapper.service';
import { LedgerEntryGrouper } from '@domain/utils/ledger-entry-grouper';

@Injectable()
export class GetMeetingMonthlyPaymentsQueryHandler {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly paymentMapperService: PaymentMapperService,
  ) {}

  async execute(meetingId: string): Promise<OperationResponseDto[]> {
    // 1. Validar que la reunión existe
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new MeetingNotFoundException(meetingId);
    }

    // 2. Obtener operaciones de tipo MONTHLY_PAYMENT para la reunión
    const operations = await this.operationRepository.findByMeetingAndType(
      meetingId,
      OperationType.MONTHLY_PAYMENT,
    );

    // 3. Si no hay operaciones, retornar array vacío
    if (operations.length === 0) {
      return [];
    }

    // 4. Obtener todas las ledger entries para estas operaciones
    const operationIds = operations.map((op) => op.id);
    const allEntries =
      operationIds.length > 0
        ? await this.ledgerEntryRepository.findByOperations(operationIds)
        : [];

    // 5. Agrupar entries por operación
    const entriesByOperation = LedgerEntryGrouper.groupByOperation(allEntries);

    // 6. Mapear domain entities a DTOs con totalAmount calculado
    return operations.map((operation) => {
      const entries = entriesByOperation.get(operation.id) || [];
      const totalAmount =
        this.paymentMapperService.calculatePaymentTotalAmount(entries);

      return {
        id: operation.id,
        memberId: operation.memberId,
        meetingId: operation.meetingId,
        type: operation.type,
        date: operation.date,
        description: operation.description,
        totalAmount,
      };
    });
  }
}
