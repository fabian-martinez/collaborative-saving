import { Operation } from '../../../operations/entities/operation.entity';

export interface OperationRepository {
  findById(id: string): Promise<Operation | null>;
  save(operation: Partial<Operation>): Promise<Operation>;
}
