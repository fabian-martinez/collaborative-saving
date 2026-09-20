import { Injectable } from '@nestjs/common';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { PaymentFilterType } from '@domain/enums/payment-filter-type.enum';
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

    // 2. Obtener todos los tipos de operaciones que corresponden a pagos mensuales
    const operationTypes =
      this.paymentMapperService.mapPaymentFilterToOperationTypes(
        PaymentFilterType.MONTHLY_PAYMENT,
      );

    // 3. Obtener operaciones de todos los tipos de pagos mensuales para la reunión
    const operations = await this.operationRepository.findByMeetingAndTypes(
      meetingId,
      operationTypes,
    );

    // 4. Si no hay operaciones, retornar array vacío
    if (operations.length === 0) {
      return [];
    }

    // 5. Obtener todas las ledger entries para estas operaciones
    const operationIds = operations.map((op) => op.id);
    const allEntries =
      operationIds.length > 0
        ? await this.ledgerEntryRepository.findByOperations(operationIds)
        : [];

    // 6. Agrupar entries por operación
    const entriesByOperation = LedgerEntryGrouper.groupByOperation(allEntries);

    // 7. Mapear domain entities a DTOs con totalAmount calculado y entries
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
        entries: entries.map((e) => ({
          id: e.id,
          operationId: e.operationId,
          accountType: e.accountType,
          amount: e.amount,
          createdAt: e.createdAt,
          description: e.description ?? null,
          loanId: e.loanId ?? null,
          stockId: e.stockId ?? null,
          mandatoryContributionId: e.mandatoryContributionId ?? null,
          stockSubscriptionId: e.stockSubscriptionId ?? null,
        })),
      };
    });
  }
}
