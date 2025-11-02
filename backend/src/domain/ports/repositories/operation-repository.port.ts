import { Operation } from '../../entities/operation.entity';

export interface OperationRepository {
  findById(id: string): Promise<Operation | null>;
  findByMeeting(meetingId: string): Promise<Operation[]>;
  save(operation: Operation): Promise<Operation>;
  saveWithEntries(
    operation: Operation,
    entries: Array<{
      accountType: string;
      amount: number;
      description?: string | null;
    }>,
  ): Promise<Operation>;
}
