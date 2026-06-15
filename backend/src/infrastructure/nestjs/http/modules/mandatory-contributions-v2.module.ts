import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MandatoryContributionsV2Controller } from '../controllers/mandatory-contributions.v2.controller';
import { GetMandatoryContributionsQueryHandler } from '@application/queries/mandatory-contributions/get-mandatory-contributions.query-handler';
import { GetMandatoryContributionDetailQueryHandler } from '@application/queries/mandatory-contributions/get-mandatory-contribution-detail.query-handler';
import { CreateMandatoryContributionUseCase } from '@application/use-cases/mandatory-contributions/create-mandatory-contribution.use-case';
import { UpdateMandatoryContributionUseCase } from '@application/use-cases/mandatory-contributions/update-mandatory-contribution.use-case';
import { DeleteMandatoryContributionUseCase } from '@application/use-cases/mandatory-contributions/delete-mandatory-contribution.use-case';
import { TypeOrmMandatoryContributionRepository } from '@infrastructure/typeorm/repositories/typeorm-mandatory-contribution.repository';
import { MandatoryContribution } from '@infrastructure/typeorm/entities/mandatory-contribution.entity';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MANDATORY_CONTRIBUTION_REPOSITORY } from '@domain/constants/injection-tokens';

@Module({
  imports: [TypeOrmModule.forFeature([MandatoryContribution])],
  controllers: [MandatoryContributionsV2Controller],
  providers: [
    {
      provide: MANDATORY_CONTRIBUTION_REPOSITORY,
      useClass: TypeOrmMandatoryContributionRepository,
    },
    {
      provide: GetMandatoryContributionsQueryHandler,
      useFactory: (repo: MandatoryContributionRepository) =>
        new GetMandatoryContributionsQueryHandler(repo),
      inject: [MANDATORY_CONTRIBUTION_REPOSITORY],
    },
    {
      provide: GetMandatoryContributionDetailQueryHandler,
      useFactory: (repo: MandatoryContributionRepository) =>
        new GetMandatoryContributionDetailQueryHandler(repo),
      inject: [MANDATORY_CONTRIBUTION_REPOSITORY],
    },
    {
      provide: CreateMandatoryContributionUseCase,
      useFactory: (repo: MandatoryContributionRepository) =>
        new CreateMandatoryContributionUseCase(repo),
      inject: [MANDATORY_CONTRIBUTION_REPOSITORY],
    },
    {
      provide: UpdateMandatoryContributionUseCase,
      useFactory: (repo: MandatoryContributionRepository) =>
        new UpdateMandatoryContributionUseCase(repo),
      inject: [MANDATORY_CONTRIBUTION_REPOSITORY],
    },
    {
      provide: DeleteMandatoryContributionUseCase,
      useFactory: (repo: MandatoryContributionRepository) =>
        new DeleteMandatoryContributionUseCase(repo),
      inject: [MANDATORY_CONTRIBUTION_REPOSITORY],
    },
    TypeOrmMandatoryContributionRepository,
  ],
})
export class MandatoryContributionsV2Module {}
