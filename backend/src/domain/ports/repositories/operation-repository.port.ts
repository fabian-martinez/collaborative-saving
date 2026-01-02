import { Operation } from '../../entities/operation.entity';
import { OperationType } from '../../enums/operation-type.enum';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface OperationFilters {
  memberId?: string;
  meetingId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: OperationType;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface OperationRepository {
  findById(id: string): Promise<Operation | null>;
  findByMeeting(meetingId: string): Promise<Operation[]>;
  findByMeetingAndType(
    meetingId: string,
    type: OperationType,
  ): Promise<Operation[]>;
  findByMember(
    memberId: string,
    filters?: {
      meetingId?: string;
      types?: OperationType[];
    },
  ): Promise<Operation[]>;
  findWithPagination(
    filters: OperationFilters,
    pagination: PaginationOptions,
    orderBy: 'ASC' | 'DESC',
  ): Promise<PaginatedResult<Operation>>;
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
