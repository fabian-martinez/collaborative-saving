/* eslint-disable @typescript-eslint/unbound-method */
import { GetRecentActivityQueryHandler } from './get-recent-activity.query-handler';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { Operation } from '@domain/entities/operation.entity';
import { Member } from '@domain/entities/member.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { OperationType } from '@domain/enums/operation-type.enum';

describe('GetRecentActivityQueryHandler', () => {
  let handler: GetRecentActivityQueryHandler;
  let operationRepository: jest.Mocked<OperationRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;

  beforeEach(() => {
    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      findByMeetingAndTypes: jest.fn(),
      findByMember: jest.fn(),
      findWithPagination: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    memberRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByEmail: jest.fn(),
      findByIdentificationNumber: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByOperations: jest.fn(),
      findByAccount: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    handler = new GetRecentActivityQueryHandler(
      operationRepository,
      memberRepository,
      ledgerEntryRepository,
    );
  });

  it('should return empty array when no operations are found', async () => {
    operationRepository.findWithPagination.mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await handler.execute();

    expect(result).toEqual([]);
    expect(operationRepository.findWithPagination).toHaveBeenCalledWith(
      {},
      { page: 1, limit: 10 },
      'DESC',
    );
  });

  it('should return mapped recent activities with resolved member name and amounts', async () => {
    const date = new Date('2024-03-01T10:00:00Z');
    const mockOperation = {
      id: 'op-1',
      memberId: 'member-1',
      type: OperationType.MANDATORY_CONTRIBUTION,
      date,
      description: 'Aporte mensual',
    } as Partial<Operation> as Operation;

    const mockMember = {
      id: 'member-1',
      name: 'María González',
    } as Partial<Member> as Member;

    const mockEntries = [
      {
        id: 'entry-1',
        operationId: 'op-1',
        amount: 150000,
      },
      {
        id: 'entry-2',
        operationId: 'op-1',
        amount: -150000,
      },
    ] as Partial<LedgerEntry>[] as LedgerEntry[];

    operationRepository.findWithPagination.mockResolvedValue({
      data: [mockOperation],
      total: 1,
    });
    memberRepository.findByIds.mockResolvedValue([mockMember]);
    ledgerEntryRepository.findByOperations.mockResolvedValue(mockEntries);

    const result = await handler.execute();

    expect(result).toEqual([
      {
        id: 'op-1',
        type: OperationType.MANDATORY_CONTRIBUTION,
        description: 'Aporte mensual',
        amount: 150000,
        timestamp: date.toISOString(),
        memberName: 'María González',
      },
    ]);
    expect(memberRepository.findByIds).toHaveBeenCalledWith(['member-1']);
    expect(ledgerEntryRepository.findByOperations).toHaveBeenCalledWith([
      'op-1',
    ]);
  });

  it('should use "Sistema" when operation has no memberId', async () => {
    const date = new Date('2024-03-01T10:00:00Z');
    const mockOperation = {
      id: 'op-2',
      memberId: null,
      type: OperationType.FEE,
      date,
      description: 'Gasto reunión',
    } as Partial<Operation> as Operation;

    const mockEntries = [
      {
        id: 'entry-3',
        operationId: 'op-2',
        amount: 50000,
      },
    ] as Partial<LedgerEntry>[] as LedgerEntry[];

    operationRepository.findWithPagination.mockResolvedValue({
      data: [mockOperation],
      total: 1,
    });
    ledgerEntryRepository.findByOperations.mockResolvedValue(mockEntries);

    const result = await handler.execute();

    expect(result).toEqual([
      {
        id: 'op-2',
        type: OperationType.FEE,
        description: 'Gasto reunión',
        amount: 50000,
        timestamp: date.toISOString(),
        memberName: 'Sistema',
      },
    ]);
    expect(memberRepository.findByIds).not.toHaveBeenCalled();
  });
});
