import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { OperationType } from '@domain/enums/operation-type.enum';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { OperationResponseDto } from '@application/dto/meetings/operation-response.dto';

export class GetMeetingStockExchangesQueryHandler {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly operationRepository: OperationRepository,
  ) {}

  async execute(meetingId: string): Promise<OperationResponseDto[]> {
    // 1. Validar que la reunión existe
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new MeetingNotFoundException(meetingId);
    }

    // 2. Obtener operaciones de tipo STOCK_MODIFICATION para la reunión
    const operations = await this.operationRepository.findByMeetingAndType(
      meetingId,
      OperationType.STOCK_MODIFICATION,
    );

    // 3. Mapear domain entities a DTOs
    return operations.map((operation) => ({
      id: operation.id,
      memberId: operation.memberId,
      meetingId: operation.meetingId,
      type: operation.type,
      date: operation.date,
      description: operation.description,
    }));
  }
}
