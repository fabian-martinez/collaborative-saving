import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { OperationType } from '@domain/enums/operation-type.enum';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { RevaluationResultDto } from '@application/dto/meetings/revaluation-result.dto';
import { AssetRevaluationDomainService } from '@domain/services/asset-revaluation.service';

export class GetRevaluationQueryHandler {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly operationRepository: OperationRepository,
    private readonly assetRevaluationDomainService: AssetRevaluationDomainService,
  ) {}

  async execute(meetingId: string): Promise<RevaluationResultDto> {
    // Validar que el meeting existe
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new MeetingNotFoundException(meetingId);
    }

    // Verificar si existe una revaluación ejecutada
    const existingRevaluation =
      await this.operationRepository.findByMeetingAndType(
        meetingId,
        OperationType.ASSET_REVALUATION,
      );

    if (existingRevaluation.length > 0) {
      // Si ya existe, obtener los datos ejecutados
      const operation = existingRevaluation[0];
      const calculationResult =
        await this.assetRevaluationDomainService.getExecutedRevaluationData(
          operation.id,
          meetingId,
        );

      return {
        ...calculationResult,
        status: 'executed',
        executedAt: operation.date.toISOString(),
        operationId: operation.id,
      };
    }

    // Si no existe, calcular el preview
    const calculationResult =
      await this.assetRevaluationDomainService.calculateRevaluationData(
        meetingId,
      );

    return {
      ...calculationResult,
      status: 'preview',
    };
  }
}
