import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { MandatoryContributionsV2Controller } from './mandatory-contributions.v2.controller';
import { GetMandatoryContributionsQueryHandler } from '@application/queries/mandatory-contributions/get-mandatory-contributions.query-handler';
import { GetMandatoryContributionDetailQueryHandler } from '@application/queries/mandatory-contributions/get-mandatory-contribution-detail.query-handler';
import { CreateMandatoryContributionUseCase } from '@application/use-cases/mandatory-contributions/create-mandatory-contribution.use-case';
import { UpdateMandatoryContributionUseCase } from '@application/use-cases/mandatory-contributions/update-mandatory-contribution.use-case';
import { DeleteMandatoryContributionUseCase } from '@application/use-cases/mandatory-contributions/delete-mandatory-contribution.use-case';
import { MandatoryContributionResponseDto } from '@application/dto/mandatory-contributions/mandatory-contribution-response.dto';

describe('MandatoryContributionsV2Controller', () => {
  let controller: MandatoryContributionsV2Controller;
  let getContributionsQuery: jest.Mocked<GetMandatoryContributionsQueryHandler>;
  let getContributionDetailQuery: jest.Mocked<GetMandatoryContributionDetailQueryHandler>;
  let createUseCase: jest.Mocked<CreateMandatoryContributionUseCase>;
  let updateUseCase: jest.Mocked<UpdateMandatoryContributionUseCase>;
  let deleteUseCase: jest.Mocked<DeleteMandatoryContributionUseCase>;

  // Spies for execute methods to avoid 'this' scoping issues
  let getContributionsQueryExecuteSpy: jest.SpyInstance;
  let getContributionDetailQueryExecuteSpy: jest.SpyInstance;
  let createUseCaseExecuteSpy: jest.SpyInstance;
  let updateUseCaseExecuteSpy: jest.SpyInstance;
  let deleteUseCaseExecuteSpy: jest.SpyInstance;

  const mockContributionResponse: MandatoryContributionResponseDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    assetType: 'stock',
    value: 100,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MandatoryContributionsV2Controller],
      providers: [
        {
          provide: GetMandatoryContributionsQueryHandler,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetMandatoryContributionDetailQueryHandler,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CreateMandatoryContributionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateMandatoryContributionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteMandatoryContributionUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<MandatoryContributionsV2Controller>(
      MandatoryContributionsV2Controller,
    );
    getContributionsQuery = module.get(GetMandatoryContributionsQueryHandler);
    getContributionDetailQuery = module.get(
      GetMandatoryContributionDetailQueryHandler,
    );
    createUseCase = module.get(CreateMandatoryContributionUseCase);
    updateUseCase = module.get(UpdateMandatoryContributionUseCase);
    deleteUseCase = module.get(DeleteMandatoryContributionUseCase);

    // Create spies to avoid 'this' scoping issues
    getContributionsQueryExecuteSpy = jest.spyOn(
      getContributionsQuery,
      'execute',
    );
    getContributionDetailQueryExecuteSpy = jest.spyOn(
      getContributionDetailQuery,
      'execute',
    );
    createUseCaseExecuteSpy = jest.spyOn(createUseCase, 'execute');
    updateUseCaseExecuteSpy = jest.spyOn(updateUseCase, 'execute');
    deleteUseCaseExecuteSpy = jest.spyOn(deleteUseCase, 'execute');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return list of contributions', async () => {
      const contributions: MandatoryContributionResponseDto[] = [
        mockContributionResponse,
      ];
      getContributionsQuery.execute.mockResolvedValue(contributions);

      const result = await controller.list();

      expect(getContributionsQueryExecuteSpy).toHaveBeenCalled();
      expect(result).toEqual(contributions);
    });
  });

  describe('detail', () => {
    it('should return contribution details', async () => {
      getContributionDetailQuery.execute.mockResolvedValue(
        mockContributionResponse,
      );

      const result = await controller.detail(mockContributionResponse.id);

      expect(getContributionDetailQueryExecuteSpy).toHaveBeenCalledWith(
        mockContributionResponse.id,
      );
      expect(result).toEqual(mockContributionResponse);
    });

    it('should throw NotFoundException when contribution not found', async () => {
      getContributionDetailQuery.execute.mockRejectedValue(
        new Error('Mandatory contribution not found'),
      );

      await expect(controller.detail('non-existent-id')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('create', () => {
    it('should create contribution successfully', async () => {
      const createDto = {
        asset_type: 'stock',
        value: 100,
      };
      createUseCase.execute.mockResolvedValue(mockContributionResponse);

      const result = await controller.create(createDto);

      expect(createUseCaseExecuteSpy).toHaveBeenCalledWith({
        assetType: createDto.asset_type,
        value: createDto.value,
      });
      expect(result).toEqual(mockContributionResponse);
    });

    it('should throw HttpException for invalid input', async () => {
      const createDto = {
        asset_type: 'stock',
        value: 0,
      };
      createUseCase.execute.mockRejectedValue(
        new Error('Value must be greater than 0'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should update contribution successfully', async () => {
      const updateDto = {
        asset_type: 'savings',
        value: 200,
      };
      updateUseCase.execute.mockResolvedValue(mockContributionResponse);

      const result = await controller.update(
        mockContributionResponse.id,
        updateDto,
      );

      expect(updateUseCaseExecuteSpy).toHaveBeenCalledWith({
        id: mockContributionResponse.id,
        assetType: updateDto.asset_type,
        value: updateDto.value,
      });
      expect(result).toEqual(mockContributionResponse);
    });

    it('should throw HttpException when contribution not found', async () => {
      const updateDto = { value: 200 };
      updateUseCase.execute.mockRejectedValue(
        new Error('Mandatory contribution not found'),
      );

      await expect(
        controller.update('non-existent-id', updateDto),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete contribution successfully', async () => {
      deleteUseCase.execute.mockResolvedValue();

      await controller.remove(mockContributionResponse.id);

      expect(deleteUseCaseExecuteSpy).toHaveBeenCalledWith({
        id: mockContributionResponse.id,
      });
    });

    it('should throw HttpException when contribution not found', async () => {
      deleteUseCase.execute.mockRejectedValue(
        new Error('Mandatory contribution not found'),
      );

      await expect(controller.remove('non-existent-id')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
